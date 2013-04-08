build:
	@mkdir -p ./dist/
	@echo 'Building dist/vjs.js'
	@./node_modules/gluejs/bin/gluejs \
	--include ./lib/common ./lib/index.web.js ./lib/shim.web.js \
	--replace jQuery=window.jQuery \
	--npm microee,htmlparser-to-html \
	--global Vjs2 \
	--main lib/index.web.js \
	--out dist/vjs.js
	@sed -i 's/..\/shim.js/..\/shim.web.js/g' dist/vjs.js

.PHONY: build
