; === KEYWORDS ===
; The following keywords are reserved and cannot be used as names:

;     and       break     do        else      elseif    end
;     false     for       function  global    goto      if
;     in        local     nil       not       or        repeat
;     return    then      true      until     while

; "and", "or", "not" are handled in binop and unop.
; "false", "true", "nil" are handled in constant.
[
(break_stat) @keyword ; break is a named node type, so ...
"do"
"else"
"elseif"
"end"
"for"
"function"
"global"
"goto"
"if"
"in"
"local"
"repeat"
"return"
"then"
"until"
"while"
] @keyword

; === COMMENTS ===
(comment) @comment
(shebang) @comment.special

; === NAME/IDENTIFIER ===
(Name) @variable

; === EXPRESSIONS ===
(nil) @constant.builtin
(boolean) @boolean
(numeral) @number
(string) @string
(escape_sequence) @string.escape
(vararg) @constant.builtin
(binary_expression) @keyword.operator
(unary_expression) @keyword.operator

; === PUNCTUATIONS ===
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

; === SPECIALS ===
; Let's call these specials cuz imma put special highlighting here
; attributes
(attrib (Name) @attribute)
; for goto labels and the ::target::
(goto_stat
  (Name) @label
)
(label
  "::" @label
  (Name) @label
)

; === FUNCTIONS ===
(parlist (namelist (Name) @variable.parameter))
(varargparam (vararg) @variable.parameter)
(funcname
  (Name) @function ; This also handles the highlighting for function_decl node
)
(local_function
  (Name) @function
)
(global_function
  (Name) @function
)

; === CALLS ===
; TODO: proper highlighting for func calls
; (functioncall
;   (Name) @function
; )
