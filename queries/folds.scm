; === FOLDS ===

; Function bodies
(funcbody) @fold

; Control flow blocks
(do_stat) @fold
(while_stat) @fold
(repeat_stat) @fold
(if_stat) @fold
(elseif_clause) @fold
(else_clause) @fold
(numeric_for) @fold
(generic_for) @fold

; Tables
(tableconstructor) @fold

; Long strings and comments
(long_string) @fold
(comment) @fold
