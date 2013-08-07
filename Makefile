TESTS += test/collection_view.test.js
TESTS += test/event.test.js
TESTS += test/model_binding.test.js
TESTS += test/shim.util.test.js
TESTS += test/unirender.test.js
TESTS += test/viewify.test.js

UNAME := $(shell uname)

test:
	@mocha \
		--ui exports \
		--reporter spec \
		--slow 2000ms \
		--bail \
		$(TESTS)

build:
	@mkdir -p ./dist/
	@echo 'Building dist/cato.js'
	@./node_modules/gluejs/bin/gluejs \
	--include ./lib/common \
	--include ./lib/web \
	--replace jQuery=window.jQuery \
	--replace minilog=window.Minilog \
	--replace backbone=window.Backbone \
	--include ./node_modules/microee \
	--include ./node_modules/htmlparser-to-html \
	--global Cato \
	--main lib/web/index.js \
	--out dist/cato.js

build-standalone:
	cp ./node_modules/minilog/dist/minilog.js dist/cato.js
	./node_modules/gluejs/bin/gluejs \
	--include ./lib/common \
	--include ./lib/web \
	--replace jQuery=window.jQuery \
	--replace backbone=window.Backbone \
	--replace minilog=window.Minilog \
	--include ./node_modules/microee \
	--include ./node_modules/htmlparser-to-html \
	--global Cato \
	--main lib/web/index.js >> dist/cato.js

style:
	jshint lib

.PHONY: build build-debug test style
