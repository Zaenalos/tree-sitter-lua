/**
 * @file Tree sitter for Lua
 * @author Zaenalos <chamianramesesmendez@gmail.com>
 * @license MIT
 */

/// <reference types="tree-sitter-cli/dsl" />
// @ts-check

// Lua's precedence
// Reference: https://lua.org/source/5.5/lparser.c.html#priority
const PRECEDENCE = {
  OR: 1,
  AND: 2,
  EQUALITY: 3,
  BITOR: 4,
  BITXOR: 5,
  BITAND: 6,
  SHIFT: 7,
  CONCAT: 8,
  ADD: 9,
  MUL: 10,
  UNARY: 11,
  POWER: 12,
  // Suffix operations on primary — all left-associative, highest precedence
  CALL: 13,
  INDEX: 13,
  FIELD: 13,
};

/** @type {[string, number][]} */
const left_ops = [
  ["or", PRECEDENCE.OR],
  ["and", PRECEDENCE.AND],
  ["==", PRECEDENCE.EQUALITY],
  ["~=", PRECEDENCE.EQUALITY],
  ["<", PRECEDENCE.EQUALITY],
  ["<=", PRECEDENCE.EQUALITY],
  [">", PRECEDENCE.EQUALITY],
  [">=", PRECEDENCE.EQUALITY],
  ["|", PRECEDENCE.BITOR],
  ["~", PRECEDENCE.BITXOR],
  ["&", PRECEDENCE.BITAND],
  ["<<", PRECEDENCE.SHIFT],
  [">>", PRECEDENCE.SHIFT],
  ["+", PRECEDENCE.ADD],
  ["-", PRECEDENCE.ADD],
  ["*", PRECEDENCE.MUL],
  ["/", PRECEDENCE.MUL],
  ["//", PRECEDENCE.MUL],
  ["%", PRECEDENCE.MUL],
];

/** @type {[string, number][]} */
const right_ops = [
  ["..", PRECEDENCE.CONCAT],
  ["^", PRECEDENCE.POWER],
];

// Helper: X {',' X}
// Need to add js doc to avoid typeshit errors
/**
 *
 * @param {RuleOrLiteral} rule
 * @returns
 */
const list_of = (rule) => seq(rule, repeat(seq(",", rule)));

export default grammar({
  name: "lua",

  word: ($) => $.Name,

  extras: ($) => [$.comment, /\s/],

  externals: ($) => [$._long_string, $._long_comment_body],

  supertypes: ($) => [$.exp, $.stat], // added this to reduce `parse` noise

  // No GLR conflicts needed — single unified primary rule
  conflicts: ($) => [[$.namelist]],

  rules: {
    // =========================================================================
    // Root
    // =========================================================================

    source_file: ($) => seq(optional($.shebang), optional($.block)),

    shebang: (_) => token(/#.*/),

    // =========================================================================
    // Comments
    // =========================================================================

    comment: ($) => choice(seq("--", $._long_comment_body), seq("--", /[^\n]*/)),

    // =========================================================================
    // Identifiers
    // =========================================================================

    Name: (_) => /[a-zA-Z_][a-zA-Z0-9_]*/,

    // =========================================================================
    // Literals
    // =========================================================================

    vararg: (_) => "...",
    nil: (_) => "nil",
    boolean: (_) => choice("false", "true"),

    numeral: (_) =>
      token(
        choice(
          /0[xX][0-9a-fA-F]*\.[0-9a-fA-F]+[pP][+-]?[0-9]+/,
          /0[xX][0-9a-fA-F]+[pP][+-]?[0-9]+/,
          /0[xX][0-9a-fA-F]*\.[0-9a-fA-F]+/,
          /0[xX][0-9a-fA-F]+/,
          /[0-9]+(\.[0-9]*)?[eE][+-]?[0-9]+/,
          /\.[0-9]+[eE][+-]?[0-9]+/,
          /[0-9]+\.[0-9]*/,
          /\.[0-9]+/,
          /[0-9]+/,
        ),
      ),

    string: ($) => choice($.short_string, $.long_string),

    short_string: ($) =>
      choice(
        seq('"', repeat(choice($._string_content_double, $.escape_sequence)), '"'),
        seq("'", repeat(choice($._string_content_single, $.escape_sequence)), "'"),
      ),

    _string_content_double: (_) => token.immediate(/[^"\\\n]+/),
    _string_content_single: (_) => token.immediate(/[^'\\\n]+/),

    escape_sequence: (_) =>
      token.immediate(
        seq(
          "\\",
          choice(
            /[abfnrtvz\\"']/,
            /\n/,
            /\r\n/,
            /[0-9]{1,3}/,
            /x[0-9a-fA-F]{2}/,
            /u\{[0-9a-fA-F]+\}/,
            /z\s*/,
          ),
        ),
      ),

    long_string: ($) => $._long_string,

    // =========================================================================
    // Primary expression — unified left-recursive rule
    //
    // Models prefixexp, var, functioncall as a single rule with suffix ops.
    // Each form is distinguished by field names:
    //   base:   — root Name or parenthesized exp
    //   object: — the primary being suffixed
    //   index:  — exp inside []
    //   field:  — Name after .
    //   method: — Name after :
    //   args:   — call arguments
    //
    // Left-associativity at CALL/INDEX/FIELD precedence makes this
    // deterministic without GLR — no mutual recursion needed.
    // =========================================================================

    primary: ($) =>
      choice(
        // Base forms
        field("base", $.Name),
        seq("(", field("value", $.exp), ")"),

        // Suffix: index access  primary[exp]
        prec.left(
          PRECEDENCE.INDEX,
          seq(field("object", $.primary), "[", field("index", $.exp), "]"),
        ),

        // Suffix: field access  primary.Name
        prec.left(PRECEDENCE.FIELD, seq(field("object", $.primary), ".", field("field", $.Name))),

        // Suffix: call  primary(args)
        prec.left(PRECEDENCE.CALL, seq(field("function", $.primary), field("args", $.args))),

        // Suffix: method call  primary:Name(args)
        prec.left(
          PRECEDENCE.CALL,
          seq(field("object", $.primary), ":", field("method", $.Name), field("args", $.args)),
        ),
      ),

    // args ::= '(' [explist] ')' | tableconstructor | LiteralString
    args: ($) => choice(seq("(", optional($.explist), ")"), $.tableconstructor, $.string),

    // =========================================================================
    // Expressions
    // =========================================================================

    exp: ($) =>
      choice(
        $.nil,
        $.boolean,
        $.numeral,
        $.string,
        $.vararg,
        $.functiondef,
        $.primary,
        $.tableconstructor,
        $.binary_expression,
        $.unary_expression,
      ),

    binary_expression: ($) => {
      return choice(
        ...left_ops.map(([op, prec_val]) =>
          prec.left(
            prec_val,
            seq(field("left", $.exp), field("operator", op), field("right", $.exp)),
          ),
        ),
        ...right_ops.map(([op, prec_val]) =>
          prec.right(
            prec_val,
            seq(field("left", $.exp), field("operator", op), field("right", $.exp)),
          ),
        ),
      );
    },

    unary_expression: ($) =>
      prec(
        PRECEDENCE.UNARY,
        choice(
          ...["-", "not", "#", "~"].map((op) =>
            seq(field("operator", op), field("operand", $.exp)),
          ),
        ),
      ),

    // =========================================================================
    // Lists
    // =========================================================================

    varlist: ($) => list_of($.primary),
    namelist: ($) => list_of($.Name),
    explist: ($) => list_of($.exp),

    // =========================================================================
    // Functions
    // =========================================================================

    functiondef: ($) => seq("function", field("body", $.funcbody)),

    funcname: ($) =>
      choice(
        field("name", $.Name),
        seq(
          field("object", $.Name),
          repeat(seq(".", field("module", $.Name))),
          ".",
          field("name", $.Name),
        ),
        seq(
          field("object", $.Name),
          repeat(seq(".", field("module", $.Name))),
          ":",
          field("method", $.Name),
        ),
      ),

    funcbody: ($) =>
      seq("(", field("params", optional($.parlist)), ")", field("body", optional($.block)), "end"),

    parlist: ($) => choice(seq($.namelist, optional(seq(",", $.varargparam))), $.varargparam),

    varargparam: ($) => seq($.vararg, optional(field("name", $.Name))),

    // =========================================================================
    // Tables
    // =========================================================================

    tableconstructor: ($) => seq("{", optional($.fieldlist), "}"),

    fieldlist: ($) => seq($.field, repeat(seq($.fieldsep, $.field)), optional($.fieldsep)),

    field: ($) =>
      choice(
        seq("[", field("key", $.exp), "]", "=", field("value", $.exp)),
        seq(field("name", $.Name), "=", field("value", $.exp)),
        field("value", $.exp),
      ),

    fieldsep: (_) => choice(",", ";"),

    // =========================================================================
    // Attributes
    // =========================================================================

    attnamelist: ($) =>
      seq(
        optional($.attrib),
        field("name", $.Name),
        optional($.attrib),
        repeat(seq(",", field("name", $.Name), optional($.attrib))),
      ),

    attrib: ($) => seq("<", field("name", $.Name), ">"),

    // =========================================================================
    // Block and statements
    // =========================================================================

    block: ($) => choice(seq(repeat1($.stat), optional($.retstat)), $.retstat),

    stat: ($) =>
      choice(
        $.empty_stat,
        $.assignment,
        $.call_stat,
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

    empty_stat: (_) => ";",

    // varlist '=' explist
    // varlist uses primary instead of var — primary covers all lvalue forms
    assignment: ($) => seq(field("targets", $.varlist), "=", field("values", $.explist)),

    // functioncall as a statement — primary with args suffix
    // prec(1) resolves Name '=' vs Name '(' ambiguity at statement level
    call_stat: ($) =>
      prec(
        1,
        choice(
          seq(field("function", $.primary), field("args", $.args)),
          seq(field("object", $.primary), ":", field("method", $.Name), field("args", $.args)),
        ),
      ),

    label: ($) => seq("::", field("name", $.Name), "::"),

    break_stat: (_) => "break",

    goto_stat: ($) => seq("goto", field("label", $.Name)),

    do_stat: ($) => seq("do", field("body", optional($.block)), "end"),

    while_stat: ($) =>
      seq("while", field("condition", $.exp), "do", field("body", optional($.block)), "end"),

    repeat_stat: ($) =>
      seq("repeat", field("body", optional($.block)), "until", field("condition", $.exp)),

    if_stat: ($) =>
      seq(
        "if",
        field("condition", $.exp),
        "then",
        field("consequence", optional($.block)),
        repeat($.elseif_clause),
        optional($.else_clause),
        "end",
      ),

    elseif_clause: ($) =>
      seq("elseif", field("condition", $.exp), "then", field("consequence", optional($.block))),

    else_clause: ($) => seq("else", field("body", optional($.block))),

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
        field("body", optional($.block)),
        "end",
      ),

    generic_for: ($) =>
      seq(
        "for",
        field("names", $.namelist),
        "in",
        field("iterators", $.explist),
        "do",
        field("body", optional($.block)),
        "end",
      ),

    function_decl: ($) => seq("function", field("name", $.funcname), field("body", $.funcbody)),

    local_function: ($) =>
      seq("local", "function", field("name", $.Name), field("body", $.funcbody)),

    global_function: ($) =>
      seq("global", "function", field("name", $.Name), field("body", $.funcbody)),

    local_decl: ($) =>
      seq("local", field("names", $.attnamelist), optional(seq("=", field("values", $.explist)))),

    global_decl: ($) =>
      seq("global", field("names", $.attnamelist), optional(seq("=", field("values", $.explist)))),

    global_wildcard: ($) => seq("global", optional(field("attribute", $.attrib)), "*"),

    retstat: ($) => seq("return", optional(field("value", $.explist)), optional(";")),
  },
});
