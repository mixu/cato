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
	@echo 'Building dist/vjs.js'
	@./node_modules/gluejs/bin/gluejs \
	--include ./lib/common ./lib/shim.util.js ./lib/index.web.js ./lib/shim.web.js \
	--replace jQuery=window.jQuery,minilog=window.Minilog \
	--npm microee,htmlparser-to-html \
	--global Vjs2 \
	--main lib/index.web.js \
	--out dist/vjs.js
ifeq ($(UNAME), Linux)
	@sed -i 's/..\/shim.js/..\/shim.web.js/g' dist/vjs.js
endif
ifeq ($(UNAME), Darwin)
	@sed -i '' 's/..\/shim.js/..\/shim.web.js/g' dist/vjs.js
endif
	@cat dist/vjs.js > dist/dummy; $ cat node_modules/minilog/dist/minilog.js dist/dummy > dist/vjs.js
	@rm dist/dummy

.PHONY: build test
