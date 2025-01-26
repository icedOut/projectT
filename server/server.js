const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create the HTTP server
const server = http.createServer((req, res) => {
  res.statusCode = 200;
  res.setHeader('Content-Type', 'text/plain');
  res.end('Socket server is running!');
});

// Attach socket.io to the server with CORS options
const io = socketIo(server, {
  cors: {
    origin: "http://localhost:3000",  // Allow the front-end app to connect
    methods: ["GET", "POST"],
    allowedHeaders: ["my-custom-header"],
    credentials: true
  }
});

let users = {};

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Set user name
  socket.on('setName', (name) => {
    users[socket.id] = { id: socket.id, name, x: 0, z: 0 };
    io.emit('userList', Object.values(users));
    console.log('User setName:', users[socket.id]);
  });

  // Handle user movement
  socket.on('move', (position) => {
    if (users[socket.id]) {
      users[socket.id].x = position.x;
      users[socket.id].z = position.z;
      console.log(`Updated position for ${users[socket.id].name}:`, users[socket.id]);
      io.emit('userList', Object.values(users));  // Emit updated list to all clients
    }
  });

  // Handle user disconnection
  socket.on('disconnect', () => {
    console.log('A user disconnected:', socket.id);
    delete users[socket.id];
    io.emit('userList', Object.values(users));  // Emit updated list after user disconnects
  });
});

// Start the server
server.listen(3001, () => {
  console.log('Server listening on http://localhost:3001');
});
