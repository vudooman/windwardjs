function Environment() {
	this.data = {};
}
Environment.prototype.init = function(api, data, extractor) {
	data = data || {};
	extractor(this, data);
	this.api = api;
	return this;
};
Environment.prototype.send = function(done) {
	this.api.setConnectId(this.data);
	this.api.post('/environmentAttrs', this.data, function(info, error) {
		if (error) {
			api.error(error);
		}
		if (typeof done == 'function') {
			done(info, error);
		}
	});
};
Environment.prototype.setIntAttribute = function(name, value) {
	this.data[name] = value ? parseInt(value) : -1;
	return this;
};
Environment.prototype.temperature = function(value) {
	return this.setIntAttribute('temperature', value);
};
Environment.prototype.humidity = function(value) {
	return this.setIntAttribute('humidity', value);
};
Environment.prototype.noise = function(value) {
	return this.setIntAttribute('noise', value);
};
Environment.prototype.light = function(value) {
	return this.setIntAttribute('light', value);
};

module.exports = function(api) {
	api.environment = function(data) {
		return new Environment().init(api, data, function(env, data) {
			env.temperature(data.temperature).humidity(data.humidity).noise(
					data.noise).light(data.light);
		});
	};
};
