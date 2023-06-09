const { StringDecoder } = require('string_decoder')
const expat = require('node-expat')
const _ = require('lodash')
const util = require('util')
const stream = require('stream')

const ParserState = require('./parserState')
const defaults = {
  resourcePath: '',
  resourcePathCaseInsensitive: false,
  emitOnNodeName: false,
  attrsKey: '$',
  textKey: '_',
  explicitArray: true,
  verbatimText: false
}

function XmlParser (opts) {
  this.opts = _.defaults(opts, defaults)
  this.parserState = new ParserState()
  this.parser = new expat.Parser('UTF-8')
  stream.Transform.call(this)
  this._readableState.objectMode = true
  this.stringDecoder = new StringDecoder('utf8')
}
util.inherits(XmlParser, stream.Transform)

XmlParser.prototype.checkForInterestedNodeListeners = function () {
  const ignore = ['end', 'prefinish', 'data', 'error']
  const eventNames = Object.keys(this._events)

  for (let i = 0; i < eventNames.length; i++) {
    if (_.includes(ignore, eventNames[i], 0)) continue
    this.parserState.interestedNodes.push(eventNames[i])
  }
}

XmlParser.prototype._transform = function (chunk, encoding, callback) {
  if (encoding !== 'buffer') this.emit('error', new Error('unsupported encoding'))

  this.processChunk(chunk)
  callback()
}

XmlParser.prototype.processChunk = function (chunk) {
  const parser = this.parser
  const state = this.parserState
  let toWrite

  if (state.isRootNode) {
    this.checkForInterestedNodeListeners()
    registerEvents.call(this)
  }

  if (typeof chunk === 'string') {
    toWrite = this.stringDecoder.end()
    if (!parser.parse(toWrite, true)) processError.call(this)
  } else {
    toWrite = this.stringDecoder.write(chunk)
    if (toWrite.length && !parser.parse(toWrite)) processError.call(this)
  }
}

XmlParser.prototype.parse = function (chunk, cb) {
  const parser = this.parser
  const state = this.parserState
  let error

  if (state.isRootNode) {
    this.checkForInterestedNodeListeners()
    registerEvents.call(this)
  }

  if (chunk instanceof Buffer) chunk = chunk.toString()

  this.on('error', function (err) {
    error = err
  })

  const toWrite = this.stringDecoder.write(chunk)
  if (toWrite.length && !parser.parse(toWrite)) {
    error = processError.call(this)
  }

  if (error) return cb(error)

  return cb(null, readBuffer(this._readableState.buffer))
}

function registerEvents () {
  const scope = this
  const parser = this.parser
  const state = this.parserState
  let lastIndex
  const resourcePath = this.opts.resourcePathCaseInsensitive ? (this.opts.resourcePath && this.opts.resourcePath.toLowerCase()) : this.opts.resourcePath
  const resourcePathCaseInsensitive = this.opts.resourcePathCaseInsensitive
  const attrsKey = this.opts.attrsKey
  const textKey = this.opts.textKey
  const interestedNodes = state.interestedNodes
  const explicitArray = this.opts.explicitArray
  const verbatimText = this.opts.verbatimText

  parser.on('startElement', function (name, attrs) {
    if (state.isRootNode) state.isRootNode = false
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
    processError.call(this, err)
  })

  function processStartElement (name, attrs) {
    if (!name) return

    const obj = {}
    if (attrs && !_.isEmpty(attrs)) obj[attrsKey] = attrs
    let tempObj = state.object
    const path = getRelativePath(name)
    if (!path) {
      if (attrs && !_.isEmpty(attrs)) state.object[attrsKey] = attrs
      return
    }
    const tokens = path.split('.')

    for (let i = 0; i < tokens.length; i++) {
      if (tempObj[tokens[i]] && !(explicitArray === false && i === tokens.length - 1)) {
        tempObj = tempObj[tokens[i]]
      } else {
        // if explicitArray is true then create each node as array
        // irrespective of how many nodes are there with same name.
        tempObj[tokens[i]] = explicitArray ? [] : obj
        tempObj = tempObj[tokens[i]]
      }
      if (Array.isArray(tempObj) && i !== tokens.length - 1) tempObj = tempObj[tempObj.length - 1]
    }

    if (Array.isArray(tempObj)) {
      tempObj.push(obj)
    }
  }

  function processEndElement (name) {
    if (resourcePath) {
      const index = resourcePath.lastIndexOf('/')
      const rpath = resourcePath.substring(0, index)

      const _currentPath = resourcePathCaseInsensitive ? state.currentPath.toLowerCase() : state.currentPath

      if (rpath === _currentPath) {
        scope.push(state.object)
        if (scope.opts.emitOnNodeName) scope.emit(name, state.object)
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
    const xpath = state.currentPath.substring(1)
    let pathTokens = xpath.split('/')
    pathTokens.push(name)
    const index = pathTokens.indexOf(state.firstFoundNode)
    pathTokens = _.drop(pathTokens, index + 1)
    let tempObj = state.object
    for (let i = 0; i < pathTokens.length; i++) {
      tempObj = tempObj[pathTokens[i]]
    }
    if (Array.isArray(tempObj)) tempObj = tempObj[tempObj.length - 1]
    scope.emit(name, tempObj)
    scope.push(tempObj)
  }

  function processText (text) {
    if ((!text) || ((!verbatimText) && !/\S/.test(text))) {
      return
    }
    const path = getRelativePath()
    let tempObj = state.object
    if (!path) {
      if (!state.object[textKey]) state.object[textKey] = ''
      state.object[textKey] = state.object[textKey] + text
      return
    }
    const tokens = path.split('.')
    for (let i = 0; i < tokens.length; i++) {
      if (tempObj[tokens[i]]) {
        tempObj = tempObj[tokens[i]]
      } else {
        tempObj[tokens[i]] = explicitArray ? [] : {}
        tempObj = tempObj[tokens[i]]
      }
      if (Array.isArray(tempObj) && i !== tokens.length - 1) tempObj = tempObj[tempObj.length - 1]
    }

    if (Array.isArray(tempObj)) {
      const obj = tempObj[tempObj.length - 1]
      if (!obj[textKey]) obj[textKey] = ''
      obj[textKey] = obj[textKey] + text
    } else {
      if (!tempObj[textKey]) tempObj[textKey] = ''
      tempObj[textKey] = tempObj[textKey] + text
    }
  }

  function checkForResourcePath (name) {
    if (resourcePath) {
      let _currentPath = resourcePathCaseInsensitive ? state.currentPath.toLowerCase() : state.currentPath
      state.isPathfound = _currentPath.indexOf(resourcePath) === 0
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
    let tokens
    let jsonPath
    let index

    if (resourcePath) {
      let xpath = state.currentPath.substring(resourcePath.length)

      if (!xpath) return
      if (xpath[0] === '/') xpath = xpath.substring(1)
      tokens = xpath.split('/')
      jsonPath = tokens.join('.')
    } else {
      const xpath = state.currentPath.substring(1)
      tokens = xpath.split('/')
      index = tokens.indexOf(state.firstFoundNode)
      tokens = _.drop(tokens, index + 1)
      jsonPath = tokens.join('.')
    }
    return jsonPath
  }
}

function processError (err) {
  const parser = this.parser
  let error = ''

  if (err) {
    error = err
  } else {
    error = parser.getError()
  }
  error = new Error(error + ' at line no: ' + parser.getCurrentLineNumber())
  this.emit('error', error)
  return error
}

function readBuffer (buffer) {
  if (!buffer) return undefined

  let head = buffer.head
  const data = []

  while (head) {
    data.push(head.data)
    head = head.next
  }
  return data
}

XmlParser.prototype._flush = function (callback) {
  this.processChunk('')
  callback()
}

module.exports = XmlParser
