function Tessel() {
	this.modules = {};
	this.wifi = null;
	this.onWifiConnectedCallbacks = [];
	this.wifiReconnecting = false;
}

Tessel.prototype.wifi = function(wifi) {
	var self = this;
	this.wifi = wifi;
	wifi.on('connect', function() {
		console.log("I got connected");
		self.onWifiConnectedCallbacks.forEach(function(item) {
			item();
		});
		self.onWifiConnectedCallbacks = [];
	});

	function reconnectWifi() {
		if (!self.wifiReconnecting) {
			self.wifiReconnecting = true;
			setTimeout(function reset() {
				wifi.reset();
				setTimeout(function resetCheck() {
					if (wifi.isConnected()) {
						self.wifiReconnecting = false;
					} else {
						if (wifi.isBusy()) {
							setTimeout(resetCheck, 2000);
						} else {
							reset();
						}
					}
				}, 2000);
			}, 500);
		}
	}

	wifi.on('disconnect', function() {
		console.log("I got disconnected");
		reconnectWifi();
	});

	wifi.on('error', function() {
		console.log("I got errored");
		reconnectWifi();
	});
	return this;
};

Tessel.prototype.climate = function(module) {
	this.modules.climate = module;
	return this;
};

Tessel.prototype.ambient = function(module) {
	this.modules.ambient = module;
	this.resetAmbientStats();
	return this;
};

Tessel.prototype.stopAmbientStats = function() {
	if (this.modules.ambientStatsInterval) {
		clearInterval(this.modules.ambientStatsInterval);
	}
};

Tessel.prototype.resetAmbientStats = function() {
	var self = this;
	var maxValue = Number.MAX_VALUE || 9999999999999999;
	this.modules.ambientStats = {
		maxLight: -1,
		minLight: maxValue,
		countLight: 0,
		maxSound: -1,
		minSound: maxValue,
		countSound: 0
	};

	this.modules.ambientStatsInterval = setInterval(function() {
		self.modules.ambient.getLightLevel(function(err, ldata) {
			self.modules.ambient.getSoundLevel(function(err, sdata) {
				if (sdata > self.modules.ambientStats.maxSound) {
					self.modules.ambientStats.maxSound = sdata;
				}
				if (sdata < self.modules.ambientStats.minSound) {
					self.modules.ambientStats.minSound = sdata;
				}
				self.modules.ambientStats.countSound++;

				if (ldata > self.modules.ambientStats.maxLight) {
					self.modules.ambientStats.maxLight = ldata;
				}
				if (sdata < self.modules.ambientStats.minLight) {
					self.modules.ambientStats.minLight = sdata;
				}
				self.modules.ambientStats.countLight++;
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
			data.temperature = temp.toFixed(4);
			self.modules.climate.readHumidity(function(err, humid) {
				data.humidity = humid.toFixed(4);
				done(data);
			});
		});
	} else {
		done(data);
	}
	return this;
};

Tessel.prototype.readAmbient = function(data, done) {
	data = data || {};
	var self = this;
	if (self.modules.ambient) {
		self.stopAmbientStats();
		self.modules.ambient.getSoundLevel(function(err, sound) {
			data.sound = sound.toFixed(4);
			data.maxSound = self.modules.ambientStats.maxSound.toFixed(4);
			data.minSound = self.modules.ambientStats.minSound.toFixed(4);
			data.countSound = self.modules.ambientStats.countSound;
			self.modules.ambient.getLightLevel(function(err, light) {
				data.light = light.toFixed(4);
				data.maxLight = self.modules.ambientStats.maxSound.toFixed(4);
				data.minLight = self.modules.ambientStats.minLight.toFixed(4);
				data.countLight = self.modules.ambientStats.countLight;
				self.resetAmbientStats();
				done(data);
			});
		});
	} else {
		done(data);
	}
	return this;
};

Tessel.prototype.runWifiRequiredTask = function(task) {
	if (this.wifi) {
		if (this.wifi.isConnected()) {
			task();
		} else {
			this.onWifiConnectedCallbacks.push(task);
		}
	} else {
		task();
	}
};

Tessel.prototype.read = function(data, done) {
	data = data || {};
	var self = this;
	self.runWifiRequiredTask(function() {
		self.readClimate(data, function() {
			self.readAmbient(data, function() {
				done(data);
			});
		});
	});
	return this;
};

module.exports = function(api, config) {
	api.tessel = function() {
		return new Tessel();
	};
};