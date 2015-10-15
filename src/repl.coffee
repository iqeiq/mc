readline = require 'readline'

module.exports = class Repl
  constructor: (@logger, @emitter)->
    @rl = readline.createInterface
      input: process.stdin
      output: process.stdout

    @rl.on 'line', (line)=>
      @proc line
      
  proc: (line)->
    return if '#' isnt line.charAt 0
    line = line.substr 1
    token = line.split /[\s　]*:[\s　]*/
    return if token.length < 2 
    user = token[0]
    token.splice 0, 1
    command = token.join ''

    @emitter user, command
      .then (res)->
        console.log res
