---
title: C++ 技巧翻译
description: 这是一篇来自 Codeforces 的经典博文，作者 HosseinYousefi，涵盖了许多实用的 C++ 编程技巧，包括初始化列表、宏技巧、内置函数、C++11 新特性等内容。
published: 2026-03-14T00:00:00.000Z
tags:
  - 算法
  - C++
  - Codeforces
  - 编程技巧
lang: zh
abbrlink: cpp-tricks
translationKey: cpp-tricks
---

我看到很多程序员这样写代码：

```cpp
pair<int, int> p;
vector<int> v;
p = make_pair(3, 4);
v.push_back(4); v.push_back(5);
```

其实完全可以这样写：

```cpp
pair<int, int> p;
vector<int> v;
p = {3, 4};
v = {4, 5};
```

## 1. 用花括号 `{}` 给容器赋值

很多人这样写：

```cpp
pair<int, int> p;
p = make_pair(3, 4);
```

其实可以这样：

```cpp
pair<int, int> p;
p = {3, 4};
```

更复杂的 pair 也没问题：

```cpp
pair<int, pair<char, long long>> p;
p = {3, {'a', 8ll}};
```

`vector`、`deque`、`set` 等其他容器呢？同样适用。

**注意：** `stack` 和 `queue` **不支持**这种写法。

## 2. 宏中获取参数的名称

可以用 `#` 符号获取传入宏的参数的**原始名称字符串**：

```cpp
#define what_is(x) cerr << #x << " is " << x << endl;
int a_variable = 376;
what_is(a_variable);       // 输出 "a_variable is 376"
what_is(a_variable * 2 + 1) // 输出 "a_variable * 2 + 1 is 753"
```

## 3. 告别一堆 `#include`！

直接用：

```cpp
#include <bits/stdc++.h>
```

这个库包含了竞赛中几乎所有需要的头文件，比如 `algorithm`、`iostream`、`vector` 等等。相信我，你不需要再单独引入任何东西了！

## 4. 隐藏函数（其实不隐藏，只是用得少）

### 一）`__gcd(value1, value2)`

不需要自己实现欧几里得算法，直接用这个函数求两个数的最大公约数。

例：`__gcd(18, 27) = 9`

### 二）`__builtin_ffs(x)`

返回 `x` 的最低有效位（最右边的1）的位置索引加1。若 `x == 0`，返回0。参数类型为 `int`，后缀 `l` 接受 `long`，后缀 `ll` 接受 `long long`。

例：`__builtin_ffs(10) = 2`，因为10的二进制是 `...1010`，最右边的1在下标1（0-based），函数返回 1+1=2。

### 三）`__builtin_clz(x)`

返回 `x` 从最高有效位起**前导零的个数**。参数为 `unsigned int`，后缀 `l`/`ll` 同理。`x==0` 时返回值未定义。

例：`__builtin_clz(16) = 27`，因为16是 `...10000`，`unsigned int` 共32位，32-5=27。

### 四）`__builtin_ctz(x)`

返回 `x` 从最低位起**末尾零的个数**。参数为 `unsigned int`，`x==0` 时返回值未定义。

例：`__builtin_ctz(16) = 4`，因为16是 `...10000`，末尾有4个0。

### 五）`__builtin_popcount(x)`

返回 `x` 的二进制表示中 **1 的个数**。参数为 `unsigned int`，`x==0` 时返回值未定义。

例：`__builtin_popcount(14) = 3`，因为14是 `...1110`，有三个1。

> 注：还有其他 `__builtin` 函数，但没这几个常用。如果感兴趣可以自行搜索。

## 5. 可变参数函数与宏

我们可以写一个接受任意数量整数并返回其和的函数。

在 C++14 中，可以用 `auto sum(T a, Args... args)` 来处理混合类型的求和。

### 可变参数宏：

```cpp
#define a_macro(args...) sum(args)
```

结合可变参数模板，可以写出非常好用的调试函数（感谢 Igorjan94）：

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

输出：

```
a = 4
b = 8
c = 9
```

这个函数在调试时非常有用。

## 6. CF 已支持 C++0x，为什么还用旧版 C++？

可变参数函数属于 C++11/C++0x 的新特性。以下是 C++11 的一些精彩功能：

### 一）基于范围的 for 循环（Range-based for-loop）

旧写法：

```cpp
set<int> s = {8, 2, 3, 1};
for (set<int>::iterator it = s.begin(); it != s.end(); ++it)
    cout << *it << ' ';
```

新写法，简洁多了：

```cpp
set<int> s = {8, 2, 3, 1};
for (auto it: s)
    cout << it << ' ';
```

如果需要修改值，改用 `auto &`：

```cpp
vector<int> v = {8, 2, 3, 1};
for (auto &it: v)
    it *= 2;
```

### 二）`auto` 的威力

不再需要手动写出复杂类型名，编译器会自动推导。比如遍历 `set<pair<int, pair<int, int>>>` 的迭代器，以前要写一长串，现在只需 `auto it = s.begin()`。

另外，`x.begin()` 和 `x.end()` 现在也可以写成 `begin(x)` 和 `end(x)`。

## 来自评论的补充技巧

### 智能换行

来自 Ximera 的评论补充：

这段代码：

```cpp
for(i = 1; i <= n; i++) {
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " ";
    cout << "\n";
}
```

等价于：

```cpp
for(i = 1; i <= n; i++)
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " \n"[j == m];
```

原理：`" \n"` 是一个 `char*`，`" \n"[0]` 是空格 `' '`，`" \n"[1]` 是换行 `'\n'`。

### `tie` 和 `emplace_back` 的用法

来自 tubo28 的评论补充：

`emplace_back` 比 `push_back` 快的原因：`emplace_back` 直接在 vector 末尾**原地构造**对象；而 `push_back` 会先在别处构造，再移动进去。

`tie` 还支持 `ignore` 关键字来**忽略某个值**：

```cpp
tuple<int, int, int, char> t (3, 4, 5, 'g');
int a, b;
tie(b, ignore, a, ignore) = t;
cout << a << ' ' << b << '\n';
// 输出：5 3
```

作者还分享了一个双向遍历宏：

```cpp
#define rep(i, begin, end) for (__typeof(end) i = (begin) - ((begin) > (end)); i != (end) - ((begin) > (end)); i += 1 - 2 * ((begin) > (end)))
```

优点：无需指定类型；根据 `begin > end` 条件自动判断正向还是逆向遍历。

- `rep(i, 1, 10)` → 1, 2, ..., 9
- `rep(i, 10, 1)` → 9, 8, ..., 1

还可以配合迭代器使用：

```cpp
vector<int> v = {4, 5, 6, 4, 8};
rep(it, end(v), begin(v))
    cout << *it << ' ';
// 输出 "8 4 6 5 4"
```

### Lambda 函数

C++11 还引入了 Lambda 函数，语法如下：

```
[捕获列表](参数列表) -> 返回类型 { 函数体 }
```

- 捕获列表：不需要时写 `[]`
- 参数列表：如 `int x, string s`
- 返回类型：大多数情况可省略
- 函数体：正常写

例：

```cpp
auto f = [] (int a, int b) -> int { return a + b; };
cout << f(1, 2); // 输出 "3"
```

可用于 `sort`、`for_each` 等 STL 函数：

```cpp
vector<int> v = {3, 1, 2, 1, 8};
sort(begin(v), end(v), [] (int a, int b) { return a > b; });
// 输出：8 3 2 1 1
```

### `move` 的用法

来自 Igorjan94 的评论补充：

处理 STL 容器时，可以用 `move` 来**移动**而非复制容器，大幅节省开销：

```cpp
vector<int> v = {1, 2, 3, 4};
vector<int> w = move(v);
// v 现在为空，w 拥有原来 v 的内容
```

## 7. C++0x 字符串

### 一）原始字符串（Raw Strings）（来自 IvayloS 的评论）

定义原始字符串：

```cpp
string s = R"(Hello, World!)";
```

原始字符串会**忽略所有转义字符**，如 `\n`、`\"`。也支持多行字符串，只需加上自定义分隔符：

```cpp
string r_str = R"(Dear Programmers,
I'm using C++11
Regards, Swift!)";
```

### 二）正则表达式（Regular Expressions）

C++11 支持 `regex`，建议配合原始字符串使用（因为正则中经常含有反斜杠等特殊字符）：

```cpp
regex email_pattern(R"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)");
```

### 三）用户自定义字面量（User-defined literals）

你可以定义自己的字面量后缀，例如长度单位转换：

```cpp
long long operator "" _m(unsigned long long literal) { return literal; }
long double operator "" _cm(unsigned long long literal) { return literal / 100.0; }
long long operator "" _km(unsigned long long literal) { return literal * 1000; }

cout << 250_m;   // 250
cout << 12_km;   // 12000
cout << 421_cm;  // 4.21
```

自定义字面量的名称必须以下划线 `_` 开头，参数类型只能是以下几种之一：`const char *`、`unsigned long long int`、`long double`、`char` 等。

---

**原文链接：** [Codeforces - C++ Tricks](https://codeforces.com/blog/entry/64793)

**作者：** HosseinYousefi

**翻译：** 本站整理

**标签：** c++，c++0x，tricks

**点赞：** +971
