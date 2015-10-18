setting = require '../setting'
mongoose = require 'mongoose'

module.exports = class DB
  constructor: ->
    shareSchema = new mongoose.Schema
      user: String
      message: String
      num: Number

    muteSchema = new mongoose.Schema
      user: String

    @db = mongoose.connect "mongodb://#{setting.DB.HOST}:#{setting.DB.PORT}/#{setting.DB.NAME}"

    @shareModel = mongoose.model 'Share', shareSchema
    @muteModel = mongoose.model 'Mute', muteSchema

    @mutedCache = []

    @muteModel.find {}, (err, docs)=> 
      return if err
      for d in docs
        @mutedCache.push d.user

  addMute: (user)->  
    new Promise (resolve, reject)=>
      @mutedCache.push user
      m = new @muteModel()
      m.user = user
      m.save (err)->
        if err then reject(err) else resolve()

  removeMute: (user)->
    new Promise (resolve, reject)=>
      index = @mutedCache.indexOf user
      @mutedCache.splice index, 1 unless index < 0
      @muteModel.findOneAndRemove {user: user}, (err)->
        if err then reject(err) else resolve()

  register: (user, message)->
    new Promise (resolve, reject)=>
      @shareModel.findOne({}).sort('-num').exec (err, doc)=>
        return reject(err) if err
        s = new @shareModel()
        s.user = user
        s.message = message
        s.num = if doc? then doc.num + 1 else 0
        s.save (err)->
          if err then reject(err) else resolve()

  find: ->
    new Promise (resolve, reject)=>
      @shareModel.find {}, (err, docs)->
        if err then reject(err) else resolve(docs)

  remove: (num)->
    new Promise (resolve, reject)=>
      @shareModel.findOneAndRemove {num: num}, (err)->
        if err then reject(err) else resolve()
