---
title: 位元操作技巧
description: Sean Eron Anderson 的經典位元運算技巧合集（翻譯）。僅翻譯文字，程式碼區塊保持原樣，便於直接複製使用與對照閱讀。
published: '2026-03-14T00:00:00.000Z'
tags:
  - 位元運算
  - C/C++
  - 程式碼技巧
lang: zh-tw
abbrlink: bit-twiddling-hacks
translationKey: bit-twiddling-hacks
---

# Bit Twiddling Hacks
By Sean Eron Anderson
seander@cs.stanford.edu

本文中的每段程式碼（除非另有註明）均屬於公有領域（public domain）——你可以按你喜歡的方式使用它們。作為一個彙總集合，這些程式碼與說明文字的整體著作權歸 Sean Eron Anderson 所有（© 1997-2005）。這些程式碼與說明文字的發布目的，是希望它們能對你有用，但**不提供任何擔保**；包括但不限於對適銷性或特定用途適用性的默示擔保。

截至 2005 年 5 月 5 日，所有程式碼都經過了充分測試。已有成千上萬的人閱讀過它。此外，卡內基美隆大學電腦科學學院院長 Randal Bryant 教授還使用他的 Uclid 程式碼驗證系統親自測試了幾乎所有內容。對於他尚未測試的部分，我也在一台 32 位元機器上對所有可能輸入進行了檢查。

如果你是第一個告知我程式碼中存在**真實且合理**的 bug 的人，我會支付 10 美元獎金（支票或 Paypal）。如果你希望我把這筆錢捐給慈善機構，我會支付 20 美元。

---

## 目錄（Contents）

- 關於操作計數方法（About the operation counting methodology）
- 計算整數的符號（Compute the sign of an integer）
- 檢測兩個整數是否符號相反（Detect if two integers have opposite signs）
- 不分支計算整數絕對值 abs（Compute the integer absolute value (abs) without branching）
- 不分支求兩個整數的最小值/最大值（Compute the minimum (min) or maximum (max) of two integers without branching）
- 判斷整數是否為 2 的冪（Determining if an integer is a power of 2）
- 符號擴展（Sign extending）
- 從固定位元寬度進行符號擴展（Sign extending from a constant bit-width）
- 從可變位元寬度進行符號擴展（Sign extending from a variable bit-width）
- 在 3 次操作內從可變位元寬度進行符號擴展（Sign extending from a variable bit-width in 3 operations）
- 不分支按條件設定/清除位元（Conditionally set or clear bits without branching）
- 不分支按條件取負（Conditionally negate a value without branching）
- 按遮罩從兩個值合併位元（Merge bits from two values according to a mask）
- 統計置位 bit 的數量（Counting bits set）
- 從固定位元寬度進行符號擴展（Sign extending from a constant bit-width）
- 從可變位元寬度進行符號擴展（Sign extending from a variable bit-width）
- ……（下文逐段翻譯追加）

> 說明：目錄很長，本文會按原文順序逐段翻譯追加。

---

## 關於操作計數方法（About the operation counting methodology）

在統計本文演算法的「操作數」時，**任何 C 運算子都按 1 次操作計**。中間變數賦值（不一定會寫回 RAM）不計入操作數。當然，這種計數方式只能粗略近似真實的機器指令數和 CPU 時間。

本文假設所有操作耗時相同——這在現實中並不成立，但隨著時間推移，CPU 的發展趨勢在一定程度上讓這個假設更接近事實。實際速度取決於許多細節，例如快取大小、記憶體頻寬、指令集等。

最終，**基準測試（benchmarking）**才是判斷某種方法是否真的更快的最佳方式。因此，把下面這些技巧視為在目標架構上值得測試的候選方案即可。

---

## 計算整數的符號（Compute the sign of an integer）

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

上面最後一個表達式在 32 位元整數時等價於 `sign = v >> 31`。它比直觀寫法 `sign = -(v < 0)` 少 1 次操作。這個技巧成立的原因是：當對有符號整數做右移時，最左側的符號位會被複製到其餘位元。最左位在負數時為 1，否則為 0；全 1 的位元模式對應 `-1`。但遺憾的是，這種行為與體系結構/實作相關。

如果你希望結果是 `-1` 或 `+1`，可以用：

```c
sign = +1 | (v >> (sizeof(int) * CHAR_BIT - 1));  // if v < 0 then -1, else +1
```

如果你希望結果是 `-1`、`0` 或 `+1`，可以用：

```c
sign = (v != 0) | -(int)((unsigned int)((int)v) >> (sizeof(int) * CHAR_BIT - 1));
// Or, for more speed but less portability:
sign = (v != 0) | (v >> (sizeof(int) * CHAR_BIT - 1));  // -1, 0, or +1
// Or, for portability, brevity, and (perhaps) speed:
sign = (v > 0) - (v < 0); // -1, 0, or +1
```

如果你只想判斷是否非負（非負回傳 `1`，否則 `0`），可以用：

> 注意：2003 年 3 月 7 日，Angus Duggan 指出 1989 ANSI C 規範將「有符號右移」的結果定義為 implementation-defined，因此在某些系統上此技巧可能失效。為了更好的可攜性，Toby Speight 在 2005 年 9 月 28 日建議此處及全文都使用 `CHAR_BIT`，而不要假設 1 位元組恆為 8 bit。2006 年 3 月 4 日，Angus 推薦了上面涉及強制轉型的可攜版本。2009 年 9 月 12 日，Rohit Garg 提供了下面這個用於「非負判斷」的版本。

```c
sign = 1 ^ ((unsigned int)v >> (sizeof(int) * CHAR_BIT - 1)); // if v < 0 then 0, else 1
```

---

## 檢測兩個整數是否符號相反（Detect if two integers have opposite signs）

```c
int x, y;               // input values to compare signs

bool f = ((x ^ y) < 0); // true iff x and y have opposite signs
```

Manfred Weis 建議我在 2009 年 11 月 26 日加入這條技巧。

---

## 不分支計算整數絕對值 abs（Compute the integer absolute value (abs) without branching）

```c
int v;           // we want to find the absolute value of v
unsigned int r;  // the result goes here
int const mask = v >> sizeof(int) * CHAR_BIT - 1;

r = (v + mask) ^ mask;
```

專利變體（Patented variation）：有些 CPU 沒有「整數絕對值」指令（或編譯器沒有使用它）。在分支代價很高的機器上，上面的表達式可能比直觀寫法 `r = (v < 0) ? -(unsigned)v : v` 更快，儘管兩者的操作數相同。

```c
r = (v ^ mask) - mask;
```

> 注意：2003 年 3 月 7 日，Angus Duggan 指出 1989 ANSI C 規範將「有符號右移」的結果定義為 implementation-defined，因此在某些系統上此技巧可能失效。我也讀到過 ANSI C 並不要求整數必須以二進位補碼（two's complement）表示，因此在極少數仍使用反碼（one's complement）的老機器上也可能失效。
>
> 2004 年 3 月 14 日，Keith H. Duggar 把上面的「專利變體」發給我；它優於我最初想到的方法，因為它不需要用乘法。不幸的是，這個方法在美國於 2000 年 6 月 6 日被 Vladimir Yu Volkonsky 申請並授予專利，專利權轉讓給了 Sun Microsystems。
>
> 2006 年 8 月 13 日，Yuriy Kaminskiy 告訴我該專利很可能無效，因為該方法在申請專利前就已公開發表，例如 Agner Fog 在 1996 年 11 月 9 日的《How to Optimize for the Pentium Processor》一書中就寫過。Yuriy 也提到該文件在 1997 年被翻譯成俄文，Vladimir 可能讀過；並且 Internet Archive 上也能找到舊連結。
>
> 2007 年 1 月 30 日，Peter Kankowski 分享了一個受 Microsoft Visual C++ 編譯器輸出啟發的 abs 版本，我把它作為此處的主要方案。
>
> 2007 年 12 月 6 日，Hai Jin 抱怨結果是有符號的，因此當對最小負數取 abs 時仍然是負數。
>
> 2008 年 4 月 15 日，Andrew Shapira 指出直觀寫法可能溢位，因為先前缺少 `(unsigned)` 轉換；為獲得最大可攜性他建議……但 Vincent Lefèvre 在 2008 年 7 月 9 日引用 ISO C99 規範說服我移除該建議：即使在非二補碼機器上，`-(unsigned)v` 仍然會得到正確結果。
>
> 原因是：計算 `-(unsigned)v` 時，會先把 v 的負值轉換為無符號值（透過加上 `2**N`），得到 v 的二補碼表示 U；隨後對 U 取負，得到 `-U = 0 - U = 2**N - U = 2**N - (v+2**N) = -v = abs(v)`。

---

## 不分支求兩個整數的最小值/最大值（Compute the minimum (min) or maximum (max) of two integers without branching）

```c
int x;  // we want to find the minimum of x and y
int y;
int r;  // the result goes here

r = y ^ ((x ^ y) & -(x < y)); // min(x, y)
```

在一些極少見的機器上，如果分支非常昂貴且沒有條件移動（conditional move）指令，上面的表達式可能比直觀寫法 `r = (x < y) ? x : y` 更快，儘管它多了兩條指令。（不過通常直觀寫法才是最佳選擇。）它之所以可行，是因為：

- 若 `x < y`，則 `-(x < y)` 會變成全 1，於是
  `r = y ^ ((x ^ y) & ~0) = y ^ x ^ y = x`。
- 否則 `x >= y`，則 `-(x < y)` 為全 0，於是
  `r = y ^ ((x ^ y) & 0) = y`。

在某些機器上，把 `(x < y)` 計算成 0 或 1 需要分支指令，因此不一定有優勢。

求最大值時，用：

```c
r = x ^ ((x ^ y) & -(x < y)); // max(x, y)
```

快速但粗糙（Quick and dirty）的版本：
如果你確定滿足 `INT_MIN <= x - y <= INT_MAX`，可以用下面的寫法，它更快，因為 `(x - y)` 只需計算一次。注意：1989 ANSI C 規範沒有規定「有符號右移」的結果，因此這兩句**不可攜**。如果溢位會拋例外，那麼 x、y 應當使用無符號或在做減法時轉為無符號，以避免不必要的例外；不過右移需要有符號運算元才能在為負時產生全 1，因此右移處需要轉回有符號。

```c
r = y + ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // min(x, y)
r = x - ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // max(x, y)
```

> 說明：2003 年 3 月 7 日 Angus Duggan 指出了右移可攜性問題。2005 年 5 月 3 日 Randal E. Bryant 提醒需要滿足前置條件 `INT_MIN <= x - y <= INT_MAX`，並建議使用非 quick-and-dirty 版本修復。2005 年 7 月 6 日 Nigel Horspoon 觀察到 gcc 在 Pentium 上對直觀寫法生成了同樣程式碼（取決於 `(x < y)` 的實作）。2008 年 7 月 9 日 Vincent Lefèvre 指出舊版本 `r = y + ((x - y) & -(x < y))` 的減法在啟用溢位例外時有風險。2009 年 6 月 2 日 Timothy B. Terriberry 建議用 xor 而不是加減，以減少型別轉換與溢位風險。

---

## 判斷整數是否為 2 的冪（Determining if an integer is a power of 2）

```c
unsigned int v; // we want to see if v is a power of 2
bool f;         // the result goes here

f = (v & (v - 1)) == 0;
```

注意：這裡會把 `0` 錯誤地當作 2 的冪。要修正它，用：

```c
f = v && !(v & (v - 1));
```

---

## 從固定位元寬度進行符號擴展（Sign extending from a constant bit-width）

對於內建型別（例如 `char`、`int`），符號擴展是自動完成的。但假設你有一個有符號的二補碼數 `x`，它只用 `b` 個 bit 儲存；現在你想把它轉換成 bit 數更多的 `int`。如果 `x` 是正數，直接拷貝即可；但如果是負數，就必須擴展符號位。

例如，若只有 4 bit 存一個數，`-3` 的二進位表示是 `1101`；若用 8 bit，則是 `11111101`。把 4 bit 表示轉換成更多 bit 表示時，需要把最高位（符號位）向左複製填充，這個過程就是**符號擴展**（sign extending）。

在 C 語言裡，從固定 bit 寬度進行符號擴展很簡單，因為可以在 `struct` 或 `union` 中定義位元欄位（bit field）。例如，把一個 5 bit 的數轉換成完整的 `int`：

```c
int x; // convert this from using 5 bits to a full int
int r; // resulting sign extended number goes here
struct {signed int x:5;} s;
r = s.x = x;
```

下面是一個 C++ 範本函式，利用相同語言特性，把一個用 B bit 表示的值在 1 次操作中轉換（當然編譯器實際會生成更多指令）：

```cpp
template <typename T, unsigned B>
inline T signextend(const T x)
{
  struct {T x:B;} s;
  return s.x = x;
}

int r = signextend<signed int,5>(x);  // sign extend 5 bit number x to r
```

> 說明：2005 年 5 月 2 日 John Byrd 發現了程式碼裡的一個拼字錯誤（可能由 HTML 格式引起）。2006 年 3 月 4 日 Pat Wood 指出 ANSI C 標準要求位元欄位必須顯式寫 `signed` 才能保證其為有符號；否則符號是不確定的。

---

## 從可變位元寬度進行符號擴展（Sign extending from a variable bit-width）

有時我們需要做符號擴展，但事先並不知道數字使用的 bit 數 `b`。（或者你在 Java 這類沒有位元欄位的語言中編程。）上面固定寬度的寫法需要 4 次操作；但當 bit 寬度是常數而不是變數時，如果高位本來就都是 0，那麼只需 2 次快速操作。

```c
unsigned b; // number of bits representing the number in x
int x;      // sign extend this b-bit number to r
int r;      // resulting sign-extended number
int const m = 1U << (b - 1); // mask can be pre-computed if b is fixed

x = x & ((1U << b) - 1);  // (Skip this if bits in x above position b are already zero.)
r = (x ^ m) - m;
```

一種稍快但可攜性較差的方法，不依賴於 `x` 在第 b 位以上是否為 0：

```c
int const m = CHAR_BIT * sizeof(x) - b;
r = (x << m) >> m;
```

> 說明：2004 年 6 月 13 日 Sean A. Irvine 建議我把符號擴展方法加入本頁，並給出了一個起點，我將其最佳化為 `m = 1U << (b - 1); r = (x ^ m) - m`。2007 年 5 月 11 日 Shay Green 建議了上面這個版本，它比我之前的版本少 1 次操作。2008 年 10 月 15 日 Vipin Sharma 建議加入一步，以處理 `x` 在目標 b 位以外可能仍包含 1 的情況。2009 年 12 月 31 日 Chris Pirazzi 建議加入「更快版本」，常數寬度時僅需 2 次操作，變數寬度時為 3 次操作。

---

## 在 3 次操作內從可變位元寬度進行符號擴展（Sign extending from a variable bit-width in 3 operations）

下面這種方法在某些機器上可能較慢，因為乘法與除法的代價較高。這個版本需要 4 次操作。如果你能保證初始 bit 寬度 `b > 1`，那麼可以用 `r = (x * multipliers[b]) / divisors[b]` 這類方式把它壓到 3 次操作（只需要一次陣列查表）。

接下來這個變體並不可攜，但在使用「算術右移」（arithmetic right shift，右移時保留符號）的體系結構上應該很快。Randal E. Bryant 在 2005 年 5 月 3 日指出了早期版本的一個 bug（當時把 `multipliers[]` 誤用作 `divisors[]`），在 `x=1, b=1` 的情況下會失敗。

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

## 不分支按條件設定/清除位元（Conditionally set or clear bits without branching）

```c
bool f;         // conditional flag
unsigned int m; // the bit mask
unsigned int w; // the word to modify:  if (f) w |= m; else w &= ~m;

w ^= (-f ^ w) & m;

// OR, for superscalar CPUs:
w = (w & ~m) | (-f & m);
```

在某些架構上，不使用分支帶來的收益足以抵消「看起來操作數加倍」的劣勢。比如在 AMD Athlon™ XP 2100+ 上的非正式速度測試表明它能快 5–10%。在 Intel Core 2 Duo 上，適合超純量（superscalar）的第二種寫法比第一種快約 16%。

Glenn Slayden 在 2003 年 12 月 11 日把第一個表達式告知我。Marco Yu 在 2007 年 4 月 3 日分享了適合 superscalar 的版本，並在兩天後指出了一個筆誤。

---

## 不分支按條件取負（Conditionally negate a value without branching）

如果你只需要在某個 flag 為 false 時取負（negate），可以用下面寫法來避免分支；如果你只需要在 flag 為 true 時取負，則用第二個寫法。

Avraham Plotnitzky 在 2009 年 6 月 2 日建議加入第一個版本。為了避免乘法，我在 2009 年 6 月 8 日想出了第二個版本。Alfonso De Gregorio 在 2009 年 11 月 26 日指出其中缺少括號，並獲得了 bug 懸賞。

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

## 按遮罩從兩個值合併位元（Merge bits from two values according to a mask）

```c
unsigned int a;    // value to merge in non-masked bits
unsigned int b;    // value to merge in masked bits
unsigned int mask; // 1 where bits from b should be selected; 0 where from a.
unsigned int r;    // result of (a & ~mask) | (b & mask) goes here

r = a ^ ((a ^ b) & mask);
```

這比直觀寫法 `(a & ~mask) | (b & mask)` 少 1 次操作。如果 `mask` 是常數，那麼未必有優勢。

Ron Jeffery 在 2006 年 2 月 9 日把這個技巧發給我。

---

## 統計置位 bit 的數量（Counting bits set）

### 樸素方法（naive way）

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v

for (c = 0; v; v >>= 1)
{
  c += v & 1;
}
```

樸素方法每次迴圈處理 1 個 bit，直到沒有置位為止。所以對於 32 位元整數，若只有最高位是 1，它會迴圈 32 次。

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

2009 年 7 月 14 日，Hallvard Furuseth 建議使用巨集來壓縮表的寫法。

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

Brian Kernighan 的方法迴圈次數等於置位 bit 的數量。所以對於 32 位元整數，若只有最高位是 1，它只會迴圈 1 次。

該方法在《The C Programming Language（第 2 版）》的練習 2-9 中提到（1988 年）。2006 年 4 月 19 日，Donald Knuth 告訴我這個方法最早由 Peter Wegner 發表在 CACM 3 (1960), 322。（此外 Derrick Lehmer 也獨立發現並在 1964 年出版的某本書中發表，書的編輯是 Beckenbach。）

---

### 使用 64 位元指令統計 14/24/32 位元字（using 64-bit instructions）

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

這種方法需要 64 位元 CPU 且取模除法很快時才高效。第 1 個選項僅需 3 次操作；第 2 個選項需要 10 次；第 3 個選項需要 15 次。

Rich Schroeppel 最初建立了一個 9-bit 版本（類似 option 1）；可參見 Beeler, M., Gosper, R. W., and Schroeppel, R.《HAKMEM》中的 Programming Hacks 章節，MIT AI Memo 239，1972 年 2 月 29 日。他的方法啟發了上面的變體，這些變體由 Sean Anderson 設計。Randal E. Bryant 在 2005 年 5 月 3 日提供了幾個 bug 修正。Bruce Dawson 在 2007 年 2 月 1 日把此前的 12-bit 版本微調為適用於 14 bit，且操作數不變。

---

### 平行計數（in parallel）

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

B 陣列寫成二進位是：

- `B[0] = 0x55555555 = 01010101 01010101 01010101 01010101`
- `B[1] = 0x33333333 = 00110011 00110011 00110011 00110011`
- `B[2] = 0x0F0F0F0F = 00001111 00001111 00001111 00001111`
- `B[3] = 0x00FF00FF = 00000000 11111111 00000000 11111111`
- `B[4] = 0x0000FFFF = 00000000 00000000 11111111 11111111`

我們可以透過延續這些「二進位魔數（Binary Magic Numbers）」的模式來適配更大的整數位元寬：如果有 k 個 bit，那麼陣列 S 和 B 的長度需要是 `ceil(lg(k))`，並且需要計算同樣數量的表達式。對於 32-bit 的 `v`，上述方法用了 16 次操作。

---

### 更佳的 32 位元計數方法（The best method for 32-bit）

```c
v = v - ((v >> 1) & 0x55555555);                    // reuse input as temporary
v = (v & 0x33333333) + ((v >> 2) & 0x33333333);     // temp
c = ((v + (v >> 4) & 0xF0F0F0F) * 0x1010101) >> 24; // count
```

這個「最佳方法」只需要 12 次操作，和查表法一樣，但它避免了表帶來的記憶體存取與潛在快取未命中的成本。它是上面「純平行法」和更早的「用乘法 + 64 位元指令」那類方法之間的折衷：它在位元組層面平行統計每個位元組的置位 bit 數，然後透過乘以 `0x1010101` 並右移 24 bit，把 4 個位元組的計數求和。

---

### 推廣到最多 128 位元（generalization up to 128-bit）

下面給出對最多 128 位元整數（用型別 `T` 參數化）的推廣：

```c
v = v - ((v >> 1) & (T)~(T)0/3);                           // temp
v = (v & (T)~(T)0/15*3) + ((v >> 2) & (T)~(T)0/15*3);      // temp
v = (v + (v >> 4)) & (T)~(T)0/255*15;                      // temp
c = (T)(v * ((T)~(T)0/255)) >> (sizeof(T) - 1) * CHAR_BIT; // count
```

關於統計置位 bit（也稱 sideways addition）的更多資訊，可參見 Ian Ashdown 在新聞群組中的精彩貼文。

這份「最佳計數方法」是 Andrew Shapira 在 2005 年 10 月 5 日提醒我的，他在《Software Optimization Guide for AMD Athlon™ 64 and Opteron™ Processors》第 187–188 頁中看到了它。Charlie Gordon 在 2005 年 12 月 14 日建議給純平行版本再省 1 次操作；Don Clugston 在 2005 年 12 月 30 日又削減了 3 次。我在採用 Don 的建議時寫錯了一個地方，Eric Cole 在 2006 年 1 月 8 日指出了這個筆誤。Eric 之後在 2006 年 11 月 17 日建議了「任意位元寬推廣到最佳方法」。2007 年 4 月 5 日，Al Williams 觀察到我在第一個方法頂部有一行死程式碼。

---

## 從最高位到指定位置的置位計數（rank）（Count bits set (rank) from the most-significant bit upto a given position）

下面程式碼用於計算某一 bit 的 **rank**：也就是從最高有效位（MSB）開始向右數，一直到給定位置 `pos` 為止（包含該位置）的所有置位 bit（值為 1）的數量之和。

Juha Järvi 在 2009 年 11 月 21 日把它發給我，作為下面「根據 rank 選取 bit 位置」的逆運算。

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

## 根據 rank 選取（從最高位起）bit 的位置（Select the bit position (from the most-significant bit) with the given count (rank)）

下面這段 64 位元程式碼用於：從左向右（從 MSB 開始）數置位 bit 的個數，找到第 `r` 個 1 所在的位置並回傳。如果請求的 rank 超過了置位 bit 總數，則回傳 64。該程式碼可以改造成 32 位元版本，或改為從右向左計數。

如果你的目標 CPU 分支很快，可以考慮把註解掉的 `if` 敘述取消註解，同時註解掉它們後面的無分支版本。

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

Juha Järvi 在 2009 年 11 月 21 日把這段程式碼發給我。

---

## 計算奇偶校驗（parity）（Computing parity (1 if an odd number of bits set, 0 otherwise)）

這裡的 parity 指：若置位 bit 的數量為奇數則為 1，否則為 0。

### 樸素方法（Computing parity the naive way）

下面程式碼採用類似 Brian Kernighan 計數的方式：每清除一個置位 bit 就翻轉一次 parity，因此時間與置位 bit 數量成正比。

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

Randal E. Bryant 在 2005 年 5 月 3 日鼓勵我加入最後這個「帶 variable p 的變體」（儘管它確實很直觀）。2005 年 9 月 27 日 Bruce Rawles 發現了表名的一個拼字錯誤，並獲得了 10 美元 bug 懸賞。2006 年 10 月 9 日 Fabrice Bellard 建議了上面的 32 位元變體，它們只需要一次查表；此前版本每個位元組查一次，共 4 次查表，速度更慢。2009 年 7 月 14 日 Hallvard Furuseth 建議使用巨集壓縮表的寫法。

---

### 用 64 位元乘法與取模計算 1 位元組 parity（Compute parity of a byte using 64-bit multiply and modulus division）

```c
unsigned char b;  // byte value to compute the parity of
bool parity =
  (((b * 0x0101010101010101ULL) & 0x8040201008040201ULL) % 0x1FF) & 1;
```

該方法大約需要 4 次操作，但僅適用於位元組。

---

### 用乘法計算 word parity（Compute parity of word with a multiply）

下面方法用乘法在 8 次操作內計算 32 位元值的 parity；對於 64 位元同樣只需 8 次操作。

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

Andrew Shapira 在 2007 年 9 月 2 日提出了這個方法並發給我。

---

### 平行法（Compute parity in parallel）

```c
unsigned int v;  // word value to compute the parity of
v ^= v >> 16;
v ^= v >> 8;
v ^= v >> 4;
v &= 0xf;
return (0x6996 >> v) & 1;
```

上述方法大約需要 9 次操作，適用於 32 位元 word。若只針對位元組，可去掉 `unsigned int v;` 之後緊跟的兩行，從而最佳化到約 5 次操作。

原理是：先透過移位 + XOR，把 32 位元值的 8 個半位元組（nibble）折疊到最低 nibble；然後用二進位數 `0110 1001 1001 0110`（十六進位 `0x6996`）作為一個「迷你 16 項 parity 表」，按最低 nibble 的值右移取出結果 bit，再遮罩回傳。

Mathew Hendry 在 2002 年 12 月 15 日指出了最後這步「移位查表」的想法，這個最佳化能減少 2 次操作。

---

## 交換值（Swapping Values）

### 用加減法交換（Swapping values with subtraction and addition）

```c
#define SWAP(a, b) ((&(a) == &(b)) || \
                    (((a) -= (b)), ((b) += (a)), ((a) = (b) - (a))))
```

這段巨集可以在不使用暫存變數的情況下交換 `a` 與 `b` 的值。最開始對 `a` 與 `b` 是否指向同一記憶體位置的檢查，在你確定不會發生這種情況時可以省略。（編譯器也可能作為最佳化將其去掉。）

如果你啟用了溢位例外，建議傳入無符號值以避免拋例外。下面的 XOR 交換法在某些機器上可能略快。不要對浮點數使用這個巨集（除非你操作的是它們的原始整數表示）。

Sanjeev Sivasankaran 建議我在 2007 年 6 月 12 日加入這條。Vincent Lefèvre 在 2008 年 7 月 9 日指出了加減法可能觸發溢位例外的問題。

---

### 用 XOR 交換（Swapping values with XOR）

```c
#define SWAP(a, b) (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))
```

這是一個老技巧：不借助暫存變數交換 `a` 與 `b` 的值。

2005 年 1 月 20 日，Iain A. Fleming 指出：當你交換同一記憶體位置（例如 `SWAP(a[i], a[j])` 且 `i == j`）時，這個巨集會失效。因此如果可能出現這種情況，可以改成：

`(((&(a) == &(b)) || (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))))`（原文給出了類似建議）

2009 年 7 月 14 日，Hallvard Furuseth 還建議在一些機器上，`(a) ^ (b)` 的結果可以被重用，從而進一步提速（原文略）。

---

### 用 XOR 交換單個位元區間（Swapping individual bits with XOR）

```c
unsigned int i, j; // positions of bit sequences to swap
unsigned int n;    // number of consecutive bits in each sequence
unsigned int b;    // bits to swap reside in b
unsigned int r;    // bit-swapped result goes here

unsigned int x = ((b >> i) ^ (b >> j)) & ((1U << n) - 1); // XOR temporary
r = b ^ ((x << i) | (x << j));
```

例：假設 `b = 00101111`（二進位），我們要交換從 `i = 1`（從右數第二位）開始的連續 `n = 3` 個 bit，和從 `j = 5` 開始的連續 `3` 個 bit；結果將是 `r = 11100011`（二進位）。

該方法與通用 XOR swap 類似，但面向單個位元（或位元區間）。變數 `x` 先存下兩段要交換的 bit 的 XOR 結果，然後透過對原數 XOR 把位元翻轉到交換後的狀態。若兩段區間有重疊，則結果未定義。

2009 年 7 月 14 日，Hallvard Furuseth 建議把 `1 << n` 改成 `1U << n`，因為結果賦給無符號數，且避免移位進入符號位。

---

## 反轉 bit 序列（Reversing bit sequences）

### 直觀寫法（Reverse bits the obvious way）

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

2004 年 10 月 15 日，Michael Hoisie 指出了原始版本中的一個 bug。2005 年 5 月 3 日，Randal E. Bryant 建議去掉一個額外操作。2005 年 5 月 18 日，Behdad Esfahbod 建議做輕微改動以減少一次迴圈迭代。之後 2007 年 2 月 6 日，Liyong Zhou 提出了更好的版本：迴圈條件改為 `v != 0`，從而不必遍歷所有 bit，可提前結束（原文歷史說明略）。

---

### 用查表法反轉 word（Reverse bits in word by lookup table）

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

第一種方法大約需要 17 次操作；第二種假設 CPU 便於按位元組 load/store，則大約需要 12 次操作。

2009 年 7 月 14 日，Hallvard Furuseth 建議使用巨集壓縮表的寫法。

---

### 用 3 次操作反轉一個位元組（64 位元乘法 + 取模）（Reverse the bits in a byte with 3 operations）

```c
unsigned char b; // reverse this (8-bit) byte

b = (b * 0x0202020202ULL & 0x010884422010ULL) % 1023;
```

乘法會把 8-bit 的位元組模式扇出成 64-bit 中的 5 份拷貝。AND 會選出相對於每個 10-bit 分組處於正確（反轉後）位置的 bit。乘法與 AND 共同保證原位元組的每個 bit 只出現在某一組 10-bit 中的某一位置。最後一步對 `2^10 - 1` 取模，會把各組 10 bit 合併起來。因為這些組在 64-bit 中互不重疊，所以取模所隱含的「加法」行為效果等同於按位 OR。

該方法歸功於 Rich Schroeppel，見 Beeler, M., Gosper, R. W., and Schroeppel, R.《HAKMEM》MIT AI Memo 239，1972 年 2 月 29 日的 Programming Hacks 章節。

---

### 用 4 次操作反轉一個位元組（64 位元乘法，無除法）（Reverse the bits in a byte with 4 operations）

```c
unsigned char b; // reverse this byte

b = ((b * 0x80200802ULL) & 0x0884422110ULL) * 0x0101010101ULL >> 32;
```

原文隨後給出了 bit 流動示意（略）。注意：在某些處理器上，最後兩步可以合併，因為暫存器可按位元組存取：只需安排乘法使某暫存器存放結果的高 32 位，然後取其低位元組即可。因此總操作數可能降到 6 次。

Sean Anderson 於 2001 年 7 月 13 日提出該方法。

---

### 用 7 次操作反轉一個位元組（不使用 64 位元）（Reverse the bits in a byte with 7 operations）

```c
b = ((b * 0x0802LU & 0x22110LU) | (b * 0x8020LU & 0x88440LU)) * 0x10101LU >> 16;
```

務必把結果賦值或強制轉型為 `unsigned char`，以去掉高位的垃圾值。Sean Anderson 於 2001 年 7 月 13 日提出該方法。Mike Keith 在 2002 年 1 月 3 日指出並修正了一個筆誤。

---

### 平行反轉 N-bit：5 * lg(N) 次操作（Reverse an N-bit quantity in parallel）

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

下面這個變體同樣是 `O(lg(N))`，但為了反轉 `v` 需要更多操作；它的優點是占用更少常數記憶體（常數在迴圈中動態計算）。上述方法適合 N 很大時使用。如果把上面方法用於 64 位元（或更大）整數，需要繼續按模式追加更多行；否則只會反轉低 32 位元，並且結果也只在低 32 位元中。

```c
unsigned int s = sizeof(v) * CHAR_BIT; // bit size; must be power of 2
unsigned int mask = ~0;
while ((s >>= 1) > 0)
{
  mask ^= (mask << s);
  v = ((v >> s) & mask) | ((v << s) & ~mask);
}
```

更多資訊可參見 Dr. Dobb's Journal 1983 年 Edwin Freed 的《Binary Magic Numbers》文章。第二個變體由 Ken Raeburn 於 2005 年 9 月 13 日建議。Veldmeijer 在 2006 年 3 月 19 日提到第一種版本最後一行可以不需要 AND（原文歷史說明略）。

---

## 取模除法（也叫計算餘數）（Modulus division (aka computing remainders)）

### 用 `1 << s` 取模（不使用除法）（Computing modulus division by 1 << s without a division operator）

```c
const unsigned int n;          // numerator
const unsigned int s;
const unsigned int d = 1U << s; // So d will be one of: 1, 2, 4, 8, 16, 32, ...
unsigned int m;                // m will be n % d
m = n & (d - 1);
```

多數程式設計師很早就會學到這個技巧，這裡為了完整性也收錄進來。

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

這個「對比 2 的冪少 1 的數取模」的方法，最多需要
`5 + (4 + 5 * ceil(N / s)) * ceil(lg(N / s))` 次操作，其中 N 是分子（numerator）的 bit 數。換句話說，它的時間複雜度最多為 `O(N * lg(N))`。

Sean Anderson 於 2001 年 8 月 15 日提出該方法。Sean A. Irvine 在 2004 年 6 月 17 日糾正了我：我曾錯誤地在註解裡說「末尾可以改用賦值」。Michael Miller 在 2005 年 4 月 25 日發現了一個筆誤。

---

### 用平行方式對 `(1 << s) - 1` 取模（不使用除法）（Computing modulus division by (1 << s) - 1 in parallel without a division operator）

> 以下程式碼以 32-bit word 為例！

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

這個方法把分子按 base `(1 << s)` 的「各位數字」平行相加，從而在最多 `O(lg(N))` 時間內完成（對上面 32-bit 的程式碼，N=32）。操作數上界約為 `12 + 9 * ceil(lg(N))`。如果你在編譯期就知道分母，可以移除表：只取出相關條目並展開迴圈。也可以很容易擴展到更多 bit。

它的直觀理解是：把結果寫在紙上，把紙對半剪開，對齊後把兩半的值逐位相加寫到新紙上；重複「剪開並相加」的過程，直到無法再剪。對 `lg(N/s/2)` 次剪裁後，不再剪，只持續做相加，直到每次相加時只剩下一個 s-bit 值為止。

Sean Anderson 於 2001 年 8 月 20 日提出該方法。Randy E. Bryant 在 2005 年 5 月 3 日指出了一個筆誤（我在貼上程式碼後，後來又在變數宣告裡寫成了 `unsinged`）。和上一條技巧類似，我也曾在註解裡誤寫「末尾可以改用賦值」，Donald Knuth 在 2006 年 4 月 19 日糾正了我並提出了替代寫法（原文略）。2009 年 6 月 18 日 Sean Irvine 提議一個改動：用 `((n >> s) & M[s])` 代替 `((n & ~M[s]) >> s)`，通常操作更少，因為常數 `M[s]` 已經被載入（原文末尾附了若干替代式）。

---

## 求整數的以 2 為底對數（也就是最高置位的位置）（Finding integer log base 2 of an integer）

### 樸素方法：MSB 在第 N 位，O(N) 次操作（Find the log base 2 ... in O(N) operations）

```c
unsigned int v; // 32-bit word to find the log base 2 of
unsigned int r = 0; // r will be lg(v)

while (v >>= 1) // unroll for more speed...
{
  r++;
}
```

整數的以 2 為底對數，等價於「最高置位 bit（MSB）的位置」。下面還有更快的方法。

---

### 用 64 位元 IEEE 浮點數求 log2（Find the log base 2 ... with an 64-bit IEEE float）

```c
int v; // 32-bit integer to find the log base 2 of
int r; // result of log_2(v) goes here
union { unsigned int u[2]; double d; } t; // temp

t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] = 0x43300000;
t.u[__FLOAT_WORD_ORDER!=LITTLE_ENDIAN] = v;
t.d -= 4503599627370496.0;
r = (t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] >> 20) - 0x3FF;
```

這段程式碼透過把 32-bit 整數（無 padding bits）寫入 `double` 的尾數（mantissa），並把指數（exponent）設為 `2^52`，從而構造出一個 64-bit IEEE-754 `double`。接著從該 `double` 中減去 `2^52`（以 double 表示就是 `4503599627370496.0`），使結果的指數變為輸入值 `v` 的 log2。最後把指數位右移到位並減去偏置 `0x3FF`（即十進位 1023）即可。

該技巧只需要 5 次操作，但許多 CPU 對 double 運算較慢，而且還需要處理架構的端序（endianness）。

Eric Cole 在 2006 年 1 月 15 日把它發給我。Evan Felix 在 2006 年 4 月 4 日指出了一個筆誤。Vincent Lefèvre 在 2008 年 7 月 9 日提醒我：端序檢查應當用浮點數的端序，因為它可能不同於整數端序。

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

這個查表法找 32-bit 值的 log2 大約只需 7 次操作。若擴展到 64-bit，約需 9 次操作。還可以用 4 張表（把可能的加法編碼進表項）進一步減少 1 次操作。表項用 `int` 也許會更快，取決於你的架構。

上述程式碼對「輸出值均勻分布」的情況做了最佳化。如果你的輸入在 32-bit 空間內均勻分布，可以考慮用下面這種寫法：

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

生成 log 表的方式（演算法化初始化）：

```c
LogTable256[0] = LogTable256[1] = 0;
for (int i = 2; i < 256; i++)
{
  LogTable256[i] = 1 + LogTable256[i / 2];
}
LogTable256[0] = -1; // if you want log(0) to return -1
```

2005 年 5 月 18 日 Behdad Esfahbod 和我把平均操作數又削減了一點點。2006 年 11 月 14 日 Emanuel Hoogeveen 又去掉了另一點點。2008 年 9 月 19 日 David A. Butterfield 建議加入「針對均勻分布輸入」的變體。2009 年 1 月 5 日 Venkat Reddy 指出 `log(0)` 應回傳 `-1` 表示錯誤，於是我把表的第一項改成了 `-1`。

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

該方法用一個小表和一次乘法計算 32-bit 整數的 log2。它只需要 13 次操作，相比上一種 `O(lg(N))` 的通用方法（可能需要到 20 次）更省。純查表法操作數最少，但該方法在「表大小 vs 速度」之間提供了折衷。

若你知道 `v` 本身就是 2 的冪，則只需：

```c
static const int MultiplyDeBruijnBitPosition2[32] =
{
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
  31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
};
r = MultiplyDeBruijnBitPosition2[(uint32_t)(v * 0x077CB531U) >> 27];
```

Eric Cole 在 2006 年 1 月 8 日提出該方法：他在讀到後文「向上取整到 2 的冪」以及「用乘法 + 查表計算 trailing zeros（de Bruijn 序列）」後，想到將其用於 log2。2009 年 12 月 10 日 Mark Dickinson 又削減了幾次操作：要求 `v` 先被「向上修約到小於下一個 2 的冪的值」而非直接修約到 2 的冪。

---

## 求整數的以 10 為底對數（Find integer log base 10 of an integer）

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

整數的 log10 先透過上面任一 log2 技巧得到 `IntegerLogBase2(v)`。根據關係 `log10(v) = log2(v) / log2(10)`，我們需要乘上 `1/log2(10)`，它近似為 `1233/4096`，也就是乘以 1233 再右移 12 位。再加 1 是因為 `IntegerLogBase2` 會向下取整。最後由於 `t` 只是近似值（可能差 1），透過判斷 `v < PowersOf10[t]` 來修正得到精確結果。

該方法比 `IntegerLogBase2` 多 6 次操作。若你的機器記憶體存取很快，可以把上文 log2 的查表法改為「表項直接存 t 的值」（也就是把預先的加法、乘法、移位編碼進表），這樣總操作數可降到 9（假設使用 4 張表，對應 v 的 4 個位元組）。

Eric Cole 建議我在 2006 年 1 月 7 日加入該方法。

---

### 樸素的 log10（Find integer log base 10 ... the obvious way）

```c
unsigned int v; // non-zero 32-bit integer value to compute the log base 10 of
int r;          // result goes here

r = (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
    (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
    (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
```

當輸入在 32-bit 空間內均勻分布時，這個方法表現很好：76% 的輸入會在第一次比較就命中，21% 會在第二次命中，2% 在第三次命中……每次比較都把剩餘範圍縮小約 90%。因此平均只需要不到 2.6 次操作。

2007 年 4 月 18 日 Emanuel Hoogeveen 提出一個變體：用除法做條件判斷，但它不如簡單比較快。

---

## 求 32-bit IEEE 浮點數的 log2 整數部分（Find integer log base 2 of a 32-bit IEEE float）

```c
const float v; // find int(log2(v)), where v > 0.0 && finite(v) && isnormal(v)
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = (c >> 23) - 127;
```

上面很快，但 IEEE 754 相容架構還支援次正規數（subnormal/denormal）。它們的指數位為 0（表示 `2^-127`），尾數也不再歸一化，因此需要從尾數中重新計算 log2。要相容 subnormal，可以用：

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

> 說明：2004 年 6 月 20 日 Sean A. Irvine 建議加入 subnormal 的處理。2005 年 6 月 11 日 Falk Hüffner 指出 ISO C99 6.5/7 對常見的 type punning 寫法 `*(int *)&` 規定為未定義行為（儘管 99.9% 編譯器可用）。他建議為最大可攜性使用 `memcpy`，或者用 `{ float; int; }` 的 union 來獲得比 `memcpy` 更好的程式碼生成。

---

## 求 `pow(2, r)` 次方根後的浮點 log2（Find integer log base 2 of the pow(2, r)-root ...）

```c
const int r;
const float v; // find int(log2(pow((double) v, 1. / pow(2, r)))),
               // where isnormal(v) and v > 0
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = ((((c - 0x3f800000) >> r) + 0x3f800000) >> 23) - 127;
```

例如 `r = 0` 時，`c = int(log2((double)v))`；`r = 1` 時，`c = int(log2(sqrt((double)v)))`；`r = 2` 時，`c = int(log2(pow((double)v, 1./4)))`。

2005 年 6 月 11 日 Falk Hüffner 同樣指出了 `*(int *)&` 的未定義行為，並建議 `memcpy`。

---

## 統計末尾連續 0（trailing zeros）（Counting consecutive trailing zero bits）

### 線性方法（Count trailing zeros linearly）

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

隨機均勻分布的二進位數平均 trailing zeros 為 1，因此這個 `O(trailing zeros)` 的方法其實並不差。

Jim Cole 在 2007 年 8 月 15 日建議加入該線性方法。2007 年 10 月 22 日 Jason Cunningham 指出我貼上程式碼時漏了 `unsigned` 修飾。

---

### 平行方法（Count trailing zeros in parallel）

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

這基本等價於「平行求 log2」，但先把最低的 1 bit 單獨取出來，然後讓 `c` 從最大值開始遞減。操作數上界約為 `3 * lg(N) + 4`（對 N-bit word）。

Bill Burdick 在 2011 年 2 月 4 日提出了一個最佳化，把時間從 `4 * lg(N)` 降低。

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

這與上一種方法類似，但它透過累加 `c` 的方式做「二分式縮小範圍」：先看低 16 位元是否為 0，是則右移 16 並 `c += 16`；後續每次檢查都把範圍再減半，直到剩下 1 位元。它比上一種更快（約快 33%），因為 if 的 body 執行次數更少。

Matt Whitlock 在 2006 年 1 月 25 日建議加入該方法。Andrew Shapira 在 2007 年 9 月 5 日又削減了幾次操作（例如令 `c=1` 並在末尾無條件減一次）。

---

### 浮點轉型法（Count trailing zeros by casting to a float）

```c
unsigned int v;            // find the number of trailing zeros in v
int r;                     // the result goes here
float f = (float)(v & -v); // cast the least significant bit in v to a float
r = (*(uint32_t *)&f >> 23) - 0x7f;
```

儘管只需約 6 次操作，但整數轉 float 在某些機器上代價很高。這裡利用 IEEE 754 的指數位：把 `v` 的最低置位單獨取出並轉為 float，指數減去偏置即可得到該置位的位置。若 `v` 為 0，則結果為 `-127`。

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

該方法利用這樣一個事實：前 32 個 bit 位置與 37 互質（相對質），因此對 37 取模會得到 0..36 的唯一值，再用小表映射回 trailing zeros。它只需 4 次操作，但取模和查表可能讓它不適合某些情境。我是獨立想到的，後來搜尋表值的子序列時發現它在《Hacker's Delight》中被歸功於 Reiser。

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

這比「取模 + 查表」多 1 次操作，但乘法可能更快。表達式 `(v & -v)` 提取最低置位。常數 `0x077CB531U` 是一個 de Bruijn 序列，乘上它後會在高 5 位元產生與 bit 位置一一對應的唯一模式，從而查表得到索引。若沒有任何置位，則回傳 0。

更多資訊可參見論文《Using de Bruijn Sequences to Index 1 in a Computer Word》（Charles E. Leiserson、Harald Prokof、Keith H. Randall）。

Andrew Shapira 在 2005 年 10 月 8 日建議加入該方法。2009 年 4 月 14 日 Dustin Spicuzza 要求把乘法結果轉成 32-bit，否則在 64-bit int 編譯時會出問題。

---

## 透過 float 轉型向上取整到下一個 2 的冪（Round up to the next highest power of 2 by float casting）

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

該程式碼用 8 次操作，適用於所有 `v <= (1<<31)`。

快速但粗糙版本（取值域 `1 < v < (1<<25)`）：

```c
float f = (float)(v - 1);
r = 1U << ((*(unsigned int*)(&f) >> 23) - 126);
```

儘管 quick-and-dirty 版本只需約 6 次操作，但在 Athlon™ XP 2100+ 上基準測試顯示它比下面（12 次操作）的技巧慢約 3 倍。某些 CPU 可能更適合它。

2005 年 9 月 27 日 Andi Smithers 建議加入用 float 找 lg 來向上取整到 2 的冪的方法。他的版本與這裡類似，受尾數捨入影響只能用於 `< (1<<25)`，但多 1 次操作。

---

## 向上取整到下一個 2 的冪（Round up to the next highest power of 2）

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

該程式碼用 12 次操作計算 32-bit 整數的下一個（或自身）2 的冪。邊界情況 `v=0` 時回傳 0（不是 2 的冪）；若在意可追加 `v += (v == 0)` 修正。用公式 `1U << (lg(v - 1) + 1)` 再配合查表 log2 會更快 2 次操作，但有些情境不適合查表，因此上述寫法可能更合適。

它的原理是：把最高置位複製到所有低位，然後加 1，透過進位把低位清零，並把最高位之上的一位變成 1。如果原數本來就是 2 的冪，則先 `v--` 讓它變成全 1，再加回去就得到原值。

Atul Divekar 在 2010 年 9 月 5 日建議我提到：也可以用查表的 `floor(lg(v))`，再算 `1<<(1+floor(lg(v)))`，這樣只需 8 或 9 次操作。

Sean Anderson 於 2001 年 9 月 14 日提出該演算法。Pete Hart 在 1997 年 2 月把我引向他與 William Lewis 的幾篇新聞群組貼文，他們得出了同樣演算法。

---

## 交織 bit（也叫計算 Morton 數）（Interleaving bits (aka computing Morton Numbers)）

### 直觀方法（Interleave bits the obvious way）

```c
unsigned short x;   // Interleave bits of x and y, so that all of the
unsigned short y;   // bits of x are in the even positions and y in the odd;
unsigned int z = 0; // z gets the resulting Morton Number.

for (int i = 0; i < sizeof(x) * CHAR_BIT; i++) // unroll for more speed...
{
  z |= (x & 1U << i) << i | (y & 1U << i) << (i + 1);
}
```

交織 bit（Morton numbers）常用於把二維整數座標線性化：把 `x` 與 `y` 合併成一個整數，這個整數可以直接比較，並具有這樣的性質：若兩點的 x、y 座標都接近，那麼 Morton 數通常也接近。

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

若想更快，可再增加一張表：把 `MortonTable256` 的值預先左移 1 bit，用於 `y` 的查表，從而減少 2 次操作，但記憶體幾乎翻倍。進一步也可以做 4 張表（其中兩張再預左移 16 位元），這樣總操作數可降到 11。

---

### 用 64 位元乘法交織 bit（Interleave bits with 64-bit multiply）

下面方法在 11 次操作中交織兩個位元組（而非 `unsigned short`）。但其中許多操作是 64-bit 乘法，因此並不適合所有機器。輸入 `x`、`y` 需要小於 256。

Holger Bettag 在 2004 年 10 月 10 日讀到本文的乘法反轉 bit 後受到啟發，建議加入該技巧。

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

### 用二進位魔數交織 bit（Interleave bits by Binary Magic Numbers）

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

## 測試 word 中位元組範圍（以及統計出現次數）（Testing for ranges of bytes in a word）

### 判斷 word 是否含有 0 位元組（Determine if a word has a zero byte）

```c
// Fewer operations:
unsigned int v; // 32-bit word to check if any 8-bit byte in it is 0
bool hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
```

該寫法在做「每次拷貝一個 word 的快速字串拷貝」時很有用；它只用 5 次操作。相比之下，下面這些直觀方法至少需要 7 次操作，最多 12 次。

```c
// More operations:
bool hasNoZeroByte = ((v & 0xff) && (v & 0xff00) && (v & 0xff0000) && (v & 0xff000000))
// OR:
unsigned char * p = (unsigned char *) &v;
bool hasNoZeroByte = *p && *(p + 1) && *(p + 2) && *(p + 3);
```

還可以先做一個更快的預檢（4 次操作）判斷「可能有 0 位元組」。該測試在最高位元組為 `0x80` 時會出現假陽性，因此命中後可再用更可靠的版本複核，以提高整體效能並保持輸出正確。

```c
bool hasZeroByte = ((v + 0x7efefeff) ^ ~v) & 0x81010100;
if (hasZeroByte) // or may just have 0x80 in the high byte
{
  hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
}
```

還有一種更快的方法——使用下面定義的 `hasless(v, 1)`；它只需 4 次操作且無需後續驗證。它可化簡為：

```c
#define haszero(v) (((v) - 0x01010101UL) & ~(v) & 0x80808080UL)
```

其中 `(v - 0x01010101UL)` 會在某位元組為 0 或大於 `0x80` 時讓對應位元組的高位產生進位；`~v & 0x80808080UL` 選出那些高位未置位（即 < 0x80）的位元組；兩者 AND 後，留下的就是「位元組恰為 0」的位置。

Paul Messmer 在 2004 年 10 月 2 日提出了更快預檢的改進。Juha Järvi 在 2005 年 4 月 6 日建議了 `haszero`（他在 Paul Hsieh 的 Assembly Lab 中看到；更早它曾出現在 1987 年 4 月 27 日 Alan Mycroft 的新聞群組貼文裡）。

---

### 判斷是否存在某位元組等於 n（Determine if a word has a byte equal to n）

如果我們想知道 word 中是否存在某個位元組等於指定值，可以把 `x` 與「每個位元組都填充為 n 的 word」做 XOR：相等則該位元組 XOR 後為 0，否則非 0；再把結果交給 `haszero` 即可。

```c
#define hasvalue(x,n) \
(haszero((x) ^ (~0UL/255 * (n))))
```

Stephen M Bennet 在 2009 年 12 月 13 日建議加入該技巧。

---

### 判斷是否存在某位元組小於 n（Determine if a word has a byte less than n）

測試 word `x` 中是否包含無符號位元組滿足 `< n`。特別地，當 `n=1` 時，可用於檢測 0 位元組（每次檢查一個 long），或者先用遮罩 XOR 再檢測任意位元組。若 `n` 為常數，則只需 4 次算術/邏輯操作。

要求：`x >= 0`；`0 <= n <= 128`

```c
#define hasless(x,n) (((x)-~0UL/255*(n))&~(x)&~0UL/255*128)
```

若要統計 `x` 中小於 n 的位元組數量（7 次操作）：

```c
#define countless(x,n) \
(((~0UL/255*(127+(n))-((x)&~0UL/255*127))&~(x)&~0UL/255*128)/128%255)
```

Juha Järvi 在 2005 年 4 月 6 日把這個巧妙方法發給我。Sean Anderson 在 2005 年 4 月 10 日受其啟發加入了巨集定義（以及下文的 `hasmore/countmore` 等）。

---

### 判斷是否存在某位元組大於 n（Determine if a word has a byte greater than n）

測試 word `x` 中是否包含無符號位元組滿足 `> n`。當 n 為常數時只需 3 次操作。

要求：`x >= 0`；`0 <= n <= 127`

```c
#define hasmore(x,n) (((x)+~0UL/255*(127-(n))|(x))&~0UL/255*128)
```

統計 `x` 中大於 n 的位元組數量（6 次操作）：

```c
#define countmore(x,n) \
(((((x)&~0UL/255*127)+~0UL/255*(127-(n))|(x))&~0UL/255*128)/128%255)
```

---

### 判斷是否存在某位元組介於 m 與 n 之間（Determine if a word has a byte between m and n）

當 `m < n` 時，該技巧測試 word `x` 中是否存在無符號位元組滿足 `m < value < n`。當 m、n 為常數時需要 7 次操作。

注意：`likelyhasbetween` 可能把「等於 n 的位元組」回報為假陽性，因此若需要嚴格正確，需逐位元組複核。

要求：`x >= 0`；`0 <= m <= 127`；`0 <= n <= 128`

```c
#define likelyhasbetween(x,m,n) \
((((x)-~0UL/255*(n))&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

一個多 1 次操作（總計 8 次）但能給出精確答案的變體是：

```c
#define hasbetween(x,m,n) \
((~0UL/255*(127+(n))-((x)&~0UL/255*127)&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

統計介於 m 與 n（開區間）之間的位元組數量（10 次操作）：

```c
#define countbetween(x,m,n) (hasbetween(x,m,n)/128%255)
```

---

## 計算字典序的下一個 bit 排列（Compute the lexicographically next bit permutation）

假設一個整數中有 N 個 bit 置位為 1，我們想在「字典序」的意義下得到下一個包含 N 個 1 的排列。例如 N=3、bit 模式是 `00010011`，那麼後續依次為：`00010101`、`00010110`、`00011001`、`00011010`、`00011100`、`00100011` ……等等。下面給出一種快速計算下一個排列的方法。

GNU C 編譯器在 x86 上的內建函式 `__builtin_ctz(v)` 回傳末尾 0 的數量。若使用 MSVC（x86），對應 intrinsic 是 `_BitScanForward`。兩者都會生成 `bsf` 指令。其他架構也可能有類似指令；若沒有，可使用上文的 trailing zeros 方法之一。

```c
unsigned int v; // current permutation of bits
unsigned int w; // next permutation of bits

unsigned int t = v | (v - 1); // t gets v's least significant 0 bits set to 1
// Next set to 1 the most significant bit to change,
// set to 0 the least significant ones, and add the necessary 1 bits.
w = (t + 1) | (((~t & -~t) - 1) >> (__builtin_ctz(v) + 1));
```

下面是另一個版本，通常會更慢，因為包含除法，但不需要計算 trailing zeros：

```c
unsigned int t = (v | (v - 1)) + 1;
w = t | ((((t & -t) / (v & -v)) >> 1) - 1);
```

感謝來自阿根廷的 Dario Sneidermanis，他在 2009 年 11 月 28 日提供了該方法。

---

還提供了一份白俄羅斯語翻譯（由 Webhostingrating 提供）。
