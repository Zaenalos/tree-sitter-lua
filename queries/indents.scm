; === INDENTS ===

; Indent after these openers
(do_stat) @indent
(while_stat) @indent
(repeat_stat) @indent
(if_stat) @indent
(elseif_clause) @indent
(else_clause) @indent
(numeric_for) @indent
(generic_for) @indent
(function_decl) @indent
(local_function) @indent
(global_function) @indent
(functiondef) @indent
(funcbody) @indent
(tableconstructor) @indent
(block) @indent

; Dedent on closing keywords
"end" @dedent
"until" @dedent
"else" @dedent
"elseif" @dedent

; Dedent on closing brace
"}" @dedent

; Align to opening bracket for multiline expressions
(args) @indent
")" @dedent
