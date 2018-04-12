.PHONY: test hint default
CURRENT_BRANCH=$(shell git rev-parse --abbrev-ref HEAD)

default: bootstrap hint test

bootstrap:
	npm install

test:
	./node_modules/.bin/jasmine-node --captureExceptions spec
	cd test && ./bin_test.sh

hint:
	./node_modules/.bin/jshint bin/canned index.js lib/ spec/

release: docs
	@read -p "Version to release: " version; \
	git tag -a $$version -m "version $$version release"
	git push --tags
	npm publish

docs:
	@git stash
	@git checkout gh-pages
	@git checkout master -- README.md
	@echo "---\nlayout: index\n---" | cat - README.md > index.md
	@git reset README.md
	@rm README.md
	@git add index.md
	-git commit -m "updated docs"
	-git push origin gh-pages
	@git checkout ${CURRENT_BRANCH}
	-@git stash apply
