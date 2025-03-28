// Game constants
const GRID_SIZE = 20; // Size of each grid cell in pixels
const GRID_WIDTH = 20; // Number of grid cells in width (400/20)
const GRID_HEIGHT = 20; // Number of grid cells in height (400/20)
const SNAKE_COLOR = '#4CAF50';
const SNAKE_HEAD_COLOR = '#388E3C';
const FOOD_COLOR = '#FF5252';
const EFFECT_DURATION = 300; // Duration of visual effects in milliseconds

// Difficulty settings (milliseconds between moves - lower = faster)
const DIFFICULTY_SPEEDS = {
    easy: 200,
    medium: 150,
    hard: 100
};
let currentDifficulty = 'medium';
let GAME_SPEED = DIFFICULTY_SPEEDS[currentDifficulty];

// Game variables
let canvas, ctx;
let snake = [];
let food = {};
let direction = 'right';
let nextDirection = 'right';
let score = 0;
let highScores = {
    easy: 0,
    medium: 0,
    hard: 0
};
let gameRunning = false;
let gameLoop;
let isPaused = false;

// Variables for visual effects
let foodEatenEffect = false;
let effectTimer = null;
let gameOverEffect = false;
let gameOverRadius = 0;

// DOM Elements
let scoreDisplay, finalScoreDisplay, gameOverDisplay;
let startButton, restartButton;

// Initialize the game
window.onload = function() {
    canvas = document.getElementById('game-board');
    ctx = canvas.getContext('2d');
    
    scoreDisplay = document.getElementById('score');
    finalScoreDisplay = document.getElementById('final-score');
    gameOverDisplay = document.getElementById('game-over');
    
    startButton = document.getElementById('start-btn');
    restartButton = document.getElementById('restart-btn');
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // Load high scores from local storage
    loadHighScores();
    
    // Add keyboard event listener
    document.addEventListener('keydown', handleKeyPress);
    
    // Initial draw
    drawEmptyBoard();
    
    // Set up difficulty selector if it exists
    const difficultySelector = document.getElementById('difficulty');
    if (difficultySelector) {
        difficultySelector.addEventListener('change', function() {
            currentDifficulty = this.value;
            GAME_SPEED = DIFFICULTY_SPEEDS[currentDifficulty];
            
            // Update high score display for the new difficulty
            updateHighScoreDisplay();
            
            // Restart game loop with new speed if game is running
            if (gameRunning && !isPaused) {
                clearInterval(gameLoop);
                gameLoop = setInterval(updateGame, GAME_SPEED);
            }
        });
    }
    
    // Add pause function on spacebar
    document.addEventListener('keydown', function(e) {
        if (e.code === 'Space' && gameRunning) {
            togglePause();
        }
    });
    
    // Add touch event handlers for mobile control
    setupTouchControls();
};

// Start or restart the game
function startGame() {
    // Reset game state
    snake = [
        {x: 10, y: 10}, // Head
        {x: 9, y: 10},
        {x: 8, y: 10}
    ];
    
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    scoreDisplay.textContent = '0';
    gameRunning = true;
    
    // Reset visual effects
    foodEatenEffect = false;
    gameOverEffect = false;
    gameOverRadius = 0;
    
    // Hide game over display if visible
    gameOverDisplay.classList.add('hidden');
    
    // Generate initial food
    generateFood();
    
    // Clear any existing game loop
    if (gameLoop) clearInterval(gameLoop);
    
    // Start the game loop
    gameLoop = setInterval(updateGame, GAME_SPEED);
}

// Handle keyboard controls
function handleKeyPress(event) {
    const key = event.key;
    
    // Prevent the default behavior of arrow keys and WASD keys (scrolling the page)
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(key)) {
        event.preventDefault();
    }
    
    // Set the next direction based on key pressed
    // Prevent 180-degree turns (e.g., can't go right if currently moving left)
    if ((key === 'ArrowUp' || key.toLowerCase() === 'w') && direction !== 'down') {
        nextDirection = 'up';
    } else if ((key === 'ArrowDown' || key.toLowerCase() === 's') && direction !== 'up') {
        nextDirection = 'down';
    } else if ((key === 'ArrowLeft' || key.toLowerCase() === 'a') && direction !== 'right') {
        nextDirection = 'left';
    } else if ((key === 'ArrowRight' || key.toLowerCase() === 'd') && direction !== 'left') {
        nextDirection = 'right';
    }
}

// Update game state
function updateGame() {
    if (!gameRunning || isPaused) return;
    
    // Update direction
    direction = nextDirection;
    
    // Move the snake
    moveSnake();
    
    // Check collisions
    if (checkCollision()) {
        gameOver();
        return;
    }
    
    // Check if food is eaten
    if (snake[0].x === food.x && snake[0].y === food.y) {
        eatFood();
    }
    
    // Draw the updated game
    drawGame();
}

// Move the snake based on the current direction
function moveSnake() {
    // Create new head position based on current direction
    const head = { x: snake[0].x, y: snake[0].y };
    
    switch (direction) {
        case 'up':
            head.y -= 1;
            break;
        case 'down':
            head.y += 1;
            break;
        case 'left':
            head.x -= 1;
            break;
        case 'right':
            head.x += 1;
            break;
    }
    
    // Add the new head to the beginning of the snake array
    snake.unshift(head);
    
    // Remove the last segment unless food was eaten
    // (in eatFood function we don't remove the tail to make the snake grow)
    if (!(head.x === food.x && head.y === food.y)) {
        snake.pop();
    }
}

// Check for collisions with walls or self
function checkCollision() {
    const head = snake[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        return true;
    }
    
    // Self collision (check if head collides with any segment)
    for (let i = 1; i < snake.length; i++) {
        if (head.x === snake[i].x && head.y === snake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Generate food at a random position
function generateFood() {
    // Create a random position for the food
    let newFood;
    let foodOnSnake;
    
    // Keep generating positions until we find one that's not on the snake
    do {
        foodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT)
        };
        
        // Check if the food is on any snake segment
        for (let segment of snake) {
            if (newFood.x === segment.x && newFood.y === segment.y) {
                foodOnSnake = true;
                break;
            }
        }
    } while (foodOnSnake);
    
    food = newFood;
}

// Handle food consumption
function eatFood() {
    // Increase score
    score += 10;
    scoreDisplay.textContent = score;
    
    // Trigger food eaten effect
    foodEatenEffect = true;
    
    // Clear any existing effect timer
    if (effectTimer) {
        clearTimeout(effectTimer);
    }
    
    // Set timer to end the effect
    effectTimer = setTimeout(() => {
        foodEatenEffect = false;
    }, EFFECT_DURATION);
    
    // Generate new food
    generateFood();
}

// Game over function
function gameOver() {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // Trigger game over visual effect
    gameOverEffect = true;
    gameOverRadius = 0;
    requestAnimationFrame(drawGame);
    
    // Check if current score is a new high score for the current difficulty
    if (score > highScores[currentDifficulty]) {
        highScores[currentDifficulty] = score;
        saveHighScores();
        updateHighScoreDisplay();
    }
    
    // Delay showing game over message until after animation
    setTimeout(() => {
        // Show game over display
        finalScoreDisplay.textContent = score;
        gameOverDisplay.classList.remove('hidden');
    }, 1000);
}

// Draw the empty game board
function drawEmptyBoard() {
    ctx.fillStyle = '#202020';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
}

// Draw the game (snake and food)
function drawGame() {
    // Clear the canvas
    drawEmptyBoard();
    
    // Draw the snake
    snake.forEach((segment, index) => {
        // Use different color for the head
        ctx.fillStyle = index === 0 ? SNAKE_HEAD_COLOR : SNAKE_COLOR;
        
        ctx.fillRect(
            segment.x * GRID_SIZE,
            segment.y * GRID_SIZE,
            GRID_SIZE - 1, // Leave a small gap for grid effect
            GRID_SIZE - 1
        );
    });
    
    // Draw the food
    ctx.fillStyle = FOOD_COLOR;
    ctx.beginPath();
    const radius = GRID_SIZE / 2 - 2;
    ctx.arc(
        food.x * GRID_SIZE + radius + 1,
        food.y * GRID_SIZE + radius + 1,
        radius,
        0,
        Math.PI * 2
    );
    ctx.fill();
    
    // Draw food eaten effect (pulsating circle)
    if (foodEatenEffect) {
        const elapsedTime = new Date().getTime() % EFFECT_DURATION;
        const effectProgress = elapsedTime / EFFECT_DURATION;
        
        // Calculate expanding radius for the effect
        const effectRadius = radius * (1 + effectProgress);
        
        // Draw pulsating circle effect
        ctx.fillStyle = 'rgba(255, 82, 82, ' + (1 - effectProgress) + ')';
        ctx.beginPath();
        ctx.arc(
            snake[0].x * GRID_SIZE + radius + 1,
            snake[0].y * GRID_SIZE + radius + 1,
            effectRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();
    }
    
    // Draw game over effect
    if (gameOverEffect) {
        // Transparent overlay
        ctx.fillStyle = 'rgba(255, 0, 0, 0.3)';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        
        // Expanding circle from where the collision happened
        ctx.fillStyle = 'rgba(255, 0, 0, 0.7)';
        ctx.beginPath();
        ctx.arc(
            snake[0].x * GRID_SIZE + radius + 1,
            snake[0].y * GRID_SIZE + radius + 1,
            gameOverRadius,
            0,
            Math.PI * 2
        );
        ctx.fill();
        
        // Increase the radius until it covers most of the canvas
        if (gameOverRadius < canvas.width) {
            gameOverRadius += 5;
            requestAnimationFrame(drawGame);
        }
    }
}

// Toggle pause state
function togglePause() {
    isPaused = !isPaused;
    
    // Show/hide pause notification
    const pauseNotification = document.getElementById('pause-notification');
    if (pauseNotification) {
        if (isPaused) {
            pauseNotification.classList.remove('hidden');
        } else {
            pauseNotification.classList.add('hidden');
            // Resume the game loop
            clearInterval(gameLoop);
            gameLoop = setInterval(updateGame, GAME_SPEED);
        }
    } else {
        // If no pause notification element exists, create one
        if (isPaused) {
            const notification = document.createElement('div');
            notification.id = 'pause-notification';
            notification.innerHTML = '<h2>Game Paused</h2><p>Press Space to resume</p>';
            notification.style.position = 'absolute';
            notification.style.top = '50%';
            notification.style.left = '50%';
            notification.style.transform = 'translate(-50%, -50%)';
            notification.style.backgroundColor = 'rgba(0, 0, 0, 0.7)';
            notification.style.color = 'white';
            notification.style.padding = '20px';
            notification.style.borderRadius = '10px';
            notification.style.textAlign = 'center';
            notification.style.zIndex = '1000';
            
            canvas.parentNode.appendChild(notification);
        }
    }
}

// Set up touch controls for mobile devices
function setupTouchControls() {
    // Exit if canvas doesn't exist
    if (!canvas) return;
    
    let touchStartX = 0;
    let touchStartY = 0;
    
    // Add touch event listeners to the canvas
    canvas.addEventListener('touchstart', function(e) {
        e.preventDefault();
        touchStartX = e.touches[0].clientX;
        touchStartY = e.touches[0].clientY;
    }, false);
    
    canvas.addEventListener('touchmove', function(e) {
        e.preventDefault(); // Prevent scrolling when touching the canvas
    }, false);
    
    canvas.addEventListener('touchend', function(e) {
        e.preventDefault();
        
        if (!gameRunning) {
            // Start the game if it's not running
            startGame();
            return;
        }
        
        // Get touch end coordinates
        const touchEndX = e.changedTouches[0].clientX;
        const touchEndY = e.changedTouches[0].clientY;
        
        // Calculate swipe direction
        const diffX = touchEndX - touchStartX;
        const diffY = touchEndY - touchStartY;
        
        // Determine swipe direction (the direction with the larger absolute difference)
        if (Math.abs(diffX) > Math.abs(diffY)) {
            // Horizontal swipe
            if (diffX > 0 && direction !== 'left') {
                // Right swipe
                nextDirection = 'right';
            } else if (diffX < 0 && direction !== 'right') {
                // Left swipe
                nextDirection = 'left';
            }
        } else {
            // Vertical swipe
            if (diffY > 0 && direction !== 'up') {
                // Down swipe
                nextDirection = 'down';
            } else if (diffY < 0 && direction !== 'down') {
                // Up swipe
                nextDirection = 'up';
            }
        }
    }, false);
}

// Load high scores from local storage
function loadHighScores() {
    const storedScores = localStorage.getItem('snakeHighScores');
    if (storedScores) {
        highScores = JSON.parse(storedScores);
    }
    
    // Display the high score for the current difficulty
    updateHighScoreDisplay();
}

// Save high scores to local storage
function saveHighScores() {
    localStorage.setItem('snakeHighScores', JSON.stringify(highScores));
}

// Update the high score display for the current difficulty
function updateHighScoreDisplay() {
    const highScoreElement = document.getElementById('high-score');
    if (highScoreElement) {
        highScoreElement.textContent = highScores[currentDifficulty];
    }
}