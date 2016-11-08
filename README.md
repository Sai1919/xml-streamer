[![Build Status](https://travis-ci.org/Sai1919/xml-streamer.svg?branch=master)](https://travis-ci.org/Sai1919/xml-streamer)
## Motivation

You use [Node.js](https://nodejs.org) for speed? You process XML streams? Then you want the fastest XML to JS parser: [xml-streamer]!

## Install

```
npm install xml-streamer
```

## Usage

```javascript
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
    // NOTE: when error emit emitted no end event will be emitted
    console.error(error)
  })

  xmlStream.pipe(parser) // pipe your input xmlStream to parser.

}())

```

## API

* `#on('readable' function () {})`
* `#on('end' function () {})`
* `#on('error' function (err) {})
* `#on('nodeName' function (err) {//if you are interested listen on the "nodeName" instead of "data"})
* `#stop()` pauses
* `#resume()` resumes

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