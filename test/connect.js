var windward = require('../index.js');

windward.connect('540f8c6340bed70000165f80', '54111605e668ad675c000000',
		function(info, err) {
			if (err) {
				console.log("Error: ");
				console.log(err);
			} else {
				windward.printConfig();
			}
		});
