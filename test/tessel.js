var windward = require('../index.js');

var maxSound = -1;
var minSound = Number.MAX_VALUE;
var countSound = 0;

var timeout = 3200;
var numberOfRuns = Math.floor(timeout/500);

var tessel = windward.tessel()
.climate({
	readTemperature: function(config, done) {
		done(null, 123.456789);
	},
	readHumidity: function(done) {
		done(null, 45.678910);
	}
})
.ambient({
	getLightLevel: function(done) {
		done(null, 12345);
	},
	getSoundLevel: function(done) {
		var val = Math.random();
		if(countSound < numberOfRuns) {
			if(val > maxSound) {
				maxSound = val;
			}
			if(val < minSound) {
				minSound = val;
			}
			countSound++;
		}
		done(null, val);
	}
});

setTimeout(function() {
	tessel.read(null, function(data) {
		console.log(data);
		var errorCount = 0;
		if(data.sound) {
			if(data.maxSound != maxSound.toFixed(4)) {
				errorCount++;
				console.log("Max sound incorrect [Expected: " + maxSound + ", Actual: " + data.maxSound + "].");
			}
			if(data.minSound != minSound.toFixed(4)) {
				errorCount++;
				console.log("Count sound incorrect [Expected: " + minSound + ", Actual: " + data.minSound + "].");
			}
			if(data.countSound != countSound) {
				errorCount++;
				console.log("Count sound incorrect [Expected: " + countSound + ", Actual: " + data.countSound + "].");
			}
		}
		if(errorCount === 0) {
			console.log("All readings correct!!");
		}
		process.exit();
	});
}, 3200);