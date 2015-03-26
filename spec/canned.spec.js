"use strict";
var querystring = require("querystring")
var canned = require('../canned')
var path = require('path')

describe('canned', function () {

  var can, req, res
  beforeEach(function () {
    can = canned('./spec/test_responses')
    req = { method: 'GET' }
    res = { setHeader: function () {}, end: function () {} }
  })

  describe('paths', function () {
    beforeEach(function () {
      var fullpath = path.resolve('./spec/test_responses')
      can = canned(fullpath)
    })

    it('resolve requests when passed an absolute path', function (done) {
      req.url = '/a'
      res.end = function () {
        expect(res.statusCode).toBe(200)
        done()
      }
      can(req, res)
    })
  })

  describe('error messages', function () {
    var writeLog, logCan
    beforeEach(function () {
      var logger = {
        write: function (msg) {
          if (writeLog) writeLog(msg)
        }
      }
      logCan = canned('./spec/test_responses', { logger: logger })
    })

    it('displays an error for unparsable json files', function (done) {
      var regex = new RegExp('.*Syntax.*')
      writeLog = function (message) {
        if (regex.test(message)) {
          expect(message).toBe("problem sanatizing content for _invalid_syntax.get.json SyntaxError: Unexpected token I")
          done()
        }
      }
      req.url = '/invalid_syntax'
      logCan(req, res)
    })
  })

  describe('status codes', function () {
    it('sets 404 for non resolveable request', function (done) {
      req.url = '/i_do_not_exist'
      res.end = function () {
        expect(res.statusCode).toBe(404)
        done()
      }
      can(req, res)
    })

    it('sets 200 for resolveable requests', function (done) {
      req.url = '/a'
      res.end = function () {
        expect(res.statusCode).toBe(200)
        done()
      }
      can(req, res)
    })

    it('sets 201 if specified in file', function (done) {
      req.url = '/201'
      res.end = function () {
        expect(res.statusCode).toBe(201)
        done()
      }
      can(req, res)
    })

    it('sets 204 for empty file', function (done) {
      req.url = '/empty'
      res.end = function () {
        expect(res.statusCode).toBe(204)
        done()
      }
      can(req, res)
    })

    it('sets specified status for empty file with headers set', function (done) {
      req.url = '/empty_with_headers'
      res.end = function () {
        expect(res.statusCode).toBe(420)
        done()
      }
      can(req, res)
    })
  })

  describe('content type', function () {
    it('sets text/plain for txt', function (done) {
      req.url = '/b'
      res.setHeader = function (name, value) {
        expect(value).toBe('text/plain')
        expect(name).toBe('Content-Type')
        done()
      }
      can(req, res)
    })

    it('sets text/html for errors', function (done) {
      req.url = '/i_do_not_exist'
      res.setHeader = function (name, value) {
        expect(value).toBe('text/html')
        expect(name).toBe('Content-Type')
        done()
      }
      can(req, res)
    })
    it('sets Content-type header if specified in file', function(done){
      req.url = '/vendor_type'
      res.setHeader = function(name, value){
        expect(value).toBe('application/vnd.custom+xml')
        expect(name).toBe('Content-Type')
        done()
      }
      can(req, res)
    })
  })

  describe('resolve file paths', function () {

    it('loads index for /', function (done) {
      req.url = '/'
      res.end = function (content) {
        expect(content).toContain('index.get.json')
        done()
      }
      can(req, res)
    });

    it('loads index for /d with d being a directory', function (done) {
      req.url = '/d'
      res.end = function (content) {
        expect(content).toContain('d/index.get.json')
        done()
      }
      can(req, res)
    });

    it('loads index for /d/e with both being directories', function (done) {
      req.url = '/d/e'
      res.end = function (content) {
        expect(content).toContain('d/e/index.get.html')
        done()
      }
      can(req, res);
    });

    it('loads any for /d/something', function (done) {
      req.url = '/d/i_am_an_id'
      res.end = function (content) {
        expect(content).toContain('d/any.get.json')
        done()
      }
      can(req, res)
    })

    it('looks for _file with query params', function (done) {
      req.url = '/a?name=Superman&age=30&idontneed=everyparaminfilename'
      res.end = function (content) {
        expect(content).toContain('Superman!')
        done()
      }
      can(req, res)
    })

    it('looks for index file with query params', function (done) {
      req.url = '/?name=Superman'
      res.end = function (content) {
        expect(content).toContain('Superman!')
        done()
      }
      can(req, res)
    })

    it('can tell different query param files a part', function (done) {
      req.url = '/a?name=Batman&age=30&idontneed=everyparaminfilename'
      res.end = function (content) {
        expect(content).toContain('Batman!')
        done()
      }
      can(req, res)
    })

    it('falls back to file without query params if one or more params dont match', function (done) {
      req.url = '/a?foo=bar'
      res.end = function (content) {
        expect(content).toContain('_a.get.json')
        done()
      }
      can(req, res)
    })

    it('works for nested folder being not present', function (done) {
      req.url = '/foo/bar/baz'
      res.end = function () {
        expect(res.statusCode).toBe(404)
        done()
      }
      can(req, res)
    })

    it('allows for multiple files to match via the .NUMBER extension and pick 1 by default', function (done) {
      req.url = '/multimatch'
      res.end = function (content) {
        var multimatch = JSON.parse(content).multimatch
        expect(multimatch).toBe(1)
        done()
      }
      can(req, res)
    })
  })

  describe('content modifier', function () {
    it('removes comments from json', function (done) {
      req.url = '/d/commented'
      res.end = function (content) {
        expect(content).toBe('{"no":"comments"}');
        done()
      }
      can(req, res)
    })

    it('works with http:// in json strings', function (done) {
      req.url = '/chartest'
      res.end = function (content) {
        expect(content).toBe('{"my_url":"http://www.mywebsite.com"}');
        done()
      }
      can(req, res)
    })
  })

  describe('CORS', function () {
    var can = canned('./spec/test_responses', { cors: true })
    it('accepts the options verb', function (done) {
      req.method = 'OPTIONS'
      req.url = '/'
      res.end = function (content) {
        // serves no content
        expect(content).toBe('')
        done()
      }
      can(req, res)
    })

    it('sets the headers', function (done) {
      req.url = '/'
      var expectedHeaders = {
        'Access-Control-Allow-Origin': "*",
        'Access-Control-Allow-Headers': "X-Requested-With",
        'Access-Control-Allow-Methods': "GET, POST, PUT, DELETE, OPTIONS"
      }
      res.setHeader = function (name, value) {
        if (expectedHeaders[name]) {
          expect(expectedHeaders[name]).toBe(value)
          delete expectedHeaders[name]
        }
        // all expected headers have been set!
        if (Object.keys(expectedHeaders).length === 0) done()
      }
      can(req, res)
    })

    it('adds custom headers', function (done) {
      var can2 = canned('./spec/test_responses', { cors: true, cors_headers: "Authorization" })
      req.url = '/'
      var expectedHeaders = {
        'Access-Control-Allow-Headers': "X-Requested-With, Authorization"
      }
      res.setHeader = function (name, value) {
        if (expectedHeaders[name]) {
          expect(expectedHeaders[name]).toBe(value)
          delete expectedHeaders[name]
        }
        // all expected headers have been set!
        if (Object.keys(expectedHeaders).length === 0) done()
      }
      can2(req, res)
    })
  })

  describe('variable GET responses', function () {
    it('should return the first JSON response body if no header match', function (done) {
      req.headers = {}
      req.url = '/multiple_responses'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response":"response for abc"}))
        done()
      }
      can(req, res)
    })

    it('should return the first text response body if no header match', function (done) {
      req.headers = {}
      req.url = '/multiple_responses_text'
      res.end = function (content) {
        expect(content).toEqual('response for abc')
        done()
      }
      can(req, res)
    })

    it('should return the first JSON response body on header match', function (done) {
      req.headers = {
        "authorization": 'abc'
      }
      req.url = '/multiple_responses'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response":"response for abc"}))
        done()
      }
      can(req, res)
    })

    it('should return the first text response body on header match', function (done) {
      req.headers = {
        "authorization": 'abc'
      }
      req.url = '/multiple_responses_text'
      res.end = function (content) {
        expect(content).toEqual('response for abc')
        done()
      }
      can(req, res)
    })

    it('should return the second response body on header match', function (done) {
      req.headers = {
        "authorization": '123'
      }
      req.url = '/multiple_responses'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response":"response for 123"}))
        done()
      }
      can(req, res)
    })

    it('should return the second response body on header match', function (done) {
      req.headers = {
        "authorization": '123'
      }
      req.url = '/multiple_responses_text'
      res.end = function (content) {
        expect(content).toEqual('response for 123')
        done()
      }
      can(req, res)
    })

    it('should be able to return html', function (done) {
      req.headers = {
        "authorization": 'html'
      }
      req.url = '/multiple_responses_text'
      res.end = function (content) {
        expect(content).toEqual('<h1>response for html</h1>')
        done()
      }
      can(req, res)
    })

    it('should return correct status code and the first JSON response body on header match', function (done) {
      req.headers = {
        "authorization": 'abc'
      }
      req.url = '/201_multiple_responses'
      res.end = function (content) {
        expect(res.statusCode).toBe(201)
        expect(content).toEqual(JSON.stringify({"response":"response for abc"}))
        done()
      }
      can(req, res)
    })
    it('should return correct status code and the second response body on header match', function (done) {
      req.headers = {
        "authorization": '123'
      }
      req.url = '/201_multiple_responses'
      res.end = function (content) {
        expect(res.statusCode).toBe(201)
        expect(content).toEqual(JSON.stringify({"response":"response for 123"}))
        done()
      }
      can(req, res)
    })
  })

  describe("variable GET responses based on params", function() {
    var req, data
    beforeEach(function() {
      req = { method: 'GET' }
    })

    it("should select the right response based on the GET request data", function (done) {
      req.url = "/multiple_get_responses?" + querystring.stringify({ foo: "bar" })
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for bar"}))
        done()
      }
      can(req, res)
    })

    it("should select the first response with no query string", function (done) {
      req.url = "/multiple_get_responses"
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for baz"}))
        done()
      }
      can(req, res)
    })
  })

  describe("Issues", function () {
    it("#49", function (done) {
      req.url = "/regexmatchbug?u=root&p=root&q=select+mean(value)+from+%22Coraid.1Controller.ZFS.VOps-3008.gauge.wlat%22+where+time+%3E++now()+-+86400000000u+and+time+%3C+now()+-+0u+group+by+time(240000000u)+fill(null)"
      res.end = function (content) {
        var response = JSON.parse(content)
        expect(response.itworks).toBeTruthy()
        done()
      }
      can(req, res)
    })
    it("#58", function(done) {
      req.url = "/multiple_get_responses?" + querystring.stringify({foo: "apostrophe"})
      res.end = function(content) {
        expect(content).toEqual(JSON.stringify({"response": "response with 'apostrophes'"}))
        done()
      }
      can(req, res)
    })
  })

  describe("variable POST responses", function() {
    var req, data
    beforeEach(function() {
      req = {
        method: 'POST',
        headers: {},
        on: function(event, fn) {
          fn(data)
        }
      }
    })

    it('should return the first response body if no payload match', function (done) {
      data = 'email=nobody@example.com'
      req.url = '/multiple_responses'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for one@example.com"}))
        done()
      }
      can(req, res)
    })

    it('should return the first response body if no payload match', function (done) {
      data = 'email=nobody@example.com'
      req.url = '/multiple_responses_text'
      res.end = function (content) {
        expect(content).toEqual('response for one@example.com')
        done()
      }
      can(req, res)
    })

    it('should return the first response body on payload match', function (done) {
      data = 'email=one@example.com'
      req.url = '/multiple_responses'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for one@example.com"}))
        done()
      }
      can(req, res)
    })

    it('should return the first response JSON body on payload match', function (done) {
      data = '{"email":"one@example.com"}'
      req.url = '/multiple_responses'
      req.headers['content-type'] = 'application/json'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for one@example.com"}))
        done()
      }
      can(req, res)
    })

    it('should return the first response JSON body on payload match (because JSON body is invalid)', function (done) {
      data = 'bad json data'
      req.url = '/multiple_responses'
      req.headers['content-type'] = 'application/json'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for one@example.com"}))
        done()
      }
      can(req, res)
    })

    it('should return the first response body on payload match', function (done) {
      data = 'email=one@example.com'
      req.url = '/multiple_responses_text'
      res.end = function (content) {
        expect(content).toEqual('response for one@example.com')
        done()
      }
      can(req, res)
    })

    it('should return the second response body on payload match', function (done) {
      data = 'email=two@example.com'
      req.url = '/multiple_responses'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for two@example.com"}))
        done()
      }
      can(req, res)
    })

    it('should return the second response JSON body on payload match', function (done) {
      data = '{"email":"two@example.com"}'
      req.url = '/multiple_responses'
      req.headers['content-type'] = 'application/json'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for two@example.com"}))
        done()
      }
      can(req, res)
    })

    it('should return the second response body on payload match', function (done) {
      data = 'email=two@example.com'
      req.url = '/multiple_responses_text'
      res.end = function (content) {
        expect(content).toEqual('response for two@example.com')
        done()
      }
      can(req, res)
    })

    it('should return the first response xml on header match', function (done) {
      data = ''
      req.url = '/multiple_responses_xml'
      req.headers = {
        "action": 'foo'
      }
      res.end = function (content) {
        expect(content).toEqual('<SOAP:Envelope><SOAP:Body><Foo Time="2015-01-22T08:30:00.000+05:30"/></SOAP:Body></SOAP:Envelope>')
        done()
      }
      can(req, res)
    })

    it('should return the second response xml on header match', function (done) {
      data = ''
      req.url = '/multiple_responses_xml'
      req.headers = {
        "action": 'bar'
      }
      res.end = function (content) {
        expect(content).toEqual('<SOAP:Envelope><SOAP:Body><Bar Time="2015-01-22T08:30:00.000+05:30"/></SOAP:Body></SOAP:Envelope>')
        done()
      }
      can(req, res)
    })
  })

})
