function Tessel(tessel) {
	this.tessel = tessel;
	this.modules = {};
	this.wifi = null;
	this.onWifiConnectedCallbacks = [];
	this.wifiReconnecting = false;
	this.externalLogger = null;
}

Tessel.prototype.log = function(message) {
	message += " [" + new Date() + "]";
	if (this.externalLogger) {
		this.externalLogger.log(message);
	} else {
		console.log(message);
	}
	return this;
};

Tessel.prototype.workflow = function(wf) {
	var self = this;

	function blinkStatus(blinkInfo) {
		(function doBlinkStatus() {
			self.tessel.led[0].toggle();
			if (++blinkInfo.index < blinkInfo.total) {
				setTimeout(doBlinkStatus, blinkInfo.interval);
			} else {
				self.tessel.led[0].output(0);
			}
		})();
	}

	function blinkWF(blinkInfo) {
		(function doBlinkWF() {
			self.tessel.led[1].toggle();
			if (++blinkInfo.index < blinkInfo.total) {
				setTimeout(doBlinkWF, blinkInfo.interval);
			} else {
				self.tessel.led[1].output(0);
			}
		})();
	}

	function createBlinkInfo(info, err, id) {
		var blinkCount = 1,
			blinkInterval = 300;
		if (err) {
			blinkCount = 20;
		}
		return {
			index: 0,
			total: blinkCount,
			interval: blinkInterval,
			id: id
		};
	}

	if (wf && self.tessel) {
		wf.on('statusStart', function() {
			self.tessel.led[0].output(1);
		});
		wf.on('statusComplete', function(info, err) {
			var blinkInfo = createBlinkInfo(info, err, 'status');
			blinkStatus(blinkInfo);
		});
		wf.on('workflowStart', function() {
			self.tessel.led[1].output(1);
		});
		wf.on('workflowComplete', function(info, err) {
			var blinkInfo = createBlinkInfo(info, err, 'workflow');
			blinkWF(blinkInfo);
		});
	}
	return this;
};

Tessel.prototype.wifi = function(wifi) {
	var self = this;
	this.wifi = wifi;
	wifi.on('connect', function() {
		self.log("I got connected");
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
		self.log("I got disconnected");
		reconnectWifi();
	});

	wifi.on('error', function() {
		self.log("I got errored");
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
	api.tessel = function(tessel) {
		return new Tessel(tessel);
	};
};