function Report() {
  this.data = {};
}
Report.prototype.init = function(data, extractor) {
  data = data || {};
  extractor(this, data);
  return this;
}

function ClimateReport(data, extractor) {
}
ClimateReport.prototype = new Report();
ClimateReport.prototype.send = function(done) {
  console.log("Sending...");
  console.log(this.data);
  done();
}
ClimateReport.prototype.temperature = function(value) {
  this.data.temperature = value;
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
    return new ClimateReport().init(data, extractClimate);
  };
};
