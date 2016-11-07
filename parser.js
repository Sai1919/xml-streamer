var expat = require('node-expat')
var _ = require('lodash')
var util = require('util')
var stream = require('stream')

var ParserState = require('./parserState')

function XmlParser (opts) {
  this.opts = opts || {}
  this.parserState = new ParserState()
  this.parser = new expat.Parser('UTF-8')
  var transformOpts = { readableObjectMode: true }
  stream.Transform.call(this, transformOpts)
}
util.inherits(XmlParser, stream.Transform)

XmlParser.prototype._transform = function (chunk, encoding, callback) {
  if (!this.opts.resourcePath) this.emit('error', new Error('resourcePath missing'))
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

  if (state.isRootNode) registerEvents()

  if (typeof chunk === 'string') {
    parser.parse('', true)
  } else {
    parser.parse(chunk.toString())
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
      scope.emit('error', new Error(err + 'at line no:' + parser.getCurrentLineNumber() + ' on column no:' + parser.getCurrentColumnNumber()))
    })

    parser.on('end', function () {
    })
  }

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
      if (scope.opts.emitEventsOnNodeName) scope.emit(name, state.object)
      scope.push(state.object)
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
      this.end()
    }
  }
}

XmlParser.prototype._flush = function (callback) {
  this.parse('')
  callback()
}

module.exports = XmlParser

