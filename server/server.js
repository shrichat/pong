// Require necessary modules
const express = require('express');
const http = require('http');
const socketIo = require('socket.io');

// Create an Express app
const app = express();
const server = http.createServer(app);
const io = socketIo(server);

// Serve static files from the 'client' directory
app.use(express.static('client'));

// Singleplayer game logic
io.on('connection', (socket) => {
    console.log('A user connected to the game');

    // Handle player movement
    socket.on('move', (data) => {
        // Broadcast player movement to all clients
        io.emit('move', data);
    });

    // Handle ball movement
    socket.on('ball', (data) => {
        // Broadcast ball movement to all clients
        io.emit('ball', data);
    });

    // Handle game over
    socket.on('gameOver', () => {
        // Broadcast game over event to all clients
        io.emit('gameOver');
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('A user disconnected');
    });
});

// Multiplayer lobby logic
const multiplayerLobby = io.of('/multiplayer');
let lobby = [];

multiplayerLobby.on('connection', (socket) => {
    console.log('A user connected to the multiplayer lobby');

    // Add the player to the lobby
    lobby.push(socket);

    // Check if lobby has enough players to start a game
    if (lobby.length === 2) {
        // Pair up the first two players
        const player1 = lobby[0];
        const player2 = lobby[1];

        // Remove paired players from the lobby
        lobby = [];

        // Notify the players to start the game
        player1.emit('startGame', { opponentId: player2.id });
        player2.emit('startGame', { opponentId: player1.id });
    }

    // Handle join lobby
    socket.on('joinLobby', (lobbyCode) => {
        // Logic to handle joining a lobby
        // For simplicity, let's assume the lobby code is valid
        if (lobbyCode === "exampleLobbyCode") {
            // Add the player to the lobby
            lobby.push(socket);

            // Check if lobby has enough players to start a game
            if (lobby.length === 2) {
                // Pair up the first two players
                const player1 = lobby[0];
                const player2 = lobby[1];

                // Remove paired players from the lobby
                lobby = [];

                // Notify the players to start the game
                player1.emit('startGame', { opponentId: player2.id });
                player2.emit('startGame', { opponentId: player1.id });
            }
        } else {
            // Notify the player of an invalid lobby code
            socket.emit('lobbyError', 'Invalid lobby code');
        }
    });

    // Handle disconnect
    socket.on('disconnect', () => {
        console.log('A user disconnected from the multiplayer lobby');

        // Remove the disconnected player from the lobby
        lobby = lobby.filter(player => player.id !== socket.id);
    });
});

// Start the server
const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
