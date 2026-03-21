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
    $._long_bracket, // handles [=*[...]=*] for both strings and comments
  ],

  conflicts: ($) => [[$.exp, $.prefixexp], [$.namelist]],

  rules: {
    // =========================================================================
    // Root
    // =========================================================================

    // I'd consider source file as chunk
    // chunk ::= block
    source_file: ($) => seq(optional($.shebang), optional($.block)),

    // You should already know what a shebang is, you Linux nerd!
    shebang: ($) => /#.*/,

    // =========================================================================
    // Comments
    // =========================================================================

    comment: ($) =>
      choice(
        seq("--", /[^\n]*/), // short comment
        seq("--", $._long_bracket), // long comment
      ),

    // =========================================================================
    // Identifiers
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
        // HEX (most specific first)
        /0[xX][0-9a-fA-F]*\.[0-9a-fA-F]+[pP][+-]?[0-9]+/,
        /0[xX][0-9a-fA-F]+[pP][+-]?[0-9]+/,
        /0[xX][0-9a-fA-F]*\.[0-9a-fA-F]+/,
        /0[xX][0-9a-fA-F]+/,

        // DECIMAL WITH EXPONENT (must come BEFORE plain numbers)
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

    long_string: ($) => $._long_bracket,

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
        $.prefixexp,
        $.tableconstructor,
        $.binary_expression,
        $.unary_expression,
      ),

    binary_expression: ($) =>
      choice(
        prec.left(PRECEDENCE.OR[0], seq($.exp, "or", $.exp)),
        prec.left(PRECEDENCE.AND[0], seq($.exp, "and", $.exp)),
        prec.left(PRECEDENCE.EQUALITY[0], seq($.exp, "==", $.exp)),
        prec.left(PRECEDENCE.EQUALITY[0], seq($.exp, "~=", $.exp)),
        prec.left(PRECEDENCE.EQUALITY[0], seq($.exp, "<", $.exp)),
        prec.left(PRECEDENCE.EQUALITY[0], seq($.exp, "<=", $.exp)),
        prec.left(PRECEDENCE.EQUALITY[0], seq($.exp, ">", $.exp)),
        prec.left(PRECEDENCE.EQUALITY[0], seq($.exp, ">=", $.exp)),
        prec.left(PRECEDENCE.BITOR[0], seq($.exp, "|", $.exp)),
        prec.left(PRECEDENCE.BITXOR[0], seq($.exp, "~", $.exp)),
        prec.left(PRECEDENCE.BITAND[0], seq($.exp, "&", $.exp)),
        prec.left(PRECEDENCE.SHIFT[0], seq($.exp, "<<", $.exp)),
        prec.left(PRECEDENCE.SHIFT[0], seq($.exp, ">>", $.exp)),
        prec.right(PRECEDENCE.CONCAT[0], seq($.exp, "..", $.exp)),
        prec.left(PRECEDENCE.ADD[0], seq($.exp, "+", $.exp)),
        prec.left(PRECEDENCE.ADD[0], seq($.exp, "-", $.exp)),
        prec.left(PRECEDENCE.MUL[0], seq($.exp, "*", $.exp)),
        prec.left(PRECEDENCE.MUL[0], seq($.exp, "/", $.exp)),
        prec.left(PRECEDENCE.MUL[0], seq($.exp, "//", $.exp)),
        prec.left(PRECEDENCE.MUL[0], seq($.exp, "%", $.exp)),
        prec.right(PRECEDENCE.POWER[0], seq($.exp, "^", $.exp)),
      ),

    unary_expression: ($) =>
      prec(
        PRECEDENCE.UNARY,
        choice(seq("-", $.exp), seq("not", $.exp), seq("#", $.exp), seq("~", $.exp)),
      ),

    // =========================================================================
    // Prefix expressions, variables, and function calls
    // =========================================================================

    // Flattened to avoid mutual left recursion between var/prefixexp/functioncall.
    prefixexp: ($) =>
      choice(
        $.Name,
        seq($.prefixexp, "[", $.exp, "]"), // index
        seq($.prefixexp, ".", $.Name), // field access
        seq($.prefixexp, $.args), // call
        seq($.prefixexp, ":", $.Name, $.args), // method call
        seq("(", $.exp, ")"),
      ),

    var: ($) =>
      prec(1, choice($.Name, seq($.prefixexp, "[", $.exp, "]"), seq($.prefixexp, ".", $.Name))),

    functioncall: ($) =>
      prec(1, choice(seq($.prefixexp, $.args), seq($.prefixexp, ":", $.Name, $.args))),

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
    funcname: ($) => seq($.Name, repeat(seq(".", $.Name)), optional(seq(":", $.Name))),

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
    field: ($) => choice(seq("[", $.exp, "]", "=", $.exp), seq($.Name, "=", $.exp), $.exp),

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
    attrib: ($) => seq("<", $.Name, ">"),

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
        $.functioncall,
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

    // '::' Name '::'
    label: ($) => seq("::", $.Name, "::"),

    // break
    break_stat: ($) => "break",

    // goto Name
    goto_stat: ($) => seq("goto", $.Name),

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
        $.Name,
        "=",
        $.exp,
        ",",
        $.exp,
        optional(seq(",", $.exp)),
        "do",
        optional($.block),
        "end",
      ),

    // for namelist in explist do block end
    generic_for: ($) => seq("for", $.namelist, "in", $.explist, "do", optional($.block), "end"),

    // function funcname funcbody
    function_decl: ($) => seq("function", $.funcname, $.funcbody),

    // local function Name funcbody
    local_function: ($) => seq("local", "function", $.Name, $.funcbody),

    // global function Name funcbody
    global_function: ($) => seq("global", "function", $.Name, $.funcbody),

    // local attnamelist ['=' explist]
    local_decl: ($) => seq("local", $.attnamelist, optional(seq("=", $.explist))),

    // global attnamelist
    global_decl: ($) => seq("global", $.attnamelist),

    // global [attrib] '*'
    global_wildcard: ($) => seq("global", optional($.attrib), "*"),

    // retstat ::= return [explist] [';']
    retstat: ($) => seq("return", optional($.explist), optional(";")),
  },
});
