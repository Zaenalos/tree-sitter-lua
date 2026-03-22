<div align="center">
<h1>tree-sitter-lua</h1>
</div>

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [Lua 5.5](https://www.lua.org/manual/5.5/).

Built primarily to power a [Zed](https://zed.dev/) extension, but compatible with any editor or tool that supports Tree-sitter — including VS Code (via [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) or similar), Neovim, Emacs, and others.

You might want to check the Zed extension I'm working on: https://github.com/Zaenalos/Lua-Zed

![CI](https://github.com/Zaenalos/tree-sitter-lua/actions/workflows/ci.yml/badge.svg)

## Features

- Full Lua 5.1 - 5.5 syntax support including `global` declarations, attributes (`<const>`, `<close>`), and `global *`
- Correct long string and long comment parsing — `--[==[...]==]` vs `-- [[...]]`

## Usage

### CLI

```bash
npm install -g tree-sitter-cli
tree-sitter parse your_file.lua
tree-sitter highlight your_file.lua

# testing
tree-sitter test
tree-sitter parse test-lua/*
```

## Tests

| Suite                                                           | Status                        |
| --------------------------------------------------------------- | ----------------------------- |
| Corpus (literals, expressions, statements, functions, comments) | ✅ 55/55 passing              |
| Sample file parsing (`test-lua/all.lua`)                        | ✅ No errors or missing nodes |

## Contributing

Found a bug or missing feature? Feel free to [open an issue](https://github.com/Zaenalos/tree-sitter-lua/issues) or submit a pull request.

## License

MIT

---

> Credits to [Lua](https://lua.org/) for the test files :)
