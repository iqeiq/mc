(function() {
  var Bot, Repl, Twitter, bot, emitter, inspect, log4js, logger, repl, setting, tracer, twi;

  setting = require('../setting');

  Bot = require('./bot');

  Twitter = require('./twitter');

  Repl = require('./repl');

  inspect = require('util').inspect;

  log4js = require('log4js');

  log4js.configure('log4js.json', {
    reloadSecs: 60
  });

  logger = log4js.getLogger("system");

  tracer = log4js.getLogger("trace");

  bot = new Bot(logger);

  emitter = function(user, command) {
    return new Promise(function(resolve, reject) {
      return bot.emit('command', user, command, function(res) {
        return resolve(res);
      });
    });
  };

  repl = new Repl(logger, emitter);

  twi = new Twitter(logger, emitter);

  process.on('uncaughtException', function(err) {
    tracer.trace(err.stack);
    return logger.error(err.message);
  });

}).call(this);
