---
title: 位操作技巧
description: Sean Eron Anderson 的经典位运算技巧合集（翻译）。仅翻译文本，代码块保持原样，便于直接复制使用与对照阅读。
published: 2026-03-14T00:00:00.000Z
tags:
  - 位运算
  - C/C++
  - 代码技巧
lang: zh
abbrlink: bit-twiddling-hacks
translationKey: bit-twiddling-hacks
---

# Bit Twiddling Hacks
By Sean Eron Anderson
seander@cs.stanford.edu

本文中的每段代码（除非另有注明）均属于公有领域（public domain）——你可以按你喜欢的方式使用它们。作为一个汇总集合，这些代码与说明文字的整体版权归 Sean Eron Anderson 所有（© 1997-2005）。这些代码与说明文字的发布目的，是希望它们能对你有用，但**不提供任何担保**；包括但不限于对适销性或特定用途适用性的默示担保。

截至 2005 年 5 月 5 日，所有代码都经过了充分测试。已有成千上万的人阅读过它。此外，卡内基梅隆大学计算机科学学院院长 Randal Bryant 教授还使用他的 Uclid 代码验证系统亲自测试了几乎所有内容。对于他尚未测试的部分，我也在一台 32 位机器上对所有可能输入进行了检查。

如果你是第一个告知我代码中存在**真实且合理**的 bug 的人，我会支付 10 美元奖金（支票或 Paypal）。如果你希望我把这笔钱捐给慈善机构，我会支付 20 美元。

---

## 目录（Contents）

- 关于操作计数方法（About the operation counting methodology）
- 计算整数的符号（Compute the sign of an integer）
- 检测两个整数是否符号相反（Detect if two integers have opposite signs）
- 不分支计算整数绝对值 abs（Compute the integer absolute value (abs) without branching）
- 不分支求两个整数的最小值/最大值（Compute the minimum (min) or maximum (max) of two integers without branching）
- 判断整数是否为 2 的幂（Determining if an integer is a power of 2）
- 符号扩展（Sign extending）
- 从固定比特宽度进行符号扩展（Sign extending from a constant bit-width）
- 从可变比特宽度进行符号扩展（Sign extending from a variable bit-width）
- 在 3 次操作内从可变比特宽度进行符号扩展（Sign extending from a variable bit-width in 3 operations）
- 不分支按条件设置/清除位（Conditionally set or clear bits without branching）
- 不分支按条件取负（Conditionally negate a value without branching）
- 按掩码从两个值合并位（Merge bits from two values according to a mask）
- 统计置位 bit 的数量（Counting bits set）
- 从固定比特宽度进行符号扩展（Sign extending from a constant bit-width）
- 从可变比特宽度进行符号扩展（Sign extending from a variable bit-width）
- ……（下文逐段翻译追加）

> 说明：目录很长，本文会按原文顺序逐段翻译追加。

---

## 关于操作计数方法（About the operation counting methodology）

在统计本文算法的“操作数”时，**任何 C 运算符都按 1 次操作计**。中间变量赋值（不一定会写回 RAM）不计入操作数。当然，这种计数方式只能粗略近似真实的机器指令数和 CPU 时间。

本文假设所有操作耗时相同——这在现实中并不成立，但随着时间推移，CPU 的发展趋势在一定程度上让这个假设更接近事实。实际速度取决于许多细节，例如缓存大小、内存带宽、指令集等。

最终，**基准测试（benchmarking）**才是判断某种方法是否真的更快的最佳方式。因此，把下面这些技巧视为在目标架构上值得测试的候选方案即可。

---

## 计算整数的符号（Compute the sign of an integer）

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

上面最后一个表达式在 32 位整数时等价于 `sign = v >> 31`。它比直观写法 `sign = -(v < 0)` 少 1 次操作。这个技巧成立的原因是：当对有符号整数做右移时，最左侧的符号位会被复制到其余位。最左位在负数时为 1，否则为 0；全 1 的比特模式对应 `-1`。但遗憾的是，这种行为与体系结构/实现相关。

如果你希望结果是 `-1` 或 `+1`，可以用：

```c
sign = +1 | (v >> (sizeof(int) * CHAR_BIT - 1));  // if v < 0 then -1, else +1
```

如果你希望结果是 `-1`、`0` 或 `+1`，可以用：

```c
sign = (v != 0) | -(int)((unsigned int)((int)v) >> (sizeof(int) * CHAR_BIT - 1));
// Or, for more speed but less portability:
sign = (v != 0) | (v >> (sizeof(int) * CHAR_BIT - 1));  // -1, 0, or +1
// Or, for portability, brevity, and (perhaps) speed:
sign = (v > 0) - (v < 0); // -1, 0, or +1
```

如果你只想判断是否非负（非负返回 `1`，否则 `0`），可以用：

> 注意：2003 年 3 月 7 日，Angus Duggan 指出 1989 ANSI C 规范将“有符号右移”的结果定义为 implementation-defined，因此在某些系统上此技巧可能失效。为了更好的可移植性，Toby Speight 在 2005 年 9 月 28 日建议此处及全文都使用 `CHAR_BIT`，而不要假设 1 字节恒为 8 bit。2006 年 3 月 4 日，Angus 推荐了上面涉及强制转换的可移植版本。2009 年 9 月 12 日，Rohit Garg 提供了下面这个用于“非负判断”的版本。

```c
sign = 1 ^ ((unsigned int)v >> (sizeof(int) * CHAR_BIT - 1)); // if v < 0 then 0, else 1
```

---

## 检测两个整数是否符号相反（Detect if two integers have opposite signs）

```c
int x, y;               // input values to compare signs

bool f = ((x ^ y) < 0); // true iff x and y have opposite signs
```

Manfred Weis 建议我在 2009 年 11 月 26 日加入这条技巧。

---

## 不分支计算整数绝对值 abs（Compute the integer absolute value (abs) without branching）

```c
int v;           // we want to find the absolute value of v
unsigned int r;  // the result goes here
int const mask = v >> sizeof(int) * CHAR_BIT - 1;

r = (v + mask) ^ mask;
```

专利变体（Patented variation）：有些 CPU 没有“整数绝对值”指令（或编译器没有使用它）。在分支代价很高的机器上，上面的表达式可能比直观写法 `r = (v < 0) ? -(unsigned)v : v` 更快，尽管两者的操作数相同。

```c
r = (v ^ mask) - mask;
```

> 注意：2003 年 3 月 7 日，Angus Duggan 指出 1989 ANSI C 规范将“有符号右移”的结果定义为 implementation-defined，因此在某些系统上此技巧可能失效。我也读到过 ANSI C 并不要求整数必须以二进制补码（two's complement）表示，因此在极少数仍使用反码（one's complement）的老机器上也可能失效。
>
> 2004 年 3 月 14 日，Keith H. Duggar 把上面的“专利变体”发给我；它优于我最初想到的方法，因为它不需要用乘法。不幸的是，这个方法在美国于 2000 年 6 月 6 日被 Vladimir Yu Volkonsky 申请并授予专利，专利权转让给了 Sun Microsystems。
>
> 2006 年 8 月 13 日，Yuriy Kaminskiy 告诉我该专利很可能无效，因为该方法在申请专利前就已公开发表，例如 Agner Fog 在 1996 年 11 月 9 日的《How to Optimize for the Pentium Processor》一书中就写过。Yuriy 也提到该文档在 1997 年被翻译成俄文，Vladimir 可能读过；并且 Internet Archive 上也能找到旧链接。
>
> 2007 年 1 月 30 日，Peter Kankowski 分享了一个受 Microsoft Visual C++ 编译器输出启发的 abs 版本，我把它作为此处的主要方案。
>
> 2007 年 12 月 6 日，Hai Jin 抱怨结果是有符号的，因此当对最小负数取 abs 时仍然是负数。
>
> 2008 年 4 月 15 日，Andrew Shapira 指出直观写法可能溢出，因为先前缺少 `(unsigned)` 转换；为获得最大可移植性他建议……但 Vincent Lefèvre 在 2008 年 7 月 9 日引用 ISO C99 规范说服我移除该建议：即使在非二补码机器上，`-(unsigned)v` 仍然会得到正确结果。
>
> 原因是：计算 `-(unsigned)v` 时，会先把 v 的负值转换为无符号值（通过加上 `2**N`），得到 v 的二补码表示 U；随后对 U 取负，得到 `-U = 0 - U = 2**N - U = 2**N - (v+2**N) = -v = abs(v)`。

---

## 不分支求两个整数的最小值/最大值（Compute the minimum (min) or maximum (max) of two integers without branching）

```c
int x;  // we want to find the minimum of x and y
int y;
int r;  // the result goes here

r = y ^ ((x ^ y) & -(x < y)); // min(x, y)
```

在一些极少见的机器上，如果分支非常昂贵且没有条件移动（conditional move）指令，上面的表达式可能比直观写法 `r = (x < y) ? x : y` 更快，尽管它多了两条指令。（不过通常直观写法才是最佳选择。）它之所以可行，是因为：

- 若 `x < y`，则 `-(x < y)` 会变成全 1，于是
  `r = y ^ ((x ^ y) & ~0) = y ^ x ^ y = x`。
- 否则 `x >= y`，则 `-(x < y)` 为全 0，于是
  `r = y ^ ((x ^ y) & 0) = y`。

在某些机器上，把 `(x < y)` 计算成 0 或 1 需要分支指令，因此不一定有优势。

求最大值时，用：

```c
r = x ^ ((x ^ y) & -(x < y)); // max(x, y)
```

快速但粗糙（Quick and dirty）的版本：
如果你确定满足 `INT_MIN <= x - y <= INT_MAX`，可以用下面的写法，它更快，因为 `(x - y)` 只需计算一次。注意：1989 ANSI C 规范没有规定“有符号右移”的结果，因此这两句**不可移植**。如果溢出会抛异常，那么 x、y 应当使用无符号或在做减法时转为无符号，以避免不必要的异常；不过右移需要有符号操作数才能在为负时产生全 1，因此右移处需要转回有符号。

```c
r = y + ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // min(x, y)
r = x - ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // max(x, y)
```

> 说明：2003 年 3 月 7 日 Angus Duggan 指出了右移可移植性问题。2005 年 5 月 3 日 Randal E. Bryant 提醒需要满足前置条件 `INT_MIN <= x - y <= INT_MAX`，并建议使用非 quick-and-dirty 版本修复。2005 年 7 月 6 日 Nigel Horspoon 观察到 gcc 在 Pentium 上对直观写法生成了同样代码（取决于 `(x < y)` 的实现）。2008 年 7 月 9 日 Vincent Lefèvre 指出旧版本 `r = y + ((x - y) & -(x < y))` 的减法在启用溢出异常时有风险。2009 年 6 月 2 日 Timothy B. Terriberry 建议用 xor 而不是加减，以减少类型转换与溢出风险。

---

## 判断整数是否为 2 的幂（Determining if an integer is a power of 2）

```c
unsigned int v; // we want to see if v is a power of 2
bool f;         // the result goes here

f = (v & (v - 1)) == 0;
```

注意：这里会把 `0` 错误地当作 2 的幂。要修正它，用：

```c
f = v && !(v & (v - 1));
```

---

## 从固定比特宽度进行符号扩展（Sign extending from a constant bit-width）

对于内置类型（例如 `char`、`int`），符号扩展是自动完成的。但假设你有一个有符号的二补码数 `x`，它只用 `b` 个 bit 存储；现在你想把它转换成 bit 数更多的 `int`。如果 `x` 是正数，直接拷贝即可；但如果是负数，就必须扩展符号位。

例如，若只有 4 bit 存一个数，`-3` 的二进制表示是 `1101`；若用 8 bit，则是 `11111101`。把 4 bit 表示转换成更多 bit 表示时，需要把最高位（符号位）向左复制填充，这个过程就是**符号扩展**（sign extending）。

在 C 语言里，从固定 bit 宽度进行符号扩展很简单，因为可以在 `struct` 或 `union` 中定义位域（bit field）。例如，把一个 5 bit 的数转换成完整的 `int`：

```c
int x; // convert this from using 5 bits to a full int
int r; // resulting sign extended number goes here
struct {signed int x:5;} s;
r = s.x = x;
```

下面是一个 C++ 模板函数，利用相同语言特性，把一个用 B bit 表示的值在 1 次操作中转换（当然编译器实际会生成更多指令）：

```cpp
template <typename T, unsigned B>
inline T signextend(const T x)
{
  struct {T x:B;} s;
  return s.x = x;
}

int r = signextend<signed int,5>(x);  // sign extend 5 bit number x to r
```

> 说明：2005 年 5 月 2 日 John Byrd 发现了代码里的一个拼写错误（可能由 HTML 格式引起）。2006 年 3 月 4 日 Pat Wood 指出 ANSI C 标准要求位域必须显式写 `signed` 才能保证其为有符号；否则符号是不确定的。

---

## 从可变比特宽度进行符号扩展（Sign extending from a variable bit-width）

有时我们需要做符号扩展，但事先并不知道数字使用的 bit 数 `b`。（或者你在 Java 这类没有位域的语言中编程。）上面固定宽度的写法需要 4 次操作；但当 bit 宽度是常量而不是变量时，如果高位本来就都是 0，那么只需 2 次快速操作。

```c
unsigned b; // number of bits representing the number in x
int x;      // sign extend this b-bit number to r
int r;      // resulting sign-extended number
int const m = 1U << (b - 1); // mask can be pre-computed if b is fixed

x = x & ((1U << b) - 1);  // (Skip this if bits in x above position b are already zero.)
r = (x ^ m) - m;
```

一种稍快但可移植性较差的方法，不依赖于 `x` 在第 b 位以上是否为 0：

```c
int const m = CHAR_BIT * sizeof(x) - b;
r = (x << m) >> m;
```

> 说明：2004 年 6 月 13 日 Sean A. Irvine 建议我把符号扩展方法加入本页，并给出了一个起点，我将其优化为 `m = 1U << (b - 1); r = (x ^ m) - m`。2007 年 5 月 11 日 Shay Green 建议了上面这个版本，它比我之前的版本少 1 次操作。2008 年 10 月 15 日 Vipin Sharma 建议加入一步，以处理 `x` 在目标 b 位以外可能仍包含 1 的情况。2009 年 12 月 31 日 Chris Pirazzi 建议加入“更快版本”，常量宽度时仅需 2 次操作，变量宽度时为 3 次操作。

---

## 在 3 次操作内从可变比特宽度进行符号扩展（Sign extending from a variable bit-width in 3 operations）

下面这种方法在某些机器上可能较慢，因为乘法与除法的代价较高。这个版本需要 4 次操作。如果你能保证初始 bit 宽度 `b > 1`，那么可以用 `r = (x * multipliers[b]) / divisors[b]` 这类方式把它压到 3 次操作（只需要一次数组查表）。

接下来这个变体并不可移植，但在使用“算术右移”（arithmetic right shift，右移时保留符号）的体系结构上应该很快。Randal E. Bryant 在 2005 年 5 月 3 日指出了早期版本的一个 bug（当时把 `multipliers[]` 误用作 `divisors[]`），在 `x=1, b=1` 的情况下会失败。

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

## 不分支按条件设置/清除位（Conditionally set or clear bits without branching）

```c
bool f;         // conditional flag
unsigned int m; // the bit mask
unsigned int w; // the word to modify:  if (f) w |= m; else w &= ~m;

w ^= (-f ^ w) & m;

// OR, for superscalar CPUs:
w = (w & ~m) | (-f & m);
```

在某些架构上，不使用分支带来的收益足以抵消“看起来操作数翻倍”的劣势。比如在 AMD Athlon™ XP 2100+ 上的非正式速度测试表明它能快 5–10%。在 Intel Core 2 Duo 上，适合超标量（superscalar）的第二种写法比第一种快约 16%。

Glenn Slayden 在 2003 年 12 月 11 日把第一个表达式告知我。Marco Yu 在 2007 年 4 月 3 日分享了适合 superscalar 的版本，并在两天后指出了一个笔误。

---

## 不分支按条件取负（Conditionally negate a value without branching）

如果你只需要在某个 flag 为 false 时取负（negate），可以用下面写法来避免分支；如果你只需要在 flag 为 true 时取负，则用第二个写法。

Avraham Plotnitzky 在 2009 年 6 月 2 日建议加入第一个版本。为了避免乘法，我在 2009 年 6 月 8 日想出了第二个版本。Alfonso De Gregorio 在 2009 年 11 月 26 日指出其中缺少括号，并获得了 bug 悬赏。

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

## 按掩码从两个值合并位（Merge bits from two values according to a mask）

```c
unsigned int a;    // value to merge in non-masked bits
unsigned int b;    // value to merge in masked bits
unsigned int mask; // 1 where bits from b should be selected; 0 where from a.
unsigned int r;    // result of (a & ~mask) | (b & mask) goes here

r = a ^ ((a ^ b) & mask);
```

这比直观写法 `(a & ~mask) | (b & mask)` 少 1 次操作。如果 `mask` 是常量，那么未必有优势。

Ron Jeffery 在 2006 年 2 月 9 日把这个技巧发给我。

---

## 统计置位 bit 的数量（Counting bits set）

### 朴素方法（naive way）

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v

for (c = 0; v; v >>= 1)
{
  c += v & 1;
}
```

朴素方法每次循环处理 1 个 bit，直到没有置位为止。所以对于 32 位整数，若只有最高位是 1，它会循环 32 次。

---

### 查表法（by lookup table）

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

2009 年 7 月 14 日，Hallvard Furuseth 建议使用宏来压缩表的写法。

---

### Brian Kernighan 方法（Brian Kernighan's way）

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v
for (c = 0; v; c++)
{
  v &= v - 1; // clear the least significant bit set
}
```

Brian Kernighan 的方法循环次数等于置位 bit 的数量。所以对于 32 位整数，若只有最高位是 1，它只会循环 1 次。

该方法在《The C Programming Language（第 2 版）》的练习 2-9 中提到（1988 年）。2006 年 4 月 19 日，Donald Knuth 告诉我这个方法最早由 Peter Wegner 发表在 CACM 3 (1960), 322。（此外 Derrick Lehmer 也独立发现并在 1964 年出版的某本书中发表，书的编辑是 Beckenbach。）

---

### 使用 64 位指令统计 14/24/32 位字（using 64-bit instructions）

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

这种方法需要 64 位 CPU 且取模除法很快时才高效。第 1 个选项仅需 3 次操作；第 2 个选项需要 10 次；第 3 个选项需要 15 次。

Rich Schroeppel 最初创建了一个 9-bit 版本（类似 option 1）；可参见 Beeler, M., Gosper, R. W., and Schroeppel, R.《HAKMEM》中的 Programming Hacks 章节，MIT AI Memo 239，1972 年 2 月 29 日。他的方法启发了上面的变体，这些变体由 Sean Anderson 设计。Randal E. Bryant 在 2005 年 5 月 3 日提供了几个 bug 修复。Bruce Dawson 在 2007 年 2 月 1 日把此前的 12-bit 版本微调为适用于 14 bit，且操作数不变。

---

### 并行计数（in parallel）

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

B 数组写成二进制是：

- `B[0] = 0x55555555 = 01010101 01010101 01010101 01010101`
- `B[1] = 0x33333333 = 00110011 00110011 00110011 00110011`
- `B[2] = 0x0F0F0F0F = 00001111 00001111 00001111 00001111`
- `B[3] = 0x00FF00FF = 00000000 11111111 00000000 11111111`
- `B[4] = 0x0000FFFF = 00000000 00000000 11111111 11111111`

我们可以通过延续这些“二进制魔数（Binary Magic Numbers）”的模式来适配更大的整数位宽：如果有 k 个 bit，那么数组 S 和 B 的长度需要是 `ceil(lg(k))`，并且需要计算同样数量的表达式。对于 32-bit 的 `v`，上述方法用了 16 次操作。

---

### 更佳的 32 位计数方法（The best method for 32-bit）

```c
v = v - ((v >> 1) & 0x55555555);                    // reuse input as temporary
v = (v & 0x33333333) + ((v >> 2) & 0x33333333);     // temp
c = ((v + (v >> 4) & 0xF0F0F0F) * 0x1010101) >> 24; // count
```

这个“最佳方法”只需要 12 次操作，和查表法一样，但它避免了表带来的内存访问与潜在缓存未命中的成本。它是上面“纯并行法”和更早的“用乘法+64 位指令”那类方法之间的折中：它在字节层面并行统计每个字节的置位 bit 数，然后通过乘以 `0x1010101` 并右移 24 bit，把 4 个字节的计数求和。

---

### 推广到最多 128 位（generalization up to 128-bit）

下面给出对最多 128 位整数（用类型 `T` 参数化）的推广：

```c
v = v - ((v >> 1) & (T)~(T)0/3);                           // temp
v = (v & (T)~(T)0/15*3) + ((v >> 2) & (T)~(T)0/15*3);      // temp
v = (v + (v >> 4)) & (T)~(T)0/255*15;                      // temp
c = (T)(v * ((T)~(T)0/255)) >> (sizeof(T) - 1) * CHAR_BIT; // count
```

关于统计置位 bit（也称 sideways addition）的更多信息，可参见 Ian Ashdown 在新闻组中的精彩帖子。

这份“最佳计数方法”是 Andrew Shapira 在 2005 年 10 月 5 日提醒我的，他在《Software Optimization Guide for AMD Athlon™ 64 and Opteron™ Processors》第 187–188 页中看到了它。Charlie Gordon 在 2005 年 12 月 14 日建议给纯并行版本再省 1 次操作；Don Clugston 在 2005 年 12 月 30 日又削减了 3 次。我在采用 Don 的建议时写错了一个地方，Eric Cole 在 2006 年 1 月 8 日指出了这个笔误。Eric 之后在 2006 年 11 月 17 日建议了“任意位宽推广到最佳方法”。2007 年 4 月 5 日，Al Williams 观察到我在第一个方法顶部有一行死代码。

---

## 从最高位到指定位置的置位计数（rank）（Count bits set (rank) from the most-significant bit upto a given position）

下面代码用于计算某一 bit 的 **rank**：也就是从最高有效位（MSB）开始向右数，一直到给定位置 `pos` 为止（包含该位置）的所有置位 bit（值为 1）的数量之和。

Juha Järvi 在 2009 年 11 月 21 日把它发给我，作为下面“根据 rank 选取 bit 位置”的逆运算。

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

## 根据 rank 选取（从最高位起）bit 的位置（Select the bit position (from the most-significant bit) with the given count (rank)）

下面这段 64 位代码用于：从左向右（从 MSB 开始）数置位 bit 的个数，找到第 `r` 个 1 所在的位置并返回。如果请求的 rank 超过了置位 bit 总数，则返回 64。该代码可以改造成 32 位版本，或改为从右向左计数。

如果你的目标 CPU 分支很快，可以考虑把注释掉的 `if` 语句取消注释，同时注释掉它们后面的无分支版本。

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

Juha Järvi 在 2009 年 11 月 21 日把这段代码发给我。

---

## 计算奇偶校验（parity）（Computing parity (1 if an odd number of bits set, 0 otherwise)）

这里的 parity 指：若置位 bit 的数量为奇数则为 1，否则为 0。

### 朴素方法（Computing parity the naive way）

下面代码采用类似 Brian Kernighan 计数的方式：每清除一个置位 bit 就翻转一次 parity，因此时间与置位 bit 数量成正比。

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

### 查表法（Compute parity by lookup table）

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

Randal E. Bryant 在 2005 年 5 月 3 日鼓励我加入最后这个“带 variable p 的变体”（尽管它确实很直观）。2005 年 9 月 27 日 Bruce Rawles 发现了表名的一个拼写错误，并获得了 10 美元 bug 悬赏。2006 年 10 月 9 日 Fabrice Bellard 建议了上面的 32 位变体，它们只需要一次查表；此前版本每个字节查一次，共 4 次查表，速度更慢。2009 年 7 月 14 日 Hallvard Furuseth 建议使用宏压缩表的写法。

---

### 用 64 位乘法与取模计算 1 字节 parity（Compute parity of a byte using 64-bit multiply and modulus division）

```c
unsigned char b;  // byte value to compute the parity of
bool parity =
  (((b * 0x0101010101010101ULL) & 0x8040201008040201ULL) % 0x1FF) & 1;
```

该方法大约需要 4 次操作，但仅适用于字节。

---

### 用乘法计算 word parity（Compute parity of word with a multiply）

下面方法用乘法在 8 次操作内计算 32 位值的 parity；对于 64 位同样只需 8 次操作。

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

Andrew Shapira 在 2007 年 9 月 2 日提出了这个方法并发给我。

---

### 并行法（Compute parity in parallel）

```c
unsigned int v;  // word value to compute the parity of
v ^= v >> 16;
v ^= v >> 8;
v ^= v >> 4;
v &= 0xf;
return (0x6996 >> v) & 1;
```

上述方法大约需要 9 次操作，适用于 32 位 word。若只针对字节，可去掉 `unsigned int v;` 之后紧跟的两行，从而优化到约 5 次操作。

原理是：先通过移位+异或，把 32 位值的 8 个半字节（nibble）折叠到最低 nibble；然后用二进制数 `0110 1001 1001 0110`（十六进制 `0x6996`）作为一个“迷你 16 项 parity 表”，按最低 nibble 的值右移取出结果 bit，再 mask 返回。

Mathew Hendry 在 2002 年 12 月 15 日指出了最后这步“移位查表”的想法，这个优化能减少 2 次操作。

---

## 交换值（Swapping Values）

### 用加减法交换（Swapping values with subtraction and addition）

```c
#define SWAP(a, b) ((&(a) == &(b)) || \
                    (((a) -= (b)), ((b) += (a)), ((a) = (b) - (a))))
```

这段宏可以在不使用临时变量的情况下交换 `a` 与 `b` 的值。最开始对 `a` 与 `b` 是否指向同一内存位置的检查，在你确定不会发生这种情况时可以省略。（编译器也可能作为优化将其去掉。）

如果你启用了溢出异常，建议传入无符号值以避免抛异常。下面的 XOR 交换法在某些机器上可能略快。不要对浮点数使用这个宏（除非你操作的是它们的原始整数表示）。

Sanjeev Sivasankaran 建议我在 2007 年 6 月 12 日加入这条。Vincent Lefèvre 在 2008 年 7 月 9 日指出了加减法可能触发溢出异常的问题。

---

### 用 XOR 交换（Swapping values with XOR）

```c
#define SWAP(a, b) (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))
```

这是一个老技巧：不借助临时变量交换 `a` 与 `b` 的值。

2005 年 1 月 20 日，Iain A. Fleming 指出：当你交换同一内存位置（例如 `SWAP(a[i], a[j])` 且 `i == j`）时，这个宏会失效。因此如果可能出现这种情况，可以改成：

`(((&(a) == &(b)) || (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))))`（原文给出了类似建议）

2009 年 7 月 14 日，Hallvard Furuseth 还建议在一些机器上，`(a) ^ (b)` 的结果可以被复用，从而进一步提速（原文略）。

---

### 用 XOR 交换单个位区间（Swapping individual bits with XOR）

```c
unsigned int i, j; // positions of bit sequences to swap
unsigned int n;    // number of consecutive bits in each sequence
unsigned int b;    // bits to swap reside in b
unsigned int r;    // bit-swapped result goes here

unsigned int x = ((b >> i) ^ (b >> j)) & ((1U << n) - 1); // XOR temporary
r = b ^ ((x << i) | (x << j));
```

例：假设 `b = 00101111`（二进制），我们要交换从 `i = 1`（从右数第二位）开始的连续 `n = 3` 个 bit，和从 `j = 5` 开始的连续 `3` 个 bit；结果将是 `r = 11100011`（二进制）。

该方法与通用 XOR swap 类似，但面向单个位（或位区间）。变量 `x` 先存下两段要交换的 bit 的异或结果，然后通过对原数异或把位翻转到交换后的状态。若两段区间有重叠，则结果未定义。

2009 年 7 月 14 日，Hallvard Furuseth 建议把 `1 << n` 改成 `1U << n`，因为结果赋给无符号数，且避免移位进入符号位。

---

## 反转 bit 序列（Reversing bit sequences）

### 直观写法（Reverse bits the obvious way）

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

2004 年 10 月 15 日，Michael Hoisie 指出了原始版本中的一个 bug。2005 年 5 月 3 日，Randal E. Bryant 建议去掉一个额外操作。2005 年 5 月 18 日，Behdad Esfahbod 建议做轻微改动以减少一次循环迭代。之后 2007 年 2 月 6 日，Liyong Zhou 提出了更好的版本：循环条件改为 `v != 0`，从而不必遍历所有 bit，可提前结束（原文历史说明略）。

---

### 用查表法反转 word（Reverse bits in word by lookup table）

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

第一种方法大约需要 17 次操作；第二种假设 CPU 便于按字节 load/store，则大约需要 12 次操作。

2009 年 7 月 14 日，Hallvard Furuseth 建议使用宏压缩表的写法。

---

### 用 3 次操作反转一个字节（64 位乘法 + 取模）（Reverse the bits in a byte with 3 operations）

```c
unsigned char b; // reverse this (8-bit) byte

b = (b * 0x0202020202ULL & 0x010884422010ULL) % 1023;
```

乘法会把 8-bit 的字节模式扇出成 64-bit 中的 5 份拷贝。AND 会选出相对于每个 10-bit 分组处于正确（反转后）位置的 bit。乘法与 AND 共同保证原字节的每个 bit 只出现在某一组 10-bit 中的某一位置。最后一步对 `2^10 - 1` 取模，会把各组 10 bit 合并起来。因为这些组在 64-bit 中互不重叠，所以取模所隐含的“加法”行为效果等同于按位 OR。

该方法归功于 Rich Schroeppel，见 Beeler, M., Gosper, R. W., and Schroeppel, R.《HAKMEM》MIT AI Memo 239，1972 年 2 月 29 日的 Programming Hacks 章节。

---

### 用 4 次操作反转一个字节（64 位乘法，无除法）（Reverse the bits in a byte with 4 operations）

```c
unsigned char b; // reverse this byte

b = ((b * 0x80200802ULL) & 0x0884422110ULL) * 0x0101010101ULL >> 32;
```

原文随后给出了 bit 流动示意（略）。注意：在某些处理器上，最后两步可以合并，因为寄存器可按字节访问：只需安排乘法使某寄存器存放结果的高 32 位，然后取其低字节即可。因此总操作数可能降到 6 次。

Sean Anderson 于 2001 年 7 月 13 日提出该方法。

---

### 用 7 次操作反转一个字节（不使用 64 位）（Reverse the bits in a byte with 7 operations）

```c
b = ((b * 0x0802LU & 0x22110LU) | (b * 0x8020LU & 0x88440LU)) * 0x10101LU >> 16;
```

务必把结果赋值或强制转换为 `unsigned char`，以去掉高位的垃圾值。Sean Anderson 于 2001 年 7 月 13 日提出该方法。Mike Keith 在 2002 年 1 月 3 日指出并修正了一个笔误。

---

### 并行反转 N-bit：5 * lg(N) 次操作（Reverse an N-bit quantity in parallel）

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

下面这个变体同样是 `O(lg(N))`，但为了反转 `v` 需要更多操作；它的优点是占用更少常量内存（常量在循环中动态计算）。上述方法适合 N 很大时使用。如果把上面方法用于 64 位（或更大）整数，需要继续按模式追加更多行；否则只会反转低 32 位，并且结果也只在低 32 位中。

```c
unsigned int s = sizeof(v) * CHAR_BIT; // bit size; must be power of 2
unsigned int mask = ~0;
while ((s >>= 1) > 0)
{
  mask ^= (mask << s);
  v = ((v >> s) & mask) | ((v << s) & ~mask);
}
```

更多信息可参见 Dr. Dobb's Journal 1983 年 Edwin Freed 的《Binary Magic Numbers》文章。第二个变体由 Ken Raeburn 于 2005 年 9 月 13 日建议。Veldmeijer 在 2006 年 3 月 19 日提到第一种版本最后一行可以不需要 AND（原文历史说明略）。

---

## 取模除法（也叫计算余数）（Modulus division (aka computing remainders)）

### 用 `1 << s` 取模（不使用除法）（Computing modulus division by 1 << s without a division operator）

```c
const unsigned int n;          // numerator
const unsigned int s;
const unsigned int d = 1U << s; // So d will be one of: 1, 2, 4, 8, 16, 32, ...
unsigned int m;                // m will be n % d
m = n & (d - 1);
```

多数程序员很早就会学到这个技巧，这里为了完整性也收录进来。

---

### 用 `(1 << s) - 1` 取模（不使用除法）（Computing modulus division by (1 << s) - 1 without a division operator）

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

这个“对比 2 的幂少 1 的数取模”的方法，最多需要
`5 + (4 + 5 * ceil(N / s)) * ceil(lg(N / s))` 次操作，其中 N 是分子（numerator）的 bit 数。换句话说，它的时间复杂度最多为 `O(N * lg(N))`。

Sean Anderson 于 2001 年 8 月 15 日提出该方法。Sean A. Irvine 在 2004 年 6 月 17 日纠正了我：我曾错误地在注释里说“末尾可以改用赋值”。Michael Miller 在 2005 年 4 月 25 日发现了一个笔误。

---

### 用并行方式对 `(1 << s) - 1` 取模（不使用除法）（Computing modulus division by (1 << s) - 1 in parallel without a division operator）

> 以下代码以 32-bit word 为例！

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

这个方法把分子按 base `(1 << s)` 的“各位数字”并行相加，从而在最多 `O(lg(N))` 时间内完成（对上面 32-bit 的代码，N=32）。操作数上界约为 `12 + 9 * ceil(lg(N))`。如果你在编译期就知道分母，可以移除表：只取出相关条目并展开循环。也可以很容易扩展到更多 bit。

它的直观理解是：把结果写在纸上，把纸对半剪开，对齐后把两半的值逐位相加写到新纸上；重复“剪开并相加”的过程，直到无法再剪。对 `lg(N/s/2)` 次剪裁后，不再剪，只持续做相加，直到每次相加时只剩下一个 s-bit 值为止。

Sean Anderson 于 2001 年 8 月 20 日提出该方法。Randy E. Bryant 在 2005 年 5 月 3 日指出了一个笔误（我在粘贴代码后，后来又在变量声明里写成了 `unsinged`）。和上一条技巧类似，我也曾在注释里误写“末尾可以改用赋值”，Donald Knuth 在 2006 年 4 月 19 日纠正了我并提出了替代写法（原文略）。2009 年 6 月 18 日 Sean Irvine 提议一个改动：用 `((n >> s) & M[s])` 代替 `((n & ~M[s]) >> s)`，通常操作更少，因为常量 `M[s]` 已经被加载（原文末尾附了若干替代式）。

---

## 求整数的以 2 为底对数（也就是最高置位的位置）（Finding integer log base 2 of an integer）

### 朴素方法：MSB 在第 N 位，O(N) 次操作（Find the log base 2 ... in O(N) operations）

```c
unsigned int v; // 32-bit word to find the log base 2 of
unsigned int r = 0; // r will be lg(v)

while (v >>= 1) // unroll for more speed...
{
  r++;
}
```

整数的以 2 为底对数，等价于“最高置位 bit（MSB）的位置”。下面还有更快的方法。

---

### 用 64 位 IEEE 浮点数求 log2（Find the log base 2 ... with an 64-bit IEEE float）

```c
int v; // 32-bit integer to find the log base 2 of
int r; // result of log_2(v) goes here
union { unsigned int u[2]; double d; } t; // temp

t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] = 0x43300000;
t.u[__FLOAT_WORD_ORDER!=LITTLE_ENDIAN] = v;
t.d -= 4503599627370496.0;
r = (t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] >> 20) - 0x3FF;
```

这段代码通过把 32-bit 整数（无 padding bits）写入 `double` 的尾数（mantissa），并把指数（exponent）设为 `2^52`，从而构造出一个 64-bit IEEE-754 `double`。接着从该 `double` 中减去 `2^52`（以 double 表示就是 `4503599627370496.0`），使结果的指数变为输入值 `v` 的 log2。最后把指数位右移到位并减去偏置 `0x3FF`（即十进制 1023）即可。

该技巧只需要 5 次操作，但许多 CPU 对 double 运算较慢，而且还需要处理架构的端序（endianness）。

Eric Cole 在 2006 年 1 月 15 日把它发给我。Evan Felix 在 2006 年 4 月 4 日指出了一个笔误。Vincent Lefèvre 在 2008 年 7 月 9 日提醒我：端序检查应当用浮点数的端序，因为它可能不同于整数端序。

---

### 用查表法求 log2（Find the log base 2 ... with a lookup table）

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

这个查表法找 32-bit 值的 log2 大约只需 7 次操作。若扩展到 64-bit，约需 9 次操作。还可以用 4 张表（把可能的加法编码进表项）进一步减少 1 次操作。表项用 `int` 也许会更快，取决于你的架构。

上述代码对“输出值均匀分布”的情况做了优化。如果你的输入在 32-bit 空间内均匀分布，可以考虑用下面这种写法：

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

生成 log 表的方式（算法化初始化）：

```c
LogTable256[0] = LogTable256[1] = 0;
for (int i = 2; i < 256; i++)
{
  LogTable256[i] = 1 + LogTable256[i / 2];
}
LogTable256[0] = -1; // if you want log(0) to return -1
```

2005 年 5 月 18 日 Behdad Esfahbod 和我把平均操作数又削减了一点点。2006 年 11 月 14 日 Emanuel Hoogeveen 又去掉了另一点点。2008 年 9 月 19 日 David A. Butterfield 建议加入“针对均匀分布输入”的变体。2009 年 1 月 5 日 Venkat Reddy 指出 `log(0)` 应返回 `-1` 表示错误，于是我把表的第一项改成了 `-1`。

---

## 用 de Bruijn 乘法 + 查表求 log2（Find the log base 2 ... with multiply and lookup）

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

该方法用一个小表和一次乘法计算 32-bit 整数的 log2。它只需要 13 次操作，相比上一种 `O(lg(N))` 的通用方法（可能需要到 20 次）更省。纯查表法操作数最少，但该方法在“表大小 vs 速度”之间提供了折中。

若你知道 `v` 本身就是 2 的幂，则只需：

```c
static const int MultiplyDeBruijnBitPosition2[32] =
{
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
  31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
};
r = MultiplyDeBruijnBitPosition2[(uint32_t)(v * 0x077CB531U) >> 27];
```

Eric Cole 在 2006 年 1 月 8 日提出该方法：他在读到后文“向上取整到 2 的幂”以及“用乘法+查表计算 trailing zeros（de Bruijn 序列）”后，想到将其用于 log2。2009 年 12 月 10 日 Mark Dickinson 又削减了几次操作：要求 `v` 先被“向上修约到小于下一个 2 的幂的值”而非直接修约到 2 的幂。

---

## 求整数的以 10 为底对数（Find integer log base 10 of an integer）

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

整数的 log10 先通过上面任一 log2 技巧得到 `IntegerLogBase2(v)`。根据关系 `log10(v) = log2(v) / log2(10)`，我们需要乘上 `1/log2(10)`，它近似为 `1233/4096`，也就是乘以 1233 再右移 12 位。再加 1 是因为 `IntegerLogBase2` 会向下取整。最后由于 `t` 只是近似值（可能差 1），通过判断 `v < PowersOf10[t]` 来修正得到精确结果。

该方法比 `IntegerLogBase2` 多 6 次操作。若你的机器内存访问很快，可以把上文 log2 的查表法改为“表项直接存 t 的值”（也就是把预先的加法、乘法、移位编码进表），这样总操作数可降到 9（假设使用 4 张表，对应 v 的 4 个字节）。

Eric Cole 建议我在 2006 年 1 月 7 日加入该方法。

---

### 朴素的 log10（Find integer log base 10 ... the obvious way）

```c
unsigned int v; // non-zero 32-bit integer value to compute the log base 10 of
int r;          // result goes here

r = (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
    (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
    (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
```

当输入在 32-bit 空间内均匀分布时，这个方法表现很好：76% 的输入会在第一次比较就命中，21% 会在第二次命中，2% 在第三次命中……每次比较都把剩余范围缩小约 90%。因此平均只需要不到 2.6 次操作。

2007 年 4 月 18 日 Emanuel Hoogeveen 提出一个变体：用除法做条件判断，但它不如简单比较快。

---

## 求 32-bit IEEE 浮点数的 log2 整数部分（Find integer log base 2 of a 32-bit IEEE float）

```c
const float v; // find int(log2(v)), where v > 0.0 && finite(v) && isnormal(v)
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = (c >> 23) - 127;
```

上面很快，但 IEEE 754 兼容架构还支持次正规数（subnormal/denormal）。它们的指数位为 0（表示 `2^-127`），尾数也不再归一化，因此需要从尾数中重新计算 log2。要兼容 subnormal，可以用：

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

> 说明：2004 年 6 月 20 日 Sean A. Irvine 建议加入 subnormal 的处理。2005 年 6 月 11 日 Falk Hüffner 指出 ISO C99 6.5/7 对常见的 type punning 写法 `*(int *)&` 规定为未定义行为（尽管 99.9% 编译器可用）。他建议为最大可移植性使用 `memcpy`，或者用 `{ float; int; }` 的 union 来获得比 `memcpy` 更好的代码生成。

---

## 求 `pow(2, r)` 次方根后的浮点 log2（Find integer log base 2 of the pow(2, r)-root ...）

```c
const int r;
const float v; // find int(log2(pow((double) v, 1. / pow(2, r)))),
               // where isnormal(v) and v > 0
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = ((((c - 0x3f800000) >> r) + 0x3f800000) >> 23) - 127;
```

例如 `r = 0` 时，`c = int(log2((double)v))`；`r = 1` 时，`c = int(log2(sqrt((double)v)))`；`r = 2` 时，`c = int(log2(pow((double)v, 1./4)))`。

2005 年 6 月 11 日 Falk Hüffner 同样指出了 `*(int *)&` 的未定义行为，并建议 `memcpy`。

---

## 统计末尾连续 0（trailing zeros）（Counting consecutive trailing zero bits）

### 线性方法（Count trailing zeros linearly）

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

随机均匀分布的二进制数平均 trailing zeros 为 1，因此这个 `O(trailing zeros)` 的方法其实并不差。

Jim Cole 在 2007 年 8 月 15 日建议加入该线性方法。2007 年 10 月 22 日 Jason Cunningham 指出我粘贴代码时漏了 `unsigned` 修饰。

---

### 并行方法（Count trailing zeros in parallel）

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

这基本等价于“并行求 log2”，但先把最低的 1 bit 单独取出来，然后让 `c` 从最大值开始递减。操作数上界约为 `3 * lg(N) + 4`（对 N-bit word）。

Bill Burdick 在 2011 年 2 月 4 日提出了一个优化，把时间从 `4 * lg(N)` 降低。

---

### 二分法（Count trailing zeros by binary search）

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

这与上一种方法类似，但它通过累加 `c` 的方式做“二分式缩小范围”：先看低 16 位是否为 0，是则右移 16 并 `c += 16`；后续每次检查都把范围再减半，直到剩下 1 位。它比上一种更快（约快 33%），因为 if 的 body 执行次数更少。

Matt Whitlock 在 2006 年 1 月 25 日建议加入该方法。Andrew Shapira 在 2007 年 9 月 5 日又削减了几次操作（例如令 `c=1` 并在末尾无条件减一次）。

---

### 浮点转型法（Count trailing zeros by casting to a float）

```c
unsigned int v;            // find the number of trailing zeros in v
int r;                     // the result goes here
float f = (float)(v & -v); // cast the least significant bit in v to a float
r = (*(uint32_t *)&f >> 23) - 0x7f;
```

尽管只需约 6 次操作，但整数转 float 在某些机器上代价很高。这里利用 IEEE 754 的指数位：把 `v` 的最低置位单独取出并转为 float，指数减去偏置即可得到该置位的位置。若 `v` 为 0，则结果为 `-127`。

---

### 取模 + 查表法（Count trailing zeros with modulus division and lookup）

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

该方法利用这样一个事实：前 32 个 bit 位置与 37 互素（相对素），因此对 37 取模会得到 0..36 的唯一值，再用小表映射回 trailing zeros。它只需 4 次操作，但取模和查表可能让它不适合某些场景。我是独立想到的，后来搜索表值的子序列时发现它在《Hacker's Delight》中被归功于 Reiser。

---

### 乘法 + 查表法（de Bruijn）（Count trailing zeros with multiply and lookup）

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

这比“取模 + 查表”多 1 次操作，但乘法可能更快。表达式 `(v & -v)` 提取最低置位。常量 `0x077CB531U` 是一个 de Bruijn 序列，乘上它后会在高 5 位产生与 bit 位置一一对应的唯一模式，从而查表得到索引。若没有任何置位，则返回 0。

更多信息可参见论文《Using de Bruijn Sequences to Index 1 in a Computer Word》（Charles E. Leiserson、Harald Prokof、Keith H. Randall）。

Andrew Shapira 在 2005 年 10 月 8 日建议加入该方法。2009 年 4 月 14 日 Dustin Spicuzza 要求把乘法结果转成 32-bit，否则在 64-bit int 编译时会出问题。

---

## 通过 float 转型向上取整到下一个 2 的幂（Round up to the next highest power of 2 by float casting）

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

该代码用 8 次操作，适用于所有 `v <= (1<<31)`。

快速但粗糙版本（取值域 `1 < v < (1<<25)`）：

```c
float f = (float)(v - 1);
r = 1U << ((*(unsigned int*)(&f) >> 23) - 126);
```

尽管 quick-and-dirty 版本只需约 6 次操作，但在 Athlon™ XP 2100+ 上基准测试显示它比下面（12 次操作）的技巧慢约 3 倍。某些 CPU 可能更适合它。

2005 年 9 月 27 日 Andi Smithers 建议加入用 float 找 lg 来向上取整到 2 的幂的方法。他的版本与这里类似，受尾数舍入影响只能用于 `< (1<<25)`，但多 1 次操作。

---

## 向上取整到下一个 2 的幂（Round up to the next highest power of 2）

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

该代码用 12 次操作计算 32-bit 整数的下一个（或自身）2 的幂。边界情况 `v=0` 时返回 0（不是 2 的幂）；若在意可追加 `v += (v == 0)` 修正。用公式 `1U << (lg(v - 1) + 1)` 再配合查表 log2 会更快 2 次操作，但有些场景不适合查表，因此上述写法可能更合适。

它的原理是：把最高置位复制到所有低位，然后加 1，通过进位把低位清零，并把最高位之上的一位变成 1。如果原数本来就是 2 的幂，则先 `v--` 让它变成全 1，再加回去就得到原值。

Atul Divekar 在 2010 年 9 月 5 日建议我提到：也可以用查表的 `floor(lg(v))`，再算 `1<<(1+floor(lg(v)))`，这样只需 8 或 9 次操作。

Sean Anderson 于 2001 年 9 月 14 日提出该算法。Pete Hart 在 1997 年 2 月把我引向他与 William Lewis 的几篇新闻组帖子，他们得出了同样算法。

---

## 交织 bit（也叫计算 Morton 数）（Interleaving bits (aka computing Morton Numbers)）

### 直观方法（Interleave bits the obvious way）

```c
unsigned short x;   // Interleave bits of x and y, so that all of the
unsigned short y;   // bits of x are in the even positions and y in the odd;
unsigned int z = 0; // z gets the resulting Morton Number.

for (int i = 0; i < sizeof(x) * CHAR_BIT; i++) // unroll for more speed...
{
  z |= (x & 1U << i) << i | (y & 1U << i) << (i + 1);
}
```

交织 bit（Morton numbers）常用于把二维整数坐标线性化：把 `x` 与 `y` 合并成一个整数，这个整数可以直接比较，并具有这样的性质：若两点的 x、y 坐标都接近，那么 Morton 数通常也接近。

---

### 查表法（Interleave bits by table lookup）

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

若想更快，可再增加一张表：把 `MortonTable256` 的值预先左移 1 bit，用于 `y` 的查表，从而减少 2 次操作，但内存几乎翻倍。进一步也可以做 4 张表（其中两张再预左移 16 位），这样总操作数可降到 11。

---

### 用 64 位乘法交织 bit（Interleave bits with 64-bit multiply）

下面方法在 11 次操作中交织两个字节（而非 `unsigned short`）。但其中许多操作是 64-bit 乘法，因此并不适合所有机器。输入 `x`、`y` 需要小于 256。

Holger Bettag 在 2004 年 10 月 10 日读到本文的乘法反转 bit 后受到启发，建议加入该技巧。

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

### 用二进制魔数交织 bit（Interleave bits by Binary Magic Numbers）

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

## 测试 word 中字节范围（以及统计出现次数）（Testing for ranges of bytes in a word）

### 判断 word 是否含有 0 字节（Determine if a word has a zero byte）

```c
// Fewer operations:
unsigned int v; // 32-bit word to check if any 8-bit byte in it is 0
bool hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
```

该写法在做“每次拷贝一个 word 的快速字符串拷贝”时很有用；它只用 5 次操作。相比之下，下面这些直观方法至少需要 7 次操作，最多 12 次。

```c
// More operations:
bool hasNoZeroByte = ((v & 0xff) && (v & 0xff00) && (v & 0xff0000) && (v & 0xff000000))
// OR:
unsigned char * p = (unsigned char *) &v;
bool hasNoZeroByte = *p && *(p + 1) && *(p + 2) && *(p + 3);
```

还可以先做一个更快的预检（4 次操作）判断“可能有 0 字节”。该测试在最高字节为 `0x80` 时会出现假阳性，因此命中后可再用更可靠的版本复核，以提高整体性能并保持输出正确。

```c
bool hasZeroByte = ((v + 0x7efefeff) ^ ~v) & 0x81010100;
if (hasZeroByte) // or may just have 0x80 in the high byte
{
  hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
}
```

还有一种更快的方法——使用下面定义的 `hasless(v, 1)`；它只需 4 次操作且无需后续验证。它可化简为：

```c
#define haszero(v) (((v) - 0x01010101UL) & ~(v) & 0x80808080UL)
```

其中 `(v - 0x01010101UL)` 会在某字节为 0 或大于 `0x80` 时让对应字节的高位产生进位；`~v & 0x80808080UL` 选出那些高位未置位（即 < 0x80）的字节；两者 AND 后，留下的就是“字节恰为 0”的位置。

Paul Messmer 在 2004 年 10 月 2 日提出了更快预检的改进。Juha Järvi 在 2005 年 4 月 6 日建议了 `haszero`（他在 Paul Hsieh 的 Assembly Lab 中看到；更早它曾出现在 1987 年 4 月 27 日 Alan Mycroft 的新闻组帖子里）。

---

### 判断是否存在某字节等于 n（Determine if a word has a byte equal to n）

如果我们想知道 word 中是否存在某个字节等于指定值，可以把 `x` 与“每个字节都填充为 n 的 word”做 XOR：相等则该字节 XOR 后为 0，否则非 0；再把结果交给 `haszero` 即可。

```c
#define hasvalue(x,n) \
(haszero((x) ^ (~0UL/255 * (n))))
```

Stephen M Bennet 在 2009 年 12 月 13 日建议加入该技巧。

---

### 判断是否存在某字节小于 n（Determine if a word has a byte less than n）

测试 word `x` 中是否包含无符号字节满足 `< n`。特别地，当 `n=1` 时，可用于检测 0 字节（每次检查一个 long），或者先用 mask XOR 再检测任意字节。若 `n` 为常量，则只需 4 次算术/逻辑操作。

要求：`x >= 0`；`0 <= n <= 128`

```c
#define hasless(x,n) (((x)-~0UL/255*(n))&~(x)&~0UL/255*128)
```

若要统计 `x` 中小于 n 的字节数量（7 次操作）：

```c
#define countless(x,n) \
(((~0UL/255*(127+(n))-((x)&~0UL/255*127))&~(x)&~0UL/255*128)/128%255)
```

Juha Järvi 在 2005 年 4 月 6 日把这个巧妙方法发给我。Sean Anderson 在 2005 年 4 月 10 日受其启发加入了宏定义（以及下文的 `hasmore/countmore` 等）。

---

### 判断是否存在某字节大于 n（Determine if a word has a byte greater than n）

测试 word `x` 中是否包含无符号字节满足 `> n`。当 n 为常量时只需 3 次操作。

要求：`x >= 0`；`0 <= n <= 127`

```c
#define hasmore(x,n) (((x)+~0UL/255*(127-(n))|(x))&~0UL/255*128)
```

统计 `x` 中大于 n 的字节数量（6 次操作）：

```c
#define countmore(x,n) \
(((((x)&~0UL/255*127)+~0UL/255*(127-(n))|(x))&~0UL/255*128)/128%255)
```

---

### 判断是否存在某字节介于 m 与 n 之间（Determine if a word has a byte between m and n）

当 `m < n` 时，该技巧测试 word `x` 中是否存在无符号字节满足 `m < value < n`。当 m、n 为常量时需要 7 次操作。

注意：`likelyhasbetween` 可能把“等于 n 的字节”报告为假阳性，因此若需要严格正确，需逐字节复核。

要求：`x >= 0`；`0 <= m <= 127`；`0 <= n <= 128`

```c
#define likelyhasbetween(x,m,n) \
((((x)-~0UL/255*(n))&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

一个多 1 次操作（总计 8 次）但能给出精确答案的变体是：

```c
#define hasbetween(x,m,n) \
((~0UL/255*(127+(n))-((x)&~0UL/255*127)&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

统计介于 m 与 n（开区间）之间的字节数量（10 次操作）：

```c
#define countbetween(x,m,n) (hasbetween(x,m,n)/128%255)
```

---

## 计算字典序的下一个 bit 排列（Compute the lexicographically next bit permutation）

假设一个整数中有 N 个 bit 置位为 1，我们想在“字典序”的意义下得到下一个包含 N 个 1 的排列。例如 N=3、bit 模式是 `00010011`，那么后续依次为：`00010101`、`00010110`、`00011001`、`00011010`、`00011100`、`00100011` ……等等。下面给出一种快速计算下一个排列的方法。

GNU C 编译器在 x86 上的内建函数 `__builtin_ctz(v)` 返回末尾 0 的数量。若使用 MSVC（x86），对应 intrinsic 是 `_BitScanForward`。两者都会生成 `bsf` 指令。其他架构也可能有类似指令；若没有，可使用上文的 trailing zeros 方法之一。

```c
unsigned int v; // current permutation of bits
unsigned int w; // next permutation of bits

unsigned int t = v | (v - 1); // t gets v's least significant 0 bits set to 1
// Next set to 1 the most significant bit to change,
// set to 0 the least significant ones, and add the necessary 1 bits.
w = (t + 1) | (((~t & -~t) - 1) >> (__builtin_ctz(v) + 1));
```

下面是另一个版本，通常会更慢，因为包含除法，但不需要计算 trailing zeros：

```c
unsigned int t = (v | (v - 1)) + 1;
w = t | ((((t & -t) / (v & -v)) >> 1) - 1);
```

感谢来自阿根廷的 Dario Sneidermanis，他在 2009 年 11 月 28 日提供了该方法。

---

还提供了一份白俄罗斯语翻译（由 Webhostingrating 提供）。
