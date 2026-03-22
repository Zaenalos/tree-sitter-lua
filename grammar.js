/**
 * @file Tree sitter for Lua
 * @author Zaenalos <chamianramesesmendez@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Lua's precedence
// Reference: https://lua.org/source/5.5/lparser.c.html#priority
// Prio table for binary operators.
const PRECEDENCE = {
  OR: [1, 1], // "or"
  AND: [2, 2], // "and"
  EQUALITY: [3, 3], // ==, <, <=, ~=, >, >=
  BITOR: [4, 4], // |
  BITXOR: [5, 5], // ~
  BITAND: [6, 6], // &
  SHIFT: [7, 7], // <<, >>
  CONCAT: [9, 8], // .. (right associative)
  ADD: [10, 10], // +, -
  MUL: [11, 11], // *, %, /, //
  UNARY: 12, // not, #, -, ~
  POWER: [14, 13], // ^ (right associative)
};

// Full grammar is based on the Lua 5.5 reference manual
export default grammar({
  name: "lua",

  word: ($) => $.Name,

  extras: ($) => [$.comment, /\s/],

  externals: ($) => [
    $._long_string, // [=[...]=] for string literals
    $._long_comment_body, // [=[...]=] for long comments (no whitespace skip)
  ],

  conflicts: ($) => [
    [$.namelist],
    [$.exp, $.prefixexp],
    // [$.functioncall, $.prefixexp],
    [$.call_expression, $.exp],
  ],

  rules: {
    // =========================================================================
    // Root
    // =========================================================================

    // I'd consider source as chunk here
    // chunk ::= block
    source_file: ($) => seq(optional($.shebang), optional($.block)),

    // You should already know what a shebang is, you Linux nerd!
    shebang: ($) => /#.*/,

    // =========================================================================
    // Comments
    // =========================================================================

    comment: ($) => choice(seq("--", $._long_comment_body), seq("--", /[^\n]*/)),

    // =========================================================================
    // Identifiers|Names
    // =========================================================================

    Name: ($) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // =========================================================================
    // Literals
    // =========================================================================

    vararg: ($) => "...",
    nil: ($) => "nil",
    boolean: ($) => choice("false", "true"),
    numeral: ($) =>
      choice(
        // HEX
        /0[xX][0-9a-fA-F]*\.[0-9a-fA-F]+[pP][+-]?[0-9]+/,
        /0[xX][0-9a-fA-F]+[pP][+-]?[0-9]+/,
        /0[xX][0-9a-fA-F]*\.[0-9a-fA-F]+/,
        /0[xX][0-9a-fA-F]+/,

        // DECIMAL WITH EXPONENT
        /[0-9]+(\.[0-9]*)?[eE][+-]?[0-9]+/,
        /\.[0-9]+[eE][+-]?[0-9]+/,

        // DECIMAL WITHOUT EXPONENT
        /[0-9]+\.[0-9]*/,
        /\.[0-9]+/,
        /[0-9]+/,
      ),
    string: ($) => choice($.short_string, $.long_string),

    short_string: ($) =>
      choice(
        seq('"', repeat(choice($._string_content_double, $.escape_sequence)), '"'),
        seq("'", repeat(choice($._string_content_single, $.escape_sequence)), "'"),
      ),

    _string_content_double: ($) => /[^"\\\n]+/,
    _string_content_single: ($) => /[^'\\\n]+/,

    escape_sequence: ($) =>
      choice(
        /\\[abfnrtvz\\"']/, // Basic C-like escapes
        /\\\n/, // Line break (LF)
        /\\\r\n/, // Line break (CRLF)
        /\\[0-9]{1,3}/, // Decimal: \ddd
        /\\x[0-9a-fA-F]{2}/, // Hex: \xXX
        /\\u\{[0-9a-fA-F]+\}/, // Unicode: \u{XXX}
      ),

    long_string: ($) => $._long_string,

    call_expression: ($) =>
      choice(
        seq(field("callee", $.prefixexp), field("args", $.args)),
        seq(field("object", $.prefixexp), ":", field("method", $.Name), field("args", $.args)),
      ),

    // =========================================================================
    // Expressions
    // =========================================================================

    // exp ::= nil | false | true | Numeral | LiteralString | '...' |
    //         functiondef | prefixexp | tableconstructor | exp binop exp | unop exp
    exp: ($) =>
      choice(
        $.nil,
        $.boolean,
        $.numeral,
        $.string,
        $.vararg,
        $.functiondef,
        $.call_expression,
        $.prefixexp,
        $.tableconstructor,
        $.binary_expression,
        $.unary_expression,
      ),

    binary_expression: ($) =>
      choice(
        prec.left(PRECEDENCE.OR[0], seq(field("left", $.exp), "or", field("right", $.exp))),
        prec.left(PRECEDENCE.AND[0], seq(field("left", $.exp), "and", field("right", $.exp))),
        prec.left(PRECEDENCE.EQUALITY[0], seq(field("left", $.exp), "==", field("right", $.exp))),
        prec.left(PRECEDENCE.EQUALITY[0], seq(field("left", $.exp), "~=", field("right", $.exp))),
        prec.left(PRECEDENCE.EQUALITY[0], seq(field("left", $.exp), "<", field("right", $.exp))),
        prec.left(PRECEDENCE.EQUALITY[0], seq(field("left", $.exp), "<=", field("right", $.exp))),
        prec.left(PRECEDENCE.EQUALITY[0], seq(field("left", $.exp), ">", field("right", $.exp))),
        prec.left(PRECEDENCE.EQUALITY[0], seq(field("left", $.exp), ">=", field("right", $.exp))),
        prec.left(PRECEDENCE.BITOR[0], seq(field("left", $.exp), "|", field("right", $.exp))),
        prec.left(PRECEDENCE.BITXOR[0], seq(field("left", $.exp), "~", field("right", $.exp))),
        prec.left(PRECEDENCE.BITAND[0], seq(field("left", $.exp), "&", field("right", $.exp))),
        prec.left(PRECEDENCE.SHIFT[0], seq(field("left", $.exp), "<<", field("right", $.exp))),
        prec.left(PRECEDENCE.SHIFT[0], seq(field("left", $.exp), ">>", field("right", $.exp))),
        prec.right(PRECEDENCE.CONCAT[0], seq(field("left", $.exp), "..", field("right", $.exp))),
        prec.left(PRECEDENCE.ADD[0], seq(field("left", $.exp), "+", field("right", $.exp))),
        prec.left(PRECEDENCE.ADD[0], seq(field("left", $.exp), "-", field("right", $.exp))),
        prec.left(PRECEDENCE.MUL[0], seq(field("left", $.exp), "*", field("right", $.exp))),
        prec.left(PRECEDENCE.MUL[0], seq(field("left", $.exp), "/", field("right", $.exp))),
        prec.left(PRECEDENCE.MUL[0], seq(field("left", $.exp), "//", field("right", $.exp))),
        prec.left(PRECEDENCE.MUL[0], seq(field("left", $.exp), "%", field("right", $.exp))),
        prec.right(PRECEDENCE.POWER[0], seq(field("left", $.exp), "^", field("right", $.exp))),
      ),

    unary_expression: ($) =>
      prec(
        PRECEDENCE.UNARY,
        choice(
          seq("-", field("operand", $.exp)),
          seq("not", field("operand", $.exp)),
          seq("#", field("operand", $.exp)),
          seq("~", field("operand", $.exp)),
        ),
      ),

    // =========================================================================
    // Prefix expressions, and variables
    // =========================================================================
    // Flattened to avoid mutual left recursion between var/prefixexp.
    prefixexp: ($) =>
      choice(
        $.call_expression,
        field("base", $.Name),
        seq(field("object", $.prefixexp), "[", field("index", $.exp), "]"),
        seq(field("object", $.prefixexp), ".", field("field", $.Name)),
        seq("(", field("value", $.exp), ")"),
      ),

    var: ($) =>
      prec(
        1,
        choice(
          field("base", $.Name),
          seq(field("object", $.prefixexp), "[", field("index", $.exp), "]"),
          seq(field("object", $.prefixexp), ".", field("field", $.Name)),
        ),
      ),

    // args ::= '(' [explist] ')' | tableconstructor | LiteralString
    args: ($) => choice(seq("(", optional($.explist), ")"), $.tableconstructor, $.string),

    // =========================================================================
    // Lists
    // =========================================================================

    // varlist ::= var {',' var}
    varlist: ($) => seq($.var, repeat(seq(",", $.var))),

    // namelist ::= Name {',' Name}
    namelist: ($) => seq($.Name, repeat(seq(",", $.Name))),

    // explist ::= exp {',' exp}
    explist: ($) => seq($.exp, repeat(seq(",", $.exp))),

    // =========================================================================
    // Functions
    // =========================================================================

    // functiondef ::= function funcbody
    functiondef: ($) => seq("function", $.funcbody),

    // funcname ::= Name {'.' Name} [':' Name]
    funcname: ($) =>
      choice(
        // foo
        field("name", $.Name),
        // foo.bar
        seq(field("object", $.Name), ".", field("name", $.Name)),
        // foo.bar.baz
        seq(
          field("object", $.Name),
          repeat1(seq(".", field("module", $.Name))),
          ".",
          field("name", $.Name),
        ),
        // foo:method
        seq(field("object", $.Name), ":", field("method", $.Name)),
        // foo.bar:method
        seq(
          field("object", $.Name),
          repeat(seq(".", field("module", $.Name))),
          ":",
          field("method", $.Name),
        ),
      ),

    // funcbody ::= '(' [parlist] ')' block end
    funcbody: ($) => seq("(", optional($.parlist), ")", optional($.block), "end"),

    // parlist ::= namelist [',' varargparam] | varargparam
    parlist: ($) => choice(seq($.namelist, optional(seq(",", $.varargparam))), $.varargparam),

    // varargparam ::= '...' [Name]
    varargparam: ($) => seq($.vararg, optional($.Name)),

    // =========================================================================
    // Tables
    // =========================================================================

    // tableconstructor ::= '{' [fieldlist] '}'
    tableconstructor: ($) => seq("{", optional($.fieldlist), "}"),

    // fieldlist ::= field {fieldsep field} [fieldsep]
    fieldlist: ($) => seq($.field, repeat(seq($.fieldsep, $.field)), optional($.fieldsep)),

    // field ::= '[' exp ']' '=' exp | Name '=' exp | exp
    field: ($) =>
      choice(
        seq("[", field("key", $.exp), "]", "=", field("value", $.exp)),
        seq(field("name", $.Name), "=", field("value", $.exp)),
        field("value", $.exp),
      ),

    // fieldsep ::= ',' | ';'
    fieldsep: ($) => choice(",", ";"),

    // =========================================================================
    // Attributes
    // =========================================================================

    // attnamelist ::= [attrib] Name [attrib] {',' Name [attrib]}
    attnamelist: ($) =>
      seq(
        optional($.attrib),
        $.Name,
        optional($.attrib),
        repeat(seq(",", $.Name, optional($.attrib))),
      ),

    // attrib ::= '<' Name '>'
    attrib: ($) => seq("<", field("name", $.Name), ">"),

    // =========================================================================
    // Block and statements
    // =========================================================================

    // block ::= {stat} [retstat]
    block: ($) => choice(seq(repeat1($.stat), optional($.retstat)), $.retstat),

    // stat ::= ...
    stat: ($) =>
      choice(
        $.empty_stat,
        $.assignment,
        $.call_statement,
        $.label,
        $.break_stat,
        $.goto_stat,
        $.do_stat,
        $.while_stat,
        $.repeat_stat,
        $.if_stat,
        $.numeric_for,
        $.generic_for,
        $.function_decl,
        $.local_function,
        $.global_function,
        $.local_decl,
        $.global_decl,
        $.global_wildcard,
      ),

    // ';'
    empty_stat: ($) => ";",

    // varlist '=' explist
    assignment: ($) => seq($.varlist, "=", $.explist),

    // call statement
    call_statement: ($) =>
      prec(
        1,
        choice(
          seq(field("callee", $.exp), field("args", $.args)),
          seq(field("object", $.exp), ":", field("method", $.Name), field("args", $.args)),
        ),
      ),

    // '::' Name '::'
    label: ($) => seq("::", field("name", $.Name), "::"),

    // break
    break_stat: ($) => "break",

    // goto Name
    goto_stat: ($) => seq("goto", field("label", $.Name)),

    // do block end
    do_stat: ($) => seq("do", optional($.block), "end"),

    // while exp do block end
    while_stat: ($) => seq("while", $.exp, "do", optional($.block), "end"),

    // repeat block until exp
    repeat_stat: ($) => seq("repeat", optional($.block), "until", $.exp),

    // if exp then block {elseif exp then block} [else block] end
    if_stat: ($) =>
      seq(
        "if",
        $.exp,
        "then",
        optional($.block),
        repeat($.elseif_clause),
        optional($.else_clause),
        "end",
      ),

    elseif_clause: ($) => seq("elseif", $.exp, "then", optional($.block)),

    else_clause: ($) => seq("else", optional($.block)),

    // for Name '=' exp ',' exp [',' exp] do block end
    numeric_for: ($) =>
      seq(
        "for",
        field("var", $.Name),
        "=",
        field("start", $.exp),
        ",",
        field("limit", $.exp),
        optional(seq(",", field("step", $.exp))),
        "do",
        optional($.block),
        "end",
      ),

    // for namelist in explist do block end
    generic_for: ($) => seq("for", $.namelist, "in", $.explist, "do", optional($.block), "end"),

    // function funcname funcbody
    function_decl: ($) => seq("function", field("name", $.funcname), field("body", $.funcbody)),

    // local function Name funcbody
    local_function: ($) =>
      seq("local", "function", field("name", $.Name), field("body", $.funcbody)),

    // global function Name funcbody
    global_function: ($) =>
      seq("global", "function", field("name", $.Name), field("body", $.funcbody)),

    // local attnamelist ['=' explist]
    local_decl: ($) => seq("local", $.attnamelist, optional(seq("=", $.explist))),

    // global attnamelist
    global_decl: ($) => seq("global", $.attnamelist, optional(seq("=", $.explist))),

    // global [attrib] '*'
    global_wildcard: ($) => seq("global", optional($.attrib), "*"),

    // retstat ::= return [explist] [';']
    retstat: ($) => seq("return", optional($.explist), optional(";")),
  },
});
