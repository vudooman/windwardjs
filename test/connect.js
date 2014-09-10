var windward = require('../index.js');

windward.connect('testUser', 'testDevice', function(info, err) {
	console.log('hi');
});
