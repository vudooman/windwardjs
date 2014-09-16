function Workflow() {
	this.config = {
		statusInterval: 60000,
		workflowRunCount: 0,
		workFlowMaxRuns: -1
	};
	this.running = false;
	this.lastInterval = -1;
	this.wfTimeout = null;
}

Workflow.prototype.init = function(api, config) {
	this.api = api;
	this.config.apiConfig = config;
	return this;
};

Workflow.prototype.maxRuns = function(value) {
	value = parseInt(value);
	if (value < -1) {
		value = -1;
	}
	this.config.workFlowMaxRuns = value;
	return this;
};

Workflow.prototype.statusInterval = function(value) {
	value = parseInt(value);
	if (value < 5000) {
		value = 5000;
	}
	this.config.statusInterval = value;
	return this;
};

Workflow.prototype.end = function(func) {
	this.config.endFunc = func;
};

Workflow.prototype.start = function(func) {
	this.running = true;

	var self = this;

	function getUpdateInterval() {
		var interval = self.config.apiConfig && self.config.apiConfig.deviceInfo && self.config.apiConfig.deviceInfo.updateInterval ? self.config.apiConfig.deviceInfo.updateInterval : 30 * 60 * 1000;
		if (interval < 5000) {
			interval = 5000;
		}
		return interval;
	}

	function workflow() {
		var interval = getUpdateInterval();

		self.config.workflowRunCount++;
		func(this, interval, function() {
			if (self.config.workFlowMaxRuns == -1 || self.config.workflowRunCount < self.config.workFlowMaxRuns) {
				self.wfTimeout = setTimeout(workflow, interval);
			} else {
				if (typeof self.config.endFunc == 'function') {
					self.config.endFunc(self);
				}
				self.running = false;
			}
		});
	}

	setImmediate(function status() {
		self.api.status(function(config, err) {
			var interval = getUpdateInterval();

			// Reset workflow execution time
			if (self.wfTimeout && interval != self.lastInterval) {
				clearTimeout(self.wfTimeout);
				workflow();
			}
			self.lastInterval = interval;

			console.log("self.config.statusInterval: " + self.config.statusInterval);
			if (self.running) {
				setTimeout(status, self.config.statusInterval);
			}
		});
	});

	setTimeout(workflow, 500);
	return this;
};

module.exports = function(api, config) {
	api.workflow = function(workflowAPI, workflowConfig) {
		workflowAPI = workflowAPI || api;
		workflowConfig = workflowConfig || config;
		return new Workflow().init(workflowAPI, workflowConfig);
	};
};