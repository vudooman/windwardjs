module.exports = function(api) {
  api.connect = function(userId, deviceId, done) {
    var deviceInfo = {};
    var err = {};

    done(deviceInfo, err);
  };
};
