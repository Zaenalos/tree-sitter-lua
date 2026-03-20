; === FUNCTIONS ===
(function_decl
  "function" @keyword.function)

(local_function
  "local" @keyword
  "function" @keyword.function
  (Name) @function)

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

; === STATEMENTS ===
; SKIP empty_stat
; SKIP assignment

; === FUNCTIONS ===
