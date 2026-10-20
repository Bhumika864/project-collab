import { io } from 'socket.io-client';

//  Connect to the backend server
// const socket = io('http://localhost:5001');

// Use the environment variable for the live URL
const URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5001';
const socket = io(URL, { autoConnect: false });

export default socket;