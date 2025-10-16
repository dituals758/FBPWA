class OfflineManager {
    constructor() {
        this.offlineIndicator = null;
        this.isOnline = navigator.onLine;
        this.retryCount = 0;
        this.maxRetries = 3;
    }
    
    init() {
        this.createOfflineIndicator();
        this.setupOnlineOfflineListeners();
        this.setupConnectionMonitoring();
        
        console.log('📡 Offline Manager инициализирован');
    }
    
    createOfflineIndicator() {
        this.offlineIndicator = document.createElement('div');
        this.offlineIndicator.id = 'offline-indicator';
        this.offlineIndicator.style.cssText = `
            position: fixed;
            top: 0;
            left: 0;
            right: 0;
            background: #ff6b6b;
            color: white;
            text-align: center;
            padding: 12px;
            z-index: 10000;
            transform: translateY(-100%);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 600;
            box-shadow: 0 2px 10px rgba(0, 0, 0, 0.1);
        `;
        this.offlineIndicator.textContent = '🔴 Вы в оффлайн режиме';
        this.offlineIndicator.setAttribute('aria-live', 'polite');
        this.offlineIndicator.setAttribute('role', 'status');
        
        document.body.appendChild(this.offlineIndicator);
    }
    
    setupOnlineOfflineListeners() {
        window.addEventListener('online', () => {
            this.handleOnline();
        });
        
        window.addEventListener('offline', () => {
            this.handleOffline();
        });
        
        // Initial state
        if (!this.isOnline) {
            this.handleOffline();
        }
    }
    
    setupConnectionMonitoring() {
        // Monitor connection quality
        if ('connection' in navigator) {
            navigator.connection.addEventListener('change', () => {
                this.handleConnectionChange();
            });
        }
        
        // Periodic online checks
        setInterval(() => {
            this.checkConnection();
        }, 30000); // Check every 30 seconds
    }
    
    handleOnline() {
        this.isOnline = true;
        this.hideOfflineIndicator();
        this.retryCount = 0;
        
        console.log('✅ Онлайн соединение восстановлено');
        
        // Try to sync any pending data
        this.syncData().catch(error => {
            console.warn('⚠️ Синхронизация данных не удалась:', error);
        });
        
        // Show reconnected message
        this.showTemporaryMessage('✅ Соединение восстановлено', 'success');
    }
    
    handleOffline() {
        this.isOnline = false;
        this.showOfflineIndicator();
        
        console.warn('⚠️ Оффлайн режим');
        
        // Show offline message
        this.showTemporaryMessage('🔴 Оффлайн режим', 'error');
    }
    
    handleConnectionChange() {
        if ('connection' in navigator) {
            const connection = navigator.connection;
            console.log('📡 Изменение соединения:', {
                effectiveType: connection.effectiveType,
                downlink: connection.downlink,
                rtt: connection.rtt
            });
            
            if (connection.effectiveType === 'slow-2g' || connection.downlink < 0.5) {
                this.showTemporaryMessage('📶 Медленное соединение', 'warning');
            }
        }
    }
    
    async checkConnection() {
        if (!this.isOnline) {
            try {
                // Try to fetch a small resource to check connection
                const response = await fetch('/?connection-check=' + Date.now(), {
                    method: 'HEAD',
                    cache: 'no-cache'
                });
                
                if (response.ok) {
                    this.handleOnline();
                }
            } catch (error) {
                // Still offline
                this.retryCount++;
                
                if (this.retryCount >= this.maxRetries) {
                    console.warn(`🔴 Все попытки подключения провалились (${this.retryCount})`);
                }
            }
        }
    }
    
    showOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.style.transform = 'translateY(0)';
            
            // Add retry button after a delay
            setTimeout(() => {
                if (!this.isOnline && this.offlineIndicator) {
                    this.addRetryButton();
                }
            }, 3000);
        }
    }
    
    hideOfflineIndicator() {
        if (this.offlineIndicator) {
            this.offlineIndicator.style.transform = 'translateY(-100%)';
            this.removeRetryButton();
        }
    }
    
    addRetryButton() {
        if (this.offlineIndicator.querySelector('.retry-button')) return;
        
        const retryButton = document.createElement('button');
        retryButton.className = 'retry-button';
        retryButton.textContent = ' Повторить';
        retryButton.style.cssText = `
            margin-left: 10px;
            background: rgba(255, 255, 255, 0.2);
            border: 1px solid rgba(255, 255, 255, 0.3);
            color: white;
            padding: 4px 8px;
            border-radius: 4px;
            cursor: pointer;
            font-size: 12px;
        `;
        
        retryButton.addEventListener('click', () => {
            this.checkConnection();
        });
        
        this.offlineIndicator.appendChild(retryButton);
    }
    
    removeRetryButton() {
        const retryButton = this.offlineIndicator?.querySelector('.retry-button');
        if (retryButton) {
            retryButton.remove();
        }
    }
    
    showTemporaryMessage(message, type = 'info') {
        const messageDiv = document.createElement('div');
        const backgroundColor = type === 'success' ? '#4CAF50' : 
                              type === 'warning' ? '#FF9800' : '#ff6b6b';
        
        messageDiv.style.cssText = `
            position: fixed;
            top: 60px;
            left: 50%;
            transform: translateX(-50%) translateY(-100px);
            background: ${backgroundColor};
            color: white;
            padding: 12px 20px;
            border-radius: 8px;
            z-index: 9999;
            box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
            transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
            font-weight: 600;
            white-space: nowrap;
        `;
        messageDiv.textContent = message;
        
        document.body.appendChild(messageDiv);
        
        // Animate in
        requestAnimationFrame(() => {
            messageDiv.style.transform = 'translateX(-50%) translateY(0)';
        });
        
        // Remove after delay
        setTimeout(() => {
            messageDiv.style.transform = 'translateX(-50%) translateY(-100px)';
            setTimeout(() => {
                if (messageDiv.parentNode) {
                    messageDiv.parentNode.removeChild(messageDiv);
                }
            }, 300);
        }, 3000);
    }
    
    async syncData() {
        // Placeholder for data synchronization
        // In a real app, this would sync game data, scores, etc.
        console.log('🔄 Синхронизация данных...');
        
        try {
            // Simulate API calls or data synchronization
            await new Promise(resolve => setTimeout(resolve, 1000));
            console.log('✅ Данные синхронизированы');
            return true;
        } catch (error) {
            console.error('❌ Ошибка синхронизации:', error);
            throw error;
        }
    }
    
    // Public method to check online status
    getOnlineStatus() {
        return {
            isOnline: this.isOnline,
            retryCount: this.retryCount,
            connectionInfo: this.getConnectionInfo()
        };
    }
    
    getConnectionInfo() {
        if ('connection' in navigator) {
            const conn = navigator.connection;
            return {
                effectiveType: conn.effectiveType,
                downlink: conn.downlink,
                rtt: conn.rtt,
                saveData: conn.saveData
            };
        }
        return null;
    }
}

export { OfflineManager };