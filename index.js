var http = require('http');

var api = {};

var config = {
	apiHost : 'nodejs-pasorobles.rhcloud.com',
	apiContext : '',
	apiPort : 80
};

// Utils module
require('./modules/utils')(api, config);

// Connect module
require('./modules/connect')(api, config);

// Report module
require('./modules/report')(api, config);

module.exports = api;
