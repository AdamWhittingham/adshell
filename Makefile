.PHONY: install
install:
	./install

.PHONY: work
work: install
	@brew bundle --no-lock --file=Brewfile.work

.PHONY: personal
personal: install
	@brew bundle --no-lock --file=Brewfile.personal
