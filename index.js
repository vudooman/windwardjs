var api = {};

// Connect module
require('./modules/connect')(api);

// Report module
require('./modules/report')(api);

module.exports = api;
