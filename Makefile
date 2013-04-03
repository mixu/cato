build:
	@mkdir -p ./dist/
	@echo 'Building dist/vjs.js'
	@./node_modules/gluejs/bin/gluejs \
	--include ./lib/common ./lib/index.web.js ./lib/shim.web.js \
	--npm microee \
	--global Vjs2 \
	--main lib/index.web.js \
	--out dist/vjs.js

.PHONY: build
