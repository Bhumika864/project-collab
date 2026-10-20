# Collaborative Project Management App

A full-stack MERN application that allows teams to manage projects, tasks, and collaborations in real-time. This tool is designed to be secure, performant, and user-friendly, featuring user authentication, role-based access, and live updates using Socket.io.

**Live Demo:** [Project Manager](https://project-manager-six-wine.vercel.app/)
**Performance Note:** The backend is deployed on a free-tier Render instance, which may "spin down" after a period of inactivity. **The first request (like logging in) may take 30-50 seconds to complete as the server restarts.** Subsequent requests will be much faster.

---

### Demo Credentials

To test the application and its collaborative features without registering, you can use the following pre-configured demo accounts. The easiest way is to use the one-click login buttons on the homepage.

* **User 1:** `user1@demo.com` / `password123`
* **User 2:** `user2@demo.com` / `password123`

## Features

-   **User Authentication**: Secure user registration and login using JWT.
-   **Project Management**: Create, update, delete, and view projects.
-   **Task Management**: Kanban-style board with ToDo, InProgress, and Done columns.
-   **Real-Time Collaboration**: Task updates are broadcast to all project members instantly using Socket.io.
-   **Project Roles and Invites**: Owners can add existing users by email, manage editor/viewer roles, and create revocable seven-day share links.
-   **Project Activity Feed**: See task creation, edits, and deletions live, with member/action filters and links to active tasks.
-   **Project Analytics**: Track overdue and completed work, recent completion trends, task workload, and cycle time from recorded status changes.
-   **Dashboard Overview**: At-a-glance view of all projects and tasks with a chart for task statuses.
-   **Protected Routes**: API is secured to ensure users can only access their own data.

---

## Tech Stack

-   **Frontend**: React, Vite, React Router, Axios, Chart.js, Socket.io Client
-   **Backend**: Node.js, Express.js, Mongoose
-   **Database**: MongoDB (via MongoDB Atlas)
-   **Authentication**: JSON Web Tokens (JWT), bcrypt
-   **Testing**: Jest, Supertest

---

## Getting Started

Follow these instructions to get a copy of the project up and running on your local machine for development and testing purposes.

### Prerequisites

You need to have the following software installed on your machine:
-   [Node.js](https://nodejs.org/) (v18.x or later recommended)
-   [npm](https://www.npmjs.com/) (usually comes with Node.js)
-   [Git](https://git-scm.com/)

## Project Structure

The repository is organized into two main folders, `frontend` and `backend`.

```
/
├── backend/
│   ├── controllers/  # Contains the business logic for API routes
│   ├── models/       # Mongoose schemas for the database
│   ├── routes/       # Express route definitions
│   └── middleware/   # Custom middleware (e.g., authentication)
└── frontend/
    ├── src/
    │   ├── components/ # Reusable React components
    │   ├── pages/      # Components representing full pages
    │   ├── context/    # Global state management (AuthContext)
    │   └── services/   # Centralized API and socket services
```

### Local Setup

1.  **Clone the repository:**
    ```sh
    git clone https://github.com/subha0319/Project-Manager
    cd Project-Manager
    ```

2.  **Install Backend Dependencies:**
    ```sh
    cd backend
    npm install
    ```

3.  **Install Frontend Dependencies:**
    ```sh
    cd ../frontend
    npm install
    ```

4.  **Set Up Environment Variables:**
    -   In the `backend` folder, create a new file named `.env`.
    -   Copy `backend/.env.example` and replace the placeholder values with your own.

---

## Environment Variables

The backend requires the following environment variables. Create a `.env` file in the `/backend` directory:

```env
# The port your server will run on
PORT=5001

# Your MongoDB Atlas connection string
MONGO_URI=mongodb+srv://<username>:<password>@cluster0.xxxxx.mongodb.net/yourDatabaseName?retryWrites=true&w=majority

# A long, random string used to sign JWTs
JWT_SECRET=replace_with_a_long_random_secret
```

The backend creates the two documented demo accounts when it starts if they do not already exist. Existing accounts are left unchanged.
Email invites add an existing account immediately; use a share link to invite someone who has not registered yet. Invite links require login and can be revoked by the owner.

---

## Available Scripts

### Backend

-   `npm start`: Runs the server with `nodemon`, which automatically restarts on file changes.
  ```sh
    cd backend
    npm start
  ```
-   `npm test`: Runs the Jest test suite.

### Frontend

-   `npm run dev`: Starts the Vite development server for the React app.
  ```sh
    cd frontend
    npm run dev
  ```

---

## API Documentation

### User Routes

| Endpoint            | Method | Description                         | Protected | Body (Example)                                        |
| ------------------- | ------ | ----------------------------------- | --------- | ----------------------------------------------------- |
| `/api/users/register` | POST   | Register a new user.                | No        | `{ "name", "email", "password" }`                     |
| `/api/users/login`    | POST   | Log in a user and get a JWT.        | No        | `{ "email", "password" }`                             |
| `/api/users/profile`  | GET    | Get the profile of the logged-in user. | Yes       | `null`                                                |

### Project Routes

| Endpoint         | Method | Description                        | Protected | Body (Example)                  |
| ---------------- | ------ | ---------------------------------- | --------- | ------------------------------- |
| `/api/projects`    | GET    | Get all projects for the user.     | Yes       | `null`                          |
| `/api/projects`    | POST   | Create a new project.              | Yes       | `{ "title", "description" }`    |
| `/api/projects/:id`| PUT    | Update a project (owner only).     | Yes       | `{ "title", "description" }`    |
| `/api/projects/:id`| DELETE | Delete a project (owner only).     | Yes       | `null`                          |

### Task Routes

| Endpoint                  | Method | Description                       | Protected | Body (Example)                                |
| ------------------------- | ------ | --------------------------------- | --------- | --------------------------------------------- |
| `/api/tasks`              | POST   | Create a new task.                | Yes       | `{ "title", "projectId" }`                    |
| `/api/tasks/project/:id`  | GET    | Get all tasks for a project.      | Yes       | `null`                                        |
| `/api/tasks/:id`          | PUT    | Update a task (owner/assignee).   | Yes       | `{ "title", "status", "assignee" }` |
| `/api/tasks/:id`          | DELETE | Delete a task (owner only).       | Yes       | `null`                                        |
