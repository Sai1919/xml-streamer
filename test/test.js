var should = require('should')
var fs = require('fs')
var zlib = require('zlib')

var ParserFactory = require('../parser')

describe('Tests', function () {
  describe('Basic behaviour', function () {
    it('should properly parse a simple file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var expectedData = [
                           { '$': { id: '1', test: 'hello' },
                             subitem:
                             [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                                  { '$': { sub: '2' }, _: 'two' } ] },
                              { '$': { id: '2' },
                                subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] } ]
      var actualData = []
      var dataEventCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('error', function (err) {
        should(err).not.be.ok()
        done(err)
      })

      parser.on('end', function () {
        // console.log('actualData=', actualData)
        // console.log('dataEventCount=', dataEventCount)
        actualData.should.deepEqual(expectedData)
        dataEventCount.should.equal(2)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a medium size file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/medium.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})

      var dataEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(10)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a file containing many nodes.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/manyItems.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})

      var dataEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(296)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a xml simple file in which nodes contain text values randomly.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/randomText.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var expectedData = [ { '$': { 'id': '1', 'test': 'hello' }, '_': ' item  one  two',
                             'subitem': [ { '$': { 'sub': 'TESTING SUB' }, '_': 'one' },
                                          { '$': { 'sub': '2' }, '_': 'two' } ] },
                           { '$': { 'id': '2' }, '_': ' item  one two three  four',
                             'subitem': [ { '_': 'three' }, { '_': 'four' }, { '_': 'five' } ] }
                         ]
      var actualData = []
      var dataEventCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('actualData=', JSON.stringify(actualData, null, 1))
        // console.log('dataEventCount=', dataEventCount)
        actualData.should.deepEqual(expectedData)
        dataEventCount.should.equal(2)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a file containing many nodes.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/manyItems.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      // console.log(parser)
      var dataEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(296)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a huge file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/hugeFile.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      // console.log(parser)
      var dataEventCount = 0
      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(2072)
        done()
      })
      xmlStream.pipe(parser)
    })
  })

  describe('pause and resume', function () {
    it('should properly parse a simple file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var expectedData = [
                           { '$': { id: '1', test: 'hello' },
                             subitem:
                             [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                                  { '$': { sub: '2' }, _: 'two' } ] },
                              { '$': { id: '2' },
                                subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] } ]
      var actualData = []
      var dataEventCount = 0
      var isSetTimeoutHappened = true
      this.timeout(4000)
      parser.on('data', function (data) {
        actualData.push(data)
        parser.pause()
        isSetTimeoutHappened.should.equal(true)
        setTimeout(function () {
          parser.resume()
          isSetTimeoutHappened = true
        }, 3000)
        dataEventCount++
        isSetTimeoutHappened = false
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('actualData=', actualData)
        // console.log('dataEventCount=', dataEventCount)
        actualData.should.deepEqual(expectedData)
        dataEventCount.should.equal(2)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should emit data events with 1sec interval between each using pause and resume.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/medium.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})

      var dataEventCount = 0
      var isSetTimeoutHappened = true
      this.timeout(20000)
      parser.on('data', function (data) {
        parser.pause()
        isSetTimeoutHappened.should.equal(true)
        setTimeout(function () {
          parser.resume()
          isSetTimeoutHappened = true
        }, 2000)
        dataEventCount++
        isSetTimeoutHappened = false
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(10)
        done()
      })
      xmlStream.pipe(parser)
    })
  })

  describe('should respect the options passed', function () {
    it('should properly generate objects with $ as key for attrs and _ as key for text value of node.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var expectedData = [
                           { '$': { id: '1', test: 'hello' },
                             subitem:
                             [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                                  { '$': { sub: '2' }, _: 'two' } ] },
                              { '$': { id: '2' },
                                subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] } ]
      var actualData = []
      var dataEventCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('actualData=', actualData)
        // console.log('dataEventCount=', dataEventCount)
        actualData.should.deepEqual(expectedData)
        dataEventCount.should.equal(2)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly generate objects with passed attrs and text keys in the options.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', attrsKey: 'attrs', textKey: 'text'})
      var expectedData = [
                           { 'attrs': { id: '1', test: 'hello' },
                             subitem:
                             [ { 'attrs': { sub: 'TESTING SUB' }, text: 'one' },
                                  { 'attrs': { sub: '2' }, text: 'two' } ] },
                              { 'attrs': { id: '2' },
                                subitem: [ { text: 'three' }, { text: 'four' }, { text: 'five' } ] } ]
      var actualData = []
      var dataEventCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('actualData=', JSON.stringify(actualData, null, 1))
        // console.log('dataEventCount=', dataEventCount)
        actualData.should.deepEqual(expectedData)
        dataEventCount.should.equal(2)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly generate objects when special symbols are passed as attrs and text keys in the options.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', attrsKey: '!', textKey: '%'})
      var expectedData = [
                           { '!': { id: '1', test: 'hello' },
                             subitem:
                             [ { '!': { sub: 'TESTING SUB' }, '%': 'one' },
                                  { '!': { sub: '2' }, '%': 'two' } ] },
                              { '!': { id: '2' },
                                subitem: [ { '%': 'three' }, { '%': 'four' }, { '%': 'five' } ] } ]
      var actualData = []
      var dataEventCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('actualData=', JSON.stringify(actualData, null, 1))
        // console.log('dataEventCount=', dataEventCount)
        actualData.should.deepEqual(expectedData)
        dataEventCount.should.equal(2)
        done()
      })
      xmlStream.pipe(parser)
    })
  })

  describe('should properly handle uncompressed files', function () {
    it('should properly parse a uncompressed xml file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/medium.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var gzip = zlib.createGzip()
      var gunzip = zlib.createGunzip()
      var dataEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(10)
        done()
      })
      xmlStream.pipe(gzip).pipe(gunzip).pipe(parser)
    })

    it('should properly parse uncompressed file and go fine with pause and resume.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/medium.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var gzip = zlib.createGzip()
      var gunzip = zlib.createGunzip()

      var dataEventCount = 0
      var isSetTimeoutHappened = true
      this.timeout(20000)
      parser.on('data', function (data) {
        parser.pause()
        isSetTimeoutHappened.should.equal(true)
        setTimeout(function () {
          parser.resume()
          isSetTimeoutHappened = true
        }, 2000)
        dataEventCount++
        isSetTimeoutHappened = false
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(10)
        done()
      })
      xmlStream.pipe(gzip).pipe(gunzip).pipe(parser)
    })
  })

  describe('read method', function () {
    it('should properly parse a simple file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var expectedData = [
                           { '$': { id: '1', test: 'hello' },
                             subitem:
                             [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                                  { '$': { sub: '2' }, _: 'two' } ] },
                              { '$': { id: '2' },
                                subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] } ]
      var actualData = []
      var obj
      var Timeout

      parser.on('readable', function () {
        Timeout = setInterval(function () {
          if ((obj = parser.read())) actualData.push(obj)
          obj = null
        }, 50)
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('actualData=', actualData)
        // console.log('dataEventCount=', dataEventCount)
        clearInterval(Timeout)
        actualData.should.deepEqual(expectedData)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a file containing many nodes.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/manyItems.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var objCount = 0
      var endEventOcurred = false

      parser.on('readable', function () {
        read()
      })

      function read () {
        while (parser.read()) objCount++
        if (!endEventOcurred) setTimeout(read, 50)
      }

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log(objCount)
        objCount.should.deepEqual(296)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a huge.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/hugeFile.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var objCount = 0
      var endEventOcurred = false

      parser.on('readable', function () {
        read()
      })

      function read () {
        while (parser.read()) objCount++
        if (!endEventOcurred) setTimeout(read, 50)
      }

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log(objCount)
        objCount.should.deepEqual(2072)
        done()
      })
      xmlStream.pipe(parser)
    })
  })

  describe('Error Handling', function () {
    it('should properly return error if the xml file is corrupted.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/corrupted.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var dataEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        // console.log(err)
        err.message.should.equal('mismatched tag at line no: 11')
        done()
      })

      xmlStream.pipe(parser)
    })

    it('should properly return error if the large xml file is corrupted.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/largeCorruptedFile.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var dataEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        // console.log(err)
        err.message.should.equal('mismatched tag at line no: 8346')
        done()
      })

      xmlStream.pipe(parser)
    })
  })

  describe('CData and comments in xml', function () {
    it('should properly parse a simple file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/CData-comments.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})

      var dataEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(296)
        done()
      })
      xmlStream.pipe(parser)
    })
  })

  describe('emitOnNodeName', function () {
    it('should properly emit events on node names.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', emitOnNodeName: true})
      var expectedData = [
                           { '$': { id: '1', test: 'hello' },
                             subitem:
                             [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                                  { '$': { sub: '2' }, _: 'two' } ] },
                              { '$': { id: '2' },
                                subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] } ]
      var actualData = []
      var itemData = []
      var dataEventCount = 0
      var itemCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('item', function (item) {
        itemData.push(item)
        itemCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('actualData=', actualData)
        // console.log('dataEventCount=', dataEventCount)
        actualData.should.deepEqual(expectedData)
        dataEventCount.should.equal(2)
        itemData.should.deepEqual(expectedData)
        itemCount.should.equal(2)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly emit events on node names while parsing a medium size file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/medium.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', emitOnNodeName: true})

      var dataEventCount = 0
      var itemCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('item', function (data) {
        itemCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(10)
        itemCount.should.equal(10)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a file containing many nodes.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/manyItems.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', emitOnNodeName: true})

      var dataEventCount = 0
      var itemCount = 0
      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('item', function (data) {
        itemCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(296)
        itemCount.should.equal(296)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a huge file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/hugeFile.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', emitOnNodeName: true})

      var dataEventCount = 0
      var itemCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('item', function (item) {
        itemCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(2072)
        itemCount.should.equal(2072)
        done()
      })
      xmlStream.pipe(parser)
    })
  })

  describe('wrong resourcePath', function () {
    it('should be able to detect the wrong resourcePath at root level.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/wrong/noNodes', emitOnNodeName: true})

      var actualData = []
      var itemData = []
      var dataEventCount = 0
      var itemCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('item', function (item) {
        itemData.push(item)
        itemCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('actualData=', actualData)
        // console.log('dataEventCount=', dataEventCount)
        actualData.length.should.equal(0)
        dataEventCount.should.equal(0)
        itemData.length.should.equal(0)
        itemCount.should.equal(0)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should be able to detect wrong resourcePath while parsing xml', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/manyItems.xml')
      var parser = new ParserFactory({resourcePath: '/wrong/noNodes', emitOnNodeName: true})

      var dataEventCount = 0
      var itemCount = 0
      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('item', function (data) {
        itemCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(0)
        itemCount.should.equal(0)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a huge file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/hugeFile.xml')
      var parser = new ParserFactory({resourcePath: '/wrong/path', emitOnNodeName: true})

      var dataEventCount = 0
      var itemCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('item', function (item) {
        itemCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        dataEventCount.should.equal(0)
        itemCount.should.equal(0)
        done()
      })
      xmlStream.pipe(parser)
    })
  })
})
