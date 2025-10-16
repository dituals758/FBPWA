import { Helpers } from './js/utils/helpers.js';

class Pipes {
    constructor(canvasWidth, canvasHeight) {
        this.canvasWidth = canvasWidth;
        this.canvasHeight = canvasHeight;
        this.pipes = [];
        this.gap = 120;
        this.width = 52;
        this.speed = 2;
        this.spawnRate = 120; // frames between pipes
        this.frameCount = 0;
        this.score = 0;
        this.lastPipeX = 0;
        
        this.reset();
    }
    
    reset() {
        this.pipes = [];
        this.frameCount = 0;
        this.score = 0;
        this.speed = 2;
        this.lastPipeX = this.canvasWidth;
    }
    
    update(deltaTime) {
        this.frameCount++;
        
        // Spawn new pipes with consistent spacing
        if (this.frameCount % this.spawnRate === 0 || 
            (this.pipes.length === 0 && this.frameCount % 60 === 0)) {
            this.spawnPipe();
        }
        
        // Update pipe positions and check for removal
        for (let i = this.pipes.length - 1; i >= 0; i--) {
            const pipe = this.pipes[i];
            pipe.x -= this.speed * (deltaTime / 16.67); // Normalize speed
            
            // Remove off-screen pipes
            if (pipe.x + this.width < -50) {
                this.pipes.splice(i, 1);
                continue;
            }
            
            // Score point when bird passes pipe
            if (!pipe.passed && pipe.x + this.width < this.canvasWidth / 4) {
                pipe.passed = true;
                this.score++;
                
                // Gradually increase speed and difficulty
                if (this.score % 5 === 0) {
                    this.speed += 0.2;
                    this.gap = Math.max(80, this.gap - 2); // Minimum gap of 80
                }
            }
        }
    }
    
    spawnPipe() {
        const minHeight = 60;
        const maxHeight = this.canvasHeight - this.gap - minHeight - 80; // Account for ground
        const height = minHeight + Math.random() * (maxHeight - minHeight);
        
        // Ensure minimum distance between pipes
        const minDistance = this.canvasWidth * 0.4;
        if (this.lastPipeX - this.canvasWidth > minDistance) {
            this.pipes.push({
                x: this.canvasWidth,
                y: height,
                height: height,
                passed: false
            });
            this.lastPipeX = this.canvasWidth;
        }
    }
    
    draw(ctx) {
        this.pipes.forEach(pipe => {
            const topPipeHeight = pipe.height;
            const bottomPipeY = pipe.height + this.gap;
            const bottomPipeHeight = this.canvasHeight - bottomPipeY - 80;
            
            // Pipe gradient for top pipe
            const topGradient = ctx.createLinearGradient(
                pipe.x, 0, 
                pipe.x + this.width, 0
            );
            topGradient.addColorStop(0, '#27ae60');
            topGradient.addColorStop(1, '#2ecc71');
            
            // Top pipe
            ctx.fillStyle = topGradient;
            ctx.fillRect(pipe.x, 0, this.width, topPipeHeight);
            
            // Top pipe cap with 3D effect
            ctx.fillStyle = '#219653';
            ctx.fillRect(pipe.x - 4, topPipeHeight - 20, this.width + 8, 20);
            
            // Top pipe cap highlight
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(pipe.x - 3, topPipeHeight - 20, this.width + 6, 5);
            
            // Pipe gradient for bottom pipe
            const bottomGradient = ctx.createLinearGradient(
                pipe.x, bottomPipeY, 
                pipe.x + this.width, bottomPipeY
            );
            bottomGradient.addColorStop(0, '#27ae60');
            bottomGradient.addColorStop(1, '#2ecc71');
            
            // Bottom pipe
            ctx.fillStyle = bottomGradient;
            ctx.fillRect(pipe.x, bottomPipeY, this.width, bottomPipeHeight);
            
            // Bottom pipe cap with 3D effect
            ctx.fillStyle = '#219653';
            ctx.fillRect(pipe.x - 4, bottomPipeY, this.width + 8, 20);
            
            // Bottom pipe cap highlight
            ctx.fillStyle = '#2ecc71';
            ctx.fillRect(pipe.x - 3, bottomPipeY, this.width + 6, 5);
            
            // Pipe details/stripes
            ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
            for (let i = 10; i < topPipeHeight - 20; i += 25) {
                ctx.fillRect(pipe.x, i, this.width, 10);
            }
            
            for (let i = bottomPipeY + 25; i < this.canvasHeight - 80 - 10; i += 25) {
                ctx.fillRect(pipe.x, i, this.width, 10);
            }
        });
    }
    
    getPipes() {
        return this.pipes.map(pipe => ({
            x: pipe.x,
            y: pipe.y,
            width: this.width,
            height: pipe.height,
            gap: this.gap,
            passed: pipe.passed
        }));
    }
    
    getScore() {
        return this.score;
    }
    
    // Performance optimization - limit number of pipes
    optimize() {
        if (this.pipes.length > 5) {
            this.pipes = this.pipes.slice(-5); // Keep only last 5 pipes
        }
    }
}

export { Pipes };