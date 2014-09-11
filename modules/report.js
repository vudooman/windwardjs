function Report() {
  this.data = {};
}
Report.prototype.init = function(api, data, extractor) {
  data = data || {};
  extractor(this, data);
  this.api = api;
  return this;
}
Report.prototype.sendReport = function(path, done) {
  this.api.setConnectId(this.data);
  this.api.post(path, this.data, function(info, error) {
    done(info, error);
  });
}

function ClimateReport() {
}
ClimateReport.prototype = new Report();
ClimateReport.prototype.send = function(done) {
  this.sendReport('/climates', done);
}
ClimateReport.prototype.temperature = function(value) {
  this.data.temperature = value;
  return this;
}
ClimateReport.prototype.humidity = function(value) {
  this.data.humidity = value;
  return this;
}

function extractClimate(report, data) {
  if(data.temperature) {
    report.data.temperature = data.temperature;
  }
  if(data.humidity) {
    report.data.humidity = data.humidity;
  }
}

module.exports = function(api) {
  api.reportClimate = function(data) {
    return new ClimateReport().init(api, data, extractClimate);
  };
};
