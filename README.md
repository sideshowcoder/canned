Canned fake API server
======================

[![Build Status](https://travis-ci.org/sideshowcoder/canned.png?branch=master)](https://travis-ci.org/sideshowcoder/canned) [![Code Climate](https://codeclimate.com/github/sideshowcoder/canned.png)](https://codeclimate.com/github/sideshowcoder/canned) [![Bitdeli Badge](https://d2weczhvl823v0.cloudfront.net/sideshowcoder/canned/trend.png)](https://bitdeli.com/free "Bitdeli Badge")


View the docs on [Docs](http://sideshowcoder.github.io/canned)

Working with APIs, more often than not, during development you want to work
with a fixed version of the responses provided. This is especially true if the
API is still under development, and maybe even still needs input on how to
output something. This is what Canned is for!

What does it do?
----------------
Canned maps a folder structure to API responses. Given the following directory structure:
    
    /content/index.get.html
    /comment/any.get.json
    /comment/1/votes/index.get.json
    /comment/any/votes/index.get.json

requests like

    GET /comment/:id

are served from the file `/comment/any.get.json` as

    Content-Type: application/json
    { "content": "I am a comment", "author": "sideshowcoder" }

requests like

    GET /content/

are served from the file `/content/index.get.html` as

    Content-Type: text/html
    <html>
      <body>Some html in here</body>
    </html>


requests like

    GET /comment/1/votes

are served from the file `/comment/1/index.get.json` as

    Content-Type: application/json
    { "content": "I am comment 1", "author": "sideshowcoder" }

requests like

    GET /comment/123456789/votes
 
are served from the file `/comment/any/index.get.json`

    Content-Type: application/json
    { "content": "I am a wildcard comment for any id", "author": "sideshowcoder" }



Awesome! so what is supported?
------------------------------
Currently Canned supports the basic REST-API mapping, as well as custom method
mapping with nested endpoints.

    file                            | resquest
    /index.get.json                 | GET /
    /any.get.json                   | GET /:id
    /_search.get.json               | GET /search
    /comments/index.get.json        | GET /comments/
    /comments/any.get.json          | GET /comments/:id
    /comments/_search.get.json      | GET /comments/search
    /comments/any/index.get.json    | GET /comments/:id/

You can even add query parameters to your filenames to return different
responses on the same route. If the all query params in a filename match the
incoming request, this file will be returned. It will fall back to returning the
file with no query params if it exists.

*Warning this will be deprecated in the future since canned now supports
multiple response based on the request body or GET URL parameters in one file.
This is the prefered way since files with ? in the name do not work on Windows*

    file                            | resquest
    /index?name=Superman.get.json   | GET /?name=Superman&NotAllParams=NeedToMatch
    /_search?q=hello.get.json       | GET /comments/search?q=hello
    /_search.get.json               | GET /comments/search?iam=soignored

Same support is available for PUT, POST, etc.

    /index.post.json            | POST serves /... + CORS Headers
    /index.put.json             | PUT serves /... + CORS Headers

If CORS support is enabled additionally options will be available as a http verb
and all requests will serve the CORS Headers as well

    /                           | OPTIONS serve all the options needed for CORS
    /index.get.json             | GET serves /... + CORS Headers

If you need some custum return codes, just add them to the file via adding a
file header like so

    //! statusCode: 201
    <html>
      <body>Created something successfully! Happy!</body>
    </html>

The header will be stripped before sending and the statusCode will be set.

You can also override the default content types by adding a custom content type to the file header:

    //! contentType: "application/vnd.custom+xml"
    <xml>
        <created>1</created>
    </xml>

This will be returned with a `Content-type: application/vnd.custom+xml` header.

Multiple headers need to be written on one single line and comma-separated, like so:

    //! statusCode: 201, contentType: "application/vnd.custom+xml"

If you need to send bind custom HTTP headers to the response you can add them as a JSON object in the
`customHeaders` attributes:

    //! customHeaders: [{"MyCustomHeaderName": "MyCustomHeaderValue"}, {"SecondHeaderName": "SecondHeaderValue"}]

Variable responses
------------------
You can get a different response by specifying request data in variant
comments. If the request data matches the comment data the matching response is
returned. If there is no match the first response is returned

*Note: comments must be on a single line*

Custom headers:

    //! header: {"authorization": "abc"}
    {
        "response": "response for abc"
    }

    //! header: {"authorization": "123"}
    {
        "response": "response for 123"
    }

If you need different responses based on request body then you can specify the
request you want matched via body comments:

    //! body: {"email": "one@example.com"}
    {
        "response": "response for one@example.com"
    }

    //! body: {"email": "two@example.com"}
    {
        "response": "response for two@example.com"
    }

If you need different responses based on request parameters then you can specify
them via parameters comments:

    //! params: {"foo": "bar"}
    {
        "response": "response for bar"
    }

    //! params: {"foo": "baz"}
    {
        "response": "response for baz"
    }

this would match `http://my.local.server/my_get_request_path?foo=bar` or
`http://my.local.server/my_get_request_path?foo=baz` respectively.

To use in conjunction with response headers and status codes, just add them on
the line above.

	//! statusCode: 201
	//! header: {"authorization": "abc"}
	{
	    "response": "response for abc"
	}

  	//! statusCode: 201, contentType: "application/my-personal-json"
	//! header: {"authorization": "123"}
	{
	    "response": "response for 123"
	}

Wildcard responses are also supported, very useful to have 'wildcard'
directories, so that if for given a request like:

  GET /api/users/1/profile/

you don't have a file in `./canned/api/users/1/profile/index.get.json` then
it would look for a file in `./canned/api/users/any/index.get.json` or
similar. Wildcards can be specified on the command line via

  canned --wildcard iamawildcard


How about some docs inside for the responses?
---------------------------------------------
Most content types support comments natively, like html or javascript. Sadly the
probably most used type (JSON) does not :(. So canned actually extends the JSON
syntax a little so it can include comments with _//_ or _/**/_. In case you use
the JSON files directly on the backend side as test cases make sure you strip
those out as well!


Ok I need this!
---------------
Just install via npm

    $ npm install canned

which will install it locally in node\_modules, if you want to have it
available from anywhere just install globally

    $ npm install -g canned

How do I use it
---------------
There are 2 ways here, either you embed it somewhere programmatically

    var canned = require('canned')
    ,   http = require('http')
    ,   opts = { cors: true, logger: process.stdout }

    can = canned('/path/to/canned/response/folder', opts)

    http.createServer(can).listen(3000)

Or just run the provided canned server script

    $ canned

Which serves the current folder with canned responses on port 3000

    $ canned -p 5000 ./my/responses/

will serve the relative folder via port 5000

If for whatever reason you want to turn of CORS support do so via

    $ canned --cors=false ./my/responses/

Also if you need additional headers to be served alongside the CORS headers
these can be added like this (thanks to runemadsen)

    $ canned --headers "Authorization, Another-Header"

For more information checkout [the pull request](https://github.com/sideshowcoder/canned/pull/9)

Already using grunt? [Great there is a plugin for that,](https://github.com/jkjustjoshing/grunt-canned)
thanks to jkjustjoshing.


It does not work :(
-------------------

### canned not found
make sure you either install globally or put ./node\_modules/.bin in your PATH

### it is still not found, and I installed globally
make sure /usr/local/share/npm/bin is in your path, this should be true for
every install since you won't be able to run any global module bins if not.
(like express, and such)

### the encoding looks wrong
make sure you run a version of node which is 0.10.3 or higher, because it fixes
a problem for the encoding handling when reading files

How to Contribute
-----------------
* Checkout the repository
* Run the tests and jshint
    ```$ make```
* Create a topic branch
    ```$ git checkout -b my-new-feature```
* Code test and make jshint happy!
    ```$ make test```
    ```$ make hint```
* Push the branch and create a Pull-Request

I try to review the pull requests as quickly as possible, should it take to long
feel free to [bug me on twitter](https://twitter.com/ischi)

Release History
---------------

### next
* update depedencies and dev-dependencies
* wildcard parameters thanks to [msurdi](https://github.com/msurdi) see
  https://github.com/sideshowcoder/canned/pull/64

### 0.3.3
* fix support for special characters in the header / params / body matches
  (@simonprickett, @kevinschumacher, @sideshowcoder)
* support differet statusCodes and content types in multiple response files
  (@sideshowcoder)

### 0.3.2
* support for XML headers to support SOAP (@vikalp)
* fix relative path again... (@sideshowcoder)

### 0.3.1
* fixes for variable responses with JSON body (@bibounde)
* fixes for relative paths on start (@sideshowcoder)
* complex get parameters causing regexp match on file to fail (@sideshowcoder)

### 0.3
* support for multiple responses per file (@hungrydavid)
* support for GET responses without the need for special characters in the
  filename (@sideshowcoder based on the work by @hungrydavid)

### 0.2.3
* added support for empty response with 204 for no content (@jkjustjoshing)

### everything before
* sorry haven't kept a version history, yet. Will now!

Contributors
------------
* [sideshowcoder](https://github.com/sideshowcoder)
* [leifg](https://github.com/leifg)
* [runemadsen](https://github.com/runemadsen)
* [mulderp](https://github.com/mulderp)
* [creynders](https://github.com/creynders)
* [jkjustjoshing](https://github.com/jkjustjoshing)
* [hungrydavid](https://github.com/hungrydavid)
* [bibounde](https://github.com/bibounde)
* [vikalp](https://github.com/vikalp)
* [simonprickett](https://github.com/simonprickett)
* [kevinschumacher](https://github.com/kevinschumacher)
* [msurdi](https://github.com/msurdi)

License
-------
MIT 2013 Philipp Fehre alias @sideshowcoder, or @ischi on twitter
