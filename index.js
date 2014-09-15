var http = require('http');

var api = {};

var config = {
	apiHost : 'nodejs-pasorobles.rhcloud.com',
	apiContext : '',
	apiPort : 80,
	isDebug : false
};

// Utils module
require('./modules/utils')(api, config);

// Workflow module
require('./modules/workflow')(api, config);

// Connect module
require('./modules/connect')(api, config);

// Report module
require('./modules/report')(api, config);

// Environment module
require('./modules/environment')(api, config);

// Tessel module
require('./modules/tessel')(api, config);

module.exports = api;
