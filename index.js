var http = require('http');

var api = {};

var config = {
	apiHost : 'nodejs-pasorobles.rhcloud.com',
	apiContext : '',
	apiPort : 80
};

api.printConfig = function() {
	console.log(config);
};

api.setConnectId = function(data) {
	if (data && config.deviceInfo) {
		data.connectId = config.deviceInfo.connectId;
	}
};

api.post = function(path, content, done) {
	var postHandler = function(res, result, err) {
		var error = null, info = null;
		if (err) {
			error = {
				errorId : 'unexpected',
				message : e.message
			};
		} else {
			if (res.statusCode == 200) {
				info = JSON.parse(result);
			} else {
				error = {
					errorId : 'statusCodeError',
					statusCode : res.statusCode
				};
				if (res.statusCode == 404) {
					error.message = 'Resource not available.';
				} else {
					error.message = result;
				}
			}
		}
		done(info, error);
	};

	var contentStr = JSON.stringify(content);

	var headers = {
		'Content-Type' : 'application/json',
		'Content-Length' : contentStr.length
	};

	var options = {
		hostname : config.apiHost,
		port : config.apiPort,
		method : 'POST',
		path : path,
		headers : headers
	};

	var req = http.request(options, function(res) {
		res.setEncoding('utf-8');

		var responseString = '';

		res.on('data', function(data) {
			responseString += data;
		});

		res.on('end', function() {
			postHandler(res, responseString);
		});
	});

	req.on('error', function(e) {
		postHandler(null, null, e);
	});

	req.write(contentStr);
	req.end();
};

// Connect module
require('./modules/connect')(api, config);

// Report module
require('./modules/report')(api, config);

module.exports = api;
