(function() {
  var Bot, DB, EventEmitter, dm, exec, express, inspect, setting, util,
    extend = function(child, parent) { for (var key in parent) { if (hasProp.call(parent, key)) child[key] = parent[key]; } function ctor() { this.constructor = child; } ctor.prototype = parent.prototype; child.prototype = new ctor(); child.__super__ = parent.prototype; return child; },
    hasProp = {}.hasOwnProperty;

  setting = require('../setting');

  util = require('./util');

  DB = require('./db');

  dm = require('./deathmessages');

  EventEmitter = require('events').EventEmitter;

  exec = require('child_process').exec;

  inspect = require('util').inspect;

  express = require('express');

  module.exports = Bot = (function(superClass) {
    extend(Bot, superClass);

    function Bot(logger1) {
      var app, mclogfile, server, watcher;
      this.logger = logger1;
      app = express();
      app.get('/', function(req, res) {
        return res.send('matcha mura');
      });
      server = app.listen(setting.PORT, (function(_this) {
        return function() {
          return _this.logger.info("server listening at " + (server.address().port) + " port");
        };
      })(this));
      this.db = new DB;
      this.emitter = [];
      this.morningcall = [];
      this.alarmstart();
      mclogfile = setting.MCLOG;
      watcher = require('fs').watch(mclogfile, (function(_this) {
        return function(event) {
          var prevlog;
          if (event === 'rename') {
            _this.logger.info("logfile rotated. try restart.");
            return process.exit(1);
          }
          if (event !== 'change') {
            return;
          }
          prevlog = "";
          return exec("tail -n 1 " + mclogfile, function(err, stdout, stderr) {
            var flag, line, mes, res, sp, t;
            if (err) {
              _this.logger.error(err);
            }
            if (stderr) {
              _this.logger.trace(stderr.toString());
            }
            if (err || stderr) {
              return;
            }
            line = stdout.toString().split(/\r*\n/);
            if (line.length === 0) {
              return;
            }
            sp = line[0].split(/]:\s*/);
            if (sp.length < 2) {
              return;
            }
            t = sp[0].split(/\s+/)[0];
            if (sp[1].length === 0) {
              return;
            }
            mes = t + " " + sp[1];
            if (mes === prevlog) {
              return;
            }
            prevlog = mes;
            if (/<[^>]+>\s*#/.test(mes)) {
              res = /<([^>]+)>\s*#\s*(.+)/.exec(mes);
              _this.emit('command', res[1], res[2], function(res) {
                var i, len, ref, results;
                ref = res.split(/\r*\n/);
                results = [];
                for (i = 0, len = ref.length; i < len; i++) {
                  line = ref[i];
                  results.push(_this.pexec("/etc/init.d/minecraft command say '" + line + "'")["catch"](function(err) {
                    if (err) {
                      return logger.error(err);
                    }
                  }));
                }
                return results;
              });
              return;
            }
            if (_this.db.mutedCache.some(function(u) {
              return RegExp("" + u).test(mes);
            })) {
              return;
            }
            flag = false;
            if (!/<[^>]+>/.test(mes)) {
              if (/the game/.test(mes)) {
                flag = true;
              } else if (/earned the achievement/.test(mes)) {
                flag = true;
              } else if (dm.some(function(v) {
                return v.test(mes);
              })) {
                flag = true;
              }
            }
            if (flag) {
              return _this.say(mes);
            }
          });
        };
      })(this));
      this.on('command', (function(_this) {
        return function(user, cmd, respond) {
          var args, command, list, num, report;
          args = cmd.split(/[\s　]+/);
          command = args[0];
          args.splice(0, 1);
          switch (command) {
            case 'restart':
              return _this.pexec("ps -ef | egrep '[S]CREEN.+minecraft' | awk '{print $2};'").then(function(out) {
                var pid;
                if (out.length > 0) {
                  pid = parseInt(out);
                  console.log(pid);
                  return _this.pexec("kill -9 " + pid).then(function() {
                    return respond("server was alive... kill process. please try again.");
                  });
                } else {
                  return _this.pexec("/etc/init.d/minecraft start").then(function() {
                    return respond("server was down... server has started!");
                  });
                }
              })["catch"](function(err) {
                _this.logger.error(err.message);
                return respond("error.");
              });
            case 'list':
              return _this.pexec("/etc/init.d/minecraft command list").then(function(out) {
                var line, message, num, players, sp;
                line = out.split(/\r*\n/);
                line.splice(0, 2);
                num = 0;
                if (line.length > 0) {
                  sp = line[0].split(/]:\s*/);
                  if (sp.length === 2) {
                    if (sp[1].length > 0) {
                      players = sp[1].split(', ');
                      players = players.filter(function(p) {
                        return _this.db.mutedCache.every(function(u) {
                          return u !== p;
                        });
                      });
                      num = players.length;
                    }
                  }
                } else {
                  _this.logger.debug("failed to getting player list.");
                  _this.emit('command', user, cmd, respond);
                  return;
                }
                message = "There are " + num + " players!";
                if (num !== 0) {
                  message += " (" + (players.join(', ')) + ")";
                }
                return respond(message);
              })["catch"](function(err) {
                _this.logger.error(err.message);
                return respond("error.");
              });
            case 'time':
              return _this.pexec("/etc/init.d/minecraft command time query daytime").then(function(out) {
                var day, daytime, hour, line, message, minute, sp, time;
                line = out.split(/\r*\n/);
                line.splice(0, 1);
                if (line.length === 0) {
                  return;
                }
                sp = line[0].split(/Time\s*is\s*/);
                if (sp.length !== 2) {
                  return;
                }
                if (sp[1].length === 0) {
                  return;
                }
                daytime = parseInt(sp[1]);
                time = daytime % 24000;
                day = Math.floor(daytime / 24000);
                hour = (Math.floor(time / 1000) + 6) % 24;
                minute = Math.floor((time % 1000) * 60 / 1000.0);
                message = "Day " + day + "  " + hour + ":" + (util.zeroFill(minute, 2));
                return respond(message);
              })["catch"](function(err) {
                _this.logger.error(err.message);
                return respond("error.");
              });
            case 'alarm':
              _this.morningcall.push(user);
              return respond("ok.");
            case 'mute':
              list = _this.db.mutedCache.join(', ');
              return respond("muted: " + list);
            case 'addmute':
              if (args.length === 0) {
                args.push(user);
              }
              return Promise.all(args.map(function(user) {
                return _this.db.addMute(user);
              })).then(function(res) {
                return respond("ok.");
              })["catch"](function(err) {
                _this.logger.error(err.message);
                return respond("error.");
              });
            case 'removemute':
              if (args.length === 0) {
                args.push(user);
              }
              return Promise.all(args.map(function(user) {
                return _this.db.removeMute(user);
              })).then(function(res) {
                return respond("ok.");
              })["catch"](function(err) {
                _this.logger.error(err.message);
                return respond("error.");
              });
            case 'report':
              if (args.length === 0) {
                return _this.db.find().then(function(res) {
                  var doc, i, len, str;
                  str = "";
                  for (i = 0, len = res.length; i < len; i++) {
                    doc = res[i];
                    str += "\n[" + doc.num + "] " + doc.message;
                  }
                  return respond(str);
                })["catch"](function(err) {
                  _this.logger.error(err.message);
                  return respond("error.");
                });
              } else {
                report = args.join(' ');
                return _this.db.register(user, report).then(function(res) {
                  return respond("ok.");
                })["catch"](function(err) {
                  _this.logger.error(err.message);
                  return respond("error.");
                });
              }
              break;
            case 'report_no':
              if (args.length !== 1) {
                return respond("usage: report_no (number)  (( report => report_no in Twitter ))");
              } else {
                num = parseInt(args[0]);
                return _this.db.findOne({
                  num: num
                }).then(function(doc) {
                  if (doc != null) {
                    return respond("\n[" + doc.num + "] " + doc.message);
                  } else {
                    return respond("Not Found.");
                  }
                })["catch"](function(err) {
                  _this.logger.error(err.message);
                  return respond("error.");
                });
              }
              break;
            case 'delete':
              if (args.length !== 1) {
                return respond("usage: delete (report number)");
              }
              num = parseInt(args[0]);
              return _this.db.remove(num).then(function(res) {
                return respond("ok.");
              })["catch"](function(err) {
                _this.logger.error(err.message);
                return respond("error.");
              });
            default:
              return respond("unknown command: " + command);
          }
        };
      })(this));
    }

    Bot.prototype.say = function(text) {
      console.log("say: " + text);
      return Promise.all(this.emitter.map((function(_this) {
        return function(saye) {
          return saye(text);
        };
      })(this)))["catch"]((function(_this) {
        return function() {
          return _this.logger.error(err.message);
        };
      })(this));
    };

    Bot.prototype.addEmitter = function(cb) {
      return this.emitter.push(cb);
    };

    Bot.prototype.pexec = function(cmd) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          return exec(cmd, function(err, stdout, stderr) {
            if (stderr) {
              _this.logger.trace(stderr.toString());
            }
            if (!err) {
              return resolve(stdout.toString());
            } else {
              return reject(err);
            }
          });
        };
      })(this));
    };

    Bot.prototype.alarmstart = function(cnt) {
      if (cnt == null) {
        cnt = 0;
      }
      if (cnt > 3) {
        this.logger.error("failed to starting alarm cycle.");
        return;
      }
      return this.pexec("/etc/init.d/minecraft command time query daytime").then((function(_this) {
        return function(out) {
          var daytime, line, ms, sp, time;
          line = out.split(/\r*\n/);
          line.splice(0, 1);
          if (line.length === 0) {
            _this.alarmstart(cnt + 1);
            return;
          }
          sp = line[0].split(/Time\s*is\s*/);
          if (sp.length !== 2) {
            _this.alarmstart(cnt + 1);
            return;
          }
          if (sp[1].length === 0) {
            _this.alarmstart(cnt + 1);
            return;
          }
          daytime = parseInt(sp[1]);
          time = daytime % 24000;
          ms = (24000 - time) * 50;
          return setTimeout(function() {
            return _this.morningTimer();
          }, ms);
        };
      })(this))["catch"]((function(_this) {
        return function(err) {
          return _this.logger.error(err.message);
        };
      })(this));
    };

    Bot.prototype.morningTimer = function() {
      var i, len, ref, user;
      ref = this.morningcall;
      for (i = 0, len = ref.length; i < len; i++) {
        user = ref[i];
        this.say("@" + user + " asadayo- " + (new Date().getTime()));
      }
      this.morningcall = [];
      return setTimeout((function(_this) {
        return function() {
          return _this.morningTimer();
        };
      })(this), 1200000);
    };

    return Bot;

  })(EventEmitter);

}).call(this);
