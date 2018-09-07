var should = require('should')
var fs = require('fs')
var zlib = require('zlib')
var stream = require('stream')

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

    it('reads tons of multibyte characters.', function(done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/bigUtf8.xml', { highWaterMark: 1024})
      var parser = new ParserFactory({resourcePath: '/items/item'})

      const dummyText = ('à'.repeat(120)+'+').repeat(110);
      var expectedData = [
                           { _: dummyText
                           } ]
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
        dataEventCount.should.equal(1)
        done()
      })
      xmlStream.pipe(parser)
    });

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

  describe('interested Nodes', function () {
    it('should properly parse a simple file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory()

      var expectedData =
        [
          { '$': { sub: 'TESTING SUB' }, _: 'one' },
          { '$': { sub: '2' }, _: 'two' },
          { '$': { id: '1', test: 'hello' },
            subitem: [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                     { '$': { sub: '2' }, _: 'two' } ]
          },
          { _: 'three' },
          { _: 'four' },
          { _: 'five' },
          { '$': { id: '2' },
            subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] }
        ]

      var actualData = []
      var dataEventCount = 0
      var expectedItems = [
                           { '$': { id: '1', test: 'hello' },
                             subitem:
                             [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                                  { '$': { sub: '2' }, _: 'two' } ] },
                              { '$': { id: '2' },
                                subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] } ]
      var actualItems = []
      var actualSubitems = []
      var expectedSubitems = [
        { '$': { sub: 'TESTING SUB' }, _: 'one' },
        { '$': { sub: '2' }, _: 'two' },
        { _: 'three' },
        { _: 'four' },
        { _: 'five' }
      ]

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('error', function (err) {
        should(err).not.be.ok()
        done(err)
      })

      parser.on('item', function (item) {
        actualItems.push(item)
      })

      parser.on('subitem', function (subitem) {
        actualSubitems.push(subitem)
      })

      parser.on('end', function () {
        // console.log('actualData=', JSON.stringify(actualData, null, 1))
        // console.log('dataEventCount=', dataEventCount)
        actualData.should.deepEqual(expectedData)
        actualItems.should.deepEqual(expectedItems)
        actualSubitems.should.deepEqual(expectedSubitems)
        actualSubitems.length.should.equal(5)
        actualItems.length.should.equal(2)
        dataEventCount.should.equal(7)
        done()
      })

      xmlStream.pipe(parser)
    })

    it('should properly parse a medium size file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/medium.xml')
      var parser = new ParserFactory()

      var dataEventCount = 0
      var itemEventCount = 0
      var subitemEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('item', function (item) {
        itemEventCount++
      })

      parser.on('subitem', function (subitem) {
        subitemEventCount++
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        // console.log('itemEventCount=', itemEventCount)
        // console.log('subitemEventCount=', subitemEventCount)
        dataEventCount.should.equal(31)
        itemEventCount.should.equal(10)
        subitemEventCount.should.equal(21)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a file containing many nodes.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/manyItems.xml')
      var parser = new ParserFactory()

      var dataEventCount = 0
      var itemEventCount = 0
      var subitemEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('item', function (item) {
        itemEventCount++
      })

      parser.on('subitem', function (subitem) {
        subitemEventCount++
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        // console.log('itemEventCount=', itemEventCount)
        // console.log('subitemEventCount=', subitemEventCount)
        itemEventCount.should.equal(296)
        subitemEventCount.should.equal(600)
        dataEventCount.should.equal(896)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a xml simple file in which nodes contain text values randomly.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/randomText.xml')
      var parser = new ParserFactory()
      var expectedData =
        [
          { '$': { sub: 'TESTING SUB' }, _: 'one' },
          { '$': { sub: '2' }, _: 'two' },
          { '$': { id: '1', test: 'hello' }, _: ' item  one  two',
            subitem: [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                     { '$': { sub: '2' }, _: 'two' } ]
          },
          { _: 'three' },
          { _: 'four' },
          { _: 'five' },
          { '$': { id: '2' }, '_': ' item  one two three  four',
            subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] }
        ]
      var expectedItems = [
                           { '$': { id: '1', test: 'hello' }, _: ' item  one  two',
                             subitem:
                             [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                                  { '$': { sub: '2' }, _: 'two' } ] },
                              { '$': { id: '2' }, '_': ' item  one two three  four',
                                subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] } ]
      var actualItems = []
      var actualSubitems = []
      var expectedSubitems = [
        { '$': { sub: 'TESTING SUB' }, _: 'one' },
        { '$': { sub: '2' }, _: 'two' },
        { _: 'three' },
        { _: 'four' },
        { _: 'five' }
      ]
      var actualData = []
      var dataEventCount = 0
      var itemEventCount = 0
      var subitemEventCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('item', function (item) {
        itemEventCount++
        actualItems.push(item)
      })

      parser.on('subitem', function (subitem) {
        subitemEventCount++
        actualSubitems.push(subitem)
      })

      parser.on('end', function () {
        // console.log('actualData=', JSON.stringify(actualData, null, 1))
        // console.log('dataEventCount=', dataEventCount)
        // console.log('itemEventCount=', itemEventCount)
        // console.log('subitemEventCount=', subitemEventCount)
        actualData.should.deepEqual(expectedData)
        actualItems.should.deepEqual(expectedItems)
        actualSubitems.should.deepEqual(expectedSubitems)
        dataEventCount.should.equal(7)
        itemEventCount.should.equal(2)
        subitemEventCount.should.equal(5)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a huge file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/hugeFile.xml')
      var parser = new ParserFactory()

      var dataEventCount = 0
      var itemEventCount = 0
      var subitemEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('item', function (item) {
        itemEventCount++
      })

      parser.on('subitem', function (subitem) {
        subitemEventCount++
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        // console.log('itemEventCount=', itemEventCount)
        // console.log('subitemEventCount=', subitemEventCount)
        dataEventCount.should.equal(6272)
        itemEventCount.should.equal(2072)
        subitemEventCount.should.equal(4200)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse a simple file and return when root element when listening on it.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory()
      var expectedData =
        [{ 'item': [{ '$': { 'id': '1', 'test': 'hello' },
                      'subitem': [{ '$': { 'sub': 'TESTING SUB' }, '_': 'one' },
                                  { '$': { 'sub': '2' }, '_': 'two' }]
                    },
                    { '$': { 'id': '2' }, 'subitem': [{ '_': 'three' }, { '_': 'four' },
                                                      { '_': 'five' }]
                    }]
        }]

      var actualData = []
      var dataEventCount = 0
      var itemsEventCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('error', function (err) {
        should(err).not.be.ok()
        done(err)
      })

      parser.on('items', function (item) {
        itemsEventCount++
      })

      parser.on('end', function () {
        // console.log('actualData=', JSON.stringify(actualData, null, 1))
        // console.log('dataEventCount=', dataEventCount)
        // console.log('itemEventCount=', itemsEventCount)
        actualData.should.deepEqual(expectedData)
        itemsEventCount.should.equal(1)
        dataEventCount.should.equal(1)
        done()
      })
      xmlStream.pipe(parser)
    })
  })

  describe.skip('performance testing', function () {
    it('should properly parse more than 500 MB of file.', function (done) {
      var parser = new ParserFactory({resourcePath: '/items/item'})
      // var wsStream = fs.createWriteStream('./test/TestFiles/MB_and_GB_size_files/MBFile.xml')
      // var rsStream = fs.createReadStream('./test/TestFiles/MB_and_GB_size_files/MBFile.xml')
      var dataEventCount = 0
      // var maxRSSMemoryTaken = 0
      // var rss
      var startTime = Date.now()
      var xmlStream = new stream.Readable()
      xmlStream._read = function noop () {}
      var dataChunk
      this.timeout(900000)
      var firstChunk = fs.readFileSync('./test/TestFiles/MB_and_GB_size_files/firstChunk.xml')
      xmlStream.push(firstChunk)
      for (var i = 0; i < 2200; i++) {
        dataChunk = fs.readFileSync('./test/TestFiles/MB_and_GB_size_files/repetitiveChunk.xml')
        xmlStream.push(dataChunk)
      }

      var endingChunk = fs.readFileSync('./test/TestFiles/MB_and_GB_size_files/endingChunk.xml')
      xmlStream.push(endingChunk)
      xmlStream.push(null)
      parser.on('data', function (data) {
        // rss = process.memoryUsage().rss
        // if (rss > maxRSSMemoryTaken) maxRSSMemoryTaken = rss
        dataEventCount++
      })

      parser.on('error', function (err) {
        should(err).not.be.ok()
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        // console.log('RSS memory=', rss)
        var TimeTaken = Date.now() - startTime
        // console.log('time taken=', TimeTaken)
        TimeTaken.should.be.belowOrEqual(300000)
        dataEventCount.should.equal(4558400)
        done()
      })
      xmlStream.pipe(parser)
    })

    it('should properly parse more than 1 GB of file.', function (done) {
      var parser = new ParserFactory({resourcePath: '/items/item'})
      // var wsStream = fs.createWriteStream('./test/TestFiles/MB_and_GB_size_files/MBFile.xml')
      // var rsStream = fs.createReadStream('./test/TestFiles/MB_and_GB_size_files/MBFile.xml')
      var dataEventCount = 0
      // var maxRSSMemoryTaken = 0
      // var rss
      var startTime = Date.now()
      var xmlStream = new stream.Readable()
      xmlStream._read = function noop () {}
      var dataChunk
      this.timeout(900000)
      var firstChunk = fs.readFileSync('./test/TestFiles/MB_and_GB_size_files/firstChunk.xml')
      xmlStream.push(firstChunk)
      for (var i = 0; i < 4400; i++) {
        dataChunk = fs.readFileSync('./test/TestFiles/MB_and_GB_size_files/repetitiveChunk.xml')
        xmlStream.push(dataChunk)
      }

      var endingChunk = fs.readFileSync('./test/TestFiles/MB_and_GB_size_files/endingChunk.xml')
      xmlStream.push(endingChunk)
      xmlStream.push(null)
      parser.on('data', function (data) {
        // rss = process.memoryUsage().rss
        // if (rss > maxRSSMemoryTaken) maxRSSMemoryTaken = rss
        dataEventCount++
      })

      parser.on('error', function (err) {
        should(err).not.be.ok()
        done(err)
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        // console.log('RSS memory=', rss)
        var TimeTaken = Date.now() - startTime
        // console.log('time taken=', TimeTaken)
        TimeTaken.should.be.belowOrEqual(700000)
        dataEventCount.should.equal(9116800)
        done()
      })
      xmlStream.pipe(parser)
    })
  })

  describe('nodes with same names', function () {
    it('should properly parse a simple file containing nodes with same names.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/nodesWithSameNames.xml')
      var parser = new ParserFactory()

      var actualData = []
      var actualItems = []
      var dataEventCount = 0

      parser.on('data', function (data) {
        actualData.push(data)
        dataEventCount++
      })

      parser.on('error', function (err) {
        should(err).not.be.ok()
        done(err)
      })

      parser.on('item', function (item) {
        actualItems.push(item)
      })

      parser.on('end', function () {
        actualItems.length.should.equal(18)
        dataEventCount.should.equal(18)
        done()
      })

      xmlStream.pipe(parser)
    })

    it('should properly parse a simple file containing nodes with same names and emit events on multiple nodes.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/nodesWithSameNames.xml')
      var parser = new ParserFactory()

      var dataEventCount = 0
      var itemEventCount = 0
      var subitemEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        should(err).not.be.ok()
        done(err)
      })

      parser.on('item', function (item) {
        itemEventCount++
      })

      parser.on('subitem', function (subitem) {
        subitemEventCount++
      })

      parser.on('end', function () {
        itemEventCount.should.equal(18)
        subitemEventCount.should.equal(13)
        dataEventCount.should.equal(31)
        done()
      })

      xmlStream.pipe(parser)
    })

    it.skip('should properly parse a medium size file with same names randomly.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/nodesWithSameNamesRandomly.xml')
      var parser = new ParserFactory()

      var dataEventCount = 0
      var itemEventCount = 0
      var subitemEventCount = 0

      parser.on('data', function (data) {
        dataEventCount++
      })

      parser.on('error', function (err) {
        done(err)
      })

      parser.on('item', function (item) {
        itemEventCount++
      })

      parser.on('subitem', function (subitem) {
        subitemEventCount++
      })

      parser.on('end', function () {
        // console.log('dataEventCount=', dataEventCount)
        // console.log('itemEventCount=', itemEventCount)
        // console.log('subitemEventCount=', subitemEventCount)
        dataEventCount.should.equal(32)
        itemEventCount.should.equal(19)
        subitemEventCount.should.equal(13)
        done()
      })
      xmlStream.pipe(parser)
    })
  })

  describe('Parse funtion should work properly', function () {
    it('should properly parse a simple file.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var expectedData = [
                           { '$': { id: '1', test: 'hello' },
                             subitem:
                             [ { '$': { sub: 'TESTING SUB' }, _: 'one' },
                                  { '$': { sub: '2' }, _: 'two' } ] },
                              { '$': { id: '2' },
                                subitem: [ { _: 'three' }, { _: 'four' }, { _: 'five' } ] } ]

      parser.parse(xml.toString(), function (err, data) {
        if (err) done(err)
        data.should.deepEqual(expectedData)
        done()
      })
    })

    it('should properly parse a medium size file.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/medium.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})

      parser.parse(xml, function (err, data) {
        if (err) done(err)
        data.length.should.equal(10)
        done()
      })
    })

    it('should properly parse a file containing many nodes.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/manyItems.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})

      parser.parse(xml, function (err, data) {
        if (err) done(err)
        data.length.should.equal(296)
        done()
      })
    })

    it('should properly parse a xml simple file in which nodes contain text values randomly.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/randomText.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      var expectedData = [ { '$': { 'id': '1', 'test': 'hello' }, '_': ' item  one  two',
                             'subitem': [ { '$': { 'sub': 'TESTING SUB' }, '_': 'one' },
                                          { '$': { 'sub': '2' }, '_': 'two' } ] },
                           { '$': { 'id': '2' }, '_': ' item  one two three  four',
                             'subitem': [ { '_': 'three' }, { '_': 'four' }, { '_': 'five' } ] }
                         ]

      parser.parse(xml, function (err, data) {
        if (err) done(err)
        data.should.deepEqual(expectedData)
        data.length.should.equal(2)
        done()
      })
    })

    it('should properly parse a huge file.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/hugeFile.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})
      // console.log(parser)
      parser.parse(xml, function (err, data) {
        if (err) done(err)
        data.length.should.equal(2072)
        done()
      })
    })

    it('should properly return error if the xml file is corrupted.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/corrupted.xml')
      var parser = new ParserFactory({resourcePath: '/items/item'})

      parser.parse(xml, function (err, data) {
        // console.log(err)
        err.message.should.equal('mismatched tag at line no: 11')
        should(data).not.be.ok()
        done()
      })
    })
  })

  describe('should respect explicitArray constructor option', function () {
    it('should properly parse a simple file with explicitArray set to false.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', explicitArray: false})
      var expectedData = [
                           { '$': { id: '1', test: 'hello' },
                             subitem: { '$': { sub: '2' }, _: 'two' } },
                              { '$': { id: '2' },
                                subitem: { _: 'five' } } ]

      parser.parse(xml.toString(), function (err, data) {
        if (err) done(err)
        // console.log('data=', JSON.stringify(data))
        data.should.deepEqual(expectedData)
        done()
      })
    })

    it('should properly parse a medium size file with explicitArray set to false.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/medium.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', explicitArray: false})
      var expectedData = [
         {
            "$":{
               "id":"1",
               "test":"hello"
            },
            "subitem":{
               "$":{
                  "sub":"2"
               },
               "_":"two"
            }
         },
         {
            "$":{
               "id":"2"
            },
            "subitem":{
               "_":"five"
            }
         },
         {
            "$":{
               "id":"3",
               "test":"hello"
            },
            "subitem":{
               "$":{
                  "sub":"2"
               },
               "_":"two"
            }
         },
         {
            "$":{
               "id":"4",
               "test":"hello"
            },
            "subitem":{
               "$":{
                  "sub":"2"
               },
               "_":"two"
            }
         },
         {
            "$":{
               "id":"5",
               "test":"hello"
            },
            "subitem":{
               "$":{
                  "sub":"2"
               },
               "_":"two"
            }
         },
         {
            "$":{
               "id":"6",
               "test":"hello"
            },
            "subitem":{
               "$":{
                  "sub":"2"
               },
               "_":"two"
            }
         },
         {
            "$":{
               "id":"7",
               "test":"hello"
            },
            "subitem":{
               "$":{
                  "sub":"2"
               },
               "_":"two"
            }
         },
         {
            "$":{
               "id":"8",
               "test":"hello"
            },
            "subitem":{
               "$":{
                  "sub":"2"
               },
               "_":"two"
            }
         },
         {
            "$":{
               "id":"9",
               "test":"hello"
            },
            "subitem":{
               "$":{
                  "sub":"2"
               },
               "_":"two"
            }
         },
         {
            "$":{
               "id":"10",
               "test":"hello"
            },
            "subitem":{
               "$":{
                  "sub":"2"
               },
               "_":"two"
            }
         }
      ]
      parser.parse(xml, function (err, data) {
        if (err) done(err)

        data.should.deepEqual(expectedData)
        data.length.should.equal(10)
        done()
      })
    })

    it('should properly parse a file containing many nodes when explicitArray set to false.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/manyItems.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', explicitArray: false})

      parser.parse(xml, function (err, data) {
        if (err) done(err)

        data.length.should.equal(296)
        done()
      })
    })

    it('should properly parse a xml simple file in which nodes contain text values randomly when explicitArray set to false.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/randomText.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', explicitArray: false})
      var expectedData = [ { '$': { 'id': '1', 'test': 'hello' }, '_': ' item  one  two',
                             'subitem': { '$': { 'sub': '2' }, '_': 'two' } },
                           { '$': { 'id': '2' }, '_': ' item  one two three  four',
                             'subitem': { '_': 'five' } }
                         ]

      parser.parse(xml, function (err, data) {
        if (err) done(err)

        data.should.deepEqual(expectedData)
        data.length.should.equal(2)
        done()
      })
    })

    it('should properly parse a huge file with explicitArray set to false.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/hugeFile.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', explicitArray: false})
      // console.log(parser)
      parser.parse(xml, function (err, data) {
        if (err) done(err)
        data.length.should.equal(2072)
        done()
      })
    })

    it('should properly return error if the xml file is corrupted.', function (done) {
      var xml = fs.readFileSync('./test/TestFiles/corrupted.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', explicitArray: false})

      parser.parse(xml, function (err, data) {
        // console.log(err)
        err.message.should.equal('mismatched tag at line no: 11')
        should(data).not.be.ok()
        done()
      })
    })

    it('should properly generate objects when special symbols are passed as attrs and text keys and explicitArray is false in the options.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory({resourcePath: '/items/item', attrsKey: '!', textKey: '%', explicitArray: false})
      var expectedData = [
                           { '!': { id: '1', test: 'hello' },
                             subitem: { '!': { sub: '2' }, '%': 'two' } },
                           { '!': { id: '2' },
                                subitem: { '%': 'five' } } ]
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
})
