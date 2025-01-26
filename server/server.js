const io = require('socket.io')(3001);
let users = [];

io.on('connection', (socket) => {
  console.log('A user connected:', socket.id);

  // Set user name and emit user list
  socket.on('setName', (name) => {
    console.log(`User ${socket.id} set their name to ${name}`);

    // Check if the user already exists, update or create new user entry
    const existingUser = users.find((user) => user.id === socket.id);
    if (!existingUser) {
      const user = { id: socket.id, name };
      users.push(user);
      console.log('Updated user list:', users);
      io.emit('userList', users); // Emit updated user list to all clients
    }
  });

  // Handle user disconnect
  socket.on('disconnect', () => {
    console.log('User disconnected:', socket.id);

    // Remove user from the users array
    users = users.filter((user) => user.id !== socket.id);
    console.log('Updated user list after disconnect:', users);

    io.emit('userList', users); // Emit updated user list to all clients
  });
});
