
function ParserState () {
  this.currentPath = ''
  this.lastEndedNode = ''
  this.isPathfound = false
  this.object = {}
  this.buffer = []
  this.paused = false
  this.isRootNode = true
}

module.exports = ParserState
