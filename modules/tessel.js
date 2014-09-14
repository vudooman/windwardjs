function Tessel() {
	this.modules = {};
}

Tessel.prototype.climate = function(module) {
	this.modules.climate = module;
	return this;
};


Tessel.prototype.ambient = function(module) {
	var self = this;
	this.modules.ambient = module;
	this.modules.ambientConf = {
		maxLight: -1,
		maxSound: -1
	};
	setInterval(function() {
		self.modules.ambient.getLightLevel(function(err, ldata) {
			self.modules.ambient.getSoundLevel(function(err, sdata) {
				if (sdata.toFixed(4) > self.modules.ambientConf.maxSound) {
					self.modules.ambientConf.maxSound = sdata.toFixed(4);
				}
				if (ldata.toFixed(4) > self.modules.ambientConf.maxLight) {
					self.modules.ambientConf.maxLight = ldata.toFixed(4);
				}
			});
		});
	}, 500);
	return this;
};

Tessel.prototype.readClimate = function(data, done) {
	data = data || {};
	var self = this;
	if (self.modules.climate) {
		self.modules.climate.readTemperature('f', function(err, temp) {
			self.modules.climate.readHumidity(function(err, humid) {
				done({
					temperature: temp.toFixed(4),
					humidity: humid.toFixed(4)
				});
			});
		});
	} else {
		done({});
	}
	return this;
};

Tessel.prototype.readAmbient = function(data, done) {
	data = data || {};
	var self = this;
	if (self.modules.ambient) {
		self.modules.ambient.getSoundLevel(function(err, sound) {
			self.modules.ambient.getLightLevel(function(err, light) {
				done({
					sound: sound.toFixed(4),
					light: light.toFixed(4),
					maxSound: self.modules.ambientConf.maxLSouund,
					maxLight: self.modules.ambientConf.maxLight
				});
			});
		});
	} else {
		done(data);
	}
	return this;
};

Tessel.prototype.resetAmbient = function() {
	this.modules.ambientConf.maxLight = -1;
	this.modules.ambientConf.maxSound = -1;
	return this;
};

Tessel.prototype.read = function(data, done) {
	data = data || {};
	var self = this;
	self.readClimate(data, function() {
		self.readAmbient(data, function() {
			done(data);
		});
	});
	return this;
};