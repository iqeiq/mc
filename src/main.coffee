setting = require '../setting'
Bot = require './bot'
Twitter = require './twitter'
Repl = require './repl'

{inspect} = require 'util'
log4js = require 'log4js'

#log
log4js.configure 'log4js.json',
  reloadSecs: 60

logger = log4js.getLogger "system"
tracer = log4js.getLogger "trace"

# bot
bot = new Bot logger

emitter = (user, command)->
  new Promise (resolve, reject)->
    bot.emit 'command', user, command, (res)-> resolve res

# repl
repl = new Repl logger, emitter

# twitter
twi = new Twitter logger, emitter

bot.addEmitter (text)->
  twi.tweet text

# uncaughtException
process.on 'uncaughtException', (err)->
  tracer.trace err.stack
  logger.error err.message
