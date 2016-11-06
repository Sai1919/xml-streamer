var expat = require('node-expat')
var _ = require('lodash')
var ParserState = require('./parserState')

function XmlParser (xmlStream, opts) {
  this.opts = opts || {}
  this.parserState = new ParserState()
  this.parser = new expat.Parser('UTF-8')
  var scope = this
  this.parser.pause = function () {
    xmlStream.pause()
    scope.parser.stop()
  }
  this.parser.restart = function () {
    scope.parser.resume()
    xmlStream.resume()
  }
  process.nextTick(function () {
    parse.call(scope, xmlStream)
  })
  return this.parser
}

function parse (xmlStream) {
  if (!this.opts.resourcePath) this.parser.emit('error', new Error('resourcePath missing'))
  var scope = this
  var parser = scope.parser
  var state = this.parserState
  var lastIndex
  var resourcePath = this.opts.resourcePath

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

  parser.on('end', function () {
    parser.emit('finish')
  })

  function processStartElement (name, attrs) {
    if (!name) return
    var obj = {}
    if (attrs && !_.isEmpty(attrs)) obj.$ = attrs
    var tempObj = state.object
    var path = getRelativePath(name)
    if (!path) {
      if (attrs && !_.isEmpty(attrs)) state.object.$ = attrs
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
    var index = resourcePath.lastIndexOf('/')
    var rpath = resourcePath.substring(0, index)

    if (rpath === state.currentPath) {
      if (scope.opts.emitEventsOnNodeName) parser.emit(name, state.object)
      parser.emit('data', state.object)
      state.object = {}
    }
  }

  function processText (text) {
    if (!text || !/\S/.test(text)) {
      return
    }
    var path = getRelativePath()
    var tempObj = state.object
    if (!path) {
      if (!state.object._) state.object._ = ''
      state.object._ = state.object._ + text
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
    if (!obj._) obj._ = ''
    obj._ = obj._ + text
  }

  function checkForResourcePath (name) {
    if (state.currentPath.indexOf(resourcePath) === 0) {
      state.isPathfound = true
    } else {
      state.isPathfound = false
    }
  }

  function getRelativePath () {
    var xpath = state.currentPath.substring(resourcePath.length)

    if (!xpath) return
    if (xpath[0] === '/') xpath = xpath.substring(1)
    var tokens = xpath.split('/')
    var jsonPath = tokens.join('.')
    return jsonPath
  }

  function validateResourcePath (name) {
    var temp
    var index

    state.isRootNode = false

    if (resourcePath[0] === '/') {
      temp = resourcePath.substring(1, resourcePath.length)
    } else {
      temp = resourcePath
    }
    index = temp.indexOf('/')
    temp = temp.substring(0, index)

    if (temp !== name) {
      xmlStream.end()
    }
  }
}

module.exports = XmlParser

