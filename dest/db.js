(function() {
  var DB, mongoose, setting;

  setting = require('../setting');

  mongoose = require('mongoose');

  module.exports = DB = (function() {
    function DB() {
      var muteSchema, shareSchema;
      shareSchema = new mongoose.Schema({
        user: String,
        message: String,
        num: Number
      });
      muteSchema = new mongoose.Schema({
        user: String
      });
      this.db = mongoose.connect("mongodb://" + setting.DB.HOST + ":" + setting.DB.PORT + "/" + setting.DB.NAME);
      this.shareModel = mongoose.model('Share', shareSchema);
      this.muteModel = mongoose.model('Mute', muteSchema);
      this.mutedCache = [];
      this.muteModel.find({}, (function(_this) {
        return function(err, docs) {
          var d, i, len, results;
          if (err) {
            return;
          }
          results = [];
          for (i = 0, len = docs.length; i < len; i++) {
            d = docs[i];
            results.push(_this.mutedCache.push(d.user));
          }
          return results;
        };
      })(this));
    }

    DB.prototype.addMute = function(user) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var m;
          _this.mutedCache.push(user);
          m = new _this.muteModel();
          m.user = user;
          return m.save(function(err) {
            if (err) {
              return reject(err);
            } else {
              return resolve();
            }
          });
        };
      })(this));
    };

    DB.prototype.removeMute = function(user) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var index;
          index = _this.mutedCache.indexOf(user);
          if (!(index < 0)) {
            _this.mutedCache.splice(index, 1);
          }
          return _this.muteModel.findOneAndRemove({
            user: user
          }, function(err) {
            if (err) {
              return reject(err);
            } else {
              return resolve();
            }
          });
        };
      })(this));
    };

    DB.prototype.register = function(user, message) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.shareModel.findOne({}).sort('-num').exec(function(err, doc) {
            var s;
            if (err) {
              return reject(err);
            }
            s = new _this.shareModel();
            s.user = user;
            s.message = message;
            s.num = doc != null ? doc.num + 1 : 0;
            return s.save(function(err) {
              if (err) {
                return reject(err);
              } else {
                return resolve();
              }
            });
          });
        };
      })(this));
    };

    DB.prototype.find = function() {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.shareModel.find({}, function(err, docs) {
            if (err) {
              return reject(err);
            } else {
              return resolve(docs);
            }
          });
        };
      })(this));
    };

    DB.prototype.remove = function(num) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return _this.shareModel.findOneAndRemove({
            num: num
          }, function(err) {
            if (err) {
              return reject(err);
            } else {
              return resolve();
            }
          });
        };
      })(this));
    };

    return DB;

  })();

}).call(this);
