var windward = require('../index.js');

var statusCount = 0, workflowCount = 0;
var deviceInfo = {
	updateInterval : 10000
};
windward.workflow({
	status : function(done) {
		statusCount++;
		console.log("Status: " + statusCount);
		deviceInfo.updateInterval = 30000;
		done();
	},
}, {
	deviceInfo : deviceInfo
}).statusInterval(1000).maxRuns(3).start(function() {
	workflowCount++;
	console.log("Workflow: " + workflowCount);
}).end(
		function() {
			console.log("statusCount: " + statusCount + ", workflowCount: "
					+ workflowCount);
		});
