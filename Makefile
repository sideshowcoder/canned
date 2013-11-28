.PHONY: test hint default

default: hint test

test:
	./node_modules/.bin/jasmine-node --captureExceptions spec
	cd test && ./bin_test.sh

hint:
	./node_modules/.bin/jshint bin/canned canned.js lib/ spec/
