var windward = require('../index.js');

windward.reportClimate({
  humidity: 45,
  vudoo: 123
})
.temperature(123)
.send(function(info, err) {
	console.log('hi');
});
