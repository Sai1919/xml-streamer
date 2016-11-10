var expat = require('node-expat')
var _ = require('lodash')
var util = require('util')
var stream = require('stream')

var ParserState = require('./parserState')
var defaults = {
  resourcePath: '',
  emitOnNodeName: false,
  attrsKey: '$',
  textKey: '_'
}
function XmlParser (opts) {
  this.opts = _.defaults(opts, defaults)
  this.parserState = new ParserState()
  this.parser = new expat.Parser('UTF-8')
  // var transformOpts = { readableObjectMode: true }
  stream.Transform.call(this)
  this._readableState.objectMode = true
  var scope = this
  process.nextTick(function () { scope.checkForInterestedNodeListeners() })
}
util.inherits(XmlParser, stream.Transform)

XmlParser.prototype.checkForInterestedNodeListeners = function () {
  var ignore = [ 'end', 'prefinish', 'data', 'error' ]
  var eventNames = Object.keys(this._events)

  for (var i = 0; i < eventNames.length; i++) {
    if (_.includes(ignore, eventNames[i], 0)) continue
    this.parserState.interestedNodes.push(eventNames[i])
  }
}

XmlParser.prototype._transform = function (chunk, encoding, callback) {
  if (encoding !== 'buffer') this.emit('error', new Error('unsupported encoding'))

  this.parse(chunk)
  callback()
}

XmlParser.prototype.parse = function (chunk) {
  var scope = this
  var parser = this.parser
  var state = this.parserState
  var lastIndex
  var resourcePath = this.opts.resourcePath
  var attrsKey = this.opts.attrsKey
  var textKey = this.opts.textKey
  var interestedNodes = state.interestedNodes

  if (state.isRootNode) registerEvents()

  if (typeof chunk === 'string') {
    if (!parser.parse('', true)) processError()
  } else {
    if (!parser.parse(chunk.toString())) processError()
  }

  function registerEvents () {
    parser.on('startElement', function (name, attrs) {
      if (state.isRootNode) validateResourcePath(name)
      state.currentPath = state.currentPath + '/' + name
      checkForResourcePath(name)
      if (state.isPathfound) processStartElement(name, attrs)
    })

    parser.on('endElement', function (name) {
      state.lastEndedNode = name
      lastIndex = state.currentPath.lastIndexOf('/' + name)
      state.currentPath = state.currentPath.substring(0, lastIndex)
      if (state.isPathfound) processEndElement(name)
      checkForResourcePath(name)
    })

    parser.on('text', function (text) {
      if (state.isPathfound) processText(text)
    })

    parser.on('error', function (err) {
      processError(err)
    })

    parser.on('end', function () {
      scope.emit('end')
    })
  }

  function processError (err) {
    var error = ''

    if (err) {
      error = err
    } else {
      error = parser.getError()
    }
    scope.emit('error', new Error(error + ' at line no: ' + parser.getCurrentLineNumber()))
  }

  function processStartElement (name, attrs) {
    if (!name) return

    var obj = {}
    if (attrs && !_.isEmpty(attrs)) obj[attrsKey] = attrs
    var tempObj = state.object
    var path = getRelativePath(name)
    if (!path) {
      if (attrs && !_.isEmpty(attrs)) state.object[attrsKey] = attrs
      return
    }
    var tokens = path.split('.')

    for (var i = 0; i < tokens.length; i++) {
      if (tempObj[tokens[i]]) {
        tempObj = tempObj[tokens[i]]
      } else {
        tempObj[tokens[i]] = []
        tempObj = tempObj[tokens[i]]
      }
      if (Array.isArray(tempObj) && i !== tokens.length - 1) tempObj = tempObj[tempObj.length - 1]
    }
    tempObj.push(obj)
  }

  function processEndElement (name) {
    if (resourcePath) {
      var index = resourcePath.lastIndexOf('/')
      var rpath = resourcePath.substring(0, index)

      if (rpath === state.currentPath) {
        if (scope.opts.emitOnNodeName) scope.emit(name, state.object)
        scope.push(state.object)
        state.object = {}
      }
    } else {
      if (_.includes(interestedNodes, name, 0)) {
        emitInterestedNode(name)
        if (state.firstFoundNode === name) {
          state.object = {}
          state.firstFoundNode = ''
          state.isPathfound = false
        }
      }
    }
  }

  function emitInterestedNode (name) {
    var index
    var xpath
    var pathTokens

    xpath = state.currentPath.substring(1)
    pathTokens = xpath.split('/')
    pathTokens.push(name)
    index = pathTokens.indexOf(state.firstFoundNode)
    pathTokens = _.drop(pathTokens, index + 1)
    var tempObj = state.object
    for (var i = 0; i < pathTokens.length; i++) {
      tempObj = tempObj[pathTokens[i]]
    }
    if (Array.isArray(tempObj)) tempObj = tempObj[tempObj.length - 1]
    scope.emit(name, tempObj)
    scope.push(tempObj)
  }

  function processText (text) {
    if (!text || !/\S/.test(text)) {
      return
    }
    var path = getRelativePath()
    var tempObj = state.object
    if (!path) {
      if (!state.object[textKey]) state.object[textKey] = ''
      state.object[textKey] = state.object[textKey] + text
      return
    }
    var tokens = path.split('.')
    for (var i = 0; i < tokens.length; i++) {
      if (tempObj[tokens[i]]) {
        tempObj = tempObj[tokens[i]]
      } else {
        tempObj[tokens[i]] = []
        tempObj = tempObj[tokens[i]]
      }
      if (Array.isArray(tempObj) && i !== tokens.length - 1) tempObj = tempObj[tempObj.length - 1]
    }
    var obj = tempObj[tempObj.length - 1]
    if (!obj[textKey]) obj[textKey] = ''
    obj[textKey] = obj[textKey] + text
  }

  function checkForResourcePath (name) {
    if (resourcePath) {
      if (state.currentPath.indexOf(resourcePath) === 0) {
        state.isPathfound = true
      } else {
        state.isPathfound = false
      }
    } else {
      if (_.includes(interestedNodes, name, 0)) {
        state.isPathfound = true
        if (!state.firstFoundNode) {
          state.firstFoundNode = name
        }
      }
    }
  }

  function getRelativePath () {
    var tokens
    var jsonPath
    var index

    if (resourcePath) {
      var xpath = state.currentPath.substring(resourcePath.length)

      if (!xpath) return
      if (xpath[0] === '/') xpath = xpath.substring(1)
      tokens = xpath.split('/')
      jsonPath = tokens.join('.')
    } else {
      xpath = state.currentPath.substring(1)
      tokens = xpath.split('/')
      index = tokens.indexOf(state.firstFoundNode)
      tokens = _.drop(tokens, index + 1)
      jsonPath = tokens.join('.')
    }
    return jsonPath
  }

  function validateResourcePath (name) {
    var temp
    var index

    state.isRootNode = false

    if (resourcePath) {
      if (resourcePath[0] === '/') {
        temp = resourcePath.substring(1, resourcePath.length)
      } else {
        temp = resourcePath
      }
      index = temp.indexOf('/')
      if (index !== -1) temp = temp.substring(0, index)
      if (temp !== name) {
        scope.end()
      }
    }
  }
}

XmlParser.prototype._flush = function (callback) {
  this.parse('')
  callback()
}

module.exports = XmlParser

