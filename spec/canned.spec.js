"use strict";
var querystring = require("querystring")
var canned = require('../index')
var path = require('path')

describe('canned', function () {

  var can, req, res
  beforeEach(function () {
    can = canned('./spec/test_responses')
    req = { method: 'GET' }
    res = { setHeader: function () {}, end: function () {} }
    spyOn(res, 'setHeader')

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
          expect(message).toContain("problem sanatizing content for _invalid_syntax.get.json SyntaxError: Unexpected token I")
          done()
        }
      }
      req.url = '/invalid_syntax'
      logCan(req, res)
    })
  })

  describe('sanitization', function () {
    var writeLog, logCan
    var logger = {
      write: function (msg) {
        if (writeLog) writeLog(msg)
      }
    }
    describe('with sanitization enabled', function() {
      beforeEach(function () {
        logCan = canned('./spec/test_responses', { logger: logger })
      })

      it('displays an error for json containing unexpected markup', function (done) {
        var regex = new RegExp('.*Syntax.*')
        writeLog = function (message) {
          if (regex.test(message)) {
            expect(message).toContain("problem sanatizing content for _broken_sanitize.get.json SyntaxError: Unexpected token")
            done()
          }
        }
        req.url = '/broken_sanitize'
        logCan(req, res)
      })
    })

    describe('with sanitization disabled', function() {
      beforeEach(function () {
        logCan = canned('./spec/test_responses', { logger: logger, sanitize: false })
      })

      it('loads content from _broken_sanitize.get.json', function (done) {
        req.url = '/broken_sanitize'
        res.end = function (content) {
          expect(content).toContain('"whatAmI": "I have been copy/pasted into a WYSIWYG editor by your grandma"')
          done()
        }
        logCan(req, res)
      })
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

    describe('custom response header', function(){
      it('populates custom header with single header', function(done){
          req.url = '/single_custom_header'
          res.end = function() {
            expect(res.setHeader).toHaveBeenCalledWith('Header-Key', 'Header-Content')
            done()
        }
          can(req, res)
      })

      it('populates custom headers with multiple headers', function(done){
          req.url = '/multiple_custom_header'
          res.end = function() {
            expect(res.setHeader).toHaveBeenCalledWith('Header-Key', 'Header-Content')
            expect(res.setHeader).toHaveBeenCalledWith('Header-Key2', 'Header-Content2')
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

    it('loads index from wildcard path for /d/1/', function (done) {
      req.url = '/d/1/'
      res.end = function (content) {
        expect(content).toContain('{"wildcard":1}')
        done()
      }
      can(req, res)
    })

    it('loads named response from wildcard path for /d/1/bar', function (done) {
      req.url = '/d/1/bar'
      res.end = function (content) {
        expect(content).toContain('{"wildcard":"named_response"}')
        done()
      }
      can(req, res)
    })

    it('loads index from real path for /d/2/', function (done) {
      req.url = '/d/2/'
      res.end = function (content) {
        expect(content).toContain('{"not-wildcard":1}')
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

    it('selects json file for request with application/json accept header', function (done) {
      req.url = '/multiple_type';
      req.headers = {
        accept: 'application/json'
      }
      res.end = function (content) {
        var jsonResponse = JSON.parse(content)
        expect(jsonResponse.type).toBe('json')
        done()
      }
      can(req, res)
    })

    it('selects jsonld file for request with application/ld+json accept header', function (done) {
      req.url = '/multiple_type';
      req.headers = {
        accept: 'application/ld+json'
      }
      res.end = function (content) {
        var jsonResponse = JSON.parse(content)
        expect(jsonResponse['@context']).toBe('http://schema.org/')
        done()
      }
      can(req, res)
    })

    it('selects nt file for request with application/n-triples accept header', function (done) {
      req.url = '/multiple_type';
      req.headers = {
        accept: 'application/n-triples'
      }
      res.end = function (content) {
        expect(content).toBe('_:b0 <http://schema.org/name> \"Jane Doe\" .')
        done()
      }
      can(req, res)
    })

    it('selects csv file for request with text/csv accept header', function (done) {
      req.url = '/multiple_type';
      req.headers = {
        accept: 'text/csv'
      }
      res.end = function (content) {
        expect(content).toBe('Jane Doe,Professor,(425) 123-4567,http://www.janedoe.com')
        done()
      }
      can(req, res)
    })

    it('selects js file for request with application/javascript accept header', function (done) {
      req.url = '/multiple_type';
      req.headers = {
        accept: 'application/javascript'
      }
      res.end = function (content) {
        expect(content).toBe('var type = \'js\';')
        done()
      }
      can(req, res)
    })

    it('selects txt file for request with text/plain accept header', function (done) {
      req.url = '/multiple_type';
      req.headers = {
        accept: 'text/plain'
      }
      res.end = function (content) {
        expect(content).toBe('text type')
        done()
      }
      can(req, res)
    })

    it('selects txt file for request with text/html accept header', function (done) {
      req.url = '/multiple_type';
      req.headers = {
        accept: 'text/html'
      }
      res.end = function (content) {
        expect(content).toBe('<type>html</type>')
        done()
      }
      can(req, res)
    })

    it('selects json file when application/json is not first in the Accept header', function (done) {
      can = canned('./spec/test_responses', {"relaxed_accept": true})
      req.url = '/d/multiple-accept-types'
      req.headers = {
        accept: 'text/html, application/json'
      }
      res.end = function (content) {
        expect(content).toBe('{"type":"json"}');
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
        'Access-Control-Allow-Methods': "GET, POST, PUT, PATCH, DELETE, OPTIONS"
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

    it('adds custom headers from a string', function (done) {
      var can2 = canned('./spec/test_responses', { cors: true, cors_headers: "Authorization, Content-Type" })
      req.url = '/'
      var expectedHeaders = {
        'Access-Control-Allow-Headers': "X-Requested-With, Authorization, Content-Type"
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

    it('adds custom headers from an array', function (done) {
      var can2 = canned('./spec/test_responses', { cors: true, cors_headers: ["Authorization", "Content-Type"] })
      req.url = '/'
      var expectedHeaders = {
        'Access-Control-Allow-Headers': "X-Requested-With, Authorization, Content-Type"
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

    it("should select the right response based on the GET request data", function (done) {
      req.url = "/multiple_get_responses?" + querystring.stringify({ foo: "apostrophe" })
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response with 'apostrophes'"}))
        done()
      }
      can(req, res)
    })

    it("should select the right response based on the GET request data", function (done) {
      req.url = "/multiple_get_responses?" + querystring.stringify({ foo: "bar", index: 1 })
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response with index 1"}))
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

    it("#73", function (done) {
      req.url = "/multiple_get_responses?" + querystring.stringify({"foo": "bar", "index": 1})
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response with index 1"}))
        done()
      }
      can(req, res)
    })

    it("#79", function (done) {
        var Canned = require('../lib/canned')
        var can = new Canned('./spec/test_responses', {});
        var mock_text = '//! params: {"serialkey": "abc"}\r\n{\r\n"errorCode": "ERROR1"\r\n}\r\n' +
                        '//! params: {"serialkey": "12121"}\r\n{\r\n"errorCode": "ERROR2"\r\n}';
        var parsedMeta = can.parseMetaData(mock_text);
        expect(parsedMeta).toEqual({
          request: {
            serialkey: 'abc'
          },
          params: {
            serialkey: '12121'
          }
        });
        done();
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

    it('should return the first response JSON body on payload match even if content type has charset', function (done) {
      data = '{"email":"one@example.com"}'
      req.url = '/multiple_responses'
      req.headers['content-type'] = 'application/json; charset=UTF-8'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for one@example.com"}))
        done()
      }
      can(req, res)
    })

    it('should handle request bodies containing arrays', function (done) {
      data = '{"email": "two@example.com","topics": [1,2]}'
      req.url = '/multiple_responses'
      req.headers['content-type'] = 'application/json; charset=UTF-8'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for two@example.com topics 1,2"}))
        done()
      }
      can(req, res)
    })

    it('should handle request bodies containing urls', function (done) {
      data = '{"url": "http://example.com"}'
      req.url = '/response_with_url_param'
      req.headers['content-type'] = 'application/json'
      res.end = function (content) {
        expect(content).toEqual(JSON.stringify({"response": "response for url in param"}))
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

    it('should return the second response body on xml (or really any string) payload match', function (done) {
      data = '<xml>b</xml>'
      req.url = '/multiple_responses_xml_request_body'
      res.end = function (content) {
        expect(content).toEqual('<xml>B</xml>')
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
