class Storage {
    constructor() {
        this.prefix = 'flappy_';
        this.supported = this.checkSupport();
        
        if (!this.supported) {
            console.warn('⚠️ localStorage не поддерживается');
        }
    }
    
    checkSupport() {
        try {
            const test = 'test';
            localStorage.setItem(test, test);
            localStorage.removeItem(test);
            return true;
        } catch (e) {
            return false;
        }
    }
    
    set(key, value) {
        if (!this.supported) {
            console.warn('🚫 localStorage не доступен');
            return false;
        }
        
        try {
            const serializedValue = JSON.stringify({
                value: value,
                timestamp: Date.now(),
                version: '1.0'
            });
            localStorage.setItem(this.prefix + key, serializedValue);
            return true;
        } catch (error) {
            console.error('❌ Ошибка сохранения в localStorage:', error);
            this.handleStorageError(error);
            return false;
        }
    }
    
    get(key, defaultValue = null) {
        if (!this.supported) {
            return defaultValue;
        }
        
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return defaultValue;
            
            const parsed = JSON.parse(item);
            return parsed.value !== undefined ? parsed.value : defaultValue;
        } catch (error) {
            console.error('❌ Ошибка чтения из localStorage:', error);
            this.handleStorageError(error);
            return defaultValue;
        }
    }
    
    remove(key) {
        if (!this.supported) return false;
        
        try {
            localStorage.removeItem(this.prefix + key);
            return true;
        } catch (error) {
            console.error('❌ Ошибка удаления из localStorage:', error);
            this.handleStorageError(error);
            return false;
        }
    }
    
    clear() {
        if (!this.supported) return false;
        
        try {
            // Only remove items with our prefix
            const keysToRemove = [];
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    keysToRemove.push(key);
                }
            }
            
            keysToRemove.forEach(key => localStorage.removeItem(key));
            return true;
        } catch (error) {
            console.error('❌ Ошибка очистки localStorage:', error);
            this.handleStorageError(error);
            return false;
        }
    }
    
    getAll() {
        if (!this.supported) return {};
        
        const items = {};
        try {
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    const cleanKey = key.replace(this.prefix, '');
                    items[cleanKey] = this.get(cleanKey);
                }
            }
            return items;
        } catch (error) {
            console.error('❌ Ошибка получения всех данных:', error);
            return {};
        }
    }
    
    getWithMetadata(key) {
        if (!this.supported) return null;
        
        try {
            const item = localStorage.getItem(this.prefix + key);
            if (!item) return null;
            
            return JSON.parse(item);
        } catch (error) {
            console.error('❌ Ошибка чтения метаданных:', error);
            return null;
        }
    }
    
    handleStorageError(error) {
        // Handle common storage errors
        if (error.name === 'QuotaExceededError') {
            console.warn('📦 localStorage переполнен, очищаем старые данные...');
            this.clearOldData();
        }
    }
    
    clearOldData() {
        if (!this.supported) return;
        
        try {
            const oneWeekAgo = Date.now() - (7 * 24 * 60 * 60 * 1000);
            const itemsToRemove = [];
            
            for (let i = 0; i < localStorage.length; i++) {
                const key = localStorage.key(i);
                if (key && key.startsWith(this.prefix)) {
                    try {
                        const item = localStorage.getItem(key);
                        const parsed = JSON.parse(item);
                        if (parsed.timestamp && parsed.timestamp < oneWeekAgo) {
                            itemsToRemove.push(key);
                        }
                    } catch (e) {
                        // If we can't parse, remove it
                        itemsToRemove.push(key);
                    }
                }
            }
            
            itemsToRemove.forEach(key => localStorage.removeItem(key));
            console.log(`🗑️ Удалено ${itemsToRemove.length} старых записей`);
            
        } catch (error) {
            console.error('❌ Ошибка очистки старых данных:', error);
        }
    }
    
    // Game specific methods
    getHighScore() {
        return this.get('highScore', 0);
    }
    
    setHighScore(score) {
        const currentHighScore = this.getHighScore();
        if (score > currentHighScore) {
            const success = this.set('highScore', score);
            if (success) {
                console.log(`🏆 Новый рекорд: ${score}`);
                
                // Track high score achievement
                if (typeof gtag !== 'undefined') {
                    gtag('event', 'high_score', {
                        event_category: 'Game',
                        event_label: 'New High Score',
                        value: score
                    });
                }
            }
            return success;
        }
        return false;
    }
    
    getGameStats() {
        return this.get('gameStats', {
            totalGames: 0,
            totalScore: 0,
            averageScore: 0,
            bestScore: 0,
            playTime: 0
        });
    }
    
    updateGameStats(gameData) {
        const stats = this.getGameStats();
        
        stats.totalGames += 1;
        stats.totalScore += gameData.score;
        stats.averageScore = Math.round(stats.totalScore / stats.totalGames);
        stats.bestScore = Math.max(stats.bestScore, gameData.score);
        stats.playTime += gameData.playTime || 0;
        
        return this.set('gameStats', stats);
    }
    
    getSettings() {
        return this.get('settings', {
            sound: true,
            vibration: true,
            difficulty: 'normal',
            theme: 'auto',
            controls: 'touch'
        });
    }
    
    updateSettings(newSettings) {
        const currentSettings = this.getSettings();
        const updatedSettings = { ...currentSettings, ...newSettings };
        
        const success = this.set('settings', updatedSettings);
        
        if (success) {
            console.log('⚙️ Настройки обновлены:', updatedSettings);
        }
        
        return success;
    }
    
    // Migration helper for future updates
    migrateData() {
        const dataVersion = this.get('dataVersion', '1.1');
        
        if (dataVersion === '1.0') {
            // Example migration logic
            const oldHighScore = this.get('highscore'); // old key format
            if (oldHighScore) {
                this.set('highScore', oldHighScore);
                this.remove('highscore');
            }
            
            this.set('dataVersion', '1.2');
        }
    }
}

export { Storage };