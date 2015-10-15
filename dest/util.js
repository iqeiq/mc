
/* utility */

(function() {
  var rand;

  module.exports.rand = rand = function(n) {
    return Math.floor(Math.random() * n);
  };

  module.exports.randf = function(n) {
    return Math.random * n;
  };

  module.exports.randArray = function(arr) {
    return arr[rand(arr.length)];
  };

}).call(this);
