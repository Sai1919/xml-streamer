
function ParserState () {
  this.currentPath = ''
  this.lastEndedNode = ''
  this.isPathfound = false
  this.object = {}
  this.paused = false
  this.isRootNode = true
  this.firstFoundNode = ''
  this.interestedNodes = []
}

module.exports = ParserState
