// Define canvas and context variables
let canvas = document.getElementById("gameCanvas");
let ctx = canvas.getContext("2d");

// Define game constants
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 10;
const PADDLE_HEIGHT = 80;
const BALL_RADIUS = 10;
const PADDLE_SPEED = 600;
let BALL_SPEED = 600; // Variable to control ball speed

// Define game state variables
let playerPaddleY = HEIGHT / 2 - PADDLE_HEIGHT / 2;
let opponentPaddleY = HEIGHT / 2 - PADDLE_HEIGHT / 2;
let ballX = WIDTH / 2;
let ballY = HEIGHT / 2;
let ballVelocityX = BALL_SPEED;
let ballVelocityY = BALL_SPEED;

// Player name
let playerName = "";

// Score variables
let playerScore = 0;
let opponentScore = 0;

// Speed increment for the ball
const BALL_SPEED_INCREMENT = 0.05;

// Variable to track game mode
let isMultiplayer = false;

// Socket.io connection
let socket;

// Function to start the game
function startGame() {
    playerName = document.getElementById("playerName").value;
    document.getElementById("nameInput").style.display = "none";
    canvas.style.display = "block";
    const selectedMode = document.getElementById("mode").value;
    if (selectedMode === "multiPlayer") {
        isMultiplayer = true;
        // Connect to the server
        
        socket = io();
        socket = io('/multiplayer');
        // Listen for opponent movement
        socket.on('move', function(data) {
            opponentPaddleY = data.y;
        });
        // Listen for opponent ball position updates
        socket.on('ball', function(data) {
            ballX = data.x;
            ballY = data.y;
        });
        // Listen for opponent disconnection
        socket.on('playerDisconnected', function(data) {
            opponentScore = 0; // Reset opponent score
            resetBall(); // Reset ball position
            alert("Your opponent has disconnected. You win!");
        });
    }
    gameLoop();
}

// Function to update game state for singleplayer mode
function updateSingleplayer() {
    // Move player paddle based on movement direction
    if (isMovingUp && playerPaddleY > 0) {
        playerPaddleY -= PADDLE_SPEED / 60; // Normalize speed for smooth movement
    }
    if (isMovingDown && playerPaddleY < HEIGHT - PADDLE_HEIGHT) {
        playerPaddleY += PADDLE_SPEED / 60; // Normalize speed for smooth movement
    }

    // Move opponent paddle towards the ball
    if (ballX < WIDTH / 2 && ballVelocityX < 0) {
        // Ball is moving towards the opponent
        if (opponentPaddleY + PADDLE_HEIGHT / 2 < ballY) {
            opponentPaddleY += PADDLE_SPEED / 60; // Move paddle down
        } else {
            opponentPaddleY -= PADDLE_SPEED / 60; // Move paddle up
        }
    } else {
        // Ball is moving towards the player or stationary
        if (opponentPaddleY + PADDLE_HEIGHT / 2 < ballY) {
            opponentPaddleY += PADDLE_SPEED / 60; // Move paddle down
        } else {
            opponentPaddleY -= PADDLE_SPEED / 60; // Move paddle up
        }
    }

    // Update ball position
    ballX += ballVelocityX / 60; // Normalize speed for smooth movement
    ballY += ballVelocityY / 60; // Normalize speed for smooth movement

    // Handle ball collisions with walls
    if (ballY - BALL_RADIUS < 0 || ballY + BALL_RADIUS > HEIGHT) {
        ballVelocityY = -ballVelocityY;
    }

    // Handle ball collisions with paddles
    if (
        (ballX - BALL_RADIUS < PADDLE_WIDTH && ballY > playerPaddleY && ballY < playerPaddleY + PADDLE_HEIGHT) ||
        (ballX + BALL_RADIUS > WIDTH - PADDLE_WIDTH && ballY > opponentPaddleY && ballY < opponentPaddleY + PADDLE_HEIGHT)
    ) {
        ballVelocityX = -ballVelocityX;
    }

    // Check if the ball goes out of bounds (scored)
    if (ballX - BALL_RADIUS < 0) {
        opponentScore++;
        resetBall();
    } else if (ballX + BALL_RADIUS > WIDTH) {
        playerScore++;
        resetBall();
    }
}

// Function to update game state for multiplayer mode
function updateMultiplayer() {
    // Move player paddle based on movement direction
    if (isMovingUp && playerPaddleY > 0) {
        playerPaddleY -= PADDLE_SPEED / 60; // Normalize speed for smooth movement
    }
    if (isMovingDown && playerPaddleY < HEIGHT - PADDLE_HEIGHT) {
        playerPaddleY += PADDLE_SPEED / 60; // Normalize speed for smooth movement
    }

    // Send player movement to the server in multiplayer mode
    if (isMultiplayer) {
        socket.emit('move', { y: playerPaddleY });
    }

    // Update ball position
    ballX += ballVelocityX / 60; // Normalize speed for smooth movement
    ballY += ballVelocityY / 60; // Normalize speed for smooth movement

    // Handle ball collisions with walls
    if (ballY - BALL_RADIUS < 0 || ballY + BALL_RADIUS > HEIGHT) {
        ballVelocityY = -ballVelocityY;
    }

    // Handle ball collisions with paddles
    if (
        (ballX - BALL_RADIUS < PADDLE_WIDTH && ballY > playerPaddleY && ballY < playerPaddleY + PADDLE_HEIGHT) ||
        (ballX + BALL_RADIUS > WIDTH - PADDLE_WIDTH && ballY > opponentPaddleY && ballY < opponentPaddleY + PADDLE_HEIGHT)
    ) {
        ballVelocityX = -ballVelocityX;
    }

    // Check if the ball goes out of bounds (scored)
    if (ballX - BALL_RADIUS < 0) {
        opponentScore++;
        resetBall();
    } else if (ballX + BALL_RADIUS > WIDTH) {
        playerScore++;
        resetBall();
    }

    // Send ball position to the server in multiplayer mode
    if (isMultiplayer) {
        socket.emit('ball', { x: ballX, y: ballY });
    }
}

// Function to render game elements
function render() {
    // Clear canvas
    ctx.clearRect(0, 0, WIDTH, HEIGHT);

    // Draw paddles
    ctx.fillStyle = "#ffffff"; // Set paddle color to white
    ctx.fillRect(0, playerPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT); // Player paddle
    if (!isMultiplayer) {
        ctx.fillRect(WIDTH - PADDLE_WIDTH, opponentPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT); // Opponent paddle
    }

    // Draw ball
    ctx.beginPath();
    ctx.arc(ballX, ballY, BALL_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = "#ffffff"; // Set ball color to white
    ctx.fill();
    ctx.closePath();

    // Draw scoreboard
    ctx.font = "20px Arial";
    ctx.fillStyle = "#ffffff";
    ctx.fillText(playerName + ": " + playerScore, 20, 30); // Display player's name and score
    if (!isMultiplayer) {
        ctx.fillText("Computer: " + opponentScore, WIDTH - 120, 30); // Display opponent's name and score
    } else {
        ctx.fillText("Opponent: " + opponentScore, WIDTH - 120, 30); // Display opponent's name and score
    }
}

// Variables to keep track of paddle movement direction
let isMovingUp = false;
let isMovingDown = false;

// Event listeners for arrow key presses
document.addEventListener("keydown", function(event) {
    if (event.key === "ArrowUp") {
        isMovingUp = true;
    } else if (event.key === "ArrowDown") {
        isMovingDown = true;
    }
});

// Event listeners for arrow key releases
document.addEventListener("keyup", function(event) {
    if (event.key === "ArrowUp") {
        isMovingUp = false;
    } else if (event.key === "ArrowDown") {
        isMovingDown = false;
    }
});

// Function to reset ball position
function resetBall() {
    ballX = WIDTH / 2;
    ballY = HEIGHT / 2;
    ballVelocityX = BALL_SPEED;
    ballVelocityY = BALL_SPEED;
}

// Game loop
function gameLoop() {
    // Update game state based on selected mode
    if (isMultiplayer) {
        updateMultiplayer();
    } else {
        updateSingleplayer();
    }

    // Render game elements
    render();

    // Request next frame
    requestAnimationFrame(gameLoop);
}
