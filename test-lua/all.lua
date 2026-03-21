#!/usr/bin/env lua
-- Comprehensive Lua 5.5 grammar test file
-- Covers every rule in the eBNF spec

-- =============================================================================
-- Literals
-- =============================================================================

-- nil, boolean
local a = nil
local b = true
local c = false

-- Numeral: integers
local i1 = 3
local i2 = 345
local i3 = 0xff
local i4 = 0xBEBADA

-- Numeral: decimal floats
local f1 = 3.0
local f2 = 3.1416
local f3 = 314.16e-2
local f4 = 0.31416E1
local f5 = 34e1
local f6 = .5
local f7 = .314e2

-- Numeral: hex floats
local h1 = 0x0.1E
local h2 = 0xA23p-4
local h3 = 0X1.921FB54442D18P+1

-- Strings: double quoted
local s1 = "hello world"
local s2 = "tab:\there"
local s3 = "newline:\nhere"
local s4 = "quote: \""
local s5 = "backslash: \\"

-- Strings: single quoted
local s6 = 'single quoted'
local s7 = 'apostrophe: \''

-- Strings: escape sequences
local e1 = "\a\b\f\n\r\t\v"
local e2 = "\x41\x42\x43"
local e3 = "\65\66\67"
local e4 = "\u{1F600}"
local e5 = "\z   trimmed"

-- Strings: long strings
local ls1 = [[simple long string]]
local ls2 = [==[level 2 long string]==]
local ls3 = [=[
  multiline
  long string
]=]

-- Vararg
local function varfunc(...)
  return ...
end

-- =============================================================================
-- Expressions
-- =============================================================================

-- Binary expressions: arithmetic
local r1 = 1 + 2
local r2 = 10 - 3
local r3 = 4 * 5
local r4 = 10 / 3
local r5 = 10 // 3
local r6 = 10 % 3
local r7 = 2 ^ 10

-- Binary expressions: bitwise
local r8  = 0xFF & 0x0F
local r9  = 0xFF | 0x0F
local r10 = 0xFF ~ 0x0F
local r11 = 1 << 4
local r12 = 16 >> 2

-- Binary expressions: concat
local r13 = "hello" .. " " .. "world"

-- Binary expressions: comparison
local r14 = 1 < 2
local r15 = 1 <= 2
local r16 = 2 > 1
local r17 = 2 >= 1
local r18 = 1 == 1
local r19 = 1 ~= 2

-- Binary expressions: logical
local r20 = true and false
local r21 = false or true

-- Unary expressions
local u1 = -42
local u2 = not true
local u3 = #"hello"
local u4 = ~0xFF

-- Precedence / associativity
local p1 = 2 ^ 3 ^ 2
local p2 = "a" .. "b" .. "c"
local p3 = 1 + 2 * 3
local p4 = (1 + 2) * 3

-- =============================================================================
-- Tables
-- =============================================================================

local t1 = {}
local t2 = { 1, 2, 3 }
local t3 = { x = 1, y = 2, z = 3 }
local t4 = { 1, x = 2, [3] = "three", "four" }
local t5 = { [1 + 1] = "two" }
local t6 = { 1, 2, 3, }
local t7 = { x = 1; y = 2; }
local t8 = { inner = { a = 1, b = 2 } }

-- =============================================================================
-- Variables and assignment
-- =============================================================================

local x = 1
x = 2

local m1, m2, m3 = 1, 2, 3
m1, m2 = m2, m1

local tbl = {}
tbl[1] = "one"
tbl["key"] = "value"
tbl.field = 42

-- =============================================================================
-- Function calls
-- =============================================================================

print("hello")
math.max(1, 2, 3)

local str = "hello"
str:upper()
string.rep("ab", 3)

print({ 1, 2, 3 })
print "hello"
tostring(tonumber("42"))

-- =============================================================================
-- Function definitions
-- =============================================================================

local function greet(name)
  return "Hello, " .. name
end

function sayHi()
  print("hi")
end

local function sum(...TOTAL)
  local total = 0
  for _, v in ipairs({...}) do
    total = total + v
  end
  return total
end

local function mixed(a, b, ...)
  return a + b
end

local square = function(n)
  return n * n
end

local MyClass = {}
function MyClass:init(value)
  self.value = value
end

local M = {}
M.sub = {}
function M.sub.method()
  return true
end

-- =============================================================================
-- Control flow
-- =============================================================================

if true then
  print("true")
elseif false then
  print("elseif")
else
  print("else")
end

if 1 > 0 then
  print("positive")
end

local n = 0
while n < 5 do
  n = n + 1
end

local k = 0
repeat
  k = k + 1
until k >= 5

for i = 1, 10 do
  print(i)
end

for i = 10, 1, -1 do
  print(i)
end

for k, v in pairs({}) do
  print(k, v)
end

for i, v in ipairs({ "a", "b", "c" }) do
  print(i, v)
end

do
  local scoped = "only here"
  print(scoped)
end

for i = 1, 10 do
  if i == 5 then break end
end

do
  goto skip
  print("skipped")
  ::skip::
  print("after label")
end

-- =============================================================================
-- Attributes (Lua 5.5)
-- =============================================================================

local x <const> = 42
local y <close> = nil

-- =============================================================================
-- Global declarations (Lua 5.5)
-- =============================================================================

global z = 100
global function globalFn()
  return true
end
global w <const>
global *

-- =============================================================================
-- Return statements
-- =============================================================================

local function multi()
  return 1, 2, 3
end

local function early(x)
  if x < 0 then
    return nil
  end
  return x * 2
end

local function withSemi()
  return 42;
end

-- =============================================================================
-- Comments
-- =============================================================================

-- Single line comment

--[[
  Multi-line comment
  spanning several lines
]]

--[==[
  Long comment level 2
]==]

-- =============================================================================
-- Edge cases
-- =============================================================================

do end

;;;

local val = t8.inner.a

local arr = { { 1, 2 }, { 3, 4 } }
local elem = arr[1][2]

local paren = (1 + 2) * 3

local t9 = { [tostring(1)] = true }

local result = math.floor(math.sqrt(144))
