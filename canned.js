var url = require('url')
,   fs = require('fs')
,   util = require('util')

function Canned(dir){
  this.dir = process.cwd() + '/' + dir
}

Canned.prototype.responder = function(req, res){
  var pathname = url.parse(req.path).pathname.split('/')
  ,   dname = pathname.pop()
  ,   fname = '_' + dname
  ,   method = req.method.toLowerCase()
  ,   path = this.dir + pathname.join('/')

  fs.readdir(path, function(err, files){
    var pattern = fname + '\.' + method + '\.(.+)'
    ,   ext

    files.forEach(function(el){
      var m = el.match(new RegExp(pattern))

      if(m) {
       ext = m[1]
       return
      }
    })

    if(!ext) {
      res.statusCode = 400
    } else {
      res.setHeader('Content-Type', 'application/' + ext)
      res.statusCode = 200
    }
    res.end()
  })
}

var canned = function(dir){
  c = new Canned(dir)
  return c.responder.bind(c)
}

module.exports = canned

