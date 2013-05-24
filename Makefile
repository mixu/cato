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
	--include ./lib/common ./lib/web \
	--replace jQuery=window.jQuery,minilog=window.Minilog \
	--npm microee,htmlparser-to-html \
	--global Cato \
	--main lib/web/index.js \
	--out dist/cato.js
ifeq ($(UNAME), Linux)
	@sed -i 's/..\/shim.js/..\/shim.web.js/g' dist/cato.js
endif
ifeq ($(UNAME), Darwin)
	@sed -i '' 's/..\/shim.js/..\/shim.web.js/g' dist/cato.js
endif
	@cat dist/cato.js > dist/dummy; $ cat node_modules/minilog/dist/minilog.js dist/dummy > dist/cato.js
	@rm dist/dummy

.PHONY: build test
