var http = require('http');

module.exports = function(api, config) {
  api.connect = function(userId, deviceId, done) {
    api.post('/connectedDevices', {
      userId : userId,
      deviceId : deviceId
    }, function(info, error) {
      config.deviceInfo = info;
      done(info, error);
    });
  };
};
