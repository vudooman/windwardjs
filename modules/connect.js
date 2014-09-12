var http = require('http');

var errorsContext = '/errors';
var devicesContext = '/connectedDevices';

module.exports = function(api, config) {

	/**
	 * Connect to service. Also store device info for other API usage.
	 */
	api.connect = function(userId, deviceId, done) {
		api.post(devicesContext, {
			userId : userId,
			deviceId : deviceId
		}, function(info, error) {
			config.deviceInfo = info;
			done(info, error);
			if (error) {
				api.error(error);
			}
		});
	};

	/**
	 * Get latest device info and save into config
	 */
	api.status = function(done) {
		api.put(devicesContext, config.deviceInfo, function(info, error) {
			if (info) {
				config.deviceInfo = info;
			}
			done(info, error);
			if (error) {
				api.error(error);
			}
		});
	};

	/**
	 * Report error to service
	 */
	api.error = function(errorObj) {

		if (config.isDebug) {
			console.log("Error:");
			console.log(errorObj);
		}

		api.post(errorsContext, {
			connectId : config.deviceInfo.connectId,
			error : errorObj
		}, function(info, error) {
			if (error && config.isDebug) {
				console.log("Could not log error: ");
				console.log(error);
			}
		});
	};
};
