// Game constants
const GRID_SIZE = 20; // Size of each grid cell in pixels
const GRID_WIDTH = 20; // Number of grid cells in width (400/20)
const GRID_HEIGHT = 20; // Number of grid cells in height (400/20)
const SNAKE_COLOR = '#4CAF50';
const SNAKE_HEAD_COLOR = '#388E3C';
const SNAKE2_COLOR = '#2196F3'; // Color for player 2's snake
const SNAKE2_HEAD_COLOR = '#1565C0'; // Color for player 2's snake head
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
let snake2 = []; // Snake for player 2
let food = {};
let direction = 'right';
let nextDirection = 'right';
let direction2 = 'left'; // Direction for player 2
let nextDirection2 = 'left'; // Next direction for player 2
let score = 0;
let score2 = 0; // Score for player 2
let isTwoPlayerMode = false; // Flag to check if 2-player mode is active
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
let effectPosition = { x: 0, y: 0 }; // Position for effect (needed for 2 players)

// DOM Elements
let scoreDisplay, scoreDisplay2, finalScoreDisplay, gameOverDisplay, winnerText;
let startButton, restartButton, modeSelector, player2Controls;

// Initialize the game
window.onload = function() {
    canvas = document.getElementById('game-board');
    ctx = canvas.getContext('2d');
    
    scoreDisplay = document.getElementById('score');
    finalScoreDisplay = document.getElementById('final-score');
    gameOverDisplay = document.getElementById('game-over');
    winnerText = document.getElementById('winner-text');
    
    startButton = document.getElementById('start-btn');
    restartButton = document.getElementById('restart-btn');
    modeSelector = document.getElementById('game-mode');
    
    // Get control instructions elements
    const singlePlayerControls = document.getElementById('single-player-controls');
    const twoPlayerControls = document.getElementById('two-player-controls');
    
    startButton.addEventListener('click', startGame);
    restartButton.addEventListener('click', startGame);
    
    // Add listener for game mode selector
    modeSelector.addEventListener('change', function() {
        isTwoPlayerMode = this.value === 'two-player';
        if (isTwoPlayerMode) {
            // Show 2-player controls, hide single player controls
            twoPlayerControls.classList.remove('hidden');
            singlePlayerControls.classList.add('hidden');
            // Update score display for 2 players
            updateScoreDisplay();
        } else {
            // Show single player controls, hide 2-player controls
            singlePlayerControls.classList.remove('hidden');
            twoPlayerControls.classList.add('hidden');
            // Reset to single player score display
            updateScoreDisplay();
        }
    });
    
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
    // Check if 2-player mode is active
    isTwoPlayerMode = modeSelector.value === 'two-player';
    
    // Get control instructions elements
    const singlePlayerControls = document.getElementById('single-player-controls');
    const twoPlayerControls = document.getElementById('two-player-controls');
    
    // Show/hide appropriate controls based on game mode
    if (isTwoPlayerMode) {
        twoPlayerControls.classList.remove('hidden');
        singlePlayerControls.classList.add('hidden');
    } else {
        singlePlayerControls.classList.remove('hidden');
        twoPlayerControls.classList.add('hidden');
    }
    
    // Reset game state
    snake = [
        {x: 5, y: 10}, // Head (moved to left side for 2-player mode)
        {x: 4, y: 10},
        {x: 3, y: 10}
    ];
    
    // Initialize player 2 snake if in 2-player mode
    if (isTwoPlayerMode) {
        snake2 = [
            {x: 15, y: 10}, // Head (right side)
            {x: 16, y: 10},
            {x: 17, y: 10}
        ];
        direction2 = 'left';
        nextDirection2 = 'left';
        score2 = 0;
    } else {
        snake2 = [];
    }
    
    direction = 'right';
    nextDirection = 'right';
    score = 0;
    updateScoreDisplay();
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
    
    // Prevent the default behavior of arrow keys and control keys
    if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 
         'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(key)) {
        event.preventDefault();
    }
    
    if (isTwoPlayerMode) {
        // 2-PLAYER MODE: Player 1 uses WASD, Player 2 uses Arrow keys
        
        // Player 1 controls (WASD keys only)
        if (key.toLowerCase() === 'w' && direction !== 'down') {
            nextDirection = 'up';
        } else if (key.toLowerCase() === 's' && direction !== 'up') {
            nextDirection = 'down';
        } else if (key.toLowerCase() === 'a' && direction !== 'right') {
            nextDirection = 'left';
        } else if (key.toLowerCase() === 'd' && direction !== 'left') {
            nextDirection = 'right';
        }
        
        // Player 2 controls (Arrow keys only)
        if (key === 'ArrowUp' && direction2 !== 'down') {
            nextDirection2 = 'up';
        } else if (key === 'ArrowDown' && direction2 !== 'up') {
            nextDirection2 = 'down';
        } else if (key === 'ArrowLeft' && direction2 !== 'right') {
            nextDirection2 = 'left';
        } else if (key === 'ArrowRight' && direction2 !== 'left') {
            nextDirection2 = 'right';
        }
    } else {
        // 1-PLAYER MODE: Player can use either Arrow keys or WASD
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
}

// Update game state
function updateGame() {
    if (!gameRunning || isPaused) return;
    
    // Update directions
    direction = nextDirection;
    if (isTwoPlayerMode) {
        direction2 = nextDirection2;
    }
    
    // Move the snakes
    moveSnake();
    if (isTwoPlayerMode) {
        moveSnake2();
    }
    
    // Check for collisions in 2-player mode (need to check both before declaring winner)
    if (isTwoPlayerMode) {
        let player1Collided = checkCollision(snake, snake) || checkSnakeCollision(snake[0], snake2);
        let player2Collided = checkCollision(snake2, snake2) || checkSnakeCollision(snake2[0], snake);
        
        // Handle the case where both players collide in the same frame
        if (player1Collided && player2Collided) {
            gameOver('tie');
            return;
        } else if (player1Collided) {
            gameOver('player2');
            return;
        } else if (player2Collided) {
            gameOver('player1');
            return;
        }
    } else {
        // Single player mode
        if (checkCollision(snake, snake)) {
            gameOver('player1');
            return;
        }
    }
    
    // Check if food is eaten by player 1
    if (snake[0].x === food.x && snake[0].y === food.y) {
        eatFood(snake[0], true);
    }
    
    // Check if food is eaten by player 2 in 2-player mode
    if (isTwoPlayerMode && snake2[0].x === food.x && snake2[0].y === food.y) {
        eatFood(snake2[0], false);
    }
    
    // Draw the updated game
    drawGame();
}

// Move player 1's snake based on the current direction
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

// Move player 2's snake based on the current direction
function moveSnake2() {
    const head = { x: snake2[0].x, y: snake2[0].y };
    
    switch (direction2) {
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
    snake2.unshift(head);
    
    // Remove the last segment unless food was eaten
    if (!(head.x === food.x && head.y === food.y)) {
        snake2.pop();
    }
}

// Check for collisions with walls or self
function checkCollision(snakeToCheck, selfSnake) {
    const head = snakeToCheck[0];
    
    // Wall collision
    if (head.x < 0 || head.x >= GRID_WIDTH || head.y < 0 || head.y >= GRID_HEIGHT) {
        return true;
    }
    
    // Self collision (check if head collides with any segment)
    for (let i = 1; i < selfSnake.length; i++) {
        if (head.x === selfSnake[i].x && head.y === selfSnake[i].y) {
            return true;
        }
    }
    
    return false;
}

// Check if a snake head collides with any part of another snake
function checkSnakeCollision(head, otherSnake) {
    for (let segment of otherSnake) {
        if (head.x === segment.x && head.y === segment.y) {
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
    
    // Keep generating positions until we find one that's not on any snake
    do {
        foodOnSnake = false;
        newFood = {
            x: Math.floor(Math.random() * GRID_WIDTH),
            y: Math.floor(Math.random() * GRID_HEIGHT)
        };
        
        // Check if the food is on player 1's snake
        for (let segment of snake) {
            if (newFood.x === segment.x && newFood.y === segment.y) {
                foodOnSnake = true;
                break;
            }
        }
        
        // Check if the food is on player 2's snake in 2-player mode
        if (!foodOnSnake && isTwoPlayerMode) {
            for (let segment of snake2) {
                if (newFood.x === segment.x && newFood.y === segment.y) {
                    foodOnSnake = true;
                    break;
                }
            }
        }
    } while (foodOnSnake);
    
    food = newFood;
}

// Handle food consumption
function eatFood(position, isPlayer1) {
    // Increase score for the appropriate player
    if (isPlayer1) {
        score += 10;
    } else {
        score2 += 10;
    }
    
    // Update score display
    updateScoreDisplay();
    
    // Trigger food eaten effect
    foodEatenEffect = true;
    effectPosition = { x: position.x, y: position.y };
    
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

// Update the score display based on game mode
function updateScoreDisplay() {
    const scoreContainer = document.querySelector('.score-container');
    
    if (isTwoPlayerMode) {
        // Two player mode: show both scores
        scoreContainer.innerHTML = `
            <div class="score player1-score">Player 1: <span id="score">${score}</span></div>
            <div class="score player2-score">Player 2: <span id="score2">${score2}</span></div>
            <div class="high-score">High Score: <span id="high-score">${highScores[currentDifficulty]}</span></div>
        `;
    } else {
        // Single player mode: show single score
        scoreContainer.innerHTML = `
            <div class="score">Score: <span id="score">${score}</span></div>
            <div class="high-score">High Score: <span id="high-score">${highScores[currentDifficulty]}</span></div>
        `;
    }
    
    // Update references
    scoreDisplay = document.getElementById('score');
    const score2Element = document.getElementById('score2');
    if (score2Element) {
        scoreDisplay2 = score2Element;
    }
}

// Game over function
function gameOver(winner) {
    gameRunning = false;
    clearInterval(gameLoop);
    
    // Trigger game over visual effect
    gameOverEffect = true;
    gameOverRadius = 0;
    
    // Set the effect position to the appropriate snake head
    if (winner === 'player2') {
        effectPosition = { x: snake[0].x, y: snake[0].y };
    } else if (isTwoPlayerMode && winner === 'player1') {
        effectPosition = { x: snake2[0].x, y: snake2[0].y };
    } else if (winner === 'tie') {
        // For ties, show effect at center of screen
        effectPosition = { x: GRID_WIDTH / 2, y: GRID_HEIGHT / 2 };
    } else {
        effectPosition = { x: snake[0].x, y: snake[0].y };
    }
    
    requestAnimationFrame(drawGame);
    
    // Check if current score is a new high score for single player mode
    if (!isTwoPlayerMode && score > highScores[currentDifficulty]) {
        highScores[currentDifficulty] = score;
        saveHighScores();
        updateHighScoreDisplay();
    }
    
    // Delay showing game over message until after animation
    setTimeout(() => {
        // Show game over display with appropriate message
        if (isTwoPlayerMode) {
            if (winner === 'player1') {
                winnerText.textContent = "Player 1 wins!";
                finalScoreDisplay.textContent = `Player 1: ${score} - Player 2: ${score2}`;
            } else if (winner === 'player2') {
                winnerText.textContent = "Player 2 wins!";
                finalScoreDisplay.textContent = `Player 1: ${score} - Player 2: ${score2}`;
            } else if (winner === 'tie') {
                winnerText.textContent = "It's a tie!";
                finalScoreDisplay.textContent = `Player 1: ${score} - Player 2: ${score2}`;
            }
        } else {
            winnerText.textContent = "";
            finalScoreDisplay.textContent = score;
        }
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
    
    // Draw player 1's snake
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
    
    // Draw player 2's snake if in 2-player mode
    if (isTwoPlayerMode) {
        snake2.forEach((segment, index) => {
            // Use different color for player 2
            ctx.fillStyle = index === 0 ? SNAKE2_HEAD_COLOR : SNAKE2_COLOR;
            
            ctx.fillRect(
                segment.x * GRID_SIZE,
                segment.y * GRID_SIZE,
                GRID_SIZE - 1,
                GRID_SIZE - 1
            );
        });
    }
    
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
            effectPosition.x * GRID_SIZE + radius + 1,
            effectPosition.y * GRID_SIZE + radius + 1,
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
            effectPosition.x * GRID_SIZE + radius + 1,
            effectPosition.y * GRID_SIZE + radius + 1,
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