.PHONY: all clean install build
all: build doc

NAME=xenstore
J=4

export OCAMLRUNPARAM=b

TESTS ?= --enable-tests
ifneq "$(MIRAGE_OS)" ""
TESTS := --disable-tests
endif

clean:
	@rm -f setup.data setup.log setup.bin
	@rm -rf _build

distclean: clean
	@rm -f config.mk

-include config.mk

setup.ml: _oasis
	@oasis setup

setup.bin: setup.ml
	@ocamlopt.opt -o $@ $< || ocamlopt -o $@ $< || ocamlc -o $@ $<
	@rm -f setup.cmx setup.cmi setup.o setup.cmo

setup.data: setup.bin
	./setup.bin -configure $(TESTS) $(ASYNC) $(LWT)

build: setup.data setup.bin
	@./setup.bin -build -j $(J)

doc: setup.data setup.bin
	@./setup.bin -doc -j $(J)

OCAML := $(shell ocamlc -where)
PYTHON := $(OCAML)/../python

install: setup.bin
	@./setup.bin -install
	mkdir -p $(DESTDIR)/$(BINDIR)
	install _build/cli/main.native $(DESTDIR)/$(BINDIR)/ms
	install _build/switch/switch_main.native $(DESTDIR)/$(BINDIR)/message-switch

# oasis bug?
#test: setup.bin build
#	@./setup.bin -test
test:
	./basic-rpc-test.sh


reinstall: setup.bin
	@ocamlfind remove $(NAME) || true
	@cp -f core/message_switch.py $(PYTHON)/
	@./setup.bin -reinstall

