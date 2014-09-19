var http = require('http');

var doPostPut = function(path, content, done, method, config) {
	var postHandler = function(res, result, err) {
		var error = null, info = null;
		if (err) {
			error = {
				errorId : 'unexpected',
				message : err.message
			};
		} else {
			if (res.statusCode == 200) {
				info = JSON.parse(result);
			} else {
				error = {
					errorId : 'statusCodeError',
					statusCode : res.statusCode,
					message : result
				};
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

var isArray = function (obj) {
	return Object.prototype.toString.call(obj) === "[object Array]";
},

getNumWithSetDec = function(num, numOfDec) {
	var pow10s = Math.pow(10, numOfDec || 0);
	return (numOfDec) ? Math.round(pow10s * num) / pow10s : num;
};

getAverageFromNumArr = function(numArr, numOfDec) {
	if (!isArray(numArr)) {
		return false;
	}
	var i = numArr.length, sum = 0;
	while (i--) {
		sum += numArr[i];
	}
	return getNumWithSetDec((sum / numArr.length), numOfDec);
};

getVariance = function(numArr, numOfDec) {
	if (!isArray(numArr)) {
		return false;
	}
	var avg = getAverageFromNumArr(numArr, numOfDec), i = numArr.length, v = 0;

	while (i--) {
		v += Math.pow((numArr[i] - avg), 2);
	}
	v /= numArr.length;
	return getNumWithSetDec(v, numOfDec);
};

getStandardDeviation = function(numArr, numOfDec) {
	if (!isArray(numArr)) {
		return false;
	}
	var stdDev = Math.sqrt(getVariance(numArr, numOfDec));
	return getNumWithSetDec(stdDev, numOfDec);
};

module.exports = function(api, config) {

	api.printConfig = function() {
		console.log(config);
	};

	api.debug = function(status) {
		config.isDebug = status === true;
		return config.isDebug;
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
	
	api.stats = function(data) {
		return {
			max: Math.max.apply(Math, data),
			min: Math.min.apply(Math, data),
			mean: getAverageFromNumArr(data, 10),
			std: getStandardDeviation(data, 10),
			'var': getVariance(data, 10),
			n: data.length
		};
	};
};
