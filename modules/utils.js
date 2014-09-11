var http = require('http');

var doPostPut = function(path, content, done, method, config) {
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
		method : method,
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

module.exports = function(api, config) {

	api.printConfig = function() {
		console.log(config);
	};

	api.setConnectId = function(data) {
		if (data && config.deviceInfo) {
			data.connectId = config.deviceInfo.connectId;
		}
	};

	api.post = function(path, content, done) {
		doPostPut(path, content, done, "POST", config);
	};

	api.put = function(path, content, done) {
		doPostPut(path, content, done, "PUT", config);
	};
};