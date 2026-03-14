---
title: C++ Tricks
description: >-
  This is a classic blog post from Codeforces by HosseinYousefi, covering many
  practical C++ programming tricks, including initializer lists, macro tricks,
  built-in functions, C++11 new features, and more.
published: 2026-03-14T00:00:00.000Z
tags:
  - Algorithms
  - C++
  - Codeforces
  - Programming Tricks
lang: en
abbrlink: cpp-tricks
translationKey: cpp-tricks
---

I see many programmers write code like this:

```cpp
pair<int, int> p;
vector<int> v;
p = make_pair(3, 4);
v.push_back(4); v.push_back(5);
```

But you can totally write it like this:

```cpp
pair<int, int> p;
vector<int> v;
p = {3, 4};
v = {4, 5};
```

## 1. Assign values to containers with braces `{}`

Many people write:

```cpp
pair<int, int> p;
p = make_pair(3, 4);
```

But you can do:

```cpp
pair<int, int> p;
p = {3, 4};
```

More complex pairs work too:

```cpp
pair<int, pair<char, long long>> p;
p = {3, {'a', 8ll}};
```

What about other containers like `vector`, `deque`, `set`, etc.? Same thing.

**Note:** `stack` and `queue` **do not support** this.

## 2. Get the parameter name inside a macro

You can use the `#` symbol to get the **original name string** of the argument passed to a macro:

```cpp
#define what_is(x) cerr << #x << " is " << x << endl;
int a_variable = 376;
what_is(a_variable);       // prints "a_variable is 376"
what_is(a_variable * 2 + 1) // prints "a_variable * 2 + 1 is 753"
```

## 3. Say goodbye to a bunch of `#include`s!

Just use:

```cpp
#include <bits/stdc++.h>
```

This header includes almost everything you need in competitive programming, such as `algorithm`, `iostream`, `vector`, etc. Trust me, you won’t need to include anything else separately!

## 4. Hidden functions (not really hidden, just less used)

### 1) `__gcd(value1, value2)`

No need to implement Euclid’s algorithm yourself—use this function to compute the greatest common divisor of two numbers.

Example: `__gcd(18, 27) = 9`

### 2) `__builtin_ffs(x)`

Returns the index (1-based) of the least significant set bit (the rightmost 1) of `x`. If `x == 0`, returns 0. The parameter type is `int`; suffix `l` accepts `long`, suffix `ll` accepts `long long`.

Example: `__builtin_ffs(10) = 2`, because the binary form of 10 is `...1010`, the rightmost 1 is at index 1 (0-based), so the function returns 1+1=2.

### 3) `__builtin_clz(x)`

Returns the **number of leading zeros** in `x` starting from the most significant bit. Parameter type is `unsigned int`; suffix `l`/`ll` are similar. The result is undefined when `x==0`.

Example: `__builtin_clz(16) = 27`, because 16 is `...10000`, an `unsigned int` has 32 bits, so 32-5=27.

### 4) `__builtin_ctz(x)`

Returns the **number of trailing zeros** in `x` starting from the least significant bit. Parameter type is `unsigned int`; the result is undefined when `x==0`.

Example: `__builtin_ctz(16) = 4`, because 16 is `...10000`, with four trailing zeros.

### 5) `__builtin_popcount(x)`

Returns the **number of 1 bits** in the binary representation of `x`. Parameter type is `unsigned int`; the result is undefined when `x==0`.

Example: `__builtin_popcount(14) = 3`, because 14 is `...1110` and has three 1s.

> Note: there are other `__builtin` functions, but these are the most commonly used. If you’re interested, you can search for more.

## 5. Variadic functions and macros

We can write a function that accepts any number of integers and returns their sum.

In C++14, you can use `auto sum(T a, Args... args)` to handle sums over mixed types.

### Variadic macros:

```cpp
#define a_macro(args...) sum(args)
```

Combined with variadic templates, you can write very useful debugging functions (thanks to Igorjan94):

```cpp
#include <bits/stdc++.h>
using namespace std;

#define error(args...) { string _s = #args; replace(_s.begin(), _s.end(), ',', ' '); stringstream _ss(_s); istream_iterator<string> _it(_ss); err(_it, args); }

void err(istream_iterator<string> it) {}
template<typename T, typename... Args>
void err(istream_iterator<string> it, T a, Args... args) {
    cerr << *it << " = " << a << endl;
    err(++it, args...);
}

int main() {
    int a = 4, b = 8, c = 9;
    error(a, b, c);
}
```

Output:

```
a = 4
b = 8
c = 9
```

This function is very useful for debugging.

## 6. CF already supports C++0x—why still use old C++?

Variadic functions are a new feature in C++11/C++0x. Here are some great C++11 features:

### 1) Range-based for-loop

Old style:

```cpp
set<int> s = {8, 2, 3, 1};
for (set<int>::iterator it = s.begin(); it != s.end(); ++it)
    cout << *it << ' ';
```

New style, much cleaner:

```cpp
set<int> s = {8, 2, 3, 1};
for (auto it: s)
    cout << it << ' ';
```

If you need to modify values, use `auto &`:

```cpp
vector<int> v = {8, 2, 3, 1};
for (auto &it: v)
    it *= 2;
```

### 2) The power of `auto`

No need to manually write complex type names— the compiler deduces them automatically. For example, when iterating over a `set<pair<int, pair<int, int>>>`, you used to write a long type, but now you only need `auto it = s.begin()`.

Also, `x.begin()` and `x.end()` can now be written as `begin(x)` and `end(x)`.

## Extra tricks from the comments

### Smart newline

Added from Ximera’s comment:

This code:

```cpp
for(i = 1; i <= n; i++) {
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " ";
    cout << "\n";
}
```

is equivalent to:

```cpp
for(i = 1; i <= n; i++)
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " \n"[j == m];
```

Reason: `" \n"` is a `char*`; `" \n"[0]` is the space `' '`, and `" \n"[1]` is the newline `'\n'`.

### How to use `tie` and `emplace_back`

Added from tubo28’s comment:

Why `emplace_back` is faster than `push_back`: `emplace_back` **constructs** the object in place at the end of the vector; while `push_back` constructs it elsewhere first, then moves it in.

`tie` also supports the `ignore` keyword to **ignore a value**:

```cpp
tuple<int, int, int, char> t (3, 4, 5, 'g');
int a, b;
tie(b, ignore, a, ignore) = t;
cout << a << ' ' << b << '\n';
// output: 5 3
```

The author also shared a bidirectional iteration macro:

```cpp
#define rep(i, begin, end) for (__typeof(end) i = (begin) - ((begin) > (end)); i != (end) - ((begin) > (end)); i += 1 - 2 * ((begin) > (end)))
```

Advantages: no need to specify the type; automatically chooses forward or reverse iteration based on whether `begin > end`.

- `rep(i, 1, 10)` → 1, 2, ..., 9
- `rep(i, 10, 1)` → 9, 8, ..., 1

It can also be used with iterators:

```cpp
vector<int> v = {4, 5, 6, 4, 8};
rep(it, end(v), begin(v))
    cout << *it << ' ';
// prints "8 4 6 5 4"
```

### Lambda functions

C++11 also introduced Lambda functions, with the following syntax:

```
[capture list](parameter list) -> return type { function body }
```

- Capture list: use `[]` when not needed
- Parameter list: e.g. `int x, string s`
- Return type: usually can be omitted
- Function body: write normally

Example:

```cpp
auto f = [] (int a, int b) -> int { return a + b; };
cout << f(1, 2); // prints "3"
```

They can be used with STL functions like `sort`, `for_each`, etc.:

```cpp
vector<int> v = {3, 1, 2, 1, 8};
sort(begin(v), end(v), [] (int a, int b) { return a > b; });
// output: 8 3 2 1 1
```

### How to use `move`

Added from Igorjan94’s comment:

When dealing with STL containers, you can use `move` to **move** rather than copy the container, greatly reducing overhead:

```cpp
vector<int> v = {1, 2, 3, 4};
vector<int> w = move(v);
// v is now empty, w owns the original contents of v
```

## 7. C++0x strings

### 1) Raw Strings (from IvayloS’s comment)

Define a raw string:

```cpp
string s = R"(Hello, World!)";
```

Raw strings **ignore all escape sequences**, like `\n`, `\"`. They also support multi-line strings—just use a custom delimiter:

```cpp
string r_str = R"(Dear Programmers,
I'm using C++11
Regards, Swift!)";
```

### 2) Regular Expressions

C++11 supports `regex`, and it’s recommended to use it together with raw strings (because regex often contains backslashes and other special characters):

```cpp
regex email_pattern(R"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)");
```

### 3) User-defined literals

You can define your own literal suffixes, for example for converting length units:

```cpp
long long operator "" _m(unsigned long long literal) { return literal; }
long double operator "" _cm(unsigned long long literal) { return literal / 100.0; }
long long operator "" _km(unsigned long long literal) { return literal * 1000; }

cout << 250_m;   // 250
cout << 12_km;   // 12000
cout << 421_cm;  // 4.21
```

The name of a user-defined literal must start with an underscore `_`, and the parameter type can only be one of a few types, such as: `const char *`, `unsigned long long int`, `long double`, `char`, etc.

---

**Original link:** [Codeforces - C++ Tricks](https://codeforces.com/blog/entry/64793)

**Author:** HosseinYousefi

**Translation:** Compiled by this site

**Tags:** c++, c++0x, tricks

**Upvotes:** +971
