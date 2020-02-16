# esselint

Sublime plugin for ESLint

## Install

This plugin is not available directly through Package Control yet, so you'll have to manually copy the files in a folder
inside `{sublime folder}/Packages/`.

## Motivation

If you are a JS developer using Sublime with SublimeLinter, you might have noticed just how slow it can be for it to
lint JavaScript. But it's not because of SublimeLinter, but rather because of how long it takes for ESLint to run.

The thing is there's multiple steps in linting a file (or text content): ESLint has to be loaded, and only then it can
run the linter. Precisely because of that [eslint_d](mantoni/eslint_d.js) was created, but I still had some difficulty
making it play nice with Sublime, especially to have fix-on-save capabilities and non-global ESLint instances. And so
for that reason (and also because I wanted to learn the process of creating a Sublime plugin) I created this
ESLint-specific plugin: for now it only has on-save linting, but that's because I'm not a big fan of running it as the
file is changed. It takes a lot from both SublimeLinter as well as `eslint_d` for the Python plugin and for the Node
daemon logic.

## How it works

It has 3 different parts:

- A Python file with the actual plugin that runs the Node command after saving;
- A Node "command" which communicates with the daemon using a local socket, providing ESLint's output to the plugin via
STDOUT;
- A Node daemon program that is initialized after the first command call, and that is kept running and listening for
other command calls.

The real speed gain here is in the fact that ESLint is run through a daemon that can require each instance only once,
and use the cached instances (found relative to the provided filename) after that, which is **much** faster.

## TODO

- Lint-on-modified
- Add error/warning description popover
- Allow for finer configuration
- Do not lint non-lintable files (e.g. readonly)
- Allow using global ESLint instances

## Inspiration

- [eslint_d](mantoni/eslint_d.js)
- [SublimeLinter-eslint-contrib](SublimeLinter/SublimeLinter-eslint)
