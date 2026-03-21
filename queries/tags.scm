; === TAGS — for symbol outline and go-to-symbol ===

; function foo()
(function_decl
  (funcname) @name) @definition.function

; local function foo()
(local_function
  (Name) @name) @definition.function

; global function foo()
(global_function
  (Name) @name) @definition.function

; local foo = function()
(local_decl
  (attnamelist (Name) @name)
  (explist (exp (functiondef))) ) @definition.function

; foo = function()
(assignment
  (varlist (var (Name) @name))
  (explist (exp (functiondef)))) @definition.function

; Method: function MyClass:method()
(function_decl
  (funcname
    (Name) @name)) @definition.method

; local x = ...
(local_decl
  (attnamelist (Name) @name)) @definition.var

; global x = ...
(global_decl
  (attnamelist (Name) @name)) @definition.var
