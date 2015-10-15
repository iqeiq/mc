(function() {
  var Repl, readline;

  readline = require('readline');

  module.exports = Repl = (function() {
    function Repl(logger, emitter) {
      this.logger = logger;
      this.emitter = emitter;
      this.rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
      });
      this.rl.on('line', (function(_this) {
        return function(line) {
          return _this.proc(line);
        };
      })(this));
    }

    Repl.prototype.proc = function(line) {
      var command, token, user;
      if ('#' !== line.charAt(0)) {
        return;
      }
      line = line.substr(1);
      token = line.split(/[\s　]*:[\s　]*/);
      if (token.length < 2) {
        return;
      }
      user = token[0];
      token.splice(0, 1);
      command = token.join('');
      return this.emitter(user, command).then(function(res) {
        return console.log(res);
      });
    };

    return Repl;

  })();

}).call(this);
