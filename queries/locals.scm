; === SCOPES ===

(source_file) @local.scope
(block) @local.scope
(funcbody) @local.scope
(do_stat) @local.scope
(while_stat) @local.scope
(repeat_stat) @local.scope
(if_stat) @local.scope
(elseif_clause) @local.scope
(else_clause) @local.scope
(numeric_for) @local.scope
(generic_for) @local.scope
(local_function) @local.scope
(global_function) @local.scope
(function_decl) @local.scope

; === DEFINITIONS ===

; local x = ...
(local_decl
  (attnamelist (Name) @local.definition))

; global x = ...
(global_decl
  (attnamelist (Name) @local.definition))

; local function foo()
(local_function
  (Name) @local.definition)

; global function foo()
(global_function
  (Name) @local.definition)

; function foo()
(function_decl
  (funcname (Name) @local.definition))

; function parameters
(parlist
  (namelist (Name) @local.definition))

(varargparam
  (vararg) @local.definition)

; numeric for variable
(numeric_for
  (Name) @local.definition)

; generic for variables
(generic_for
  (namelist (Name) @local.definition))

; === REFERENCES ===

(Name) @local.reference
