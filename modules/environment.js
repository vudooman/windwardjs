function Environment() {
}
Environment.prototype.init = function(api, data) {
	this.data = data || {};
	this.api = api;
	return this;
};
Environment.prototype.send = function(done) {
	var self = this;
	self.api.setConnectId(this.data);
	self.api.post('/environmentAttrs', this.data, function(info, error) {
		if (error) {
			self.api.error(error);
		}
		if (typeof done == 'function') {
			done(info, error);
		}
	});
};

module.exports = function(api) {
	api.environment = function(data) {
		return new Environment().init(api, data);
	};
};
