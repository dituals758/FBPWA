class CollisionDetector {
    checkBirdPipes(bird, pipes) {
        const birdBounds = bird.getBounds();
        
        for (const pipe of pipes) {
            const topPipe = {
                x: pipe.x,
                y: 0,
                width: pipe.width,
                height: pipe.height
            };
            
            const bottomPipe = {
                x: pipe.x,
                y: pipe.height + pipe.gap,
                width: pipe.width,
                height: Infinity // Extends to bottom of canvas
            };
            
            if (this.rectIntersect(birdBounds, topPipe) || 
                this.rectIntersect(birdBounds, bottomPipe)) {
                return true;
            }
        }
        
        return false;
    }
    
    checkBirdBounds(bird, canvasHeight) {
        const birdBounds = bird.getBounds();
        const groundLevel = canvasHeight - 80;
        const ceilingLevel = 0;
        
        // Check if bird hits the ground or ceiling
        return birdBounds.y + birdBounds.height >= groundLevel ||
               birdBounds.y <= ceilingLevel;
    }
    
    rectIntersect(rect1, rect2) {
        return rect1.x < rect2.x + rect2.width &&
               rect1.x + rect1.width > rect2.x &&
               rect1.y < rect2.y + rect2.height &&
               rect1.y + rect1.height > rect2.y;
    }
    
    // More precise circle-rectangle collision (for future use)
    circleRectIntersect(circle, rect) {
        const closestX = Math.max(rect.x, Math.min(circle.x, rect.x + rect.width));
        const closestY = Math.max(rect.y, Math.min(circle.y, rect.y + rect.height));
        
        const distanceX = circle.x - closestX;
        const distanceY = circle.y - closestY;
        
        return (distanceX * distanceX + distanceY * distanceY) < (circle.radius * circle.radius);
    }
}

export { CollisionDetector };