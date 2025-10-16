class Bird {
    constructor(x, y) {
        this.startX = x;
        this.startY = y;
        this.width = 34;
        this.height = 24;
        this.velocity = 0;
        this.gravity = 0.5;
        this.jumpStrength = -8;
        this.rotation = 0;
        this.flapAnimation = 0;
        
        this.reset();
    }
    
    reset() {
        this.x = this.startX;
        this.y = this.startY;
        this.velocity = 0;
        this.rotation = 0;
        this.flapAnimation = 0;
    }
    
    update(deltaTime) {
        // Apply gravity with delta time
        this.velocity += this.gravity * (deltaTime / 16.67); // Normalize to 60fps
        this.y += this.velocity;
        
        // Update flap animation
        this.flapAnimation += deltaTime / 16.67;
        
        // Calculate rotation based on velocity (-25° to 90° range)
        const targetRotation = Math.max(-0.44, Math.min(1.57, this.velocity * 0.1));
        this.rotation += (targetRotation - this.rotation) * 0.1; // Smooth rotation
    }
    
    flap() {
        this.velocity = this.jumpStrength;
        this.flapAnimation = 0; // Reset animation on flap
    }
    
    draw(ctx) {
        ctx.save();
        ctx.translate(this.x, this.y);
        ctx.rotate(this.rotation);
        
        // Bird body with gradient
        const gradient = ctx.createRadialGradient(0, 0, 0, 0, 0, this.width / 2);
        gradient.addColorStop(0, '#FFEA00');
        gradient.addColorStop(1, '#FFD700');
        ctx.fillStyle = gradient;
        
        ctx.beginPath();
        ctx.arc(0, 0, this.width / 2, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird eye
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(8, -5, 6, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.fillStyle = 'black';
        ctx.beginPath();
        ctx.arc(10, -5, 3, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird pupil highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.8)';
        ctx.beginPath();
        ctx.arc(9, -6, 1, 0, Math.PI * 2);
        ctx.fill();
        
        // Bird beak
        ctx.fillStyle = '#FF8C00';
        ctx.beginPath();
        ctx.moveTo(15, 0);
        ctx.lineTo(25, -5);
        ctx.lineTo(25, 5);
        ctx.closePath();
        ctx.fill();
        
        // Bird beak highlight
        ctx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        ctx.beginPath();
        ctx.moveTo(17, 0);
        ctx.lineTo(20, -2);
        ctx.lineTo(20, 2);
        ctx.closePath();
        ctx.fill();
        
        // Animated wing
        this.drawWing(ctx);
        
        // Bird shadow
        ctx.fillStyle = 'rgba(0, 0, 0, 0.1)';
        ctx.beginPath();
        ctx.ellipse(0, this.width / 2 + 2, this.width / 2 - 2, 3, 0, 0, Math.PI * 2);
        ctx.fill();
        
        ctx.restore();
    }
    
    drawWing(ctx) {
        const wingFlap = Math.sin(this.flapAnimation * 0.5) * 0.5 + 0.5;
        const wingY = 5 + wingFlap * 3;
        const wingScale = 0.8 + wingFlap * 0.2;
        
        ctx.fillStyle = '#FF8C00';
        ctx.save();
        ctx.scale(wingScale, 1);
        ctx.beginPath();
        ctx.ellipse(-5, wingY, 8, 5, 0, 0, Math.PI * 2);
        ctx.fill();
        ctx.restore();
        
        // Wing details
        ctx.strokeStyle = '#FF6B00';
        ctx.lineWidth = 1;
        ctx.beginPath();
        ctx.moveTo(-10, wingY);
        ctx.lineTo(-2, wingY + 2);
        ctx.lineTo(-2, wingY - 2);
        ctx.closePath();
        ctx.stroke();
    }
    
    getBounds() {
        // Return collision bounds (slightly smaller than visual for better gameplay)
        const boundsScale = 0.8;
        return {
            x: this.x - (this.width / 2) * boundsScale,
            y: this.y - (this.height / 2) * boundsScale,
            width: this.width * boundsScale,
            height: this.height * boundsScale
        };
    }
}

export { Bird };