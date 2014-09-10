function Report(data, extractor) {
  data = data || {};
  this.report = extractor(data);
}

module.exports = function(api) {
  api.reportClimate = function(data) {
    data = data || {};
    var deviceInfo = {};
    var err = {};

    done(deviceInfo, err);
  };
};
