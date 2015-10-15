setting = require '../setting'
Bot = require './bot'
Twitter = require './twitter'
Repl = require './repl'

{inspect} = require 'util'
{exec} = require 'child_process'
#fs = require 'fs'
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

mclogfile = '/home/matcha/minecraft4/logs/latest.log'

#fs.watch mclogfile, (event)->
#  if event is 'change'
exec "tail -n 1 -f #{mclogfile}", (err, stdout, stderr)->
  logger.error err.message if err
  logger.trace stderr.toString() if stderr
  return if err or stderr
  line = stdout.toString().split /\r*\n/
  return if line.length is 0
  sp = line[0].split /]:\s*/
  return if sp.length < 2
  mes = sp[1]
  console.log mes
  return if bot.db.mutedCache.some((u)-> ///#{u}///.test mes)
  if /joined the game/.test mes
    twi.tweet mes
  else if /earned the achievement/.test mes
    twi.tweet mes
  else if /connection/.test mes
    return
  else if /UUID/.test mes
    return
  else if /logged/.test mes
    return
  else  if /<[^>]+> [^#]/.test mes
    return
  twi.tweet mes

# uncaughtException
process.on 'uncaughtException', (err)->
  tracer.trace err.stack
  logger.error err.message
