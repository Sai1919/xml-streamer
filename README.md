# xml-streamer

[![Build Status](https://travis-ci.org/Sai1919/xml-streamer.svg?branch=master)](https://travis-ci.org/Sai1919/xml-streamer)
## Motivation

You use [Node.js](https://nodejs.org) for speed? You process XML streams? Then you want the fastest XML to JS parser: `xml-streamer`, based on [node-expat](https://github.com/astro/node-expat)

## Install

```
npm install xml-streamer
```

## Basic Usage

`xml-streamer can be used in three
 ways`

```javascript

// 1. By listening for interested nodes.

(function () {
  "use strict";

  var Parser = require('xml-streamer')
  
  var opts = {} // see `Available Constructor Options` section below.

  var parser = new Parser(opts)
  
  parser.on('item', function (item) {
    // consume the item object here
  })
  
  parser.on('end', function () {
    // parsing ended no more data events will be raised
  })

  parser.on('error', function (error) {
    // error occurred
    // NOTE: when error event emitted no end event will be emitted
    console.error(error)
  })

  xmlStream.pipe(parser) // pipe your input xmlStream to parser.
  // readable
  parser.on('readable', function () {
      // if you don't want to consume "data" on "data" events you can wait for readable event and consume data by calling parser.read() 
  })
}())

// 2. By passing a resource path.

(function () {
  "use strict";

  var Parser = require('xml-streamer')
  var opts = {resourcePath: '/items/item'}
  
  var parser = new Parser(opts)
  
  parser.on('data', function (data) {
    // consume the data object here
  })
  
  parser.on('end', function () {
    // parsing ended no more data events will be raised
  })

  parser.on('error', function (error) {
    // error occurred
    // NOTE: when error event emitted no end event will be emitted
    console.error(error)
  })

  xmlStream.pipe(parser) // pipe your input xmlStream to parser.
  // readable
  parser.on('readable', function () {
      // if you don't want to consume "data" on "data" events you can wait for readable event and consume data by calling parser.read() 
  })
}())

// 3. By passing the resourcePath as shown in 2 method and reading data by calling `read` method instead listening for data events.

(function () {
  "use strict";

  var Parser = require('xml-streamer')
  
  var opts = {resourcePath: '/items/item'}

  var parser = new Parser(opts)
  
  parser.on('end', function () {
    // parsing ended no more data events will be raised
  })

  parser.on('error', function (error) {
    // error occurred
    // NOTE: when error event emitted no end event will be emitted
    console.error(error)
  })

  xmlStream.pipe(parser) // pipe your input xmlStream to parser.
  // readable
  parser.on('readable', function () {
      // if you don't want to consume "data" on "data" events you can wait for readable event and consume data by calling parser.read() 
  })
}())

```

## API

* `#on('readable' function () {})`
* `#on('end' function () {})` `Note: No end event will be emmited when error is emitted`
* `#on('error' function (err) {})` 
* `#on('nodeName' function (err) {})` //if you are interested to listen on the "nodeName" instead of "data"
* `#stop()` pauses
* `#resume()` resumes
* `#read()` returns object if stream is readable

## Available Constructor Options

* `resourcePath`: `Type: String` Optional field. Used to extract the XML nodes that you are interested in. 

            // Ex: let the XML be
                ```xml
                    <?xml version="1.0" encoding="utf-8"?>
                    <items>
                        <item id="1" test= 'hello'>
                            <subitem sub= "TESTING SUB">one</subitem>
                            <subitem sub= "2">two</subitem>
                        </item>
                        <item id="2">
                            <subitem>three</subitem>
                            <subitem>four</subitem>
                            <subitem>five</subitem>
                        </item>
                    </items>
                ```
           if you are interested in `item` nodes then resourcePath would be: `/items/item`
           if you are interested in `subitem` nodes then resourcePath would be: `/items/item/subitem`
           if you are interested in `items` nodes then resourcePath would be: `/items`


* `emitOnNodeName`: `Type: Boolean` Optional field. Set this to true if you want to listen on node names instead of data event. `default: false`
            
            // Ex: consider the above XML snippet
             ```javascript
                if you are interested in `item` nodes. You can listen for `data` event by default to get those nodes in JS object form
                        
                          parser.on('data', function (data) {
                             // item nodes as javascipt objects
                          })

                or else you can set `emitOnNodeName: true` and listen on node names like

                          parser.on('item', function (data) {
                             // item nodes as javascipt objects
                          })
             ```

                `NOTE:` when you set `emitOnNodeName:true` "data" events are emitted normally. So make sure you don't listen for both the events.


* `attrsKey`: `Type: String` Optional field. pass the value with which you want to reference attributes of a node in its object form. `default: '$'`
                  
* `textKey`: `Type: String` Optional field. pass the value with which you want to reference node value in its object form. `default: '_'`
                   
                   // In the above XML snippet `subitem` node will look like this after converted to javascript object
                  ```javascript
                          {
                              "$": {
                                  "sub": "TESTING SUB"
                              }
                              "_": "one"
                          }
                          // if you want like this
                          {
                              "attrs": {
                                  "sub": "TESTING SUB"
                              },
                              "text": "one"
                          }
                  ```
                     // Then set `attrsKey= "attrs"` and `textKey= "text"`


## upcoming features

1. `handling of compressed streams`
2. `handling of different encodings`


## Namespace handling

A word about special parsing of *xmlns:* Note that "resourcePath" in the options is not an XPATH.
So the value given to the resourcePath is treated as simple value and no expression evaluations are done.

## Benchmark

`xml-streamer` internally uses `node-expat`

`npm run benchmark`

| module                                                                                | ops/sec | native | XML compliant | stream         |
|---------------------------------------------------------------------------------------|--------:|:------:|:-------------:|:--------------:|
| [sax-js](https://github.com/isaacs/sax-js)                                            |  99,412 | ☐      | ☑             | ☑              |
| [node-xml](https://github.com/dylang/node-xml)                                        | 130,631 | ☐      | ☑             | ☑              |
| [libxmljs](https://github.com/polotek/libxmljs)                                       | 276,136 | ☑      | ☑             | ☐              |
| **node-expat**                                                                        | 322,769 | ☑      | ☑             | ☑              |

Higher is better.

## Testing

```
npm install -g standard
npm test
```