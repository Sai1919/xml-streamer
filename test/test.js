var should = require('should')
var fs = require('fs')

var ParserFactory = require('../parser')

describe('Tests', function () {
  describe('simple behaviour testing', function () {
    it('should properly parse a simple file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/item.xml')
      var parser = new ParserFactory(xmlStream, {resourcePath: '/items/item'})
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

    it('should properly parse a medium size file.', function (done) {
      var xmlStream = fs.createReadStream('./test/TestFiles/medium.xml')
      var parser = new ParserFactory(xmlStream, {resourcePath: '/items/item'})

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
      var parser = new ParserFactory(xmlStream, {resourcePath: '/items/item'})

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
      var parser = new ParserFactory(xmlStream, {resourcePath: '/items/item'})
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
  })
})
