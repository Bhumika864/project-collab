// Import required packages
const express = require('express');
const http = require('http'); // Import http
const { Server } = require("socket.io"); // Import Server from socket.io
const dotenv = require('dotenv');
dotenv.config();

const cors = require('cors');
const connectDB = require('./config/db'); // Import the connectDB function
const userRoutes = require('./routes/userRoutes'); // Import the user routes
const projectRoutes = require('./routes/projectRoutes'); // Import project routes
const taskRoutes = require('./routes/taskRoutes'); // Import task routes
const seedDemoUsers = require('./utils/seedDemoUsers');
const corsOptions = require('./utils/corsOptions');
const jwt = require('jsonwebtoken');
const User = require('./models/User');
const Project = require('./models/Project');
const { getProjectRole } = require('./utils/projectPermissions');

// Create an Express app instance
const app = express();
const server = http.createServer(app); // Create http server

// Initialize socket.io with CORS configuration
const io = new Server(server, {
  cors: corsOptions
});

io.use(async (socket, next) => {
  try {
    const decoded = jwt.verify(socket.handshake.auth?.token, process.env.JWT_SECRET);
    const user = await User.findById(decoded.id).select('_id');
    if (!user) {
      return next(new Error('Not authorized'));
    }
    socket.data.userId = user._id;
    next();
  } catch {
    next(new Error('Not authorized'));
  }
});

// Define the port from environment variables, with a fallback to 5001
const PORT = process.env.PORT || 5001;

// --- Middlewares ---
// Enable CORS for all routes
app.use(cors(corsOptions));
// Allow the app to parse JSON from request bodies
app.use(express.json());

// Middleware to make `io` accessible from controllers
app.use((req, res, next) => {
  req.io = io;
  next();
});

// --- Socket.io Connection Logic ---
io.on('connection', (socket) => {
  console.log('🔌 A user connected:', socket.id);

  // Listener for a client to join a project-specific room
  socket.on('joinProject', async (projectId) => {
    try {
      const project = await Project.findById(projectId);
      if (project && getProjectRole(project, socket.data.userId)) {
        socket.join(projectId);
      }
    } catch (error) {
      console.error('Failed to join project room:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('🔥 A user disconnected:', socket.id);
  });
});

// --- Routes ---
// A simple test route to check if the server is running
app.get('/', (req, res) => {
  res.send('API is running successfully!');
});

// Mount the user routes
app.use('/api/users', userRoutes);
app.use('/api/projects', projectRoutes); // Mount project routes
app.use('/api/tasks', taskRoutes); // Mount task routes

const startServer = async () => {
  if (!process.env.JWT_SECRET) {
    throw new Error('JWT_SECRET is required');
  }

  await connectDB();
  await seedDemoUsers();
  server.listen(PORT, () => {
    console.log(`🚀 Server is running on port ${PORT}`);
  });
};

startServer().catch((error) => {
  console.error(`Unable to start server: ${error.message}`);
  process.exitCode = 1;
});
