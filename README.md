# Real-Time-Chat-Application

Real Time Chat Application Using Socket.io

Setup Instructions

1. Clone the Repository : https://github.com/sakunadew99/Real-Time-Chat-Application

2. Install Dependencies:
   Navigate to the 'backend' directory and run:

   npm install

   Navigate to the 'frontend' directory and run:

   npm install

3. Environment Variables:

   - Create a '.env' file in the 'backend' directory and add the following environment variables:

     MONGODB_URI=your_mongodb_uri,
     NODE_ENV= production,
     PORT=3001,
     FRONTEND_URL=http://localhost:3000

4. **Run the Application**:
   - To start the backend server, navigate to the 'backend' directory and run:

     nodemon server.js

   - To start the frontend application, navigate to the 'frontend' directory and run:

     npm start

Application Structure

Backend:
'server.js': The main server file that sets up the Express app, configures Socket.IO, and connects to MongoDB.
'models/User.js': Mongoose model for users.
'models/Message.js': Mongoose model for messages.
The backend uses Express for the server, Socket.IO for real-time communication, and Mongoose for MongoDB interactions.

Frontend:
The frontend is built with React.
The main dependencies include 'react', 'axios' for HTTP requests, 'socket.io-client' for real-time communication, and various libraries for UI and state management.

Assumptions and Limitations

Assumptions:
MongoDB URI and frontend URL are correctly configured in the '.env' file.
The frontend and backend are running on 'http://localhost:3000' and 'http://localhost:3001' respectively during development.
Users are identified uniquely by their usernames.

Limitations:
The application does not implement advanced security features such as authentication or authorization.
Error handling in the backend is basic and may need improvement for production readiness.
The current setup assumes a development environment; additional configuration might be necessary for production deployment.
The frontend build process uses the `--openssl-legacy-provider` flag, which may indicate compatibility issues with certain versions of OpenSSL.
