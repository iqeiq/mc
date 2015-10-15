setting = require '../setting'
util = require './util'
DB = require './db'

{EventEmitter} = require 'events'
{exec} = require 'child_process'
{inspect} = require 'util'

express = require 'express'

module.exports = class Bot extends EventEmitter
  constructor: (@logger)->
    # server
    app = express()
    app.get '/', (req, res)-> res.send 'matcha mura'
    server = app.listen setting.PORT, =>
      @logger.info "server listening at #{server.address().port} port"
    
    # DB
    @db = new DB

    @pexec = (cmd)=>
      new Promise (resolve, reject)=>
        exec cmd, (err, stdout, stderr)=>
          @logger.trace stderr.toString() if stderr
          unless err
            resolve stdout.toString()
          else
            reject err

    @on 'command', (user, cmd, respond)=>
      args = cmd.split /[\s　]+/
      command = args[0]
      args.splice 0, 1

      switch command
        when 'restart'
          @pexec "ps -ef | egrep '[S]CREEN.+minecraft' | awk '{print $2};'"
            .then (out)=>
              if out.length > 0
                pid = parseInt out
                console.log pid
                @pexec "kill -9 #{pid}"
                  .then ->
                    respond "server was alive... kill process. please try again."
              else
                @pexec "/etc/init.d/minecraft start"
                  .then ->
                    respond "server was down... server has started!"
            .catch (err)=>
              @logger.error err.message
              respond "error."
        when 'list'
          @pexec "/etc/init.d/minecraft command list"
            .then (out)=>
              line = out.split /\r*\n/
              line.splice 0, 2
              num = 0
              if line.length > 0
                sp = line[0].split ']: '
                if sp.length is 2
                  players = sp[1].split ', '
                  players = players.filter (p)=> 
                    @db.mutedCache.every (u)-> u isnt p
                  num = players.length
              message = "There are #{num} players!"
              message += " (#{players.join ', '})"
              respond message 
            .catch (err)=>
              @logger.error err.message
              respond "error."
        when 'mute'
          list = @db.mutedCache.join ', '
          respond "muted: #{list}"
        when 'addmute'
          if args.length is 0
            return respond "usage: addmute (user1) [user2] ..."
          Promise.all args.map((user)=> @db.addMute user)
            .then (res)-> respond "ok."
            .catch (err)=>
              @logger.error err.message
              respond "error."
        when 'removemute'
          if args.length is 0
            return respond "usage: removemute (user1) [user2] ..."
          Promise.all args.map((user)=> @db.removeMute user)
            .then (res)-> respond "ok."
            .catch (err)=>
              @logger.error err.message
              respond "error."
        when 'report'
          if args.length is 0
            @db.find()
              .then (res)->
                str = ""
                for doc in res
                  str += "[#{doc.num}] #{doc.message}\n"
                respond str
              .catch (err)=>
                @logger.error err.message
                respond "err"
          else
            report = args.join ' '
            @db.register user, report
              .then (res)-> respond "ok."
              .catch (err)=>
                @logger.error err.message
                respond "error."
        when 'delete'
          unless args.length is 1
            return respond "usage: delete (report number)"
          num = parseInt arg[0]
          @db.remove num
            .then (res)-> respond "ok."
            .catch (err)=>
              @logger.error err.message
              respond "error."
        else
          respond "unknown command: #{command}"
