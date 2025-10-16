import { Bird } from './js/game/bird.js';
import { Pipes } from './js/game/pipes.js';
import { CollisionDetector } from './js/game/collision.js';
import { Helpers } from './js/utils/helpers.js';

class GameEngine {
    constructor(canvas) {
        this.canvas = canvas;
        this.ctx = canvas.getContext('2d');
        this.isRunning = false;
        this.isPaused = false;
        this.lastTime = 0;
        this.accumulator = 0;
        this.timestep = 1000 / 60; // 60 FPS
        this.frameId = null;
        
        // Game objects
        this.bird = new Bird(canvas.width / 4, canvas.height / 2);
        this.pipes = new Pipes(canvas.width, canvas.height);
        this.collisionDetector = new CollisionDetector();
        
        // Game state
        this.score = 0;
        this.highScore = parseInt(localStorage.getItem('flappyHighScore')) || 0;
        this.gameStartTime = 0;
        
        this.init();
    }
    
    init() {
        this.setupEventListeners();
        this.updateUI();
        this.drawStaticScreen();
    }
    
    setupEventListeners() {
        // Input handlers with improved touch support
        this.handleInput = this.handleInput.bind(this);
        
        // Mouse events
        this.canvas.addEventListener('click', this.handleInput);
        
        // Touch events with better handling
        this.canvas.addEventListener('touchstart', (e) => {
            e.preventDefault();
            this.handleInput();
        }, { passive: false });
        
        // Keyboard support
        document.addEventListener('keydown', (e) => {
            if (e.code === 'Space' || e.code === 'ArrowUp' || e.code === 'KeyW') {
                e.preventDefault();
                this.handleInput();
            }
            
            // Pause with Escape key
            if (e.code === 'Escape' && this.isRunning) {
                this.togglePause();
            }
        });
        
        // Gamepad support (experimental)
        window.addEventListener('gamepadconnected', (e) => {
            console.log('🎮 Gamepad connected:', e.gamepad.id);
        });
    }
    
    handleInput() {
        if (!this.isRunning || this.isPaused) return;
        
        this.bird.flap();
        this.playSound('flap');
        Helpers.vibrate(50); // Short vibration on flap
    }
    
    start() {
        if (this.isRunning) return;
        
        this.reset();
        this.isRunning = true;
        this.isPaused = false;
        this.gameStartTime = Date.now();
        
        this.showGameUI();
        this.gameLoop(0);
        
        console.log('🎮 Игра начата');
    }
    
    reset() {
        this.score = 0;
        this.bird.reset();
        this.pipes.reset();
        this.updateScore();
    }
    
    gameLoop(timestamp) {
        if (!this.isRunning) return;
        
        if (!this.lastTime) this.lastTime = timestamp;
        const deltaTime = Math.min(timestamp - this.lastTime, 100); // Cap at 100ms
        this.lastTime = timestamp;
        
        this.accumulator += deltaTime;
        
        // Fixed timestep updates for consistent physics
        while (this.accumulator >= this.timestep) {
            this.update(this.timestep);
            this.accumulator -= this.timestep;
        }
        
        this.render();
        this.frameId = requestAnimationFrame((time) => this.gameLoop(time));
    }
    
    update(deltaTime) {
        if (this.isPaused) return;
        
        this.bird.update(deltaTime);
        this.pipes.update(deltaTime);
        
        // Check collisions
        if (this.collisionDetector.checkBirdPipes(this.bird, this.pipes.getPipes()) ||
            this.collisionDetector.checkBirdBounds(this.bird, this.canvas.height)) {
            this.gameOver();
            return;
        }
        
        // Update score
        const newScore = this.pipes.getScore();
        if (newScore > this.score) {
            this.score = newScore;
            this.updateScore();
            this.playSound('point');
            
            // Celebrate every 10 points
            if (this.score % 10 === 0) {
                Helpers.vibrate([100, 50, 100]);
            }
        }
    }
    
    render() {
        const ctx = this.ctx;
        
        // Clear canvas with optimal method
        ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Draw background
        this.drawBackground();
        
        // Draw game objects
        this.pipes.draw(ctx);
        this.bird.draw(ctx);
        
        // Draw ground
        this.drawGround();
        
        // Draw pause indicator
        if (this.isPaused) {
            this.drawPauseOverlay();
        }
    }
    
    drawBackground() {
        const ctx = this.ctx;
        
        // Sky gradient
        const gradient = ctx.createLinearGradient(0, 0, 0, this.canvas.height);
        gradient.addColorStop(0, '#87CEEB');
        gradient.addColorStop(1, '#1E90FF');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Animated clouds
        this.drawClouds();
    }
    
    drawClouds() {
        const ctx = this.ctx;
        const time = Date.now() / 1000;
        
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        
        // Cloud positions with subtle animation
        const clouds = [
            { x: (100 + Math.sin(time * 0.1) * 20) % (this.canvas.width + 100) - 50, y: 80, size: 30 },
            { x: (250 + Math.cos(time * 0.15) * 15) % (this.canvas.width + 100) - 50, y: 100, size: 25 },
            { x: (400 + Math.sin(time * 0.2) * 25) % (this.canvas.width + 100) - 50, y: 60, size: 35 }
        ];
        
        clouds.forEach(cloud => {
            this.drawSingleCloud(cloud.x, cloud.y, cloud.size);
        });
    }
    
    drawSingleCloud(x, y, size) {
        const ctx = this.ctx;
        
        ctx.beginPath();
        ctx.arc(x, y, size, 0, Math.PI * 2);
        ctx.arc(x + size * 0.8, y - size * 0.2, size * 0.8, 0, Math.PI * 2);
        ctx.arc(x + size * 1.6, y, size * 0.9, 0, Math.PI * 2);
        ctx.arc(x + size * 1.2, y + size * 0.3, size * 0.7, 0, Math.PI * 2);
        ctx.fill();
    }
    
    drawGround() {
        const ctx = this.ctx;
        const groundHeight = 80;
        const groundY = this.canvas.height - groundHeight;
        
        // Ground gradient
        const gradient = ctx.createLinearGradient(0, groundY, 0, this.canvas.height);
        gradient.addColorStop(0, '#8B4513');
        gradient.addColorStop(1, '#654321');
        ctx.fillStyle = gradient;
        ctx.fillRect(0, groundY, this.canvas.width, groundHeight);
        
        // Grass
        ctx.fillStyle = '#2ecc71';
        ctx.fillRect(0, groundY, this.canvas.width, 10);
        
        // Grass pattern with subtle animation
        const time = Date.now() / 1000;
        ctx.fillStyle = '#27ae60';
        for (let i = 0; i < this.canvas.width; i += 20) {
            const wave = Math.sin(time * 2 + i * 0.1) * 2;
            ctx.fillRect(i, groundY - 5 + wave, 5, 10);
        }
    }
    
    drawPauseOverlay() {
        const ctx = this.ctx;
        
        // Semi-transparent overlay
        ctx.fillStyle = 'rgba(0, 0, 0, 0.7)';
        ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);
        
        // Pause text
        ctx.fillStyle = '#FFFFFF';
        ctx.font = 'bold 48px Arial';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('ПАУЗА', this.canvas.width / 2, this.canvas.height / 2);
        
        ctx.font = '24px Arial';
        ctx.fillText('Нажмите ESC для продолжения', this.canvas.width / 2, this.canvas.height / 2 + 50);
    }
    
    drawStaticScreen() {
        // Draw initial static screen when game is not running
        this.drawBackground();
        this.drawGround();
        this.bird.draw(this.ctx);
    }
    
    updateScore() {
        const scoreDisplay = document.getElementById('score-display');
        if (scoreDisplay) {
            scoreDisplay.textContent = this.score;
        }
    }
    
    showGameUI() {
        const startScreen = document.getElementById('start-screen');
        const gameOverScreen = document.getElementById('game-over');
        const scoreDisplay = document.getElementById('score-display');
        
        if (startScreen) startScreen.style.display = 'none';
        if (gameOverScreen) gameOverScreen.style.display = 'none';
        if (scoreDisplay) scoreDisplay.style.display = 'block';
    }
    
    showGameOverUI() {
        const gameOverScreen = document.getElementById('game-over');
        const finalScore = document.getElementById('final-score');
        const highScoreDisplay = document.getElementById('high-score');
        
        if (gameOverScreen) {
            gameOverScreen.style.display = 'flex';
            gameOverScreen.removeAttribute('hidden');
        }
        
        if (finalScore) {
            finalScore.textContent = `Ваш счет: ${this.score}`;
        }
        
        if (highScoreDisplay) {
            highScoreDisplay.textContent = `Рекорд: ${this.highScore}`;
        }
    }
    
    gameOver() {
        if (!this.isRunning) return;
        
        this.isRunning = false;
        this.isPaused = false;
        
        if (this.frameId) {
            cancelAnimationFrame(this.frameId);
            this.frameId = null;
        }
        
        this.playSound('hit');
        Helpers.vibrate([200, 100, 200]); // Vibration pattern for game over
        
        // Update high score
        if (this.score > this.highScore) {
            this.highScore = this.score;
            localStorage.setItem('flappyHighScore', this.highScore);
        }
        
        // Calculate play time
        const playTime = Date.now() - this.gameStartTime;
        console.log(`🎮 Игра завершена. Счет: ${this.score}, Время: ${(playTime / 1000).toFixed(1)}с`);
        
        this.showGameOverUI();
    }
    
    pause() {
        if (!this.isRunning || this.isPaused) return;
        
        this.isPaused = true;
        console.log('⏸️ Игра на паузе');
    }
    
    resume() {
        if (!this.isRunning || !this.isPaused) return;
        
        this.isPaused = false;
        this.lastTime = performance.now();
        console.log('▶️ Игра продолжена');
    }
    
    togglePause() {
        if (this.isPaused) {
            this.resume();
        } else {
            this.pause();
        }
    }
    
    playSound(type) {
        // Simple Web Audio implementation with fallback
        try {
            // Check if AudioContext is supported
            if (!window.AudioContext && !window.webkitAudioContext) {
                return;
            }
            
            const audioContext = new (window.AudioContext || window.webkitAudioContext)();
            
            // Only create sounds if context is not suspended
            if (audioContext.state === 'suspended') {
                audioContext.resume();
            }
            
            const oscillator = audioContext.createOscillator();
            const gainNode = audioContext.createGain();
            
            oscillator.connect(gainNode);
            gainNode.connect(audioContext.destination);
            
            // Configure based on sound type
            switch (type) {
                case 'flap':
                    oscillator.type = 'sine';
                    oscillator.frequency.setValueAtTime(400, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.2);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.2);
                    break;
                    
                case 'point':
                    oscillator.type = 'square';
                    oscillator.frequency.setValueAtTime(800, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.1);
                    break;
                    
                case 'hit':
                    oscillator.type = 'sawtooth';
                    oscillator.frequency.setValueAtTime(150, audioContext.currentTime);
                    gainNode.gain.setValueAtTime(0.2, audioContext.currentTime);
                    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.5);
                    oscillator.start();
                    oscillator.stop(audioContext.currentTime + 0.5);
                    break;
            }
            
        } catch (error) {
            console.warn('🔇 Аудио не поддерживается:', error);
        }
    }
    
    // Performance monitoring
    getPerformanceInfo() {
        return {
            fps: this.frameId ? Math.round(1000 / (performance.now() - this.lastTime)) : 0,
            pipes: this.pipes.getPipes().length,
            score: this.score,
            running: this.isRunning,
            paused: this.isPaused
        };
    }
}

export { GameEngine };