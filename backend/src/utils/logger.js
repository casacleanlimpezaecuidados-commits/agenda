const fs = require('fs').promises;
const path = require('path');

const LOG_DIR = path.join(__dirname, '../data/logs');
const LOG_FILE = path.join(LOG_DIR, `app_${new Date().toISOString().split('T')[0]}.log`);

class Logger {
  constructor() {
    this.levels = {
      INFO: 'ℹ️',
      WARN: '⚠️',
      ERROR: '❌',
      SUCCESS: '✅',
      DEBUG: '🔍'
    };
  }

  async init() {
    try {
      await fs.mkdir(LOG_DIR, { recursive: true });
    } catch (error) {
      console.error('Erro ao criar diretório de logs:', error);
    }
  }

  formatMessage(level, message, data = null) {
    const timestamp = new Date().toISOString();
    const emoji = this.levels[level] || '';
    
    let logMessage = `[${timestamp}] ${emoji} ${level}: ${message}`;
    
    if (data) {
      logMessage += `\n📦 Data: ${JSON.stringify(data, null, 2)}`;
    }
    
    return logMessage;
  }

  async log(level, message, data = null) {
    const formattedMessage = this.formatMessage(level, message, data);
    
    // Console output
    console.log(formattedMessage);
    
    // File output
    try {
      const logEntry = formattedMessage + '\n';
      await fs.appendFile(LOG_FILE, logEntry, 'utf8');
    } catch (error) {
      console.error('Erro ao escrever log em arquivo:', error);
    }
  }

  info(message, data = null) {
    return this.log('INFO', message, data);
  }

  warn(message, data = null) {
    return this.log('WARN', message, data);
  }

  error(message, data = null) {
    return this.log('ERROR', message, data);
  }

  success(message, data = null) {
    return this.log('SUCCESS', message, data);
  }

  debug(message, data = null) {
    if (process.env.NODE_ENV === 'development') {
      return this.log('DEBUG', message, data);
    }
  }

  async getRecentLogs(limit = 100) {
    try {
      const content = await fs.readFile(LOG_FILE, 'utf8');
      const lines = content.split('\n').filter(line => line.trim());
      return lines.slice(-limit);
    } catch (error) {
      return [];
    }
  }

  async clearOldLogs(daysToKeep = 30) {
    try {
      const files = await fs.readdir(LOG_DIR);
      const cutoff = new Date();
      cutoff.setDate(cutoff.getDate() - daysToKeep);

      for (const file of files) {
        const filePath = path.join(LOG_DIR, file);
        const stats = await fs.stat(filePath);
        
        if (stats.mtime < cutoff) {
          await fs.unlink(filePath);
          console.log(`🗑️ Log antigo removido: ${file}`);
        }
      }
    } catch (error) {
      console.error('Erro ao limpar logs antigos:', error);
    }
  }
}

// Singleton
const logger = new Logger();

module.exports = logger;