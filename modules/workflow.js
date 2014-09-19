function Workflow() {
	this.config = {
		statusInterval: 60000,
		workflowRunCount: 0,
		workFlowMaxRuns: -1
	};
	this.running = false;
	this.lastInterval = -1;
	this.wfTimeout = null;
	this.handlers = {
		statusStart: [],
		statusComplete: [],
		workflowStart: [],
		workflowComplete: []
	};
	this.pendingWorkflow = null;
}

Workflow.prototype.on = function(event, handler) {
	if (this.handlers[event]) {
		this.handlers[event].push(handler);
	}
	return this;
};

Workflow.prototype.off = function(event, handler) {
	if (this.handlers[event] && this.handlers[event].indexOf(handler) != -1) {
		this.handlers[event].splice(this.handlers[event].indexOf(handler), 1);
	}
	return this;
};

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
		self.pendingWorkflow = function() {

			// Make null to only run once
			self.pendingWorkflow = null;

			self.config.workflowRunCount++;

			if (self.handlers.workflowStart.length > 0) {
				self.handlers.workflowStart.forEach(function(item) {
					item(self.config.workflowRunCount);
				});
			}

			var interval = getUpdateInterval();

			func(this, interval, function(info, err) {
				if (self.handlers.workflowComplete.length > 0) {
					self.handlers.workflowComplete.forEach(function(item) {
						item(info, err);
					});
				}

				if (self.config.workFlowMaxRuns == -1 || self.config.workflowRunCount < self.config.workFlowMaxRuns) {
					self.wfTimeout = setTimeout(workflow, interval);
				} else {
					if (typeof self.config.endFunc == 'function') {
						self.config.endFunc(self);
					}
					self.running = false;
				}
			});
		};
	}

	setImmediate(function status() {
		if (self.handlers.statusStart.length > 0) {
			self.handlers.statusStart.forEach(function(item) {
				item();
			});
		}
		self.api.status(function(config, err) {

			if (self.handlers.statusComplete.length > 0) {
				self.handlers.statusComplete.forEach(function(item) {
					item(config, err);
				});
			}
			var interval = getUpdateInterval();

			// Reset workflow execution time
			if (self.wfTimeout && interval != self.lastInterval) {
				clearTimeout(self.wfTimeout);
				workflow();
			}
			self.lastInterval = interval;

			if (typeof self.pendingWorkflow == 'function') {
				setTimeout(self.pendingWorkflow, 10000);
			}

			if (self.running) {
				setTimeout(status, self.config.statusInterval);
			}
		});
	});

	setTimeout(workflow, 100);
	return this;
};

module.exports = function(api, config) {
	api.workflow = function(workflowAPI, workflowConfig) {
		workflowAPI = workflowAPI || api;
		workflowConfig = workflowConfig || config;
		return new Workflow().init(workflowAPI, workflowConfig);
	};
};