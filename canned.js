function Canned(dir) {
}

Canned.prototype.responder = function(req, res) {
}

var canned = function(dir) {
  can = new Canned(dir)
  return can.responder
}

module.exports = canned

