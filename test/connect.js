var windward = require('../index.js');

windward.debug(true);

console.log("Connecting ...");
windward.connect('540f8c6340bed70000165f80', '54111605e668ad675c000000',
		function(info, err) {
			if (!err) {
				console.log("Connected!!");
				console.log("Updating status ...");
				windward.status(function(info, error) {
					if (!error) {
						console.log("Updated!!");
					}
				});
			}
		});
