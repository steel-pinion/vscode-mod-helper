.PHONY: install vsce_sanity publish prepareci

PROJECT            := vscode-mod-helper
PREFIX             := mh

install:
	@npm install

prepareci:
	@mkdir -p  ./config/ \
	&& touch ./config/secrets-${ENV}.env \
	&& make install

vsce_sanity:
	@. ./config/secrets-${ENV}.env \
	&& npx vsce verify-pat RareGentlemen \
	&& npm run prepare \
	&& npx vsce ls

publish:
	@. ./config/secrets-${ENV}.env \
	&& npx vsce verify-pat RareGentlemen \
	&& npm run prepare \
	&& npm run publish
