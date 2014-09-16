var windward = require('../index.js');

var statusCount = 0,
	workflowCount = 0;
var deviceInfo = {
	updateInterval: 10000
};

windward.connect('540f8c6340bed70000165f80', '54111605e668ad675c000000',
	function(info, err) {
		if (!err) {
			windward.workflow().statusInterval(1000).maxRuns(3).start(
				function(workflow, interval) {
					workflowCount++;
					console.log("Workflow: " + workflowCount + ", interval: " + interval);
				}).end(function() {
				console.log("Done");
			});
		}
	});