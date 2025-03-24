/**
 * Logger Utility
 * Simple logging utility for application events
 */
const fs = require('fs');
const path = require('path');

class Logger {
  constructor() {
    // Create logs directory if it doesn't exist
    this.logsDir = path.join(__dirname, '../logs');
    if (!fs.existsSync(this.logsDir)) {
      fs.mkdirSync(this.logsDir, { recursive: true });
    }
    
    this.logFile = path.join(this.logsDir, 'app.log');
  }
  
  /**
   * Log an info message
   * @param {string} message - Message to log
   */
  info(message) {
    this._log('INFO', message);
  }
  
  /**
   * Log an error message
   * @param {string} message - Message to log
   * @param {Error|Object} error - Error object or details
   */
  error(message, error) {
    let errorMsg = message;
    
    if (error) {
      if (error instanceof Error) {
        errorMsg += `: ${error.message}\n${error.stack}`;
      } else {
        errorMsg += `: ${JSON.stringify(error)}`;
      }
    }
    
    this._log('ERROR', errorMsg);
  }
  
  /**
   * Internal logging method
   * @private
   */
  _log(level, message) {
    const timestamp = new Date().toISOString();
    const logMessage = `[${timestamp}] [${level}] ${message}\n`;
    
    // Log to console
    console.log(logMessage);
    
    // Also log to file
    fs.appendFile(this.logFile, logMessage, (err) => {
      if (err) console.error('Error writing to log file:', err);
    });
  }
}

module.exports = new Logger();