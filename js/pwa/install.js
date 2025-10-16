import { Helpers } from './pwa/utils/helpers.js';

class PWAInstaller {
    constructor() {
        this.deferredPrompt = null;
        this.installButton = document.getElementById('install-button');
        this.isInstalled = this.checkIfInstalled();
    }
    
    async init() {
        this.setupInstallPrompt();
        this.setupAppInstalled();
        this.updateInstallButton();
        
        console.log('📱 PWA Installer инициализирован');
    }
    
    setupInstallPrompt() {
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            this.deferredPrompt = e;
            this.updateInstallButton();
            
            console.log('📱 PWA: Доступна установка');
            
            // Auto-show install prompt on mobile after delay
            if (Helpers.isMobile() && !this.isInstalled) {
                setTimeout(() => {
                    this.showInstallPrompt();
                }, 3000);
            }
        });
        
        if (this.installButton) {
            this.installButton.addEventListener('click', () => this.installApp());
        }
    }
    
    setupAppInstalled() {
        window.addEventListener('appinstalled', (e) => {
            console.log('✅ PWA успешно установлен');
            this.isInstalled = true;
            this.updateInstallButton();
            this.deferredPrompt = null;
            
            this.trackInstallation('accepted');
        });
    }
    
    async installApp() {
        if (!this.deferredPrompt) {
            console.warn('⚠️ Нет доступного prompt для установки');
            return;
        }
        
        try {
            this.deferredPrompt.prompt();
            const { outcome } = await this.deferredPrompt.userChoice;
            
            console.log(`📱 Пользователь ${outcome} установку`);
            this.trackInstallation(outcome);
            
            if (outcome === 'accepted') {
                this.isInstalled = true;
            }
            
            this.deferredPrompt = null;
            this.updateInstallButton();
            
        } catch (error) {
            console.error('❌ Ошибка установки PWA:', error);
            this.trackInstallation('error');
        }
    }
    
    showInstallPrompt() {
        if (!this.deferredPrompt || this.isInstalled) return;
        
        // Only show automatically on mobile devices
        if (Helpers.isMobile()) {
            const installConfirmed = confirm(
                'Хотите установить Flappy Bird на свое устройство для лучшего опыта?'
            );
            
            if (installConfirmed) {
                this.installApp();
            }
        }
    }
    
    updateInstallButton() {
        if (!this.installButton) return;
        
        const shouldShow = this.deferredPrompt && !this.isInstalled;
        
        if (shouldShow) {
            this.installButton.hidden = false;
            this.installButton.setAttribute('aria-hidden', 'false');
        } else {
            this.installButton.hidden = true;
            this.installButton.setAttribute('aria-hidden', 'true');
        }
    }
    
    checkIfInstalled() {
        return window.matchMedia('(display-mode: standalone)').matches ||
               window.navigator.standalone ||
               document.referrer.includes('android-app://');
    }
    
    trackInstallation(outcome) {
        const installData = {
            outcome: outcome,
            timestamp: Date.now(),
            userAgent: navigator.userAgent,
            platform: navigator.platform
        };
        
        console.log('📊 Установка PWA:', installData);
        
        // Send to analytics
        if (typeof gtag !== 'undefined') {
            gtag('event', 'pwa_install', {
                event_category: 'PWA',
                event_label: outcome
            });
        }
        
        // Store in localStorage for future reference
        try {
            const installs = JSON.parse(localStorage.getItem('pwa_install_attempts') || '[]');
            installs.push(installData);
            localStorage.setItem('pwa_install_attempts', JSON.stringify(installs));
        } catch (error) {
            console.warn('Не удалось сохранить данные установки');
        }
    }
    
    // Utility method to check installation status
    getInstallationStatus() {
        return {
            isInstalled: this.isInstalled,
            canInstall: !!this.deferredPrompt,
            isMobile: Helpers.isMobile()
        };
    }
}

export { PWAInstaller };