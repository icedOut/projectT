const express = require('express');
const http = require('http');
const socketIo = require('socket.io');
const { Pool } = require('pg');
const cors = require('cors');

// Database connection
const pool = new Pool({
  user: 'your-db-user',
  host: 'localhost',
  database: 'mmorpg_db',
  password: 'your-db-password',
  port: 5432,
});

// Initialize Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Middleware
app.use(cors());
app.use(express.json());

// Basic route
app.get('/', (req, res) => {
  res.send('MMORPG Backend Server');
});

// Handle socket connections (Game Logic)
io.on('connection', (socket) => {
  console.log('a user connected');
  
   // Listen for player move event
   socket.on('playerMove', async (data) => {
    // Update player position in the database
    const { playerId, x, y, z } = data;
    try {
      await savePlayerPosition(playerId, x, y, z);  // Save to DB (defined earlier)
      
      // Broadcast the new position to all other players
      socket.broadcast.emit('playerMoved', { playerId, x, y, z });
    } catch (error) {
      console.error('Error processing player movement:', error);
    }
  });

  socket.on('disconnect', () => {
    console.log('user disconnected');
  });
});

// Start server
server.listen(3001, () => {
  console.log('Server is running on port 3001');
});
