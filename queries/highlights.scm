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
(binary_expression "and") @keyword.operator
(binary_expression "or") @keyword.operator
(unary_expression "not") @keyword.operator
(binary_expression ["+" "-" "*" "/" "//" "%" "^"
                    "&" "|" "~" "<<" ">>" ".."
                    "==" "~=" "<" "<=" ">" ">="]) @operator
(unary_expression ["-" "#" "~"]) @operator
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

; =============================================================================
; TIER 2 — @variable fallback
; (#is-not? local) means: only fire if locals.scm hasn't resolved this node
; as a local reference. This prevents double-coloring declared locals.
; =============================================================================

((Name) @variable
 (#is-not? local))

; =============================================================================
; TIER 3 — Specific overrides (all AFTER fallback, last match wins)
; =============================================================================

; --- Attributes ---
(attrib name: (Name) @attribute)

; --- Labels ---
(goto_stat label: (Name) @label)
(label name: (Name) @label)

; --- Parameters ---
(parlist (namelist (Name) @variable.parameter))
(varargparam (vararg) @variable.parameter)

; --- Properties ---
; field: in prefixexp/var — right side of dot access
(prefixexp field: (Name) @property)
(var field: (Name) @property)
; table constructor key names: { x = 1 } → x is a property key
(field name: (Name) @property)
; funcname module: and method: are table keys
(funcname module: (Name) @property)
(funcname method: (Name) @property)

; --- Function declarations → @function ---
; function foo() / function foo.bar() / function foo:method()
(function_decl
  name: (funcname
    name: (Name) @function ; where function foo.method() | foo()
  )
)
(function_decl
  name: (funcname
    method: (Name) @function ; where function foo:method()
  )
)
; local function foo()
(local_function name: (Name) @function)
; global function foo()
(global_function name: (Name) @function)

; --- Call sites → @function.call (must be LAST) ---
; base() — call statement
(call_statement
  callee: (exp
    (prefixexp
      base: (Name) @function.call ; where `foo` is the base
    )
  )
)

; foo.field() — call statement
(call_statement
  callee: (exp
    (prefixexp
      field: (Name) @function.call ; where `bar` or whatsoever is the last index/field
    )
  )
)

; foo:method() — call statement
(call_statement
  method: (Name) @function.call ; where `method` or blah blah that comes after ":"
)

; ; obj:method()() — call statement
; (call_statement
;   callee: (prefixexp
;     object: (prefixexp)
;     method: (Name) @function.call))

; base() - call expression
(call_expression
  callee: (prefixexp
    base: (Name) @function.call
  )
)

; foo:method() - call expression
(call_expression
  method: (Name) @function.call
)

; foo.field() - call expression
(call_expression
  callee: (prefixexp
    field: (Name) @function.call
  )
)
