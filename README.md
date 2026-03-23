<div align="center">
<h1>tree-sitter-lua</h1>
</div>

![CI](https://github.com/Zaenalos/tree-sitter-lua/actions/workflows/ci.yml/badge.svg)

A [Tree-sitter](https://tree-sitter.github.io/tree-sitter/) grammar for [Lua 5.5](https://www.lua.org/manual/5.5/).

Built primarily to power a [Zed](https://zed.dev/) extension, but compatible with any editor or tool that supports Tree-sitter — including VS Code (via [nvim-treesitter](https://github.com/nvim-treesitter/nvim-treesitter) or similar), Neovim, Emacs, and others.

You might want to check the Zed extension I'm working on: https://github.com/Zaenalos/Lua-Zed

## Features

- Full Lua 5.1 - 5.5 syntax support including `global` declarations, attributes (`<const>`, `<close>`), and `global *`
- Complete syntax highlighting, check [highlights.scm](https://github.com/Zaenalos/tree-sitter-lua/blob/main/queries/highlights.scm)

## Usage

### CLI

```bash
npm install -g tree-sitter-cli
# or you might want to use bun
bun add -g tree-sitter-cli # requires node v22.22.1
tree-sitter parse your_file.lua
tree-sitter highlight your_file.lua

# testing
tree-sitter test
tree-sitter parse test-lua/*.lua
```

## Tests

| Suite                                                           | Status                        |
| --------------------------------------------------------------- | ----------------------------- |
| Corpus (literals, expressions, statements, functions, comments) | ✅ 55/55 passing              |
| Sample file parsing (`test-lua/*.lua`)                          | ✅ No errors or missing nodes |

## Contributing

Found a bug or missing feature? Feel free to [open an issue](https://github.com/Zaenalos/tree-sitter-lua/issues) or submit a pull request.

## References

- https://tree-sitter.github.io/tree-sitter/
- https://lua.org/manual/5.5/manual.html

## License

[MIT](https://github.com/Zaenalos/tree-sitter-lua?tab=MIT-1-ov-file)

---

> Credits to [Lua](https://lua.org/) for the test files :)
