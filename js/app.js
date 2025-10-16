// Главный файл приложения Flappy Bird PWA
import { GameEngine } from './game/engine.js';
import { PWAInstaller } from './pwa/install.js';
import { OfflineManager } from './pwa/offline.js';
import { Storage } from './utils/storage.js';
import { Helpers } from './utils/helpers.js';

class FlappyBirdApp {
    constructor() {
        this.gameEngine = null;
        this.pwaInstaller = null;
        this.offlineManager = null;
        this.storage = null;
        this.isInitialized = false;
        
        this.init();
    }
    
    async init() {
        try {
            // Показываем индикатор загрузки
            this.showLoadingIndicator();
            
            // Инициализируем утилиты
            this.storage = new Storage();
            
            // Инициализируем PWA функции
            this.pwaInstaller = new PWAInstaller();
            await this.pwaInstaller.init();
            
            this.offlineManager = new OfflineManager();
            this.offlineManager.init();
            
            // Регистрируем Service Worker
            await this.registerServiceWorker();
            
            // Инициализируем игру
            await this.initGame();
            
            // Скрываем индикатор загрузки
            this.hideLoadingIndicator();
            
            this.isInitialized = true;
            console.log('🎮 Flappy Bird PWA успешно инициализирован');
            
            // Отправляем аналитику
            this.trackAppLaunch();
            
        } catch (error) {
            console.error('❌ Ошибка инициализации приложения:', error);
            this.showError('Не удалось загрузить игру. Пожалуйста, обновите страницу.');
        }
    }
    
    async initGame() {
        return new Promise((resolve) => {
            // Ждем полной загрузки DOM
            if (document.readyState === 'loading') {
                document.addEventListener('DOMContentLoaded', () => {
                    this.setupGame();
                    resolve();
                });
            } else {
                this.setupGame();
                resolve();
            }
        });
    }
    
    setupGame() {
        try {
            const canvas = document.getElementById('game-canvas');
            
            if (!canvas) {
                throw new Error('Canvas элемент не найден');
            }
            
            // Оптимизируем размер canvas для устройства
            this.optimizeCanvasSize(canvas);
            
            this.gameEngine = new GameEngine(canvas);
            this.setupEventListeners();
            
        } catch (error) {
            console.error('❌ Ошибка настройки игры:', error);
            throw error;
        }
    }
    
    optimizeCanvasSize(canvas) {
        const container = canvas.parentElement;
        const rect = container.getBoundingClientRect();
        
        // Устанавливаем размеры canvas based on container
        const dpr = window.devicePixelRatio || 1;
        canvas.width = rect.width * dpr;
        canvas.height = rect.height * dpr;
        
        // Масштабируем контекст для HiDPI displays
        const ctx = canvas.getContext('2d');
        ctx.scale(dpr, dpr);
        
        console.log(`📐 Canvas оптимизирован: ${canvas.width}×${canvas.height} (DPR: ${dpr})`);
    }
    
    setupEventListeners() {
        // Обработка изменения размера окна
        let resizeTimeout;
        window.addEventListener('resize', () => {
            clearTimeout(resizeTimeout);
            resizeTimeout = setTimeout(() => {
                if (this.gameEngine && this.gameEngine.canvas) {
                    this.optimizeCanvasSize(this.gameEngine.canvas);
                }
            }, 250);
        });
        
        // Обработка видимости страницы для паузы
        document.addEventListener('visibilitychange', () => {
            if (this.gameEngine) {
                if (document.hidden) {
                    this.gameEngine.pause();
                } else if (this.gameEngine.isRunning) {
                    this.gameEngine.resume();
                }
            }
        });
        
        // Предотвращение стандартного поведения жестов
        document.addEventListener('touchmove', (e) => {
            if (e.scale !== 1) {
                e.preventDefault();
            }
        }, { passive: false });
        
        // Обработка ошибок
        window.addEventListener('error', (event) => {
            console.error('🚨 Глобальная ошибка:', event.error);
            this.trackError(event.error);
        });
        
        window.addEventListener('unhandledrejection', (event) => {
            console.error('🚨 Необработанный Promise rejection:', event.reason);
            this.trackError(event.reason);
        });
    }
    
    async registerServiceWorker() {
        if (!('serviceWorker' in navigator)) {
            console.warn('⚠️ Service Worker не поддерживается');
            return;
        }
        
        try {
            const registration = await navigator.serviceWorker.register('./sw.js', {
                scope: '/',
                updateViaCache: 'none'
            });
            
            console.log('✅ Service Worker зарегистрирован:', registration);
            
            // Проверяем обновления
            registration.addEventListener('updatefound', () => {
                const newWorker = registration.installing;
                console.log('🔄 Найдено обновление Service Worker');
                
                newWorker.addEventListener('statechange', () => {
                    if (newWorker.state === 'installed' && navigator.serviceWorker.controller) {
                        this.showUpdateNotification();
                    }
                });
            });
            
            // Периодическая проверка обновлений
            setInterval(() => {
                registration.update();
            }, 60 * 60 * 1000); // Каждый час
            
        } catch (error) {
            console.error('❌ Ошибка регистрации Service Worker:', error);
            throw error;
        }
    }
    
    showUpdateNotification() {
        if (Helpers.isMobile() && this.gameEngine && !this.gameEngine.isRunning) {
            // Показываем уведомление только на мобильных и когда игра не активна
            if (confirm('Доступна новая версия игры! Обновить?')) {
                window.location.reload();
            }
        }
    }
    
    showLoadingIndicator() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.remove('hidden');
        }
    }
    
    hideLoadingIndicator() {
        const loading = document.getElementById('loading');
        if (loading) {
            loading.classList.add('hidden');
            
            // Удаляем элемент после анимации
            setTimeout(() => {
                if (loading.parentNode) {
                    loading.parentNode.removeChild(loading);
                }
            }, 500);
        }
    }
    
    showError(message) {
        const errorDiv = document.createElement('div');
        errorDiv.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #f44336;
            color: white;
            padding: 1rem;
            text-align: center;
            z-index: 10000;
            font-weight: bold;
        `;
        errorDiv.textContent = message;
        document.body.appendChild(errorDiv);
        
        setTimeout(() => {
            if (errorDiv.parentNode) {
                errorDiv.parentNode.removeChild(errorDiv);
            }
        }, 5000);
    }
    
    trackAppLaunch() {
        // Отправка аналитики о запуске приложения
        const launchData = {
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            viewport: `${window.innerWidth}x${window.innerHeight}`,
            dpr: window.devicePixelRatio,
            online: navigator.onLine,
            pwa: window.matchMedia('(display-mode: standalone)').matches
        };
        
        console.log('📊 Запуск приложения:', launchData);
        
        // Здесь можно интегрировать с analytics service
        if (typeof gtag !== 'undefined') {
            gtag('event', 'app_launch', launchData);
        }
    }
    
    trackError(error) {
        const errorData = {
            name: error.name,
            message: error.message,
            stack: error.stack,
            timestamp: Date.now(),
            url: window.location.href
        };
        
        console.error('📊 Ошибка приложения:', errorData);
        
        // Здесь можно отправлять ошибки в систему мониторинга
        if (typeof gtag !== 'undefined') {
            gtag('event', 'exception', {
                description: error.message,
                fatal: true
            });
        }
    }
}

// Инициализация приложения когда DOM готов
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
        window.flappyBirdApp = new FlappyBirdApp();
    });
} else {
    window.flappyBirdApp = new FlappyBirdApp();
}

// Экспорт для тестирования
if (typeof module !== 'undefined' && module.exports) {
    module.exports = { FlappyBirdApp };
} else {
    window.FlappyBirdApp = FlappyBirdApp;
}