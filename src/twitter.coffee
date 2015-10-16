setting = require '../setting'
twitter = require 'twitter'
{inspect} = require 'util'
{exec} = require 'child_process'

module.exports = class Twitter
  constructor: (@logger, @emitter)->
    @client = new twitter
      consumer_key: setting.TWITTER.CONSUMER_KEY
      consumer_secret: setting.TWITTER.CONSUMER_SECRET
      access_token_key: setting.TWITTER.ACCESS_TOKEN
      access_token_secret: setting.TWITTER.ACCESS_SECRET

    @client.stream 'user', {}, (stream)=>
      stream.on 'data', (tweet)=>
        @procTweet tweet if tweet.text?

      stream.on 'error', (err)->
        throw err if err

    @commands = []

    @addCommand /stop/i, (screen_name, text, cb)->
      setTimeout (-> process.exit 1), 1000
      cb "終了します"

    @addCommand /lasterror/i, (screen_name, text, cb)->
      exec 'cat log/sysyem.log.1 log/system.log | grep ERROR | tail -1', (error, stdout, stderr)->
        cb "\n#{stdout}"

    @addCommand /^cmd:/i, (screen_name, text, cb)=>
      command = text.replace /^cmd:[\s　]*/i, ''
      @emitter screen_name, command
        .then cb
      
  tweet: (text)->
    new Promise (resolve, reject)=>
      data =
        status: text
      @client.post 'statuses/update', data, (err)->
        if err then reject(err) else resolve()

  descape: (text)->
    text = text.replace /&amp;/g, "&"
    text = text.replace /&lt;/g, "<"
    text = text.replace /&gt;/g, ">"
    text

  addCommand: (regex, cb)->
    @commands.push
        regex: regex
        callback: cb

  procTweet: (data)->
    return if data.user.id_str is setting.TWITTER.OWNER_ID

    text = @descape data.text
    mentions = data.entities.user_mentions
    name = data.user.name
    screen_name = data.user.screen_name
    reply_status_id = data.in_reply_to_status_id_str
    via = data.source.replace new RegExp(/<[^>]+>/g),''

    isMention = if mentions.length is 0 then false else mentions[0].id_str is setting.TWITTER.OWNER_ID
    isRetweet = data.retweeted_status
    
    isBot = [screen_name, name, via].some (v)-> /bot/i.test(v)
    isBot = false if /tweetbot/i.test via
    isIgnore = [
      /Tweet Button/i
      /ツイ廃あらーと/i
      /ツイート数カウントくん/i
      /リプライ数チェッカ/i
      /twittbot/i
      /twirobo/i
      /EasyBotter/i
      /makebot/i
      /botbird/i
      /botmaker/i
      /autotweety/i
      /rekkacopy/i
      /ask\.fm/i
    ].some (v)-> v.test via

    return if isIgnore or isRetweet or isBot
    
    if isMention
      text = text.replace /@[^\s　]+[\s　]+/g, ''

      for command in @commands
        if command.regex.test text
          command.callback screen_name, text, (res)=>
            data =
              status: "@#{screen_name} #{res}"
              in_reply_to_status_id: reply_status_id
            @client.post 'statuses/update', data, (err)->
              throw error if err
          return

      @emitter screen_name, "list"
        .then (res)=>
          data =
            status: "@#{screen_name} #{res}"
            in_reply_to_status_id: reply_status_id
          @client.post 'statuses/update', data, (err)->
            throw err if err

      return

    if /抹茶/.test text
      data =
        status: "抹茶 #{new Date().getTime()}"
        #in_reply_to_status_id: reply_status_id
      @client.post 'statuses/update', data, (err)->
          throw err if err

