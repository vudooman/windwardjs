function Report() {
	this.data = {};
}
Report.prototype.init = function(api, data, extractor) {
	data = data || {};
	extractor(this, data);
	this.api = api;
	return this;
};
Report.prototype.sendReport = function(path, done) {
	this.api.setConnectId(this.data);
	this.api.post(path, this.data, function(info, error) {
		done(info, error);
	});
};

function ClimateReport() {
}
ClimateReport.prototype = new Report();
ClimateReport.prototype.send = function(done) {
	this.sendReport('/climates', done);
};
ClimateReport.prototype.temperature = function(value) {
	this.data.temperature = value;
	return this;
};
ClimateReport.prototype.humidity = function(value) {
	this.data.humidity = value;
	return this;
};

module.exports = function(api) {
	api.reportClimate = function(data) {
		return new ClimateReport().init(api, data, function(report, data) {
			report.temperature(data.temperature).humidity(data.humidity);
		});
	};
};
