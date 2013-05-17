Canned fake API server
======================

[![Build Status](https://travis-ci.org/sideshowcoder/canned.png?branch=master)](https://travis-ci.org/sideshowcoder/canned)

Working with APIs, more often than not, during development you want to work
with a fixed version of the responses provided. This is especially true if the
API is still under development, and maybe even still needs input on how to
output something. This is what Canned is for!

What does it do?
----------------
Canned maps a folder structure to API responses

    /comment/any.get.json
    /comment/index.get.html

requests like

    GET /comment/:id

are served as

    Content-Type: application/json
    { "content": "I am a comment", "author": "sideshowcoder" }

requests like

    GET /content/

are served as

    Content-Type: text/html
    <html>
      <body>Some html in here</body>
    </html>


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

How about some docs inside for the responses?
---------------------------------------------
Most content types support comments nativly, like html or javascript. Sadly the
probaly most used type (JSON) does not :(. So canned actually extends the JSON
syntax a little so it can include comments with _//_ or _/**/_. In case you use
the json files directly on the backend side as test cases make sure you strip
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

    can = canned('/path/to/canned/response/folder')

    http.createServer(can).listen(3000)

Or just run the provided canned server script

    $ canned

Which serves the current folder with canned responses on port 3000

    $ canned -p 5000 ./my/responses/

will serve the relative folder via port 5000

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

License
-------
MIT 2013 Philipp Fehre alias @sideshowcoder, or @ischi on twitter


