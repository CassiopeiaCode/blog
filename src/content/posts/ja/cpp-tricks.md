---
title: C++のテクニック
description: >-
  これは Codeforces の古典的な記事で、著者は HosseinYousefi。初期化リスト、マクロのテクニック、ビルトイン関数、C++11
  の新機能など、多くの実用的な C++ プログラミング技巧を網羅している。
published: 2026-03-14T00:00:00.000Z
tags:
  - アルゴリズム
  - C++
  - Codeforces
  - プログラミング技巧
lang: ja
abbrlink: cpp-tricks
translationKey: cpp-tricks
---

多くのプログラマがこんなふうにコードを書いているのを見かけます：

```cpp
pair<int, int> p;
vector<int> v;
p = make_pair(3, 4);
v.push_back(4); v.push_back(5);
```

でも、実はこう書けます：

```cpp
pair<int, int> p;
vector<int> v;
p = {3, 4};
v = {4, 5};
```

## 1. 波括弧 `{}` でコンテナに代入する

多くの人はこう書きます：

```cpp
pair<int, int> p;
p = make_pair(3, 4);
```

でも、こうできます：

```cpp
pair<int, int> p;
p = {3, 4};
```

もっと複雑な pair でも問題ありません：

```cpp
pair<int, pair<char, long long>> p;
p = {3, {'a', 8ll}};
```

`vector`、`deque`、`set` など他のコンテナも同様に使えます。

**注意：** `stack` と `queue` は**この書き方をサポートしていません**。

## 2. マクロで引数名を取得する

`#` 記号を使うと、マクロに渡した引数の**元の名前文字列**を取得できます：

```cpp
#define what_is(x) cerr << #x << " is " << x << endl;
int a_variable = 376;
what_is(a_variable);       // "a_variable is 376" を出力
what_is(a_variable * 2 + 1) // "a_variable * 2 + 1 is 753" を出力
```

## 3. たくさんの `#include` に別れを！

これを使えばOKです：

```cpp
#include <bits/stdc++.h>
```

このヘッダには、競技プログラミングでほぼ必要な全てのヘッダ（`algorithm`、`iostream`、`vector` など）が含まれています。信じてください、個別に何かを追加で include する必要はありません！

## 4. 隠れた関数（隠れているわけではなく、使われることが少ないだけ）

### 一）`__gcd(value1, value2)`

ユークリッドの互除法を自分で実装する必要はなく、この関数で2つの数の最大公約数を求められます。

例：`__gcd(18, 27) = 9`

### 二）`__builtin_ffs(x)`

`x` の最下位の立っているビット（最も右側の1）の位置インデックス + 1 を返します。`x == 0` の場合は 0 を返します。引数の型は `int` で、接尾辞 `l` は `long`、接尾辞 `ll` は `long long` を受け取ります。

例：`__builtin_ffs(10) = 2`。10 の二進数は `...1010` で、最右の 1 はインデックス 1（0-based）にあるため、関数は 1+1=2 を返します。

### 三）`__builtin_clz(x)`

`x` の最上位ビットから見た**先頭の 0 の個数**を返します。引数は `unsigned int` で、接尾辞 `l`/`ll` も同様です。`x==0` のときの戻り値は未定義です。

例：`__builtin_clz(16) = 27`。16 は `...10000` で、`unsigned int` は全32ビットなので、32-5=27。

### 四）`__builtin_ctz(x)`

`x` の最下位ビットから見た**末尾の 0 の個数**を返します。引数は `unsigned int` で、`x==0` のときの戻り値は未定義です。

例：`__builtin_ctz(16) = 4`。16 は `...10000` なので末尾に 0 が4つあります。

### 五）`__builtin_popcount(x)`

`x` の二進表現に含まれる **1 の個数**を返します。引数は `unsigned int` で、`x==0` のときの戻り値は未定義です。

例：`__builtin_popcount(14) = 3`。14 は `...1110` で 1 が3つあります。

> 注：他にも `__builtin` 関数はありますが、このあたりが特に頻出です。興味があれば各自で調べてみてください。

## 5. 可変長引数の関数とマクロ

任意個の整数を受け取り、それらの和を返す関数が書けます。

C++14 では `auto sum(T a, Args... args)` を使って、混在型の和も処理できます。

### 可変長引数マクロ：

```cpp
#define a_macro(args...) sum(args)
```

可変長テンプレートと組み合わせると、とても便利なデバッグ関数が書けます（Igorjan94 に感謝）：

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

出力：

```
a = 4
b = 8
c = 9
```

この関数はデバッグ時にとても役に立ちます。

## 6. CF はすでに C++0x をサポートしているのに、なぜ古い C++ を使うの？

可変長引数は C++11/C++0x の新機能の一つです。以下は C++11 の素晴らしい機能の一部です：

### 一）範囲ベース for ループ（Range-based for-loop）

旧来の書き方：

```cpp
set<int> s = {8, 2, 3, 1};
for (set<int>::iterator it = s.begin(); it != s.end(); ++it)
    cout << *it << ' ';
```

新しい書き方（ずっと簡潔）：

```cpp
set<int> s = {8, 2, 3, 1};
for (auto it: s)
    cout << it << ' ';
```

値を変更したいなら `auto &` を使います：

```cpp
vector<int> v = {8, 2, 3, 1};
for (auto &it: v)
    it *= 2;
```

### 二）`auto` の威力

複雑な型名を手で書く必要がなくなり、コンパイラが自動推論してくれます。例えば `set<pair<int, pair<int, int>>>` のイテレータを回すとき、以前は長い型名を書く必要がありましたが、今は `auto it = s.begin()` で済みます。

さらに、`x.begin()` と `x.end()` は `begin(x)` と `end(x)` と書くこともできます。

## コメントからの追加テクニック

### スマートな改行

Ximera のコメントから：

このコード：

```cpp
for(i = 1; i <= n; i++) {
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " ";
    cout << "\n";
}
```

は次と等価です：

```cpp
for(i = 1; i <= n; i++)
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " \n"[j == m];
```

原理：`" \n"` は `char*` で、`" \n"[0]` は空白 `' '`、`" \n"[1]` は改行 `'\n'` です。

### `tie` と `emplace_back` の使い方

tubo28 のコメントから：

`emplace_back` が `push_back` より速い理由：`emplace_back` は vector の末尾に**その場で構築**します。一方 `push_back` は別の場所で構築してからムーブします。

`tie` は `ignore` キーワードで**特定の値を無視**することもできます：

```cpp
tuple<int, int, int, char> t (3, 4, 5, 'g');
int a, b;
tie(b, ignore, a, ignore) = t;
cout << a << ' ' << b << '\n';
// 出力：5 3
```

作者は双方向に走査できるマクロも共有しています：

```cpp
#define rep(i, begin, end) for (__typeof(end) i = (begin) - ((begin) > (end)); i != (end) - ((begin) > (end)); i += 1 - 2 * ((begin) > (end)))
```

利点：型指定が不要で、`begin > end` の条件に応じて順方向/逆方向を自動判定します。

- `rep(i, 1, 10)` → 1, 2, ..., 9
- `rep(i, 10, 1)` → 9, 8, ..., 1

イテレータと組み合わせて使うこともできます：

```cpp
vector<int> v = {4, 5, 6, 4, 8};
rep(it, end(v), begin(v))
    cout << *it << ' ';
// "8 4 6 5 4" を出力
```

### Lambda 関数

C++11 は Lambda 関数も導入しました。構文は以下の通りです：

```
[キャプチャリスト](引数リスト) -> 戻り値型 { 関数本体 }
```

- キャプチャリスト：不要なら `[]`
- 引数リスト：例 `int x, string s`
- 戻り値型：多くの場合省略可能
- 関数本体：通常通り書く

例：

```cpp
auto f = [] (int a, int b) -> int { return a + b; };
cout << f(1, 2); // "3" を出力
```

`sort` や `for_each` などの STL 関数にも使えます：

```cpp
vector<int> v = {3, 1, 2, 1, 8};
sort(begin(v), end(v), [] (int a, int b) { return a > b; });
// 出力：8 3 2 1 1
```

### `move` の使い方

Igorjan94 のコメントから：

STL コンテナを扱うとき、コピーではなく `move` で**ムーブ**すると、オーバーヘッドを大幅に節約できます：

```cpp
vector<int> v = {1, 2, 3, 4};
vector<int> w = move(v);
// v は空になり、w が元の v の中身を持つ
```

## 7. C++0x の文字列

### 一）生文字列（Raw Strings）（IvayloS のコメントより）

生文字列の定義：

```cpp
string s = R"(Hello, World!)";
```

生文字列は `\n` や `\"` など、**全てのエスケープ文字を無視**します。カスタム区切りを付ければ複数行文字列も書けます：

```cpp
string r_str = R"(Dear Programmers,
I'm using C++11
Regards, Swift!)";
```

### 二）正規表現（Regular Expressions）

C++11 は `regex` をサポートしています。正規表現にはバックスラッシュなど特殊文字が頻繁に出るので、生文字列と組み合わせるのがおすすめです：

```cpp
regex email_pattern(R"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)");
```

### 三）ユーザー定義リテラル（User-defined literals）

独自のリテラル接尾辞を定義できます。例えば長さ単位の変換：

```cpp
long long operator "" _m(unsigned long long literal) { return literal; }
long double operator "" _cm(unsigned long long literal) { return literal / 100.0; }
long long operator "" _km(unsigned long long literal) { return literal * 1000; }

cout << 250_m;   // 250
cout << 12_km;   // 12000
cout << 421_cm;  // 4.21
```

ユーザー定義リテラルの名前はアンダースコア `_` から始める必要があり、引数型は `const char *`、`unsigned long long int`、`long double`、`char` など、いくつかの型に限られます。

---

**原文リンク：** [Codeforces - C++ Tricks](https://codeforces.com/blog/entry/64793)

**作者：** HosseinYousefi

**翻訳：** 本サイトにて整理

**タグ：** c++，c++0x，tricks

**いいね：** +971
