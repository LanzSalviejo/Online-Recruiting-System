/**
 * Application Event Emitter
 * Centralizes application events for cross-service communication
 */
const EventEmitter = require('events');

// Create a global event emitter
global.eventEmitter = new EventEmitter();

// Set a higher limit for event listeners (default is 10)
global.eventEmitter.setMaxListeners(20);

module.exports = global.eventEmitter;