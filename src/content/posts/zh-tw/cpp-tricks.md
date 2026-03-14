---
title: C++ 技巧
description: >-
  這是一篇來自 Codeforces 的經典博文，作者 HosseinYousefi，涵蓋了許多實用的 C++
  程式設計技巧，包括初始化列表、巨集技巧、內建函式、C++11 新特性等內容。
published: 2026-03-14T00:00:00.000Z
tags:
  - 演算法
  - C++
  - Codeforces
  - 程式設計技巧
lang: zh-tw
abbrlink: cpp-tricks
translationKey: cpp-tricks
---

我看到很多程式設計師這樣寫程式碼：

```cpp
pair<int, int> p;
vector<int> v;
p = make_pair(3, 4);
v.push_back(4); v.push_back(5);
```

其實完全可以這樣寫：

```cpp
pair<int, int> p;
vector<int> v;
p = {3, 4};
v = {4, 5};
```

## 1. 用花括號 `{}` 給容器賦值

很多人這樣寫：

```cpp
pair<int, int> p;
p = make_pair(3, 4);
```

其實可以這樣：

```cpp
pair<int, int> p;
p = {3, 4};
```

更複雜的 pair 也沒問題：

```cpp
pair<int, pair<char, long long>> p;
p = {3, {'a', 8ll}};
```

`vector`、`deque`、`set` 等其他容器呢？同樣適用。

**注意：** `stack` 和 `queue` **不支援**這種寫法。

## 2. 巨集中取得參數的名稱

可以用 `#` 符號取得傳入巨集的參數的**原始名稱字串**：

```cpp
#define what_is(x) cerr << #x << " is " << x << endl;
int a_variable = 376;
what_is(a_variable);       // 輸出 "a_variable is 376"
what_is(a_variable * 2 + 1) // 輸出 "a_variable * 2 + 1 is 753"
```

## 3. 告別一堆 `#include`！

直接用：

```cpp
#include <bits/stdc++.h>
```

這個函式庫包含了競賽中幾乎所有需要的標頭檔，例如 `algorithm`、`iostream`、`vector` 等等。相信我，你不需要再單獨引入任何東西了！

## 4. 隱藏函式（其實不隱藏，只是用得少）

### 一）`__gcd(value1, value2)`

不需要自己實作歐幾里得演算法，直接用這個函式求兩個數的最大公因數。

例：`__gcd(18, 27) = 9`

### 二）`__builtin_ffs(x)`

回傳 `x` 的最低有效位（最右邊的1）的位置索引加1。若 `x == 0`，回傳0。參數型別為 `int`，後綴 `l` 接受 `long`，後綴 `ll` 接受 `long long`。

例：`__builtin_ffs(10) = 2`，因為10的二進位是 `...1010`，最右邊的1在下標1（0-based），函式回傳 1+1=2。

### 三）`__builtin_clz(x)`

回傳 `x` 從最高有效位起**前導零的個數**。參數為 `unsigned int`，後綴 `l`/`ll` 同理。`x==0` 時回傳值未定義。

例：`__builtin_clz(16) = 27`，因為16是 `...10000`，`unsigned int` 共32位，32-5=27。

### 四）`__builtin_ctz(x)`

回傳 `x` 從最低位起**尾端零的個數**。參數為 `unsigned int`，`x==0` 時回傳值未定義。

例：`__builtin_ctz(16) = 4`，因為16是 `...10000`，尾端有4個0。

### 五）`__builtin_popcount(x)`

回傳 `x` 的二進位表示中 **1 的個數**。參數為 `unsigned int`，`x==0` 時回傳值未定義。

例：`__builtin_popcount(14) = 3`，因為14是 `...1110`，有三個1。

> 注：還有其他 `__builtin` 函式，但沒這幾個常用。如果有興趣可以自行搜尋。

## 5. 可變參數函式與巨集

我們可以寫一個接受任意數量整數並回傳其和的函式。

在 C++14 中，可以用 `auto sum(T a, Args... args)` 來處理混合型別的求和。

### 可變參數巨集：

```cpp
#define a_macro(args...) sum(args)
```

結合可變參數模板，可以寫出非常好用的除錯函式（感謝 Igorjan94）：

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

輸出：

```
a = 4
b = 8
c = 9
```

這個函式在除錯時非常有用。

## 6. CF 已支援 C++0x，為什麼還用舊版 C++？

可變參數函式屬於 C++11/C++0x 的新特性。以下是 C++11 的一些精彩功能：

### 一）基於範圍的 for 迴圈（Range-based for-loop）

舊寫法：

```cpp
set<int> s = {8, 2, 3, 1};
for (set<int>::iterator it = s.begin(); it != s.end(); ++it)
    cout << *it << ' ';
```

新寫法，簡潔多了：

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

不再需要手動寫出複雜型別名，編譯器會自動推導。例如遍歷 `set<pair<int, pair<int, int>>>` 的迭代器，以前要寫一長串，現在只需 `auto it = s.begin()`。

另外，`x.begin()` 和 `x.end()` 現在也可以寫成 `begin(x)` 和 `end(x)`。

## 來自評論的補充技巧

### 智慧換行

來自 Ximera 的評論補充：

這段程式碼：

```cpp
for(i = 1; i <= n; i++) {
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " ";
    cout << "\n";
}
```

等價於：

```cpp
for(i = 1; i <= n; i++)
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " \n"[j == m];
```

原理：`" \n"` 是一個 `char*`，`" \n"[0]` 是空白 `' '`，`" \n"[1]` 是換行 `'\n'`。

### `tie` 和 `emplace_back` 的用法

來自 tubo28 的評論補充：

`emplace_back` 比 `push_back` 快的原因：`emplace_back` 直接在 vector 末尾**原地建構**物件；而 `push_back` 會先在別處建構，再移動進去。

`tie` 還支援 `ignore` 關鍵字來**忽略某個值**：

```cpp
tuple<int, int, int, char> t (3, 4, 5, 'g');
int a, b;
tie(b, ignore, a, ignore) = t;
cout << a << ' ' << b << '\n';
// 輸出：5 3
```

作者還分享了一個雙向遍歷巨集：

```cpp
#define rep(i, begin, end) for (__typeof(end) i = (begin) - ((begin) > (end)); i != (end) - ((begin) > (end)); i += 1 - 2 * ((begin) > (end)))
```

優點：無需指定型別；根據 `begin > end` 條件自動判斷正向還是逆向遍歷。

- `rep(i, 1, 10)` → 1, 2, ..., 9
- `rep(i, 10, 1)` → 9, 8, ..., 1

還可以配合迭代器使用：

```cpp
vector<int> v = {4, 5, 6, 4, 8};
rep(it, end(v), begin(v))
    cout << *it << ' ';
// 輸出 "8 4 6 5 4"
```

### Lambda 函式

C++11 也引入了 Lambda 函式，語法如下：

```
[捕獲列表](參數列表) -> 回傳型別 { 函式主體 }
```

- 捕獲列表：不需要時寫 `[]`
- 參數列表：如 `int x, string s`
- 回傳型別：多數情況可省略
- 函式主體：正常寫

例：

```cpp
auto f = [] (int a, int b) -> int { return a + b; };
cout << f(1, 2); // 輸出 "3"
```

可用於 `sort`、`for_each` 等 STL 函式：

```cpp
vector<int> v = {3, 1, 2, 1, 8};
sort(begin(v), end(v), [] (int a, int b) { return a > b; });
// 輸出：8 3 2 1 1
```

### `move` 的用法

來自 Igorjan94 的評論補充：

處理 STL 容器時，可以用 `move` 來**移動**而非複製容器，大幅節省開銷：

```cpp
vector<int> v = {1, 2, 3, 4};
vector<int> w = move(v);
// v 現在為空，w 擁有原來 v 的內容
```

## 7. C++0x 字串

### 一）原始字串（Raw Strings）（來自 IvayloS 的評論）

定義原始字串：

```cpp
string s = R"(Hello, World!)";
```

原始字串會**忽略所有跳脫字元**，如 `\n`、`\"`。也支援多行字串，只需加上自訂分隔符：

```cpp
string r_str = R"(Dear Programmers,
I'm using C++11
Regards, Swift!)";
```

### 二）正規表示式（Regular Expressions）

C++11 支援 `regex`，建議搭配原始字串使用（因為正規中常常含有反斜線等特殊字元）：

```cpp
regex email_pattern(R"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)");
```

### 三）使用者自訂字面量（User-defined literals）

你可以定義自己的字面量後綴，例如長度單位轉換：

```cpp
long long operator "" _m(unsigned long long literal) { return literal; }
long double operator "" _cm(unsigned long long literal) { return literal / 100.0; }
long long operator "" _km(unsigned long long literal) { return literal * 1000; }

cout << 250_m;   // 250
cout << 12_km;   // 12000
cout << 421_cm;  // 4.21
```

自訂字面量的名稱必須以下劃線 `_` 開頭，參數型別只能是以下幾種之一：`const char *`、`unsigned long long int`、`long double`、`char` 等。

---

**原文連結：** [Codeforces - C++ Tricks](https://codeforces.com/blog/entry/64793)

**作者：** HosseinYousefi

**翻譯：** 本站整理

**標籤：** c++，c++0x，tricks

**按讚：** +971
