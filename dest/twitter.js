(function() {
  var Twitter, exec, inspect, setting, twitter;

  setting = require('../setting');

  twitter = require('twitter');

  inspect = require('util').inspect;

  exec = require('child_process').exec;

  module.exports = Twitter = (function() {
    function Twitter(logger, emitter) {
      this.logger = logger;
      this.emitter = emitter;
      this.client = new twitter({
        consumer_key: setting.TWITTER.CONSUMER_KEY,
        consumer_secret: setting.TWITTER.CONSUMER_SECRET,
        access_token_key: setting.TWITTER.ACCESS_TOKEN,
        access_token_secret: setting.TWITTER.ACCESS_SECRET
      });
      this.client.stream('user', {}, (function(_this) {
        return function(stream) {
          stream.on('data', function(tweet) {
            if (tweet.text != null) {
              return _this.procTweet(tweet);
            }
          });
          return stream.on('error', function(err) {
            if (err) {
              throw err;
            }
          });
        };
      })(this));
      this.commands = [];
      this.addCommand(/stop/i, function(screen_name, text, cb) {
        setTimeout((function() {
          return process.exit(1);
        }), 1000);
        return cb("終了します");
      });
      this.addCommand(/lasterror/i, function(screen_name, text, cb) {
        return exec('cat log/sysyem.log.1 log/system.log | grep ERROR | tail -1', function(error, stdout, stderr) {
          return cb("\n" + stdout);
        });
      });
      this.addCommand(/^cmd:/i, (function(_this) {
        return function(screen_name, text, cb) {
          var command;
          command = text.replace(/^cmd:[\s　]*/i, '');
          return _this.emitter(screen_name, command).then(cb);
        };
      })(this));
    }

    Twitter.prototype.tweet = function(text) {
      return new Promise((function(_this) {
        return function(resolve, reject) {
          var data;
          data = {
            status: text
          };
          return _this.client.post('statuses/update', data, function(err) {
            if (err) {
              return reject(err);
            } else {
              return resolve();
            }
          });
        };
      })(this));
    };

    Twitter.prototype.descape = function(text) {
      text = text.replace(/&amp;/g, "&");
      text = text.replace(/&lt;/g, "<");
      text = text.replace(/&gt;/g, ">");
      return text;
    };

    Twitter.prototype.addCommand = function(regex, cb) {
      return this.commands.push({
        regex: regex,
        callback: cb
      });
    };

    Twitter.prototype.procTweet = function(data) {
      var command, i, isBot, isIgnore, isMention, isRetweet, len, mentions, name, ref, reply_status_id, screen_name, text, via;
      if (data.user.id_str === setting.TWITTER.OWNER_ID) {
        return;
      }
      text = this.descape(data.text);
      mentions = data.entities.user_mentions;
      name = data.user.name;
      screen_name = data.user.screen_name;
      reply_status_id = data.in_reply_to_status_id_str;
      via = data.source.replace(new RegExp(/<[^>]+>/g), '');
      isMention = mentions.length === 0 ? false : mentions[0].id_str === setting.TWITTER.OWNER_ID;
      isRetweet = data.retweeted_status;
      isBot = [screen_name, name, via].some(function(v) {
        return /bot/i.test(v);
      });
      if (/tweetbot/i.test(via)) {
        isBot = false;
      }
      isIgnore = [/Tweet Button/i, /ツイ廃あらーと/i, /ツイート数カウントくん/i, /リプライ数チェッカ/i, /twittbot/i, /twirobo/i, /EasyBotter/i, /makebot/i, /botbird/i, /botmaker/i, /autotweety/i, /rekkacopy/i, /ask\.fm/i].some(function(v) {
        return v.test(via);
      });
      if (isIgnore || isRetweet || isBot) {
        return;
      }
      if (isMention) {
        text = text.replace(/@[^\s　]+[\s　]+/g, '');
        ref = this.commands;
        for (i = 0, len = ref.length; i < len; i++) {
          command = ref[i];
          if (command.regex.test(text)) {
            command.callback(screen_name, text, (function(_this) {
              return function(res) {
                data = {
                  status: "@" + screen_name + " " + res,
                  in_reply_to_status_id: reply_status_id
                };
                return _this.client.post('statuses/update', data, function(err) {
                  if (err) {
                    throw error;
                  }
                });
              };
            })(this));
            return;
          }
        }
        this.emitter(screen_name, "list").then((function(_this) {
          return function(res) {
            data = {
              status: "@" + screen_name + " " + res,
              in_reply_to_status_id: reply_status_id
            };
            return _this.client.post('statuses/update', data, function(err) {
              if (err) {
                throw err;
              }
            });
          };
        })(this));
        return;
      }
      if (/抹茶/.test(text)) {
        data = {
          status: "抹茶 " + (new Date().getTime())
        };
        return this.client.post('statuses/update', data, function(err) {
          if (err) {
            throw err;
          }
        });
      }
    };

    return Twitter;

  })();

}).call(this);
