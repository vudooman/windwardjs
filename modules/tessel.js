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
			if (!err && self.modules.relay) {
				if (info.relayChannelOneOn === true) {
					self.modules.relay.turnOn(1);
				} else {
					self.modules.relay.turnOff(1);
				}
				if (info.relayChannelTwoOn === true) {
					self.modules.relay.turnOn(2);
				} else {
					self.modules.relay.turnOff(2);
				}
			}
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
	self.wifi = wifi;
	wifi.on('connect', function() {
		self.log("I got WIFI connected");
		self.onWifiConnectedCallbacks.forEach(function(item) {
			item();
		});
		self.onWifiConnectedCallbacks = [];
	});


	function reconnectWifi() {
		if(wifi.isConnected()) {
			// Recheck in 1 minute
			console.log("Wifi is connected, will check in a minute.");
			setTimeout(reconnectWifi, 60*1000);
		} else if(wifi.isBusy()) {
			// Reconnection may be happening, recheck in 10 seconds
			console.log("Wifi is busy, will check in 10 seconds.");
			setTimeout(reconnectWifi, 10*1000);
		} else {
			// Reconnect and give 30 seconds before retrying
			wifi.reset();
			console.log("Wifi is reconnecting, will check in 30 seconds.");
			setTimeout(reconnectWifi, 30*1000);
		}
	}
	reconnectWifi();
	
	/*
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
	*/
	return this;
};

Tessel.prototype.relay = function(module) {
	this.modules.relay = module;
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
	this.modules.ambientStats = {
		light: [],
		sound: []
	};

	this.modules.ambientStatsInterval = setInterval(function() {
		self.modules.ambient.getLightLevel(function(err, ldata) {
			self.modules.ambientStats.light.push(ldata);
			if(self.modules.ambientStats.light.length > 1000) {
				self.modules.ambientStats.light.shift();
			}
			self.modules.ambient.getSoundLevel(function(err, sdata) {
				self.modules.ambientStats.sound.push(sdata);
				if(self.modules.ambientStats.sound.length > 1000) {
					self.modules.ambientStats.sound.shift();
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
	function doRead() {
		self.stopAmbientStats();
		self.modules.ambient.getSoundLevel(function(err, sound) {
			self.modules.ambientStats.sound.push(sound);
			self.modules.ambient.getLightLevel(function(err, light) {
				self.modules.ambientStats.light.push(light);	
				data.light = self.modules.ambientStats.light;
				data.sound = self.modules.ambientStats.sound;
				self.resetAmbientStats();
				done(data);
			});
		});
	}
	if (self.modules.ambient) {
		if(self.modules.ambient.connected) {
			doRead();
		} else {
			self.modules.ambient.on('ready', doRead);
		}
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