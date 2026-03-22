local sum = 0
for i = 1, 10 do
  sum = sum + i
end

local function f(x, y)
  return x * y + sum
end

local t = { a = 1, b = 2, c = 3 }
return f(t.a, t.b)
