.PHONY: test

test:
	./node_modules/.bin/jasmine-node --captureExceptions spec
	cd test && ./bin_test.sh
