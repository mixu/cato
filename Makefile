TESTS += test/shim.util.test.js
TESTS += test/event.test.js
TESTS += test/unirender.test.js
TESTS += test/viewify.test.js
TESTS += test/model_binding.test.js

UNAME := $(shell uname)

test:
	@mocha \
		--ui exports \
		--reporter list \
		--slow 2000ms \
		--bail \
		$(TESTS)

build:
	@mkdir -p ./dist/
	@echo 'Building dist/cato.js'
	@./node_modules/gluejs/bin/gluejs \
	--include ./lib/common \
	--include ./lib/web \
	--replace jQuery=window.jQuery,minilog=window.Minilog \
	--include ./node_modules/microee \
	--include ./node_modules/htmlparser-to-html \
	--command 'uglifyjs --no-copyright --mangle-toplevel' \
	--global Cato \
	--main lib/web/index.js \
	--out dist/cato.js

build-debug:
	@mkdir -p ./dist/
	@echo 'Building dist/cato.js'
	@./node_modules/gluejs/bin/gluejs \
	--include ./lib/common \
	--include ./lib/web \
	--replace jQuery=window.jQuery,minilog=window.Minilog \
	--include ./node_modules/microee \
	--include ./node_modules/htmlparser-to-html \
	--command 'uglifyjs --no-copyright --beautify' \
	--source-url \
	--global Cato \
	--main lib/web/index.js \
	--out dist/cato.js

.PHONY: build build-debug test
