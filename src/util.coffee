### utility ###

module.exports.rand = rand = (n)->
  Math.floor Math.random() * n

module.exports.randf = (n)->
  Math.random * n

module.exports.randArray = (arr)->
  arr[rand arr.length]

module.exports.zeroFill = (num, n)->
  ("0" + num).slice -n