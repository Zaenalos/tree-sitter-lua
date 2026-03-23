; === HIGHLIGHTS ===

; --- Keywords ---
[
  (break_stat)
  "do" "else" "elseif" "end" "for"
  "global" "goto" "if" "in" "local"
  "repeat" "return" "then" "until" "while"
  "function"
] @keyword

; --- Comments ---
(comment) @comment
(shebang) @comment.special

; --- Literals ---
(nil) @constant.builtin
(boolean) @boolean
(numeral) @number
(string) @string
(escape_sequence) @string.escape
(vararg) @variable.special

; --- Operators ---
(binary_expression operator: "and") @keyword.operator
(binary_expression operator: "or") @keyword.operator
(unary_expression operator: "not") @keyword.operator
(binary_expression operator: ["+" "-" "*" "/" "//" "%" "^"
                              "&" "|" "~" "<<" ">>" ".."
                              "==" "~=" "<" "<=" ">" ">="]) @operator
(unary_expression operator: ["-" "#" "~"]) @operator
(assignment "=") @operator

; --- Punctuation ---
"(" @punctuation.bracket
")" @punctuation.bracket
"[" @punctuation.bracket
"]" @punctuation.bracket
"{" @punctuation.bracket
"}" @punctuation.bracket
"::" @punctuation.delimiter
":" @punctuation.delimiter
"." @punctuation.delimiter
"," @punctuation.delimiter
";" @punctuation.delimiter

((Name) @variable
 (#is-not? local))

; --- Attributes ---
(attrib name: (Name) @attribute)

; --- Labels ---
(goto_stat label: (Name) @label)
(label name: (Name) @label)

; --- Parameters ---
(parlist (namelist (Name) @variable.parameter))
(varargparam (vararg) @variable.parameter)

; --- Special variables ---
; self is always @variable.builtin in OOP context
((Name) @variable.builtin
  (#eq? @variable.builtin "self"))

; SCREAMING_SNAKE_CASE names are constants by convention
((Name) @constant
  (#match? @constant "^[A-Z][A-Z0-9]*_[A-Z0-9_]*$"))

; --- Metamethods ---
; __index, __newindex, __call, etc.
((Name) @property.definition
  (#match? @property.definition
    "^(__add|__band|__bnot|__bor|__bxor|__call|__close|__concat|__div|__eq|__gc|__idiv|__index|__le|__len|__lt|__metatable|__mod|__mode|__mul|__name|__newindex|__pairs|__pow|__shl|__shr|__sub|__tostring|__unm)$"))

; --- Properties ---
; field: in primary — right side of dot access (foo.bar)
(primary field: (Name) @property)
; table constructor key names: { x = 1 } → x is a property key
(field name: (Name) @property)
; funcname module: and method: are table keys
(funcname module: (Name) @property)
(funcname method: (Name) @property)

; --- Builtin globals ---
; Standard library modules
((Name) @variable.builtin
  (#any-of? @variable.builtin
    "_G" "_ENV" "_VERSION"
    "coroutine" "debug" "io" "math"
    "os" "package" "string" "table" "utf8"))

; --- Builtin functions ---
((Name) @function.builtin
  (#any-of? @function.builtin
    "assert" "collectgarbage" "dofile" "error"
    "getmetatable" "ipairs" "load" "loadfile"
    "next" "pairs" "pcall" "print"
    "rawequal" "rawget" "rawlen" "rawset"
    "require" "select" "setmetatable"
    "tonumber" "tostring" "type" "warn" "xpcall"))

; --- Function declarations ---
; function foo() / function foo.bar()
(function_decl
  name: (funcname name: (Name) @function))

; function foo:method()
(function_decl
  name: (funcname method: (Name) @function))

; local function foo()
(local_function name: (Name) @function)

; global function foo()
(global_function name: (Name) @function)

; --- Call sites (must be LAST) ---
; foo() — call statement, base Name
(call_stat
  function: (primary base: (Name) @function.call))

; foo.bar() — call statement, field Name
(call_stat
  function: (primary field: (Name) @function.call))

; foo:method() — call statement, method Name
(call_stat
  method: (Name) @function.call)

; foo() — call in expression context, base Name
(primary
  function: (primary base: (Name) @function.call)
  args: (args))

; foo.bar() — call in expression context, field Name
(primary
  function: (primary field: (Name) @function.call)
  args: (args))

; foo:method() — method call in expression context
(primary
  method: (Name) @function.call
  args: (args))
