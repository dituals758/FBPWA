// Utility functions for Flappy Bird PWA
class Helpers {
    static clamp(value, min, max) {
        return Math.min(Math.max(value, min), max);
    }
    
    static random(min, max) {
        return Math.random() * (max - min) + min;
    }
    
    static randomInt(min, max) {
        return Math.floor(Math.random() * (max - min + 1)) + min;
    }
    
    static formatTime(seconds) {
        const mins = Math.floor(seconds / 60);
        const secs = seconds % 60;
        return `${mins}:${secs.toString().padStart(2, '0')}`;
    }
    
    static formatScore(score) {
        return score.toString().replace(/\B(?=(\d{3})+(?!\d))/g, ',');
    }
    
    static debounce(func, wait, immediate = false) {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                timeout = null;
                if (!immediate) func(...args);
            };
            const callNow = immediate && !timeout;
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
            if (callNow) func(...args);
        };
    }
    
    static throttle(func, limit) {
        let inThrottle;
        return function(...args) {
            if (!inThrottle) {
                func.apply(this, args);
                inThrottle = true;
                setTimeout(() => inThrottle = false, limit);
            }
        };
    }
    
    // Performance monitoring
    static measurePerformance(name, fn) {
        if (typeof performance !== 'undefined') {
            const start = performance.now();
            const result = fn();
            const end = performance.now();
            
            const duration = end - start;
            console.log(`⏱️ ${name} выполнено за ${duration.toFixed(2)}ms`);
            
            if (duration > 16) { // Longer than one frame at 60fps
                console.warn(`⚠️ ${name} заняло ${duration.toFixed(2)}ms (медленно)`);
            }
            
            return result;
        } else {
            return fn();
        }
    }
    
    // Mobile detection
    static isMobile() {
        return /Android|webOS|iPhone|iPad|iPod|BlackBerry|IEMobile|Opera Mini/i.test(navigator.userAgent) ||
               'ontouchstart' in window ||
               navigator.maxTouchPoints > 0;
    }
    
    // Vibration support with fallback
    static vibrate(pattern) {
        if (!this.isMobile()) return;
        
        try {
            if ('vibrate' in navigator) {
                navigator.vibrate(pattern);
            }
        } catch (error) {
            console.warn('📳 Вибрация не поддерживается:', error);
        }
    }
    
    // Copy to clipboard
    static async copyToClipboard(text) {
        try {
            if (navigator.clipboard && window.isSecureContext) {
                await navigator.clipboard.writeText(text);
                return true;
            } else {
                // Fallback for older browsers
                const textArea = document.createElement('textarea');
                textArea.value = text;
                textArea.style.position = 'fixed';
                textArea.style.opacity = '0';
                document.body.appendChild(textArea);
                textArea.select();
                const successful = document.execCommand('copy');
                document.body.removeChild(textArea);
                return successful;
            }
        } catch (error) {
            console.error('❌ Ошибка копирования в буфер:', error);
            return false;
        }
    }
    
    // Share API
    static async share(data) {
        if (navigator.share) {
            try {
                await navigator.share(data);
                return true;
            } catch (error) {
                if (error.name !== 'AbortError') {
                    console.error('❌ Ошибка sharing:', error);
                }
                return false;
            }
        } else {
            console.warn('📤 Web Share API не поддерживается');
            return false;
        }
    }
    
    // Local storage with compression (basic)
    static compressData(data) {
        try {
            return btoa(encodeURIComponent(JSON.stringify(data)));
        } catch (error) {
            console.warn('⚠️ Сжатие данных не удалось:', error);
            return JSON.stringify(data);
        }
    }
    
    static decompressData(compressedData) {
        try {
            return JSON.parse(decodeURIComponent(atob(compressedData)));
        } catch (error) {
            // If decompression fails, try parsing as regular JSON
            try {
                return JSON.parse(compressedData);
            } catch (e) {
                console.warn('⚠️ Декомпрессия данных не удалась:', error);
                return null;
            }
        }
    }
    
    // Error reporting
    static reportError(error, context = {}) {
        const errorData = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            context: context,
            timestamp: Date.now(),
            url: window.location.href,
            userAgent: navigator.userAgent
        };
        
        console.error('🚨 Ошибка приложения:', errorData);
        
        // Here you would typically send to your error reporting service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: error.message,
                fatal: true
            });
        }
        
        return errorData;
    }
    
    // Feature detection
    static supports(feature) {
        const features = {
            serviceWorker: 'serviceWorker' in navigator,
            pushNotifications: 'PushManager' in window,
            webShare: 'share' in navigator,
            vibration: 'vibrate' in navigator,
            clipboard: 'clipboard' in navigator,
            storage: 'localStorage' in window,
            webGL: (() => {
                try {
                    const canvas = document.createElement('canvas');
                    return !!(window.WebGLRenderingContext && 
                             (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
                } catch (e) {
                    return false;
                }
            })()
        };
        
        return features[feature] || false;
    }
    
    // Get device information
    static getDeviceInfo() {
        return {
            userAgent: navigator.userAgent,
            platform: navigator.platform,
            language: navigator.language,
            cookiesEnabled: navigator.cookieEnabled,
            javaEnabled: navigator.javaEnabled ? navigator.javaEnabled() : false,
            screen: {
                width: screen.width,
                height: screen.height,
                colorDepth: screen.colorDepth
            },
            viewport: {
                width: window.innerWidth,
                height: window.innerHeight
            },
            devicePixelRatio: window.devicePixelRatio,
            touchSupport: 'ontouchstart' in window,
            online: navigator.onLine
        };
    }
    
    // Animation frame helper
    static nextFrame() {
        return new Promise(resolve => requestAnimationFrame(resolve));
    }
    
    // Wait for specified time
    static delay(ms) {
        return new Promise(resolve => setTimeout(resolve, ms));
    }
    
    // Generate unique ID
    static generateId() {
        return 'id_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now().toString(36);
    }
}

export { Helpers };