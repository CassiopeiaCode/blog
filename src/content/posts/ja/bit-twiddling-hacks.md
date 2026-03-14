---
title: ビット操作テクニック
description: >-
  Sean Eron Anderson
  による古典的なビット演算テクニック集（翻訳）。本文のみを翻訳し、コードブロックは原文のままにして、直接コピーして使ったり対照しながら読めるようにしている。
published: 2026-03-14T00:00:00.000Z
tags:
  - 位演算
  - C/C++
  - コードテクニック
lang: ja
abbrlink: bit-twiddling-hacks
translationKey: bit-twiddling-hacks
---

# Bit Twiddling Hacks
By Sean Eron Anderson
seander@cs.stanford.edu

本書中の各コード断片（別途注記がない限り）はパブリックドメイン（public domain）です——あなたの望む形で利用できます。まとめとしての集合物という意味では、これらのコードと説明文全体の著作権は Sean Eron Anderson に帰属します（© 1997-2005）。これらのコードと説明文は役に立つことを期待して公開されていますが、**いかなる保証もありません**。これには、商品性や特定目的適合性に関する黙示の保証を含みますが、これらに限りません。

2005 年 5 月 5 日時点で、すべてのコードは十分にテストされています。すでに何千人もの人が目を通しています。さらに、カーネギーメロン大学計算機科学部の学部長である Randal Bryant 教授が、Uclid のコード検証システムを用いて、ほぼすべての内容を自らテストしました。教授がテストしていない部分については、私が 32 ビット機で全入力を総当たりで検査しました。

もしあなたが最初に、コード中の**実在し合理的**なバグを私に知らせてくれたなら、10 ドルの賞金を支払います（小切手または Paypal）。その金額を慈善団体に寄付してほしい場合は、20 ドル支払います。

---

## 目次（Contents）

- 操作数カウント手法について（About the operation counting methodology）
- 整数の符号を計算する（Compute the sign of an integer）
- 2 つの整数の符号が異なるかを検出する（Detect if two integers have opposite signs）
- 分岐なしで整数の絶対値 abs を計算する（Compute the integer absolute value (abs) without branching）
- 分岐なしで 2 つの整数の最小値/最大値を求める（Compute the minimum (min) or maximum (max) of two integers without branching）
- 整数が 2 の冪かどうかを判定する（Determining if an integer is a power of 2）
- 符号拡張（Sign extending）
- 固定ビット幅からの符号拡張（Sign extending from a constant bit-width）
- 可変ビット幅からの符号拡張（Sign extending from a variable bit-width）
- 3 回の操作で可変ビット幅から符号拡張する（Sign extending from a variable bit-width in 3 operations）
- 分岐なしで条件によりビットを設定/クリアする（Conditionally set or clear bits without branching）
- 分岐なしで条件により符号反転する（Conditionally negate a value without branching）
- マスクに従って 2 つの値からビットを合成する（Merge bits from two values according to a mask）
- 立っているビット数を数える（Counting bits set）
- 固定ビット幅からの符号拡張（Sign extending from a constant bit-width）
- 可変ビット幅からの符号拡張（Sign extending from a variable bit-width）
- ……（以下、原文順に段落ごとに翻訳を追加）

> 注：目次は非常に長いため、本稿は原文の順序に従って段落ごとに翻訳を追加していきます。

---

## 操作数カウント手法について（About the operation counting methodology）

本稿のアルゴリズムの「操作数」を数える際、**あらゆる C 演算子を 1 回の操作として数えます**。中間変数への代入（必ずしも RAM に書き戻されない）は操作数に含めません。もちろん、この数え方は実際の機械命令数や CPU 時間の粗い近似に過ぎません。

本稿ではすべての操作のコストが等しいと仮定します——現実には成り立ちませんが、時間の経過とともに CPU の進化がある程度この仮定に近づけています。実際の速度は、キャッシュサイズ、メモリ帯域、命令セットなど多くの細部に依存します。

結局のところ、**ベンチマーク（benchmarking）**こそが、ある方法が本当に速いかどうかを判断する最良の手段です。したがって、以下のテクニックは対象アーキテクチャ上で試す価値のある候補として捉えてください。

---

## 整数の符号を計算する（Compute the sign of an integer）

```c
int v;      // we want to find the sign of v
int sign;   // the result goes here

// CHAR_BIT is the number of bits per byte (normally 8).
sign = -(v < 0);  // if v < 0 then -1, else 0.
// or, to avoid branching on CPUs with flag registers (IA32):
sign = -(int)((unsigned int)((int)v) >> (sizeof(int) * CHAR_BIT - 1));
// or, for one less instruction (but not portable):
sign = v >> (sizeof(int) * CHAR_BIT - 1);
```

上の最後の式は、32 ビット整数では `sign = v >> 31` と等価です。直感的な書き方 `sign = -(v < 0)` より操作が 1 回少なくなります。このテクニックが成り立つ理由は、符号付き整数を右シフトすると最上位の符号ビットが他のビットに複製されるためです。負数では最上位ビットが 1、それ以外では 0 であり、全ビット 1 のパターンは `-1` に対応します。しかし残念ながら、この挙動はアーキテクチャ/実装依存です。

結果を `-1` または `+1` にしたいなら、次を使えます：

```c
sign = +1 | (v >> (sizeof(int) * CHAR_BIT - 1));  // if v < 0 then -1, else +1
```

結果を `-1`、`0`、`+1` にしたいなら、次を使えます：

```c
sign = (v != 0) | -(int)((unsigned int)((int)v) >> (sizeof(int) * CHAR_BIT - 1));
// Or, for more speed but less portability:
sign = (v != 0) | (v >> (sizeof(int) * CHAR_BIT - 1));  // -1, 0, or +1
// Or, for portability, brevity, and (perhaps) speed:
sign = (v > 0) - (v < 0); // -1, 0, or +1
```

非負かどうかだけを判定したい（非負なら `1`、そうでなければ `0`）なら、次を使えます：

> 注：2003 年 3 月 7 日、Angus Duggan は 1989 ANSI C 仕様が「符号付き右シフト」の結果を implementation-defined と定義しているため、あるシステムではこのテクニックが無効になり得ると指摘しました。より良い移植性のため、Toby Speight は 2005 年 9 月 28 日に、ここおよび全文で `CHAR_BIT` を使用し、1 バイトが常に 8 ビットであると仮定しないことを提案しました。2006 年 3 月 4 日、Angus は上で示したキャストを用いる移植版を推奨しました。2009 年 9 月 12 日、Rohit Garg は以下の「非負判定」版を提供しました。

```c
sign = 1 ^ ((unsigned int)v >> (sizeof(int) * CHAR_BIT - 1)); // if v < 0 then 0, else 1
```

---

## 2 つの整数の符号が異なるかを検出する（Detect if two integers have opposite signs）

```c
int x, y;               // input values to compare signs

bool f = ((x ^ y) < 0); // true iff x and y have opposite signs
```

Manfred Weis は 2009 年 11 月 26 日に、このテクニックを追加するよう提案してくれました。

---

## 分岐なしで整数の絶対値 abs を計算する（Compute the integer absolute value (abs) without branching）

```c
int v;           // we want to find the absolute value of v
unsigned int r;  // the result goes here
int const mask = v >> sizeof(int) * CHAR_BIT - 1;

r = (v + mask) ^ mask;
```

特許版（Patented variation）：いくつかの CPU には「整数の絶対値」命令がありません（あるいはコンパイラがそれを利用しません）。分岐のコストが高いマシンでは、上の式は直感的な書き方 `r = (v < 0) ? -(unsigned)v : v` より速い場合があります（操作数は同じですが）。

```c
r = (v ^ mask) - mask;
```

> 注：2003 年 3 月 7 日、Angus Duggan は 1989 ANSI C 仕様が「符号付き右シフト」の結果を implementation-defined と定義しているため、あるシステムではこのテクニックが無効になり得ると指摘しました。また、ANSI C は整数が 2 の補数（two's complement）表現であることを要求していないため、まれに 1 の補数（one's complement）を使う古いマシンでも失敗し得ると読んだことがあります。
>
> 2004 年 3 月 14 日、Keith H. Duggar が上の「特許版」を送ってくれました。これは乗算を必要としないため、私が最初に考えていた方法より優れていました。不運なことに、この方法は 2000 年 6 月 6 日に Vladimir Yu Volkonsky により米国で特許出願され、付与され、特許権は Sun Microsystems に譲渡されました。
>
> 2006 年 8 月 13 日、Yuriy Kaminskiy は、この特許はおそらく無効であると伝えてくれました。というのも、この方法は特許出願前にすでに公に発表されており、例えば Agner Fog が 1996 年 11 月 9 日の『How to Optimize for the Pentium Processor』で記しているからです。Yuriy は、この文書が 1997 年にロシア語に翻訳され、Vladimir が読んだ可能性もあること、さらに Internet Archive に古いリンクがあることにも触れました。
>
> 2007 年 1 月 30 日、Peter Kankowski は Microsoft Visual C++ のコンパイラ出力に着想を得た abs の版を共有してくれたため、私はそれをここでの主要案にしました。
>
> 2007 年 12 月 6 日、Hai Jin は結果が符号付きであるため、最小の負数に abs を取ってもなお負になると不満を述べました。
>
> 2008 年 4 月 15 日、Andrew Shapira は、以前 `(unsigned)` 変換が欠けていたため、直感的な書き方がオーバーフローし得ることを指摘しました。最大の移植性を得るために彼は……と提案しましたが、Vincent Lefèvre が 2008 年 7 月 9 日に ISO C99 仕様を引用して私を説得し、その提案を削除しました。すなわち、2 の補数でないマシンであっても `-(unsigned)v` は正しい結果になります。
>
> 理由は次の通りです：`-(unsigned)v` を計算する際、まず v の負値が（`2**N` を加えることで）無符号値に変換され、v の 2 の補数表現 U を得ます。その後 U を負にして `-U = 0 - U = 2**N - U = 2**N - (v+2**N) = -v = abs(v)` となります。

---

## 分岐なしで 2 つの整数の最小値/最大値を求める（Compute the minimum (min) or maximum (max) of two integers without branching）

```c
int x;  // we want to find the minimum of x and y
int y;
int r;  // the result goes here

r = y ^ ((x ^ y) & -(x < y)); // min(x, y)
```

いくつかの非常にまれなマシンでは、分岐が非常に高価で条件付き移動（conditional move）命令もない場合、上の式は直感的な書き方 `r = (x < y) ? x : y` より速いかもしれません（ただし命令が 2 本多いです）。とはいえ通常は直感的な書き方が最良です）。これは次の理由で動作します：

- `x < y` のとき、`-(x < y)` は全ビット 1 になるので、
  `r = y ^ ((x ^ y) & ~0) = y ^ x ^ y = x`。
- それ以外（`x >= y`）では `-(x < y)` は全ビット 0 なので、
  `r = y ^ ((x ^ y) & 0) = y`。

マシンによっては `(x < y)` を 0 または 1 に計算するのに分岐命令が必要になり、必ずしも有利ではありません。

最大値を求めるには、次を使います：

```c
r = x ^ ((x ^ y) & -(x < y)); // max(x, y)
```

高速だが雑（Quick and dirty）版：
`INT_MIN <= x - y <= INT_MAX` を満たすことが分かっているなら、次の書き方が使えます。`(x - y)` を 1 回だけ計算すればよいのでより速いです。注意：1989 ANSI C 仕様は「符号付き右シフト」の結果を規定していないため、これら 2 行は**移植不可**です。オーバーフローが例外を投げるなら、x と y は無符号にするか、減算時に無符号へ変換して不要な例外を避けるべきです。ただし右シフトは負の場合に全ビット 1 を生成するために符号付きオペランドが必要なので、シフトの箇所では符号付きに戻す必要があります。

```c
r = y + ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // min(x, y)
r = x - ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // max(x, y)
```

> 注：2003 年 3 月 7 日、Angus Duggan は右シフトの移植性問題を指摘しました。2005 年 5 月 3 日、Randal E. Bryant は前提条件 `INT_MIN <= x - y <= INT_MAX` を満たす必要があることを注意し、quick-and-dirty でない版を使って修正することを提案しました。2005 年 7 月 6 日、Nigel Horspoon は gcc が Pentium で直感的な書き方に対して同じコードを生成したことを観察しました（`(x < y)` の実装に依存）。2008 年 7 月 9 日、Vincent Lefèvre は古い版 `r = y + ((x - y) & -(x < y))` の減算が、オーバーフロー例外が有効な場合に危険であると指摘しました。2009 年 6 月 2 日、Timothy B. Terriberry は加減算ではなく xor を用いて、型変換とオーバーフローのリスクを減らすことを提案しました。

---

## 整数が 2 の冪かどうかを判定する（Determining if an integer is a power of 2）

```c
unsigned int v; // we want to see if v is a power of 2
bool f;         // the result goes here

f = (v & (v - 1)) == 0;
```

注意：ここでは `0` が誤って 2 の冪として扱われます。修正するには次を使います：

```c
f = v && !(v & (v - 1));
```

---

## 固定ビット幅からの符号拡張（Sign extending from a constant bit-width）

組み込み型（`char`、`int` など）では、符号拡張は自動で行われます。しかし、`b` ビットだけで格納された符号付き 2 の補数値 `x` があり、これをより多くのビット数を持つ `int` に変換したいとします。`x` が正なら単にコピーすればよいのですが、負なら符号ビットを拡張しなければなりません。

例えば 4 ビットだけで数を保持する場合、`-3` の 2 進表現は `1101` です。8 ビットなら `11111101` になります。4 ビット表現をより多くのビット表現へ変換するには、最上位ビット（符号ビット）を左側へ複製して埋める必要があり、この処理が**符号拡張**（sign extending）です。

C では、`struct` や `union` でビットフィールド（bit field）を定義できるため、固定ビット幅からの符号拡張は簡単です。例えば 5 ビットの数を完全な `int` に変換するには：

```c
int x; // convert this from using 5 bits to a full int
int r; // resulting sign extended number goes here
struct {signed int x:5;} s;
r = s.x = x;
```

以下は C++ のテンプレート関数で、同じ言語機能を用いて B ビットで表された値を 1 回の操作で変換します（もちろんコンパイラは実際にはもっと多くの命令を生成します）：

```cpp
template <typename T, unsigned B>
inline T signextend(const T x)
{
  struct {T x:B;} s;
  return s.x = x;
}

int r = signextend<signed int,5>(x);  // sign extend 5 bit number x to r
```

> 注：2005 年 5 月 2 日、John Byrd はコード中のスペルミス（おそらく HTML 整形に起因）を発見しました。2006 年 3 月 4 日、Pat Wood は ANSI C 標準がビットフィールドを符号付きにすることを保証するためには明示的に `signed` と書く必要があると指摘しました。そうでなければ符号は不定です。

---

## 可変ビット幅からの符号拡張（Sign extending from a variable bit-width）

ときには符号拡張が必要ですが、事前に数が使用しているビット数 `b` が分からないことがあります。（あるいは Java のようにビットフィールドがない言語でプログラミングしている場合。）上の固定幅の書き方は 4 回の操作が必要です。しかしビット幅が変数ではなく定数で、かつ上位ビットがすでに 0 であれば、2 回の高速な操作で済みます。

```c
unsigned b; // number of bits representing the number in x
int x;      // sign extend this b-bit number to r
int r;      // resulting sign-extended number
int const m = 1U << (b - 1); // mask can be pre-computed if b is fixed

x = x & ((1U << b) - 1);  // (Skip this if bits in x above position b are already zero.)
r = (x ^ m) - m;
```

`x` の b ビット目より上が 0 であるかどうかに依存しない、少し速いが移植性の低い方法：

```c
int const m = CHAR_BIT * sizeof(x) - b;
r = (x << m) >> m;
```

> 注：2004 年 6 月 13 日、Sean A. Irvine は符号拡張の方法をこのページに加えるよう提案し、出発点を示してくれたため、私はそれを `m = 1U << (b - 1); r = (x ^ m) - m` に最適化しました。2007 年 5 月 11 日、Shay Green は上の版を提案し、以前の版より操作を 1 回減らしました。2008 年 10 月 15 日、Vipin Sharma は、`x` が目的の b ビット以外にも 1 を含み得る場合に対処するため、1 ステップ追加することを提案しました。2009 年 12 月 31 日、Chris Pirazzi は「さらに速い版」を提案し、定数幅なら 2 操作、可変幅なら 3 操作で済むとしました。

---

## 3 回の操作で可変ビット幅から符号拡張する（Sign extending from a variable bit-width in 3 operations）

以下の方法は、乗算と除算のコストが高いマシンでは遅いかもしれません。この版は 4 回の操作が必要です。初期ビット幅 `b > 1` を保証できるなら、`r = (x * multipliers[b]) / divisors[b]` のような形で 3 回の操作に圧縮できます（配列参照が 1 回だけ必要）。

次の変種は移植性はありませんが、「算術右シフト」（arithmetic right shift：右シフトで符号を保持する）を持つアーキテクチャでは高速なはずです。Randal E. Bryant は 2005 年 5 月 3 日に初期版のバグ（`multipliers[]` を `divisors[]` の代わりに誤用）を指摘し、`x=1, b=1` の場合に失敗することを示しました。

```c
unsigned b; // number of bits representing the number in x
int x;      // sign extend this b-bit number to r
int r;      // resulting sign-extended number
#define M(B) (1U << ((sizeof(x) * CHAR_BIT) - B)) // CHAR_BIT=bits/byte
static int const multipliers[] =
{
  0,     M(1),  M(2),  M(3),  M(4),  M(5),  M(6),  M(7),
  M(8),  M(9),  M(10), M(11), M(12), M(13), M(14), M(15),
  M(16), M(17), M(18), M(19), M(20), M(21), M(22), M(23),
  M(24), M(25), M(26), M(27), M(28), M(29), M(30), M(31),
  M(32)
}; // (add more if using more than 64 bits)
static int const divisors[] =
{
  1,    ~M(1),  M(2),  M(3),  M(4),  M(5),  M(6),  M(7),
  M(8),  M(9),  M(10), M(11), M(12), M(13), M(14), M(15),
  M(16), M(17), M(18), M(19), M(20), M(21), M(22), M(23),
  M(24), M(25), M(26), M(27), M(28), M(29), M(30), M(31),
  M(32)
}; // (add more for 64 bits)
#undef M
r = (x * multipliers[b]) / divisors[b];
const int s = -b; // OR:  sizeof(x) * CHAR_BIT - b;
r = (x << s) >> s;
```

---

## 分岐なしで条件によりビットを設定/クリアする（Conditionally set or clear bits without branching）

```c
bool f;         // conditional flag
unsigned int m; // the bit mask
unsigned int w; // the word to modify:  if (f) w |= m; else w &= ~m;

w ^= (-f ^ w) & m;

// OR, for superscalar CPUs:
w = (w & ~m) | (-f & m);
```

いくつかのアーキテクチャでは、分岐を使わないことで得られる利益が、「操作数が倍に見える」不利を相殺するのに十分です。例えば AMD Athlon™ XP 2100+ での非公式な速度テストでは 5–10% 速くなることが示されました。Intel Core 2 Duo では、スーパースカラ（superscalar）に適した第 2 の書き方が第 1 のものより約 16% 速いです。

Glenn Slayden は 2003 年 12 月 11 日に最初の式を私に知らせてくれました。Marco Yu は 2007 年 4 月 3 日に superscalar 版を共有し、2 日後にタイプミスを指摘しました。

---

## 分岐なしで条件により符号反転する（Conditionally negate a value without branching）

あるフラグが false のときだけ negate（符号反転）したいなら、次の書き方で分岐を避けられます。フラグが true のときだけ negate したいなら、2 つ目の書き方を使ってください。

Avraham Plotnitzky は 2009 年 6 月 2 日に最初の版を追加するよう提案しました。乗算を避けるため、私は 2009 年 6 月 8 日に 2 つ目の版を考えました。Alfonso De Gregorio は 2009 年 11 月 26 日に括弧の欠落を指摘し、バグ賞金を獲得しました。

```c
bool fDontNegate;  // Flag indicating we should not negate v.
int v;             // Input value to negate if fDontNegate is false.
int r;             // result = fDontNegate ? v : -v;

r = (fDontNegate ^ (fDontNegate - 1)) * v;
bool fNegate;  // Flag indicating if we should negate v.
int v;         // Input value to negate if fNegate is true.
int r;         // result = fNegate ? -v : v;

r = (v ^ -fNegate) + fNegate;
```

---

## マスクに従って 2 つの値からビットを合成する（Merge bits from two values according to a mask）

```c
unsigned int a;    // value to merge in non-masked bits
unsigned int b;    // value to merge in masked bits
unsigned int mask; // 1 where bits from b should be selected; 0 where from a.
unsigned int r;    // result of (a & ~mask) | (b & mask) goes here

r = a ^ ((a ^ b) & mask);
```

これは直感的な書き方 `(a & ~mask) | (b & mask)` より操作が 1 回少なくなります。`mask` が定数なら、必ずしも有利ではありません。

Ron Jeffery は 2006 年 2 月 9 日にこのテクニックを私に送ってくれました。

---

## 立っているビット数を数える（Counting bits set）

### 素朴な方法（naive way）

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v

for (c = 0; v; v >>= 1)
{
  c += v & 1;
}
```

素朴な方法はループ 1 回につき 1 ビット処理し、立っているビットがなくなるまで続けます。そのため 32 ビット整数で最上位ビットだけが 1 の場合、32 回ループします。

---

### ルックアップテーブル法（by lookup table）

```c
static const unsigned char BitsSetTable256[256] =
{
#   define B2(n) n,     n+1,     n+1,     n+2
#   define B4(n) B2(n), B2(n+1), B2(n+1), B2(n+2)
#   define B6(n) B4(n), B4(n+1), B4(n+1), B4(n+2)
    B6(0), B6(1), B6(1), B6(2)
};

unsigned int v; // count the number of bits set in 32-bit value v
unsigned int c; // c is the total bits set in v

// Option 1:
c = BitsSetTable256[v & 0xff] +
    BitsSetTable256[(v >> 8) & 0xff] +
    BitsSetTable256[(v >> 16) & 0xff] +
    BitsSetTable256[v >> 24];

// Option 2:
unsigned char * p = (unsigned char *) &v;
c = BitsSetTable256[p[0]] +
    BitsSetTable256[p[1]] +
    BitsSetTable256[p[2]] +
    BitsSetTable256[p[3]];

// To initially generate the table algorithmically:
BitsSetTable256[0] = 0;
for (int i = 0; i < 256; i++)
{
  BitsSetTable256[i] = (i & 1) + BitsSetTable256[i / 2];
}
```

2009 年 7 月 14 日、Hallvard Furuseth はマクロを使って表の記述を圧縮することを提案しました。

---

### Brian Kernighan 法（Brian Kernighan's way）

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v
for (c = 0; v; c++)
{
  v &= v - 1; // clear the least significant bit set
}
```

Brian Kernighan の方法はループ回数が立っているビット数に等しくなります。そのため 32 ビット整数で最上位ビットだけが 1 の場合、1 回しかループしません。

この方法は『The C Programming Language（第 2 版）』の演習 2-9（1988 年）に登場します。2006 年 4 月 19 日、Donald Knuth は、この方法が Peter Wegner により CACM 3 (1960), 322 で最初に発表されたと私に教えてくれました。（さらに Derrick Lehmer も独立に発見し、1964 年に出版されたある本で発表しました。編集者は Beckenbach です。）

---

### 64 ビット命令で 14/24/32 ビットワードを数える（using 64-bit instructions）

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v

// option 1, for at most 14-bit values in v:
c = (v * 0x200040008001ULL & 0x111111111111111ULL) % 0xf;

// option 2, for at most 24-bit values in v:
c =  ((v & 0xfff) * 0x1001001001001ULL & 0x84210842108421ULL) % 0x1f;
c += (((v & 0xfff000) >> 12) * 0x1001001001001ULL & 0x84210842108421ULL)
     % 0x1f;

// option 3, for at most 32-bit values in v:
c =  ((v & 0xfff) * 0x1001001001001ULL & 0x84210842108421ULL) % 0x1f;
c += (((v & 0xfff000) >> 12) * 0x1001001001001ULL & 0x84210842108421ULL) %
     0x1f;
c += ((v >> 24) * 0x1001001001001ULL & 0x84210842108421ULL) % 0x1f;
```

この方法は 64 ビット CPU を必要とし、かつ剰余の除算が高速な場合にのみ効率的です。オプション 1 は 3 回の操作だけで済みます。オプション 2 は 10 回、オプション 3 は 15 回必要です。

Rich Schroeppel は最初に 9 ビット版（オプション 1 に似たもの）を作りました。Beeler, M., Gosper, R. W., and Schroeppel, R.『HAKMEM』の Programming Hacks 章（MIT AI Memo 239、1972 年 2 月 29 日）を参照してください。彼の方法が上の変種の着想となり、これらの変種は Sean Anderson により設計されました。Randal E. Bryant は 2005 年 5 月 3 日にいくつかのバグ修正を提供しました。Bruce Dawson は 2007 年 2 月 1 日に、以前の 12 ビット版を 14 ビットに合わせて微調整し、操作数は変えませんでした。

---

### 並列カウント（in parallel）

```c
unsigned int v; // count bits set in this (32-bit value)
unsigned int c; // store the total here
static const int S[] = {1, 2, 4, 8, 16}; // Magic Binary Numbers
static const int B[] = {0x55555555, 0x33333333, 0x0F0F0F0F, 0x00FF00FF, 0x0000FFFF};

c = v - ((v >> 1) & B[0]);
c = ((c >> S[1]) & B[1]) + (c & B[1]);
c = ((c >> S[2]) + c) & B[2];
c = ((c >> S[3]) + c) & B[3];
c = ((c >> S[4]) + c) & B[4];
```

B 配列を 2 進数で書くと：

- `B[0] = 0x55555555 = 01010101 01010101 01010101 01010101`
- `B[1] = 0x33333333 = 00110011 00110011 00110011 00110011`
- `B[2] = 0x0F0F0F0F = 00001111 00001111 00001111 00001111`
- `B[3] = 0x00FF00FF = 00000000 11111111 00000000 11111111`
- `B[4] = 0x0000FFFF = 00000000 00000000 11111111 11111111`

これら「バイナリ魔数（Binary Magic Numbers）」のパターンを延長することで、より大きな整数ビット幅に適用できます。k ビットがあるなら、配列 S と B の長さは `ceil(lg(k))` である必要があり、同じ数の式を計算します。32 ビットの `v` に対して、上の方法は 16 回の操作を使います。

---

### より良い 32 ビットのカウント法（The best method for 32-bit）

```c
v = v - ((v >> 1) & 0x55555555);                    // reuse input as temporary
v = (v & 0x33333333) + ((v >> 2) & 0x33333333);     // temp
c = ((v + (v >> 4) & 0xF0F0F0F) * 0x1010101) >> 24; // count
```

この「最良の方法」は 12 回の操作しか必要とせず、ルックアップテーブル法と同じですが、表によるメモリアクセスと潜在的なキャッシュミスのコストを避けられます。これは上の「純並列法」と、さらに古い「乗算 + 64 ビット命令」系の方法の折衷です。バイト単位で各バイトの立っているビット数を並列に数え、`0x1010101` を掛けて 24 ビット右シフトすることで 4 バイト分のカウントを合計します。

---

### 最大 128 ビットへの一般化（generalization up to 128-bit）

以下に、最大 128 ビット整数（型 `T` でパラメータ化）への一般化を示します：

```c
v = v - ((v >> 1) & (T)~(T)0/3);                           // temp
v = (v & (T)~(T)0/15*3) + ((v >> 2) & (T)~(T)0/15*3);      // temp
v = (v + (v >> 4)) & (T)~(T)0/255*15;                      // temp
c = (T)(v * ((T)~(T)0/255)) >> (sizeof(T) - 1) * CHAR_BIT; // count
```

立っているビット数（sideways addition とも呼ばれる）の詳細については、Ian Ashdown によるニュースグループ投稿が非常に参考になります。

この「最良のカウント法」は 2005 年 10 月 5 日に Andrew Shapira が私に注意を促してくれたもので、彼は『Software Optimization Guide for AMD Athlon™ 64 and Opteron™ Processors』の 187–188 ページで見つけました。2005 年 12 月 14 日に Charlie Gordon が純並列版からさらに 1 操作削ることを提案し、2005 年 12 月 30 日に Don Clugston がさらに 3 操作削りました。私は Don の提案を採用する際に 1 箇所を書き間違え、2006 年 1 月 8 日に Eric Cole がタイプミスを指摘しました。Eric はその後 2006 年 11 月 17 日に「任意ビット幅への最良法の一般化」を提案しました。2007 年 4 月 5 日、Al Williams は最初の方法の冒頭にデッドコードがあることを観察しました。

---

## 最上位ビットから指定位置までの置位数（rank）を数える（Count bits set (rank) from the most-significant bit upto a given position）

以下のコードは、あるビットの **rank** を計算します。つまり、最上位ビット（MSB）から右へ数えて、与えられた位置 `pos` まで（その位置を含む）の立っているビット（値 1）の総数です。

Juha Järvi は 2009 年 11 月 21 日に、下の「rank に基づいてビット位置を選ぶ」操作の逆としてこれを送ってくれました。

```c
  uint64_t v;       // Compute the rank (bits set) in v from the MSB to pos.
  unsigned int pos; // Bit position to count bits upto.
  uint64_t r;       // Resulting rank of bit at pos goes here.

  // Shift out bits after given position.
  r = v >> (sizeof(v) * CHAR_BIT - pos);
  // Count set bits in parallel.
  // r = (r & 0x5555...) + ((r >> 1) & 0x5555...);
  r = r - ((r >> 1) & ~0UL/3);
  // r = (r & 0x3333...) + ((r >> 2) & 0x3333...);
  r = (r & ~0UL/5) + ((r >> 2) & ~0UL/5);
  // r = (r & 0x0f0f...) + ((r >> 4) & 0x0f0f...);
  r = (r + (r >> 4)) & ~0UL/17;
  // r = r % 255;
  r = (r * (~0UL/255)) >> ((sizeof(v) - 1) * CHAR_BIT);
```

---

## rank に対応する（MSB から数えた）ビット位置を選ぶ（Select the bit position (from the most-significant bit) with the given count (rank)）

以下の 64 ビットコードは、左から右へ（MSB から）立っているビット数を数え、`r` 番目の 1 がある位置を見つけて返します。要求された rank が立っているビット総数を超える場合は 64 を返します。このコードは 32 ビット版に変えたり、右から左へ数えるようにも変更できます。

対象 CPU で分岐が速い場合、コメントアウトされている `if` 文を有効にし、その後ろの分岐なし版をコメントアウトすることを検討してください。

```c
  uint64_t v;          // Input value to find position with rank r.
  unsigned int r;      // Input: bit's desired rank [1-64].
  unsigned int s;      // Output: Resulting position of bit with rank r [1-64]
  uint64_t a, b, c, d; // Intermediate temporaries for bit count.
  unsigned int t;      // Bit count temporary.

  // Do a normal parallel bit count for a 64-bit integer,
  // but store all intermediate steps.
  // a = (v & 0x5555...) + ((v >> 1) & 0x5555...);
  a =  v - ((v >> 1) & ~0UL/3);
  // b = (a & 0x3333...) + ((a >> 2) & 0x3333...);
  b = (a & ~0UL/5) + ((a >> 2) & ~0UL/5);
  // c = (b & 0x0f0f...) + ((b >> 4) & 0x0f0f...);
  c = (b + (b >> 4)) & ~0UL/0x11;
  // d = (c & 0x00ff...) + ((c >> 8) & 0x00ff...);
  d = (c + (c >> 8)) & ~0UL/0x101;
  t = (d >> 32) + (d >> 48);
  // Now do branchless select!
  s  = 64;
  // if (r > t) {s -= 32; r -= t;}
  s -= ((t - r) & 256) >> 3; r -= (t & ((t - r) >> 8));
  t  = (d >> (s - 16)) & 0xff;
  // if (r > t) {s -= 16; r -= t;}
  s -= ((t - r) & 256) >> 4; r -= (t & ((t - r) >> 8));
  t  = (c >> (s - 8)) & 0xf;
  // if (r > t) {s -= 8; r -= t;}
  s -= ((t - r) & 256) >> 5; r -= (t & ((t - r) >> 8));
  t  = (b >> (s - 4)) & 0x7;
  // if (r > t) {s -= 4; r -= t;}
  s -= ((t - r) & 256) >> 6; r -= (t & ((t - r) >> 8));
  t  = (a >> (s - 2)) & 0x3;
  // if (r > t) {s -= 2; r -= t;}
  s -= ((t - r) & 256) >> 7; r -= (t & ((t - r) >> 8));
  t  = (v >> (s - 1)) & 0x1;
  // if (r > t) s--;
  s -= ((t - r) & 256) >> 8;
  s = 65 - s;
```

Juha Järvi は 2009 年 11 月 21 日にこのコードを私に送ってくれました。

---

## パリティ（parity）を計算する（Computing parity (1 if an odd number of bits set, 0 otherwise)）

ここでの parity とは、立っているビット数が奇数なら 1、そうでなければ 0 のことです。

### 素朴な方法（Computing parity the naive way）

以下のコードは Brian Kernighan のカウントに似た方式です。立っているビットを 1 つ消すたびに parity を反転するため、時間は立っているビット数に比例します。

```c
unsigned int v;       // word value to compute the parity of
bool parity = false;  // parity will be the parity of v

while (v)
{
  parity = !parity;
  v = v & (v - 1);
}
```

---

### ルックアップテーブルで parity を計算（Compute parity by lookup table）

```c
static const bool ParityTable256[256] =
{
#   define P2(n) n, n^1, n^1, n
#   define P4(n) P2(n), P2(n^1), P2(n^1), P2(n)
#   define P6(n) P4(n), P4(n^1), P4(n^1), P4(n)
    P6(0), P6(1), P6(1), P6(0)
};

unsigned char b;  // byte value to compute the parity of
bool parity = ParityTable256[b];

// OR, for 32-bit words:
unsigned int v;
v ^= v >> 16;
v ^= v >> 8;
bool parity = ParityTable256[v & 0xff];

// Variation:
unsigned char * p = (unsigned char *) &v;
parity = ParityTable256[p[0] ^ p[1] ^ p[2] ^ p[3]];
```

Randal E. Bryant は 2005 年 5 月 3 日に、最後の「variable p を使う変種」を追加するよう促しました（確かにとても直感的です）。2005 年 9 月 27 日、Bruce Rawles は表名のスペルミスを見つけ、10 ドルのバグ賞金を獲得しました。2006 年 10 月 9 日、Fabrice Bellard は上の 32 ビット変種を提案しました。これらは表参照が 1 回で済みます。以前の版は各バイトで 1 回ずつ、合計 4 回参照しており、より遅かったのです。2009 年 7 月 14 日、Hallvard Furuseth はマクロで表の記述を圧縮することを提案しました。

---

### 64 ビット乗算と剰余除算で 1 バイトの parity を計算（Compute parity of a byte using 64-bit multiply and modulus division）

```c
unsigned char b;  // byte value to compute the parity of
bool parity =
  (((b * 0x0101010101010101ULL) & 0x8040201008040201ULL) % 0x1FF) & 1;
```

この方法はおよそ 4 回の操作ですが、バイトにしか適用できません。

---

### 乗算で word の parity を計算（Compute parity of word with a multiply）

以下の方法は、32 ビット値の parity を 8 回の操作で計算します。64 ビットでも同様に 8 回の操作で済みます。

```c
    unsigned int v; // 32-bit word
    v ^= v >> 1;
    v ^= v >> 2;
    v = (v & 0x11111111U) * 0x11111111U;
    return (v >> 28) & 1;
    unsigned long long v; // 64-bit word
    v ^= v >> 1;
    v ^= v >> 2;
    v = (v & 0x1111111111111111UL) * 0x1111111111111111UL;
    return (v >> 60) & 1;
```

Andrew Shapira は 2007 年 9 月 2 日にこの方法を提案し、送ってくれました。

---

### 並列法（Compute parity in parallel）

```c
unsigned int v;  // word value to compute the parity of
v ^= v >> 16;
v ^= v >> 8;
v ^= v >> 4;
v &= 0xf;
return (0x6996 >> v) & 1;
```

上の方法はおよそ 9 回の操作で、32 ビット word に適用できます。バイトだけに対して使うなら、`unsigned int v;` の直後の 2 行を削ることで、およそ 5 回の操作まで最適化できます。

原理は次の通りです。シフトと XOR により 32 ビット値の 8 個のニブル（nibble）を最下位ニブルへ畳み込み、次に 2 進数 `0110 1001 1001 0110`（16 進数 `0x6996`）を「16 項目のミニ parity 表」として使い、最下位ニブルの値だけ右シフトして該当ビットを取り出し、マスクして返します。

Mathew Hendry は 2002 年 12 月 15 日に、この最後の「シフトによる表参照」の発想を指摘し、この最適化で操作数を 2 回減らせるようになりました。

---

## 値の交換（Swapping Values）

### 減算と加算で交換（Swapping values with subtraction and addition）

```c
#define SWAP(a, b) ((&(a) == &(b)) || \
                    (((a) -= (b)), ((b) += (a)), ((a) = (b) - (a))))
```

このマクロは一時変数を使わずに `a` と `b` を交換できます。冒頭の `a` と `b` が同じメモリ位置を指していないかのチェックは、その状況が起こらないと分かっているなら省略できます。（コンパイラが最適化で削除することもあります。）

オーバーフロー例外を有効にしている場合は、例外を避けるために無符号値を渡すことを推奨します。以下の XOR 交換法は、マシンによってはわずかに速いかもしれません。浮動小数点数にこのマクロを使わないでください（それらの生の整数表現を扱っている場合は別です）。

Sanjeev Sivasankaran は 2007 年 6 月 12 日にこれを追加するよう提案しました。Vincent Lefèvre は 2008 年 7 月 9 日に、減算/加算がオーバーフロー例外を引き起こし得ることを指摘しました。

---

### XOR で交換（Swapping values with XOR）

```c
#define SWAP(a, b) (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))
```

これは古いテクニックで、一時変数なしに `a` と `b` を交換します。

2005 年 1 月 20 日、Iain A. Fleming は、同一メモリ位置を交換する場合（例えば `SWAP(a[i], a[j])` で `i == j`）にこのマクロが壊れることを指摘しました。したがってその可能性があるなら、次のようにできます：

`(((&(a) == &(b)) || (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))))`（原文では類似の提案）

2009 年 7 月 14 日、Hallvard Furuseth はさらに、一部のマシンでは `(a) ^ (b)` の結果を再利用でき、より高速化できると提案しました（原文略）。

---

### XOR で個別ビット区間を交換（Swapping individual bits with XOR）

```c
unsigned int i, j; // positions of bit sequences to swap
unsigned int n;    // number of consecutive bits in each sequence
unsigned int b;    // bits to swap reside in b
unsigned int r;    // bit-swapped result goes here

unsigned int x = ((b >> i) ^ (b >> j)) & ((1U << n) - 1); // XOR temporary
r = b ^ ((x << i) | (x << j));
```

例：`b = 00101111`（2 進）として、`i = 1`（右から 2 番目）から連続する `n = 3` ビットと、`j = 5` から連続する 3 ビットを交換すると、結果は `r = 11100011`（2 進）になります。

この方法は汎用 XOR swap に似ていますが、単一ビット（またはビット区間）向けです。変数 `x` に交換する 2 区間の XOR を保持し、その後元の数に XOR してビットを反転し、交換後の状態にします。2 区間が重なっている場合、結果は未定義です。

2009 年 7 月 14 日、Hallvard Furuseth は `1 << n` を `1U << n` に変えるよう提案しました。結果が無符号に代入されること、そして符号ビットへシフトしてしまうのを避けるためです。

---

## ビット列の反転（Reversing bit sequences）

### 直感的な書き方（Reverse bits the obvious way）

```c
unsigned int v;     // input bits to be reversed
unsigned int r = v; // r will be reversed bits of v; first get LSB of v
int s = sizeof(v) * CHAR_BIT - 1; // extra shift needed at end

for (v >>= 1; v; v >>= 1)
{
  r <<= 1;
  r |= v & 1;
  s--;
}
r <<= s; // shift when v's highest bits are zero
```

2004 年 10 月 15 日、Michael Hoisie は初期版のバグを指摘しました。2005 年 5 月 3 日、Randal E. Bryant は余分な操作を 1 つ削除することを提案しました。2005 年 5 月 18 日、Behdad Esfahbod はループ反復を 1 回減らすための軽微な変更を提案しました。その後 2007 年 2 月 6 日、Liyong Zhou はさらに良い版を提案しました。ループ条件を `v != 0` に変更し、全ビットを走査せずに早期終了できるようにしました（原文の履歴説明は略）。

---

### ルックアップテーブルで word を反転（Reverse bits in word by lookup table）

```c
static const unsigned char BitReverseTable256[256] =
{
#   define R2(n)     n,     n + 2*64,     n + 1*64,     n + 3*64
#   define R4(n) R2(n), R2(n + 2*16), R2(n + 1*16), R2(n + 3*16)
#   define R6(n) R4(n), R4(n + 2*4 ), R4(n + 1*4 ), R4(n + 3*4 )
    R6(0), R6(2), R6(1), R6(3)
};

unsigned int v; // reverse 32-bit value, 8 bits at time
unsigned int c; // c will get v reversed

// Option 1:
c = (BitReverseTable256[v & 0xff] << 24) |
    (BitReverseTable256[(v >> 8) & 0xff] << 16) |
    (BitReverseTable256[(v >> 16) & 0xff] << 8) |
    (BitReverseTable256[(v >> 24) & 0xff]);

// Option 2:
unsigned char * p = (unsigned char *) &v;
unsigned char * q = (unsigned char *) &c;
q[3] = BitReverseTable256[p[0]];
q[2] = BitReverseTable256[p[1]];
q[1] = BitReverseTable256[p[2]];
q[0] = BitReverseTable256[p[3]];
```

第 1 の方法はおよそ 17 回の操作です。第 2 の方法は CPU がバイト単位の load/store に向いていると仮定すると、およそ 12 回の操作です。

2009 年 7 月 14 日、Hallvard Furuseth はマクロで表の記述を圧縮することを提案しました。

---

### 3 回の操作で 1 バイトを反転（64 ビット乗算 + 剰余）（Reverse the bits in a byte with 3 operations）

```c
unsigned char b; // reverse this (8-bit) byte

b = (b * 0x0202020202ULL & 0x010884422010ULL) % 1023;
```

乗算は 8 ビットのバイトパターンを 64 ビット内に 5 つのコピーとして扇状に展開します。AND は各 10 ビットのグループ内で（反転後に）正しい位置にあるビットを選びます。乗算と AND により、元の各ビットはある 10 ビットグループのある位置にのみ現れることが保証されます。最後に `2^10 - 1` で剰余を取ると、各 10 ビットグループが結合されます。これらのグループは 64 ビット内で互いに重ならないため、剰余演算に暗黙に含まれる「加算」動作の効果は、ビット単位 OR と同等です。

この方法は Rich Schroeppel によるもので、Beeler, M., Gosper, R. W., and Schroeppel, R.『HAKMEM』MIT AI Memo 239（1972 年 2 月 29 日）の Programming Hacks 章を参照してください。

---

### 4 回の操作で 1 バイトを反転（64 ビット乗算、除算なし）（Reverse the bits in a byte with 4 operations）

```c
unsigned char b; // reverse this byte

b = ((b * 0x80200802ULL) & 0x0884422110ULL) * 0x0101010101ULL >> 32;
```

原文では続けてビットの流れの図解が示されています（略）。注意：一部のプロセッサでは最後の 2 ステップを統合できます。レジスタにバイトアクセスできるため、あるレジスタに結果の上位 32 ビットが入るように乗算を配置し、その下位バイトを取るだけで済みます。その場合、総操作数は 6 回まで下がり得ます。

Sean Anderson は 2001 年 7 月 13 日にこの方法を提案しました。

---

### 7 回の操作で 1 バイトを反転（64 ビットを使わない）（Reverse the bits in a byte with 7 operations）

```c
b = ((b * 0x0802LU & 0x22110LU) | (b * 0x8020LU & 0x88440LU)) * 0x10101LU >> 16;
```

必ず結果を代入するか `unsigned char` にキャストして、高位のゴミ値を取り除いてください。Sean Anderson は 2001 年 7 月 13 日にこの方法を提案しました。Mike Keith は 2002 年 1 月 3 日にタイプミスを指摘し修正しました。

---

### N ビットを並列に反転：5 * lg(N) 回の操作（Reverse an N-bit quantity in parallel）

```c
unsigned int v; // 32-bit word to reverse bit order

// swap odd and even bits
v = ((v >> 1) & 0x55555555) | ((v & 0x55555555) << 1);
// swap consecutive pairs
v = ((v >> 2) & 0x33333333) | ((v & 0x33333333) << 2);
// swap nibbles ...
v = ((v >> 4) & 0x0F0F0F0F) | ((v & 0x0F0F0F0F) << 4);
// swap bytes
v = ((v >> 8) & 0x00FF00FF) | ((v & 0x00FF00FF) << 8);
// swap 2-byte long pairs
v = ( v >> 16             ) | ( v               << 16);
```

次の変種も `O(lg(N))` ですが、`v` を反転するためにより多くの操作が必要です。その利点は、定数メモリをより少なく使えることです（ループ内で定数を動的に計算します）。上の方法は N が大きい場合に適しています。上の方法を 64 ビット（またはそれ以上）整数に適用するには、パターンに従ってさらに行を追加しなければなりません。そうしないと下位 32 ビットしか反転せず、結果も下位 32 ビットにしか反映されません。

```c
unsigned int s = sizeof(v) * CHAR_BIT; // bit size; must be power of 2
unsigned int mask = ~0;
while ((s >>= 1) > 0)
{
  mask ^= (mask << s);
  v = ((v >> s) & mask) | ((v << s) & ~mask);
}
```

詳細は Dr. Dobb's Journal 1983 年の Edwin Freed による『Binary Magic Numbers』記事を参照してください。第 2 の変種は Ken Raeburn が 2005 年 9 月 13 日に提案しました。Veldmeijer は 2006 年 3 月 19 日に、最初の版の最後の行は AND が不要になり得ると述べました（原文の履歴説明略）。

---

## 剰余除算（余りの計算）（Modulus division (aka computing remainders)）

### `1 << s` による剰余（除算演算子なし）（Computing modulus division by 1 << s without a division operator）

```c
const unsigned int n;          // numerator
const unsigned int s;
const unsigned int d = 1U << s; // So d will be one of: 1, 2, 4, 8, 16, 32, ...
unsigned int m;                // m will be n % d
m = n & (d - 1);
```

ほとんどのプログラマが早い段階で学ぶテクニックですが、完全性のためにここにも収録します。

---

### `(1 << s) - 1` による剰余（除算演算子なし）（Computing modulus division by (1 << s) - 1 without a division operator）

```c
unsigned int n;                      // numerator
const unsigned int s;                // s > 0
const unsigned int d = (1 << s) - 1; // so d is either 1, 3, 7, 15, 31, ...).
unsigned int m;                      // n % d goes here.

for (m = n; n > d; n = m)
{
  for (m = 0; n; n >>= s)
  {
    m += n & d;
  }
}
// Now m is a value from 0 to d, but since with modulus division
// we want m to be 0 when it is d.
m = m == d ? 0 : m;
```

この「2 の冪より 1 小さい数への剰余」の方法は、最大で
`5 + (4 + 5 * ceil(N / s)) * ceil(lg(N / s))` 回の操作が必要です。ここで N は分子（numerator）のビット数です。言い換えると、時間計算量の上限は `O(N * lg(N))` です。

Sean Anderson は 2001 年 8 月 15 日にこの方法を提案しました。Sean A. Irvine は 2004 年 6 月 17 日に、私がコメントで「末尾は代入に置き換えられる」と誤って書いていたことを訂正しました。Michael Miller は 2005 年 4 月 25 日にタイプミスを発見しました。

---

### 並列に `(1 << s) - 1` の剰余を計算（除算演算子なし）（Computing modulus division by (1 << s) - 1 in parallel without a division operator）

> 以下のコードは 32 ビット word を例にしています！

```c
static const unsigned int M[] =
{
  0x00000000, 0x55555555, 0x33333333, 0xc71c71c7,
  0x0f0f0f0f, 0xc1f07c1f, 0x3f03f03f, 0xf01fc07f,
  0x00ff00ff, 0x07fc01ff, 0x3ff003ff, 0xffc007ff,
  0xff000fff, 0xfc001fff, 0xf0003fff, 0xc0007fff,
  0x0000ffff, 0x0001ffff, 0x0003ffff, 0x0007ffff,
  0x000fffff, 0x001fffff, 0x003fffff, 0x007fffff,
  0x00ffffff, 0x01ffffff, 0x03ffffff, 0x07ffffff,
  0x0fffffff, 0x1fffffff, 0x3fffffff, 0x7fffffff
};

static const unsigned int Q[][6] =
{
  { 0,  0,  0,  0,  0,  0}, {16,  8,  4,  2,  1,  1}, {16,  8,  4,  2,  2,  2},
  {15,  6,  3,  3,  3,  3}, {16,  8,  4,  4,  4,  4}, {15,  5,  5,  5,  5,  5},
  {12,  6,  6,  6 , 6,  6}, {14,  7,  7,  7,  7,  7}, {16,  8,  8,  8,  8,  8},
  { 9,  9,  9,  9,  9,  9}, {10, 10, 10, 10, 10, 10}, {11, 11, 11, 11, 11, 11},
  {12, 12, 12, 12, 12, 12}, {13, 13, 13, 13, 13, 13}, {14, 14, 14, 14, 14, 14},
  {15, 15, 15, 15, 15, 15}, {16, 16, 16, 16, 16, 16}, {17, 17, 17, 17, 17, 17},
  {18, 18, 18, 18, 18, 18}, {19, 19, 19, 19, 19, 19}, {20, 20, 20, 20, 20, 20},
  {21, 21, 21, 21, 21, 21}, {22, 22, 22, 22, 22, 22}, {23, 23, 23, 23, 23, 23},
  {24, 24, 24, 24, 24, 24}, {25, 25, 25, 25, 25, 25}, {26, 26, 26, 26, 26, 26},
  {27, 27, 27, 27, 27, 27}, {28, 28, 28, 28, 28, 28}, {29, 29, 29, 29, 29, 29},
  {30, 30, 30, 30, 30, 30}, {31, 31, 31, 31, 31, 31}
};

static const unsigned int R[][6] =
{
  {0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000, 0x00000000},
  {0x0000ffff, 0x000000ff, 0x0000000f, 0x00000003, 0x00000001, 0x00000001},
  {0x0000ffff, 0x000000ff, 0x0000000f, 0x00000003, 0x00000003, 0x00000003},
  {0x00007fff, 0x0000003f, 0x00000007, 0x00000007, 0x00000007, 0x00000007},
  {0x0000ffff, 0x000000ff, 0x0000000f, 0x0000000f, 0x0000000f, 0x0000000f},
  {0x00007fff, 0x0000001f, 0x0000001f, 0x0000001f, 0x0000001f, 0x0000001f},
  {0x00000fff, 0x0000003f, 0x0000003f, 0x0000003f, 0x0000003f, 0x0000003f},
  {0x00003fff, 0x0000007f, 0x0000007f, 0x0000007f, 0x0000007f, 0x0000007f},
  {0x0000ffff, 0x000000ff, 0x000000ff, 0x000000ff, 0x000000ff, 0x000000ff},
  {0x000001ff, 0x000001ff, 0x000001ff, 0x000001ff, 0x000001ff, 0x000001ff},
  {0x000003ff, 0x000003ff, 0x000003ff, 0x000003ff, 0x000003ff, 0x000003ff},
  {0x000007ff, 0x000007ff, 0x000007ff, 0x000007ff, 0x000007ff, 0x000007ff},
  {0x00000fff, 0x00000fff, 0x00000fff, 0x00000fff, 0x00000fff, 0x00000fff},
  {0x00001fff, 0x00001fff, 0x00001fff, 0x00001fff, 0x00001fff, 0x00001fff},
  {0x00003fff, 0x00003fff, 0x00003fff, 0x00003fff, 0x00003fff, 0x00003fff},
  {0x00007fff, 0x00007fff, 0x00007fff, 0x00007fff, 0x00007fff, 0x00007fff},
  {0x0000ffff, 0x0000ffff, 0x0000ffff, 0x0000ffff, 0x0000ffff, 0x0000ffff},
  {0x0001ffff, 0x0001ffff, 0x0001ffff, 0x0001ffff, 0x0001ffff, 0x0001ffff},
  {0x0003ffff, 0x0003ffff, 0x0003ffff, 0x0003ffff, 0x0003ffff, 0x0003ffff},
  {0x0007ffff, 0x0007ffff, 0x0007ffff, 0x0007ffff, 0x0007ffff, 0x0007ffff},
  {0x000fffff, 0x000fffff, 0x000fffff, 0x000fffff, 0x000fffff, 0x000fffff},
  {0x001fffff, 0x001fffff, 0x001fffff, 0x001fffff, 0x001fffff, 0x001fffff},
  {0x003fffff, 0x003fffff, 0x003fffff, 0x003fffff, 0x003fffff, 0x003fffff},
  {0x007fffff, 0x007fffff, 0x007fffff, 0x007fffff, 0x007fffff, 0x007fffff},
  {0x00ffffff, 0x00ffffff, 0x00ffffff, 0x00ffffff, 0x00ffffff, 0x00ffffff},
  {0x01ffffff, 0x01ffffff, 0x01ffffff, 0x01ffffff, 0x01ffffff, 0x01ffffff},
  {0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff, 0x03ffffff},
  {0x07ffffff, 0x07ffffff, 0x07ffffff, 0x07ffffff, 0x07ffffff, 0x07ffffff},
  {0x0fffffff, 0x0fffffff, 0x0fffffff, 0x0fffffff, 0x0fffffff, 0x0fffffff},
  {0x1fffffff, 0x1fffffff, 0x1fffffff, 0x1fffffff, 0x1fffffff, 0x1fffffff},
  {0x3fffffff, 0x3fffffff, 0x3fffffff, 0x3fffffff, 0x3fffffff, 0x3fffffff},
  {0x7fffffff, 0x7fffffff, 0x7fffffff, 0x7fffffff, 0x7fffffff, 0x7fffffff}
};

unsigned int n;       // numerator
const unsigned int s; // s > 0
const unsigned int d = (1 << s) - 1; // so d is either 1, 3, 7, 15, 31, ...).
unsigned int m;       // n % d goes here.

m = (n & M[s]) + ((n >> s) & M[s]);

for (const unsigned int * q = &Q[s][0], * r = &R[s][0]; m > d; q++, r++)
{
  m = (m >> *q) + (m & *r);
}
m = m == d ? 0 : m; // OR, less portably: m = m & -((signed)(m - d) >> s);
```

この方法は、分子を基数 `(1 << s)` の「各桁」とみなしてそれらを並列に加算し、最大 `O(lg(N))` 時間で完了します（上の 32 ビットコードでは N=32）。操作数の上限はおよそ `12 + 9 * ceil(lg(N))` です。コンパイル時に分母が分かっているなら、表を取り除き、関連エントリだけを取り出してループを展開できます。より多くのビットにも簡単に拡張できます。

直感的には、紙に結果を書き、紙を半分に切って揃え、2 つの半分の値を桁ごとに足して新しい紙に書きます。この「切って足す」過程を、これ以上切れなくなるまで繰り返します。`lg(N/s/2)` 回切った後は切らずに加算だけを続け、各加算で s ビット値が 1 つだけ残るまで繰り返します。

Sean Anderson は 2001 年 8 月 20 日にこの方法を提案しました。Randy E. Bryant は 2005 年 5 月 3 日にタイプミス（コードを貼り付けた後で変数宣言に `unsinged` と書いてしまった）を指摘しました。前のテクニックと同様に、私はコメントで「末尾は代入に置き換えられる」と誤って書いていましたが、Donald Knuth が 2006 年 4 月 19 日に訂正し代替案を提示しました（原文略）。2009 年 6 月 18 日、Sean Irvine は `((n >> s) & M[s])` を `((n & ~M[s]) >> s)` の代わりに使う変更を提案しました。通常こちらのほうが操作が少ないためです（定数 `M[s]` はすでにロード済み）。原文末尾にはいくつかの代替式が添えられています。

---

## 整数の 2 を底とする対数（最高位の立っているビット位置）を求める（Finding integer log base 2 of an integer）

### 素朴法：MSB が N ビット目、O(N) 回の操作（Find the log base 2 ... in O(N) operations）

```c
unsigned int v; // 32-bit word to find the log base 2 of
unsigned int r = 0; // r will be lg(v)

while (v >>= 1) // unroll for more speed...
{
  r++;
}
```

整数の 2 を底とする対数は、「最上位の立っているビット（MSB）の位置」と同値です。以下により高速な方法があります。

---

### 64 ビット IEEE 浮動小数点で log2 を求める（Find the log base 2 ... with an 64-bit IEEE float）

```c
int v; // 32-bit integer to find the log base 2 of
int r; // result of log_2(v) goes here
union { unsigned int u[2]; double d; } t; // temp

t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] = 0x43300000;
t.u[__FLOAT_WORD_ORDER!=LITTLE_ENDIAN] = v;
t.d -= 4503599627370496.0;
r = (t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] >> 20) - 0x3FF;
```

このコードは、32 ビット整数（パディングビットなし）を `double` の仮数（mantissa）へ書き込み、指数（exponent）を `2^52` に設定することで 64 ビット IEEE-754 `double` を構成します。次にその `double` から `2^52`（`4503599627370496.0`）を引き、結果の指数を入力値 `v` の log2 にします。最後に指数ビットを所定位置まで右シフトし、バイアス `0x3FF`（10 進で 1023）を引けばよいという仕組みです。

このテクニックは 5 回の操作だけで済みますが、多くの CPU では double 演算が遅く、さらにアーキテクチャのエンディアン（endianness）を扱う必要があります。

Eric Cole は 2006 年 1 月 15 日にこれを送ってくれました。Evan Felix は 2006 年 4 月 4 日にタイプミスを指摘しました。Vincent Lefèvre は 2008 年 7 月 9 日に、エンディアンの検査は整数のエンディアンではなく浮動小数点のエンディアンで行うべきだと注意を促しました（両者が異なる可能性があるためです）。

---

### ルックアップテーブルで log2 を求める（Find the log base 2 ... with a lookup table）

```c
static const char LogTable256[256] =
{
#define LT(n) n, n, n, n, n, n, n, n, n, n, n, n, n, n, n, n
    -1, 0, 1, 1, 2, 2, 2, 2, 3, 3, 3, 3, 3, 3, 3, 3,
    LT(4), LT(5), LT(5), LT(6), LT(6), LT(6), LT(6),
    LT(7), LT(7), LT(7), LT(7), LT(7), LT(7), LT(7), LT(7)
};

unsigned int v; // 32-bit word to find the log of
unsigned r;     // r will be lg(v)
register unsigned int t, tt; // temporaries

if (tt = v >> 16)
{
  r = (t = tt >> 8) ? 24 + LogTable256[t] : 16 + LogTable256[tt];
}
else
{
  r = (t = v >> 8) ? 8 + LogTable256[t] : LogTable256[v];
}
```

このルックアップ法は、32 ビット値の log2 を求めるのにおよそ 7 回の操作しか要りません。64 ビットに拡張するとおよそ 9 回です。さらに 4 つの表（加算を表項に符号化）を使えば、もう 1 操作減らせます。表項を `int` にすると、アーキテクチャによっては速くなるかもしれません。

上のコードは「出力値が一様に分布する」ケースに最適化されています。入力が 32 ビット空間で一様分布するなら、次の書き方を検討できます：

```c
if (tt = v >> 24)
{
  r = 24 + LogTable256[tt];
}
else if (tt = v >> 16)
{
  r = 16 + LogTable256[tt];
}
else if (tt = v >> 8)
{
  r = 8 + LogTable256[tt];
}
else
{
  r = LogTable256[v];
}
```

log 表の生成方法（アルゴリズムで初期化）：

```c
LogTable256[0] = LogTable256[1] = 0;
for (int i = 2; i < 256; i++)
{
  LogTable256[i] = 1 + LogTable256[i / 2];
}
LogTable256[0] = -1; // if you want log(0) to return -1
```

2005 年 5 月 18 日、Behdad Esfahbod と私は平均操作数をもう少し削減しました。2006 年 11 月 14 日、Emanuel Hoogeveen がさらに少し削りました。2008 年 9 月 19 日、David A. Butterfield は「一様分布入力向け」変種を追加するよう提案しました。2009 年 1 月 5 日、Venkat Reddy は `log(0)` はエラーとして `-1` を返すべきだと指摘し、私は表の第 1 項を `-1` に変更しました。

---

## de Bruijn 乗算 + ルックアップで log2 を求める（Find the log base 2 ... with multiply and lookup）

```c
uint32_t v; // find the log base 2 of 32-bit v
int r;      // result goes here

static const int MultiplyDeBruijnBitPosition[32] =
{
  0, 9, 1, 10, 13, 21, 2, 29, 11, 14, 16, 18, 22, 25, 3, 30,
  8, 12, 20, 28, 15, 17, 24, 7, 19, 27, 23, 6, 26, 5, 4, 31
};

v |= v >> 1; // first round down to one less than a power of 2
v |= v >> 2;
v |= v >> 4;
v |= v >> 8;
v |= v >> 16;

r = MultiplyDeBruijnBitPosition[(uint32_t)(v * 0x07C4ACDDU) >> 27];
```

この方法は、小さな表と 1 回の乗算で 32 ビット整数の log2 を計算します。必要な操作数は 13 回で、前の `O(lg(N))` の汎用法（最大 20 回程度になり得る）より少なく済みます。純粋なルックアップ法が最小操作数ですが、この方法は「表サイズ vs 速度」の折衷を提供します。

`v` がすでに 2 の冪であると分かっているなら、次だけで十分です：

```c
static const int MultiplyDeBruijnBitPosition2[32] =
{
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
  31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
};
r = MultiplyDeBruijnBitPosition2[(uint32_t)(v * 0x077CB531U) >> 27];
```

Eric Cole は 2006 年 1 月 8 日にこの方法を提案しました。彼は後半の「2 の冪への切り上げ」および「乗算 + ルックアップで trailing zeros を求める（de Bruijn 列）」を読んで、log2 にも使えると気づいたのです。2009 年 12 月 10 日、Mark Dickinson はさらに操作数を削減しました。`v` を直接 2 の冪に丸めるのではなく、「次の 2 の冪の 1 つ手前の値」へ丸めることを要求したのです。

---

## 整数の 10 を底とする対数を求める（Find integer log base 10 of an integer）

```c
unsigned int v; // non-zero 32-bit integer value to compute the log base 10 of
int r;          // result goes here
int t;          // temporary

static unsigned int const PowersOf10[] =
    {1, 10, 100, 1000, 10000, 100000,
     1000000, 10000000, 100000000, 1000000000};

t = (IntegerLogBase2(v) + 1) * 1233 >> 12; // (use a lg2 method from above)
r = t - (v < PowersOf10[t]);
```

整数の log10 は、上のいずれかの log2 テクニックで `IntegerLogBase2(v)` を得るところから始まります。関係式 `log10(v) = log2(v) / log2(10)` により、`1/log2(10)` を掛ける必要があり、これは `1233/4096` で近似できます（つまり 1233 を掛けて 12 ビット右シフト）。さらに 1 を足すのは、`IntegerLogBase2` が切り捨てだからです。最後に `t` は近似値（最大 1 ずれる可能性）なので、`v < PowersOf10[t]` を判定して補正し、正確な結果を得ます。

この方法は `IntegerLogBase2` より 6 回操作が増えます。マシンのメモリアクセスが速いなら、上の log2 のルックアップ法を「表項に t の値を直接格納する」形（事前に加算・乗算・シフトを表項に符号化）に変えれば、総操作数は 9 まで下げられます（v の 4 バイトに対して 4 表を仮定）。

Eric Cole は 2006 年 1 月 7 日にこの方法を追加するよう提案しました。

---

### 素朴な log10（Find integer log base 10 ... the obvious way）

```c
unsigned int v; // non-zero 32-bit integer value to compute the log base 10 of
int r;          // result goes here

r = (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
    (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
    (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
```

入力が 32 ビット空間で一様分布する場合、この方法は非常に良好に振る舞います。76% の入力が最初の比較で命中し、21% が 2 回目、2% が 3 回目……という具合です。各比較で残り範囲を約 90% ずつ縮小するため、平均操作数は 2.6 未満です。

2007 年 4 月 18 日、Emanuel Hoogeveen は除算で条件判定する変種を提案しましたが、単純比較ほど速くありませんでした。

---

## 32 ビット IEEE 浮動小数点の log2 の整数部を求める（Find integer log base 2 of a 32-bit IEEE float）

```c
const float v; // find int(log2(v)), where v > 0.0 && finite(v) && isnormal(v)
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = (c >> 23) - 127;
```

上は高速ですが、IEEE 754 互換アーキテクチャは次正規数（subnormal/denormal）もサポートします。これらは指数ビットが 0（`2^-127` を表す）で、仮数も正規化されていないため、仮数から log2 を再計算する必要があります。subnormal も扱うには次を使えます：

```c
const float v;              // find int(log2(v)), where v > 0.0 && finite(v)
int c;                      // 32-bit int c gets the result;
int x = *(const int *) &v;  // OR, for portability:  memcpy(&x, &v, sizeof x);

c = x >> 23;

if (c)
{
  c -= 127;
}
else
{ // subnormal, so recompute using mantissa: c = intlog2(x) - 149;
  register unsigned int t; // temporary
  // Note that LogTable256 was defined earlier
  if (t = x >> 16)
  {
    c = LogTable256[t] - 133;
  }
  else
  {
    c = (t = x >> 8) ? LogTable256[t] - 141 : LogTable256[x] - 149;
  }
}
```

> 注：2004 年 6 月 20 日、Sean A. Irvine は subnormal の処理を追加することを提案しました。2005 年 6 月 11 日、Falk Hüffner は ISO C99 6.5/7 が一般的な type punning の書き方 `*(int *)&` を未定義動作としていることを指摘しました（ただし 99.9% のコンパイラでは動きます）。最大の移植性のため `memcpy` を使うか、`{ float; int; }` の union を使って `memcpy` より良いコード生成を得ることを提案しました。

---

## `pow(2, r)` 乗根後の浮動小数点 log2 の整数部を求める（Find integer log base 2 of the pow(2, r)-root ...）

```c
const int r;
const float v; // find int(log2(pow((double) v, 1. / pow(2, r)))),
               // where isnormal(v) and v > 0
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = ((((c - 0x3f800000) >> r) + 0x3f800000) >> 23) - 127;
```

例えば `r = 0` なら `c = int(log2((double)v))`、`r = 1` なら `c = int(log2(sqrt((double)v)))`、`r = 2` なら `c = int(log2(pow((double)v, 1./4)))` です。

2005 年 6 月 11 日、Falk Hüffner は同様に `*(int *)&` の未定義動作を指摘し、`memcpy` を提案しました。

---

## 末尾の連続する 0（trailing zeros）を数える（Counting consecutive trailing zero bits）

### 線形法（Count trailing zeros linearly）

```c
unsigned int v;  // input to count trailing zero bits
int c;  // output: c will count v's trailing zero bits,
        // so if v is 1101000 (base 2), then c will be 3
if (v)
{
  v = (v ^ (v - 1)) >> 1;  // Set v's trailing 0s to 1s and zero rest
  for (c = 0; v; c++)
  {
    v >>= 1;
  }
}
else
{
  c = CHAR_BIT * sizeof(v);
}
```

ランダムな一様分布の 2 進数では trailing zeros の平均は 1 なので、この `O(trailing zeros)` の方法は実際それほど悪くありません。

Jim Cole は 2007 年 8 月 15 日にこの線形法を追加するよう提案しました。2007 年 10 月 22 日、Jason Cunningham は私がコードを貼り付けた際に `unsigned` 修飾を落としていたことを指摘しました。

---

### 並列法（Count trailing zeros in parallel）

```c
unsigned int v;      // 32-bit word input to count zero bits on right
unsigned int c = 32; // c will be the number of zero bits on the right
v &= -signed(v);
if (v) c--;
if (v & 0x0000FFFF) c -= 16;
if (v & 0x00FF00FF) c -= 8;
if (v & 0x0F0F0F0F) c -= 4;
if (v & 0x33333333) c -= 2;
if (v & 0x55555555) c -= 1;
```

これは基本的に「並列 log2」と等価ですが、まず最下位の 1 ビットだけを取り出し、`c` を最大値から減らしていきます。操作数の上界はおよそ `3 * lg(N) + 4`（N ビット word）です。

Bill Burdick は 2011 年 2 月 4 日に最適化を提案し、時間を `4 * lg(N)` から低減しました。

---

### 二分探索法（Count trailing zeros by binary search）

```c
unsigned int v;     // 32-bit word input to count zero bits on right
unsigned int c;     // c will be the number of zero bits on the right,
                    // so if v is 1101000 (base 2), then c will be 3
// NOTE: if 0 == v, then c = 31.
if (v & 0x1)
{
  // special case for odd v (assumed to happen half of the time)
  c = 0;
}
else
{
  c = 1;
  if ((v & 0xffff) == 0)
  {
    v >>= 16;
    c += 16;
  }
  if ((v & 0xff) == 0)
  {
    v >>= 8;
    c += 8;
  }
  if ((v & 0xf) == 0)
  {
    v >>= 4;
    c += 4;
  }
  if ((v & 0x3) == 0)
  {
    v >>= 2;
    c += 2;
  }
  c -= v & 0x1;
}
```

これは前の方法に似ていますが、`c` を加算して「二分的に範囲を狭める」点が異なります。まず下位 16 ビットが 0 かを見て、そうなら 16 ビット右シフトし `c += 16`。以降も各チェックで範囲を半分にし、最後に 1 ビットが残るまで続けます。前の方法より高速（約 33% 速い）です。if の本体が実行される回数が少ないからです。

Matt Whitlock は 2006 年 1 月 25 日にこの方法を追加するよう提案しました。Andrew Shapira は 2007 年 9 月 5 日にさらに操作数を削りました（例えば `c=1` とし、末尾で無条件に 1 回減算するなど）。

---

### 浮動小数点キャスト法（Count trailing zeros by casting to a float）

```c
unsigned int v;            // find the number of trailing zeros in v
int r;                     // the result goes here
float f = (float)(v & -v); // cast the least significant bit in v to a float
r = (*(uint32_t *)&f >> 23) - 0x7f;
```

およそ 6 回の操作で済みますが、整数→float 変換はマシンによっては高コストです。ここでは IEEE 754 の指数ビットを利用します。`v` の最下位の立っているビットだけを取り出して float にキャストし、指数からバイアスを引くことで、そのビット位置を得ます。`v` が 0 の場合、結果は `-127` になります。

---

### 剰余 + ルックアップ法（Count trailing zeros with modulus division and lookup）

```c
unsigned int v;  // find the number of trailing zeros in v
int r;           // put the result in r
static const int Mod37BitPosition[] = // map a bit value mod 37 to its position
{
  32, 0, 1, 26, 2, 23, 27, 0, 3, 16, 24, 30, 28, 11, 0, 13, 4,
  7, 17, 0, 25, 22, 31, 15, 29, 10, 12, 6, 0, 21, 14, 9, 5,
  20, 8, 19, 18
};
r = Mod37BitPosition[(-v & v) % 37];
```

この方法は、最初の 32 個のビット位置が 37 と互いに素（相対素）であるため、37 で剰余を取ると 0..36 の一意な値になり、それを小さな表で trailing zeros に写像できるという事実を利用します。操作数は 4 回ですが、剰余と表参照により状況によっては不適になるかもしれません。私は独自に思いつきましたが、後で表値の部分列を検索したところ、『Hacker's Delight』で Reiser に帰されていることを知りました。

---

### 乗算 + ルックアップ法（de Bruijn）（Count trailing zeros with multiply and lookup）

```c
unsigned int v;  // find the number of trailing zeros in 32-bit v
int r;           // result goes here
static const int MultiplyDeBruijnBitPosition[32] =
{
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
  31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
};
r = MultiplyDeBruijnBitPosition[((uint32_t)((v & -v) * 0x077CB531U)) >> 27];
```

これは「剰余 + ルックアップ」より操作が 1 回多いですが、乗算のほうが速い可能性があります。式 `(v & -v)` は最下位の立っているビットを取り出します。定数 `0x077CB531U` は de Bruijn 列で、これを掛けると上位 5 ビットにビット位置と一対一対応する一意なパターンが現れ、表参照でインデックスを得られます。立っているビットがまったくない場合は 0 を返します。

詳細は論文『Using de Bruijn Sequences to Index 1 in a Computer Word』（Charles E. Leiserson、Harald Prokof、Keith H. Randall）を参照してください。

Andrew Shapira は 2005 年 10 月 8 日にこの方法を追加するよう提案しました。2009 年 4 月 14 日、Dustin Spicuzza は、64 ビット int でコンパイルする際の問題を避けるため、乗算結果を 32 ビットへキャストする必要があると要求しました。

---

## float キャストで次の 2 の冪へ切り上げ（Round up to the next highest power of 2 by float casting）

```c
unsigned int const v; // Round this 32-bit value to the next highest power of 2
unsigned int r;       // Put the result here. (So v=3 -> r=4; v=8 -> r=8)

if (v > 1)
{
  float f = (float)v;
  unsigned int const t = 1U << ((*(unsigned int *)&f >> 23) - 0x7f);
  r = t << (t < v);
}
else
{
  r = 1;
}
```

このコードは 8 回の操作で、すべての `v <= (1<<31)` に適用できます。

高速だが雑版（値域 `1 < v < (1<<25)`）：

```c
float f = (float)(v - 1);
r = 1U << ((*(unsigned int*)(&f) >> 23) - 126);
```

quick-and-dirty 版はおよそ 6 回の操作ですが、Athlon™ XP 2100+ のベンチマークでは、下の（12 回操作の）テクニックより約 3 倍遅いことが示されました。CPU によっては、こちらのほうが適する場合もあります。

2005 年 9 月 27 日、Andi Smithers は float で lg を見つけて 2 の冪へ切り上げる方法を追加するよう提案しました。彼の版はここに似ていますが、仮数の丸めの影響で `< (1<<25)` にしか使えず、操作が 1 回多かったです。

---

## 次の 2 の冪へ切り上げ（Round up to the next highest power of 2）

```c
unsigned int v; // compute the next highest power of 2 of 32-bit v

v--;
v |= v >> 1;
v |= v >> 2;
v |= v >> 4;
v |= v >> 8;
v |= v >> 16;
v++;
```

このコードは 12 回の操作で、32 ビット整数の次（または自身）の 2 の冪を計算します。境界ケース `v=0` では 0 を返します（2 の冪ではありません）。気になるなら `v += (v == 0)` を追加して修正できます。式 `1U << (lg(v - 1) + 1)` とルックアップ表の log2 を組み合わせれば 2 操作速くできますが、表参照に適さない場面もあるため、上の書き方のほうが良い場合があります。

原理は、最上位の立っているビットを下位へ複製し、その後 1 を足してキャリーにより下位を 0 にし、最上位の上の 1 ビットを 1 にすることです。元の数がすでに 2 の冪なら、最初に `v--` して全ビット 1 にしてから戻すことで元の値が得られます。

Atul Divekar は 2010 年 9 月 5 日に、ルックアップの `floor(lg(v))` を使って `1<<(1+floor(lg(v)))` を計算すれば 8 または 9 回の操作で済むとも言及するよう提案しました。

Sean Anderson は 2001 年 9 月 14 日にこのアルゴリズムを提案しました。Pete Hart は 1997 年 2 月に、彼と William Lewis によるニュースグループ投稿へ私を導き、彼らも同じアルゴリズムに到達していました。

---

## ビットの交互配置（Morton 数の計算）（Interleaving bits (aka computing Morton Numbers)）

### 直感的な方法（Interleave bits the obvious way）

```c
unsigned short x;   // Interleave bits of x and y, so that all of the
unsigned short y;   // bits of x are in the even positions and y in the odd;
unsigned int z = 0; // z gets the resulting Morton Number.

for (int i = 0; i < sizeof(x) * CHAR_BIT; i++) // unroll for more speed...
{
  z |= (x & 1U << i) << i | (y & 1U << i) << (i + 1);
}
```

ビットの交互配置（Morton numbers）は、2 次元の整数座標を線形化するのによく使われます。`x` と `y` を 1 つの整数に結合し、その整数は直接比較でき、次の性質を持ちます：2 点の x、y 座標がどちらも近いなら、その Morton 数も通常近くなります。

---

### ルックアップテーブル法（Interleave bits by table lookup）

```c
static const unsigned short MortonTable256[256] =
{
  0x0000, 0x0001, 0x0004, 0x0005, 0x0010, 0x0011, 0x0014, 0x0015,
  0x0040, 0x0041, 0x0044, 0x0045, 0x0050, 0x0051, 0x0054, 0x0055,
  0x0100, 0x0101, 0x0104, 0x0105, 0x0110, 0x0111, 0x0114, 0x0115,
  0x0140, 0x0141, 0x0144, 0x0145, 0x0150, 0x0151, 0x0154, 0x0155,
  0x0400, 0x0401, 0x0404, 0x0405, 0x0410, 0x0411, 0x0414, 0x0415,
  0x0440, 0x0441, 0x0444, 0x0445, 0x0450, 0x0451, 0x0454, 0x0455,
  0x0500, 0x0501, 0x0504, 0x0505, 0x0510, 0x0511, 0x0514, 0x0515,
  0x0540, 0x0541, 0x0544, 0x0545, 0x0550, 0x0551, 0x0554, 0x0555,
  0x1000, 0x1001, 0x1004, 0x1005, 0x1010, 0x1011, 0x1014, 0x1015,
  0x1040, 0x1041, 0x1044, 0x1045, 0x1050, 0x1051, 0x1054, 0x1055,
  0x1100, 0x1101, 0x1104, 0x1105, 0x1110, 0x1111, 0x1114, 0x1115,
  0x1140, 0x1141, 0x1144, 0x1145, 0x1150, 0x1151, 0x1154, 0x1155,
  0x1400, 0x1401, 0x1404, 0x1405, 0x1410, 0x1411, 0x1414, 0x1415,
  0x1440, 0x1441, 0x1444, 0x1445, 0x1450, 0x1451, 0x1454, 0x1455,
  0x1500, 0x1501, 0x1504, 0x1505, 0x1510, 0x1511, 0x1514, 0x1515,
  0x1540, 0x1541, 0x1544, 0x1545, 0x1550, 0x1551, 0x1554, 0x1555,
  0x4000, 0x4001, 0x4004, 0x4005, 0x4010, 0x4011, 0x4014, 0x4015,
  0x4040, 0x4041, 0x4044, 0x4045, 0x4050, 0x4051, 0x4054, 0x4055,
  0x4100, 0x4101, 0x4104, 0x4105, 0x4110, 0x4111, 0x4114, 0x4115,
  0x4140, 0x4141, 0x4144, 0x4145, 0x4150, 0x4151, 0x4154, 0x4155,
  0x4400, 0x4401, 0x4404, 0x4405, 0x4410, 0x4411, 0x4414, 0x4415,
  0x4440, 0x4441, 0x4444, 0x4445, 0x4450, 0x4451, 0x4454, 0x4455,
  0x4500, 0x4501, 0x4504, 0x4505, 0x4510, 0x4511, 0x4514, 0x4515,
  0x4540, 0x4541, 0x4544, 0x4545, 0x4550, 0x4551, 0x4554, 0x4555,
  0x5000, 0x5001, 0x5004, 0x5005, 0x5010, 0x5011, 0x5014, 0x5015,
  0x5040, 0x5041, 0x5044, 0x5045, 0x5050, 0x5051, 0x5054, 0x5055,
  0x5100, 0x5101, 0x5104, 0x5105, 0x5110, 0x5111, 0x5114, 0x5115,
  0x5140, 0x5141, 0x5144, 0x5145, 0x5150, 0x5151, 0x5154, 0x5155,
  0x5400, 0x5401, 0x5404, 0x5405, 0x5410, 0x5411, 0x5414, 0x5415,
  0x5440, 0x5441, 0x5444, 0x5445, 0x5450, 0x5451, 0x5454, 0x5455,
  0x5500, 0x5501, 0x5504, 0x5505, 0x5510, 0x5511, 0x5514, 0x5515,
  0x5540, 0x5541, 0x5544, 0x5545, 0x5550, 0x5551, 0x5554, 0x5555
};

unsigned short x; // Interleave bits of x and y, so that all of the
unsigned short y; // bits of x are in the even positions and y in the odd;
unsigned int z;   // z gets the resulting 32-bit Morton Number.

z = MortonTable256[y >> 8]   << 17 |
    MortonTable256[x >> 8]   << 16 |
    MortonTable256[y & 0xFF] <<  1 |
    MortonTable256[x & 0xFF];
```

さらに速くしたいなら表をもう 1 枚追加できます。`y` 用に `MortonTable256` の値をあらかじめ 1 ビット左シフトした表を用意すれば、操作を 2 回減らせますが、メモリはほぼ倍になります。さらに 4 枚の表（うち 2 枚はさらに 16 ビット左シフト）にすれば、総操作数は 11 まで下げられます。

---

### 64 ビット乗算でビットを交互配置（Interleave bits with 64-bit multiply）

次の方法は 11 回の操作で 2 バイト（`unsigned short` ではない）を交互配置します。ただし多くの操作が 64 ビット乗算なので、すべてのマシンに適するわけではありません。入力 `x`、`y` は 256 未満である必要があります。

Holger Bettag は 2004 年 10 月 10 日に本稿の「乗算でビットを反転」部分を読んで着想を得て、このテクニックを追加するよう提案しました。

```c
unsigned char x;  // Interleave bits of (8-bit) x and y, so that all of the
unsigned char y;  // bits of x are in the even positions and y in the odd;
unsigned short z; // z gets the resulting 16-bit Morton Number.

z = ((x * 0x0101010101010101ULL & 0x8040201008040201ULL) *
     0x0102040810204081ULL >> 49) & 0x5555 |
    ((y * 0x0101010101010101ULL & 0x8040201008040201ULL) *
     0x0102040810204081ULL >> 48) & 0xAAAA;
```

---

### バイナリ魔数でビットを交互配置（Interleave bits by Binary Magic Numbers）

```c
static const unsigned int B[] = {0x55555555, 0x33333333, 0x0F0F0F0F, 0x00FF00FF};
static const unsigned int S[] = {1, 2, 4, 8};

unsigned int x; // Interleave lower 16 bits of x and y, so the bits of x
unsigned int y; // are in the even positions and bits from y in the odd;
unsigned int z; // z gets the resulting 32-bit Morton Number.
                // x and y must initially be less than 65536.

x = (x | (x << S[3])) & B[3];
x = (x | (x << S[2])) & B[2];
x = (x | (x << S[1])) & B[1];
x = (x | (x << S[0])) & B[0];

y = (y | (y << S[3])) & B[3];
y = (y | (y << S[2])) & B[2];
y = (y | (y << S[1])) & B[1];
y = (y | (y << S[0])) & B[0];

z = x | (y << 1);
```

---

## word 内のバイト範囲をテストする（および出現回数を数える）（Testing for ranges of bytes in a word）

### word に 0 バイトが含まれるかを判定（Determine if a word has a zero byte）

```c
// Fewer operations:
unsigned int v; // 32-bit word to check if any 8-bit byte in it is 0
bool hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
```

この書き方は「1 回に 1 word ずつコピーする高速な文字列コピー」で有用です。必要な操作は 5 回だけです。対して、以下の直感的な方法は最低でも 7 回、最大 12 回の操作が必要です。

```c
// More operations:
bool hasNoZeroByte = ((v & 0xff) && (v & 0xff00) && (v & 0xff0000) && (v & 0xff000000))
// OR:
unsigned char * p = (unsigned char *) &v;
bool hasNoZeroByte = *p && *(p + 1) && *(p + 2) && *(p + 3);
```

さらに「0 バイトがあるかもしれない」という事前検査をより速く（4 回の操作で）行えます。このテストは最上位バイトが `0x80` のとき偽陽性を出すため、ヒットした場合はより確実な版で再検証して、性能を上げつつ正しさを保てます。

```c
bool hasZeroByte = ((v + 0x7efefeff) ^ ~v) & 0x81010100;
if (hasZeroByte) // or may just have 0x80 in the high byte
{
  hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
}
```

さらに速い方法として、下で定義する `hasless(v, 1)` を使う方法があります。これは 4 回の操作で、後続の検証も不要です。次のように簡約できます：

```c
#define haszero(v) (((v) - 0x01010101UL) & ~(v) & 0x80808080UL)
```

ここで `(v - 0x01010101UL)` は、あるバイトが 0 か `0x80` より大きい場合にそのバイトの上位ビットへボローを生じさせます。`~v & 0x80808080UL` は上位ビットが立っていない（つまり < 0x80）バイトを選びます。両者を AND すると、残るのは「バイトがちょうど 0」である位置です。

Paul Messmer は 2004 年 10 月 2 日により速い事前検査の改善を提案しました。Juha Järvi は 2005 年 4 月 6 日に `haszero` を提案しました（Paul Hsieh の Assembly Lab で見たとのこと。さらに早くは 1987 年 4 月 27 日の Alan Mycroft のニュースグループ投稿にも登場します）。

---

### word に n と等しいバイトがあるかを判定（Determine if a word has a byte equal to n）

word に指定値と等しいバイトが存在するかを知りたいなら、`x` と「各バイトを n で埋めた word」を XOR します。等しいバイトは XOR 後に 0、そうでなければ非 0 になります。あとは結果を `haszero` に渡すだけです。

```c
#define hasvalue(x,n) \
(haszero((x) ^ (~0UL/255 * (n))))
```

Stephen M Bennet は 2009 年 12 月 13 日にこのテクニックを追加するよう提案しました。

---

### word に n 未満のバイトがあるかを判定（Determine if a word has a byte less than n）

word `x` が `< n` を満たす無符号バイトを含むかをテストします。特に `n=1` のとき、0 バイト検出（1 回に long を 1 つチェック）に使えますし、マスク XOR を行った後に任意バイトを検出する用途にも使えます。`n` が定数なら、算術/論理操作 4 回で済みます。

要件：`x >= 0`；`0 <= n <= 128`

```c
#define hasless(x,n) (((x)-~0UL/255*(n))&~(x)&~0UL/255*128)
```

`x` 中で n 未満のバイト数を数える（7 回の操作）には：

```c
#define countless(x,n) \
(((~0UL/255*(127+(n))-((x)&~0UL/255*127))&~(x)&~0UL/255*128)/128%255)
```

Juha Järvi は 2005 年 4 月 6 日にこの巧妙な方法を私に送ってくれました。Sean Anderson は 2005 年 4 月 10 日にそこから着想を得てマクロ定義（および下の `hasmore/countmore` など）を追加しました。

---

### word に n より大きいバイトがあるかを判定（Determine if a word has a byte greater than n）

word `x` が `> n` を満たす無符号バイトを含むかをテストします。n が定数なら操作は 3 回だけです。

要件：`x >= 0`；`0 <= n <= 127`

```c
#define hasmore(x,n) (((x)+~0UL/255*(127-(n))|(x))&~0UL/255*128)
```

`x` 中で n より大きいバイト数を数える（6 回の操作）：

```c
#define countmore(x,n) \
(((((x)&~0UL/255*127)+~0UL/255*(127-(n))|(x))&~0UL/255*128)/128%255)
```

---

### word に m と n の間のバイトがあるかを判定（Determine if a word has a byte between m and n）

`m < n` のとき、このテクニックは word `x` が `m < value < n` を満たす無符号バイトを含むかをテストします。m と n が定数なら操作は 7 回必要です。

注意：`likelyhasbetween` は「n に等しいバイト」を偽陽性として報告することがあります。厳密に正しい結果が必要なら、バイトごとの再検証が必要です。

要件：`x >= 0`；`0 <= m <= 127`；`0 <= n <= 128`

```c
#define likelyhasbetween(x,m,n) \
((((x)-~0UL/255*(n))&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

操作が 1 回多い（合計 8 回）が正確な答えを返す変種：

```c
#define hasbetween(x,m,n) \
((~0UL/255*(127+(n))-((x)&~0UL/255*127)&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

m と n の間（開区間）にあるバイト数を数える（10 回の操作）：

```c
#define countbetween(x,m,n) (hasbetween(x,m,n)/128%255)
```

---

## 辞書順で次のビット順列を計算する（Compute the lexicographically next bit permutation）

ある整数に N 個のビット 1 が立っているとして、「辞書順」の意味で、次の N 個の 1 を含む並びを求めたいとします。例えば N=3、ビットパターンが `00010011` なら、その後は `00010101`、`00010110`、`00011001`、`00011010`、`00011100`、`00100011` ……と続きます。以下に次の順列を高速に計算する方法を示します。

GNU C コンパイラの x86 組み込み関数 `__builtin_ctz(v)` は末尾 0 の個数を返します。MSVC（x86）では対応する intrinsic は `_BitScanForward` です。どちらも `bsf` 命令を生成します。他アーキテクチャにも類似命令があるかもしれません。なければ、上で示した trailing zeros の方法のいずれかを使ってください。

```c
unsigned int v; // current permutation of bits
unsigned int w; // next permutation of bits

unsigned int t = v | (v - 1); // t gets v's least significant 0 bits set to 1
// Next set to 1 the most significant bit to change,
// set to 0 the least significant ones, and add the necessary 1 bits.
w = (t + 1) | (((~t & -~t) - 1) >> (__builtin_ctz(v) + 1));
```

次は別版で、除算を含むため通常は遅いですが、trailing zeros の計算が不要です：

```c
unsigned int t = (v | (v - 1)) + 1;
w = t | ((((t & -t) / (v & -v)) >> 1) - 1);
```

アルゼンチンの Dario Sneidermanis に感謝します。2009 年 11 月 28 日にこの方法を提供してくれました。

---

ベラルーシ語版の翻訳も提供されています（Webhostingrating 提供）。
