function Tessel () {
  this.modules = {};
}

Tessel.prototype.climate = function(module) {
  this.modules.climate = module;
  return this;
};


Tessel.prototype.ambient = function(module) {
  this.modules.ambient = module;
  return this;
};

Tessel.prototype.readClimate = function(data, done) {
  data = data || {};
  var self = this;
  if(self.modules.climate) {
    self.modules.climate.readTemperature('f', function(err, temp) {
      self.modules.climate.readHumidity(function(err, humid) {
        done({
          temperature : temp.toFixed(4),
          humidity : humid.toFixed(4)
        });
      });
    });
  } else {
    done({});
  }
  return this;
};

Tessel.prototype.readAmbient = function(data, done) {
  data = data || {};
  var self = this;
  if(self.modules.ambient) {
    self.modules.climate.readTemperature('f', function(err, temp) {
      self.modules.climate.readHumidity(function(err, humid) {
        done({
          temperature : temp.toFixed(4),
          humidity : humid.toFixed(4)
        });
      });
    });
  } else {
    done(data);
  }
  return this;
};

Tessel.prototype.read = function(data, done) {
  data = data || {};
  var self = this;
  self.readClimate(data, function() {
    self.readAmbient(data, function() {
      done(data);
    });
  });
  return this;
};