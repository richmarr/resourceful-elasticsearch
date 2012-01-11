
// Export the engine
module.exports = require('./lib/engine');

// Patch Resourceful to add a search method
require('./lib/resource-search').patch();