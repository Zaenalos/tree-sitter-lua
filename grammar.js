/**
 * @file Tree sitter for Lua
 * @author Zaenalos <chamianramesesmendez@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

export default grammar({
  name: "lua",

  rules: {
    // TODO: add the actual grammar rules
    source_file: $ => "hello"
  }
});
