Canned fake API server
======================

[![Build Status](https://travis-ci.org/sideshowcoder/canned.png?branch=master)](https://travis-ci.org/sideshowcoder/canned)

Working with APIs, more often than not, during development you want to work
with a fixed version of the responses provided. This is especially true if the
API is still under development, and maybe even still needs input on how to
output something. This is what Canned is for!

What does it do?
----------------
Canned maps a folder structure to API responses, so

    /comment/any.get.json

responds to

    GET /comment/:id

and becomes

    Content-Type: application/json
    {
      content: 'I am a comment',
      author: 'sideshowcoder'
    }

Awesome! so what is supported?
------------------------------
Currently Canned supports the basic REST-API mapping, as well as custom method
mapping with nested endpoints.


    file                        | resquest
    /index.get.json             | GET /
    /any.get.json               | GET /:id
    /_search.get.json           | GET /search
    /comments/index.get.json    | GET /comments/
    /comments/any.get.json      | GET /comments/:id
    /comments/_search.get.json  | GET /comments/search
    /comments/_search.get.json  | GET /comments/search?iam=soignored

Ok I need this!
---------------
Just install via npm

    $ npm install canned

How do I use it
---------------
There are 2 ways here, either you embed it somewhere programmatically

    var canned = require('canned')
    ,   http = require('http')

    can = canned('/path/to/canned/response/folder')

    http.createServer(can).listen(3000)

Or just run the provided canned server script

    $ canned

Which serves the current folder with canned responses on port 3000

    $ canned -p 5000 ./my/responses/

will serve the relative folder via port 5000

License
-------
MIT 2013 Philipp Fehre alias @sideshowcoder


