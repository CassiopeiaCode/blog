---
title: Bit Manipulation Tricks
description: >-
  A classic collection of bit-twiddling hacks by Sean Eron Anderson
  (translation). Only the text is translated; code blocks are kept as-is for
  easy copy/paste and side-by-side reading.
published: 2026-03-14T00:00:00.000Z
tags:
  - Bit operations
  - C/C++
  - Coding tips
lang: en
abbrlink: bit-twiddling-hacks
translationKey: bit-twiddling-hacks
---

# Bit Twiddling Hacks
By Sean Eron Anderson
seander@cs.stanford.edu

Each piece of code in this document (unless otherwise noted) is in the public domain—you can use it however you like. As a compiled collection, the overall copyright of these code snippets and the accompanying explanatory text belongs to Sean Eron Anderson (© 1997-2005). The purpose of publishing this code and text is to hope that it will be useful to you, but **it comes with NO WARRANTY**; including, but not limited to, the implied warranties of merchantability or fitness for a particular purpose.

As of May 5, 2005, all code has been thoroughly tested. Thousands of people have read it. In addition, Professor Randal Bryant, Dean of the School of Computer Science at Carnegie Mellon University, personally tested almost everything using his Uclid code verification system. For the parts he did not test, I also checked all possible inputs on a 32-bit machine.

If you are the first to notify me of a **real and reasonable** bug in the code, I will pay a $10 reward (check or PayPal). If you would like me to donate the money to a charity, I will pay $20.

---

## Contents

- About the operation counting methodology
- Compute the sign of an integer
- Detect if two integers have opposite signs
- Compute the integer absolute value (abs) without branching
- Compute the minimum (min) or maximum (max) of two integers without branching
- Determining if an integer is a power of 2
- Sign extending
- Sign extending from a constant bit-width
- Sign extending from a variable bit-width
- Sign extending from a variable bit-width in 3 operations
- Conditionally set or clear bits without branching
- Conditionally negate a value without branching
- Merge bits from two values according to a mask
- Counting bits set
- Sign extending from a constant bit-width
- Sign extending from a variable bit-width
- ... (continued with incremental, section-by-section translation below)

> Note: The table of contents is long; this article will continue translating and appending sections in the original order.

---

## About the operation counting methodology

When counting the “number of operations” for the algorithms in this document, **any C operator counts as 1 operation**. Assignments to intermediate variables (which may not actually be written back to RAM) are not counted. Of course, this counting method can only roughly approximate the real number of machine instructions and CPU time.

This document assumes all operations take the same time—this is not true in reality, but over time, CPU trends have made this assumption somewhat closer to the truth. Actual speed depends on many details, such as cache size, memory bandwidth, instruction set, and so on.

In the end, **benchmarking** is the best way to judge whether a method is truly faster. So treat the tricks below as candidate approaches worth testing on the target architecture.

---

## Compute the sign of an integer

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

The last expression above is equivalent to `sign = v >> 31` for 32-bit integers. It uses one fewer operation than the straightforward `sign = -(v < 0)`. This works because: when right-shifting a signed integer, the leftmost sign bit is replicated into the other bits. The leftmost bit is 1 for negative values and 0 otherwise; the all-ones bit pattern corresponds to `-1`. Unfortunately, this behavior is architecture/implementation-dependent.

If you want the result to be `-1` or `+1`, use:

```c
sign = +1 | (v >> (sizeof(int) * CHAR_BIT - 1));  // if v < 0 then -1, else +1
```

If you want `-1`, `0`, or `+1`, use:

```c
sign = (v != 0) | -(int)((unsigned int)((int)v) >> (sizeof(int) * CHAR_BIT - 1));
// Or, for more speed but less portability:
sign = (v != 0) | (v >> (sizeof(int) * CHAR_BIT - 1));  // -1, 0, or +1
// Or, for portability, brevity, and (perhaps) speed:
sign = (v > 0) - (v < 0); // -1, 0, or +1
```

If you only want to test whether it is non-negative (return `1` for non-negative, otherwise `0`), use:

> Note: On March 7, 2003, Angus Duggan pointed out that the 1989 ANSI C specification defines the result of “signed right shift” as implementation-defined, so this trick may fail on some systems. For better portability, on Sep 28, 2005, Toby Speight suggested using `CHAR_BIT` here and throughout the document rather than assuming a byte is always 8 bits. On Mar 4, 2006, Angus recommended the portable version above involving casts. On Sep 12, 2009, Rohit Garg provided the following version for the “non-negative test”.

```c
sign = 1 ^ ((unsigned int)v >> (sizeof(int) * CHAR_BIT - 1)); // if v < 0 then 0, else 1
```

---

## Detect if two integers have opposite signs

```c
int x, y;               // input values to compare signs

bool f = ((x ^ y) < 0); // true iff x and y have opposite signs
```

Manfred Weis suggested I add this trick on Nov 26, 2009.

---

## Compute the integer absolute value (abs) without branching

```c
int v;           // we want to find the absolute value of v
unsigned int r;  // the result goes here
int const mask = v >> sizeof(int) * CHAR_BIT - 1;

r = (v + mask) ^ mask;
```

Patented variation: Some CPUs do not have an “integer absolute value” instruction (or the compiler does not use it). On machines where branching is very expensive, the expression above may be faster than the straightforward `r = (v < 0) ? -(unsigned)v : v`, even though both have the same operation count.

```c
r = (v ^ mask) - mask;
```

> Note: On March 7, 2003, Angus Duggan pointed out that the 1989 ANSI C specification defines the result of “signed right shift” as implementation-defined, so this trick may fail on some systems. I have also read that ANSI C does not require integers to be represented in two's complement, so it may also fail on the rare old machines that still use one's complement.
>
> On March 14, 2004, Keith H. Duggar sent me the “patented variation” above; it is better than my originally conceived method because it does not require multiplication. Unfortunately, this method was patented in the U.S. on June 6, 2000 by Vladimir Yu Volkonsky, and the patent was assigned to Sun Microsystems.
>
> On Aug 13, 2006, Yuriy Kaminskiy told me the patent is likely invalid, since the method was publicly disclosed before the patent application, e.g., it appears in Agner Fog’s book “How to Optimize for the Pentium Processor” on Nov 9, 1996. Yuriy also mentioned that the document was translated into Russian in 1997, which Vladimir may have read; and that old links can be found in the Internet Archive.
>
> On Jan 30, 2007, Peter Kankowski shared an abs version inspired by Microsoft Visual C++ compiler output, and I adopted it as the primary solution here.
>
> On Dec 6, 2007, Hai Jin complained that the result is signed, so abs of the most negative number is still negative.
>
> On Apr 15, 2008, Andrew Shapira pointed out the straightforward method may overflow because it previously lacked the `(unsigned)` cast; for maximum portability he suggested ... but Vincent Lefèvre convinced me to remove that suggestion on Jul 9, 2008 by citing ISO C99: even on non-two’s-complement machines, `-(unsigned)v` still produces the correct result.
>
> The reason is: when computing `-(unsigned)v`, the negative value of v is first converted to an unsigned value (by adding `2**N`), yielding the two’s-complement representation U of v; then U is negated, yielding `-U = 0 - U = 2**N - U = 2**N - (v+2**N) = -v = abs(v)`.

---

## Compute the minimum (min) or maximum (max) of two integers without branching

```c
int x;  // we want to find the minimum of x and y
int y;
int r;  // the result goes here

r = y ^ ((x ^ y) & -(x < y)); // min(x, y)
```

On some very rare machines, if branching is extremely expensive and there is no conditional move instruction, the expression above may be faster than the obvious `r = (x < y) ? x : y`, even though it uses two extra instructions. (But usually the obvious method is best.) It works because:

- If `x < y`, then `-(x < y)` becomes all 1s, so
  `r = y ^ ((x ^ y) & ~0) = y ^ x ^ y = x`.
- Otherwise `x >= y`, then `-(x < y)` is all 0s, so
  `r = y ^ ((x ^ y) & 0) = y`.

On some machines, evaluating `(x < y)` as 0 or 1 may require a branch instruction, so this is not necessarily advantageous.

For the maximum, use:

```c
r = x ^ ((x ^ y) & -(x < y)); // max(x, y)
```

Quick and dirty version:
If you are sure `INT_MIN <= x - y <= INT_MAX`, you can use the following, which is faster because `(x - y)` is computed only once. Note: the 1989 ANSI C spec does not define the result of “signed right shift”, so these two lines are **not portable**. If overflow would throw an exception, then x and y should be unsigned or cast to unsigned for the subtraction to avoid unnecessary exceptions; however, the shift needs a signed operand to produce all 1s when negative, so you must cast back to signed for the shift.

```c
r = y + ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // min(x, y)
r = x - ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // max(x, y)
```

> Note: On March 7, 2003 Angus Duggan pointed out the portability issue with right shift. On May 3, 2005 Randal E. Bryant noted the precondition `INT_MIN <= x - y <= INT_MAX` and recommended using the non-quick-and-dirty version to fix it. On Jul 6, 2005 Nigel Horspoon observed that gcc on Pentium generated the same code for the obvious method (depending on how `(x < y)` is implemented). On Jul 9, 2008 Vincent Lefèvre pointed out that the old version `r = y + ((x - y) & -(x < y))` had a subtraction that is risky when overflow exceptions are enabled. On Jun 2, 2009 Timothy B. Terriberry suggested using xor rather than add/subtract to reduce casts and overflow risk.

---

## Determining if an integer is a power of 2

```c
unsigned int v; // we want to see if v is a power of 2
bool f;         // the result goes here

f = (v & (v - 1)) == 0;
```

Note: This incorrectly treats `0` as a power of 2. To fix it, use:

```c
f = v && !(v & (v - 1));
```

---

## Sign extending from a constant bit-width

For built-in types (e.g., `char`, `int`), sign extension is done automatically. But suppose you have a signed two’s-complement number `x` that is stored using only `b` bits; now you want to convert it to an `int` with more bits. If `x` is positive, you can just copy it; but if it is negative, you must extend the sign bit.

For example, if a number is stored in only 4 bits, `-3` is `1101`; in 8 bits it is `11111101`. When converting a 4-bit representation to a wider representation, you must replicate the highest bit (the sign bit) to the left to fill the new high bits—this is **sign extending**.

In C, sign extending from a fixed bit-width is easy because you can define a bit-field in a `struct` or `union`. For example, to convert a 5-bit number to a full `int`:

```c
int x; // convert this from using 5 bits to a full int
int r; // resulting sign extended number goes here
struct {signed int x:5;} s;
r = s.x = x;
```

Here is a C++ template function using the same language feature to convert a value represented with B bits in 1 operation (though the compiler will typically generate more instructions):

```cpp
template <typename T, unsigned B>
inline T signextend(const T x)
{
  struct {T x:B;} s;
  return s.x = x;
}

int r = signextend<signed int,5>(x);  // sign extend 5 bit number x to r
```

> Note: On May 2, 2005 John Byrd found a typo in the code (possibly introduced by HTML formatting). On Mar 4, 2006 Pat Wood pointed out that the ANSI C standard requires the bit-field to be explicitly `signed` to guarantee it is signed; otherwise the signedness is implementation-defined.

---

## Sign extending from a variable bit-width

Sometimes we need sign extension but we do not know ahead of time how many bits `b` represent the number. (Or you are programming in a language like Java that has no bit-fields.) The constant-width method above requires 4 operations; but when the bit width is a constant rather than a variable, if the high bits are already zero then only 2 fast operations are needed.

```c
unsigned b; // number of bits representing the number in x
int x;      // sign extend this b-bit number to r
int r;      // resulting sign-extended number
int const m = 1U << (b - 1); // mask can be pre-computed if b is fixed

x = x & ((1U << b) - 1);  // (Skip this if bits in x above position b are already zero.)
r = (x ^ m) - m;
```

A slightly faster but less portable method, which does not depend on whether `x` has zeros above bit b:

```c
int const m = CHAR_BIT * sizeof(x) - b;
r = (x << m) >> m;
```

> Note: On Jun 13, 2004 Sean A. Irvine suggested I add sign extension methods to this page and gave a starting point, which I optimized to `m = 1U << (b - 1); r = (x ^ m) - m`. On May 11, 2007 Shay Green suggested the version above, which uses one fewer operation than my earlier version. On Oct 15, 2008 Vipin Sharma suggested adding a step to handle the case where `x` may contain 1s outside the target b bits. On Dec 31, 2009 Chris Pirazzi suggested including the “faster version”: 2 operations for constant width, 3 for variable width.

---

## Sign extending from a variable bit-width in 3 operations

The method below may be slower on some machines because multiplication and division are expensive. This version requires 4 operations. If you can guarantee the initial bit-width `b > 1`, you can get it down to 3 operations using a form like `r = (x * multipliers[b]) / divisors[b]` (requiring only one array lookup).

The following variant is not portable, but should be fast on architectures with an arithmetic right shift (where right shift preserves the sign). Randal E. Bryant pointed out a bug in an earlier version on May 3, 2005 (it mistakenly used `multipliers[]` as `divisors[]`), which failed for `x=1, b=1`.

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

## Conditionally set or clear bits without branching

```c
bool f;         // conditional flag
unsigned int m; // the bit mask
unsigned int w; // the word to modify:  if (f) w |= m; else w &= ~m;

w ^= (-f ^ w) & m;

// OR, for superscalar CPUs:
w = (w & ~m) | (-f & m);
```

On some architectures, the gain from avoiding branches is enough to offset the apparent disadvantage of “doubling the operations”. For example, informal speed tests on an AMD Athlon™ XP 2100+ show it can be 5–10% faster. On an Intel Core 2 Duo, the second formulation (more suitable for superscalar execution) is about 16% faster than the first.

Glenn Slayden told me the first expression on Dec 11, 2003. Marco Yu shared the superscalar version on Apr 3, 2007, and two days later pointed out a typo.

---

## Conditionally negate a value without branching

If you only need to negate when a flag is false, you can use the first form below to avoid branching; if you only need to negate when the flag is true, use the second form.

Avraham Plotnitzky suggested adding the first version on Jun 2, 2009. To avoid multiplication, I came up with the second version on Jun 8, 2009. Alfonso De Gregorio pointed out missing parentheses on Nov 26, 2009 and earned the bug bounty.

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

## Merge bits from two values according to a mask

```c
unsigned int a;    // value to merge in non-masked bits
unsigned int b;    // value to merge in masked bits
unsigned int mask; // 1 where bits from b should be selected; 0 where from a.
unsigned int r;    // result of (a & ~mask) | (b & mask) goes here

r = a ^ ((a ^ b) & mask);
```

This uses 1 fewer operation than the obvious `(a & ~mask) | (b & mask)`. If `mask` is a constant, it may not be an advantage.

Ron Jeffery sent me this trick on Feb 9, 2006.

---

## Counting bits set

### Naive way

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v

for (c = 0; v; v >>= 1)
{
  c += v & 1;
}
```

The naive method processes one bit per loop iteration until no set bits remain. So for a 32-bit integer, if only the highest bit is 1, it loops 32 times.

---

### By lookup table

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

On Jul 14, 2009, Hallvard Furuseth suggested using macros to compress the table definition.

---

### Brian Kernighan's way

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v
for (c = 0; v; c++)
{
  v &= v - 1; // clear the least significant bit set
}
```

Brian Kernighan’s method loops as many times as there are set bits. So for a 32-bit integer, if only the highest bit is 1, it loops just once.

This method is mentioned in exercise 2-9 of “The C Programming Language (2nd ed.)” (1988). On Apr 19, 2006, Donald Knuth told me it was first published by Peter Wegner in CACM 3 (1960), 322. (Derrick Lehmer also discovered it independently and published it in a book from 1964 edited by Beckenbach.)

---

### Using 64-bit instructions

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

This method is efficient only when you have a 64-bit CPU and modulus division is fast. Option 1 needs only 3 operations; option 2 needs 10; option 3 needs 15.

Rich Schroeppel originally created a 9-bit version (similar to option 1); see the Programming Hacks section of Beeler, M., Gosper, R. W., and Schroeppel, R., “HAKMEM”, MIT AI Memo 239, Feb 29, 1972. His method inspired the variants above, which were designed by Sean Anderson. Randal E. Bryant provided several bug fixes on May 3, 2005. Bruce Dawson tweaked the prior 12-bit version into a 14-bit-capable one on Feb 1, 2007 without changing the operation count.

---

### In parallel

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

In binary, the B array is:

- `B[0] = 0x55555555 = 01010101 01010101 01010101 01010101`
- `B[1] = 0x33333333 = 00110011 00110011 00110011 00110011`
- `B[2] = 0x0F0F0F0F = 00001111 00001111 00001111 00001111`
- `B[3] = 0x00FF00FF = 00000000 11111111 00000000 11111111`
- `B[4] = 0x0000FFFF = 00000000 00000000 11111111 11111111`

We can adapt this to larger integer widths by continuing the pattern of these “Binary Magic Numbers”: for k bits, the lengths of S and B must be `ceil(lg(k))`, and you must compute the same number of expressions. For 32-bit `v`, the method above uses 16 operations.

---

### The best method for 32-bit

```c
v = v - ((v >> 1) & 0x55555555);                    // reuse input as temporary
v = (v & 0x33333333) + ((v >> 2) & 0x33333333);     // temp
c = ((v + (v >> 4) & 0xF0F0F0F) * 0x1010101) >> 24; // count
```

This “best method” requires only 12 operations—like the lookup-table method—but avoids the memory access and potential cache miss costs of a table. It is a compromise between the “pure parallel” method above and earlier “multiply + 64-bit” methods: it counts bits in each byte in parallel, then sums the 4 byte counts by multiplying by `0x1010101` and shifting right by 24.

---

### Generalization up to 128-bit

Below is a generalization for integers up to 128 bits (parameterized by type `T`):

```c
v = v - ((v >> 1) & (T)~(T)0/3);                           // temp
v = (v & (T)~(T)0/15*3) + ((v >> 2) & (T)~(T)0/15*3);      // temp
v = (v + (v >> 4)) & (T)~(T)0/255*15;                      // temp
c = (T)(v * ((T)~(T)0/255)) >> (sizeof(T) - 1) * CHAR_BIT; // count
```

For more information about counting bits set (also called sideways addition), see Ian Ashdown’s excellent newsgroup post.

I was alerted to this “best counting method” by Andrew Shapira on Oct 5, 2005 after he saw it on pages 187–188 of “Software Optimization Guide for AMD Athlon™ 64 and Opteron™ Processors”. Charlie Gordon suggested saving 1 more operation from the pure parallel version on Dec 14, 2005; Don Clugston cut 3 more on Dec 30, 2005. I made a mistake when applying Don’s suggestion, and Eric Cole pointed out the typo on Jan 8, 2006. Eric later suggested the “best method generalized to arbitrary widths” on Nov 17, 2006. On Apr 5, 2007, Al Williams noticed a dead line of code at the top of the first method.

---

## Count bits set (rank) from the most-significant bit upto a given position

The code below computes the **rank** of a bit: the number of set bits (1s) when counting from the most-significant bit (MSB) moving right up to a given position `pos` (inclusive).

Juha Järvi sent it to me on Nov 21, 2009 as the inverse of the “select bit position by rank” routine below.

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

## Select the bit position (from the most-significant bit) with the given count (rank)

The following 64-bit code finds, scanning from left to right (starting at the MSB), the position of the `r`-th 1 bit and returns it. If the requested rank exceeds the total number of set bits, it returns 64. This code can be adapted to a 32-bit version, or to count from right to left.

If branches are fast on your target CPU, consider uncommenting the `if` statements and commenting out the branchless versions that follow them.

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

Juha Järvi sent me this code on Nov 21, 2009.

---

## Computing parity (1 if an odd number of bits set, 0 otherwise)

Parity here means: 1 if the number of set bits is odd, otherwise 0.

### Computing parity the naive way

The code below uses a method similar to Brian Kernighan counting: it toggles parity once per cleared set bit, so the time is proportional to the number of set bits.

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

### Compute parity by lookup table

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

Randal E. Bryant encouraged me to add the last “variation with variable p” on May 3, 2005 (even though it is indeed obvious). On Sep 27, 2005 Bruce Rawles found a spelling error in the table name and earned the $10 bug bounty. On Oct 9, 2006 Fabrice Bellard suggested the 32-bit variations above, which require only one table lookup; earlier versions did one lookup per byte (4 lookups total) and were slower. On Jul 14, 2009 Hallvard Furuseth suggested using macros to compress the table definition.

---

### Compute parity of a byte using 64-bit multiply and modulus division

```c
unsigned char b;  // byte value to compute the parity of
bool parity =
  (((b * 0x0101010101010101ULL) & 0x8040201008040201ULL) % 0x1FF) & 1;
```

This method takes about 4 operations, but applies only to bytes.

---

### Compute parity of word with a multiply

The following computes parity of a 32-bit value in 8 operations; for 64-bit it also takes only 8 operations.

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

Andrew Shapira proposed and sent me this method on Sep 2, 2007.

---

### Compute parity in parallel

```c
unsigned int v;  // word value to compute the parity of
v ^= v >> 16;
v ^= v >> 8;
v ^= v >> 4;
v &= 0xf;
return (0x6996 >> v) & 1;
```

The method above takes about 9 operations and applies to 32-bit words. If you only need it for bytes, you can remove the two lines immediately after `unsigned int v;`, reducing it to about 5 operations.

The idea is: first use shifts and XORs to fold the 8 nibbles of the 32-bit value down into the lowest nibble; then use the binary number `0110 1001 1001 0110` (hex `0x6996`) as a “mini 16-entry parity table”, shift it right by the low nibble value to extract the result bit, then mask and return.

Mathew Hendry pointed out this final “shift-as-table-lookup” step on Dec 15, 2002; the optimization saves 2 operations.

---

## Swapping Values

### Swapping values with subtraction and addition

```c
#define SWAP(a, b) ((&(a) == &(b)) || \
                    (((a) -= (b)), ((b) += (a)), ((a) = (b) - (a))))
```

This macro swaps the values of `a` and `b` without using a temporary variable. The initial check for whether `a` and `b` refer to the same memory location can be omitted if you know that cannot happen. (The compiler may also optimize it away.)

If overflow exceptions are enabled, passing unsigned values is recommended to avoid exceptions. The XOR swap below may be slightly faster on some machines. Do not use this macro on floating-point values (unless you are operating on their raw integer representation).

Sanjeev Sivasankaran suggested I add this on Jun 12, 2007. Vincent Lefèvre noted on Jul 9, 2008 that subtraction/addition can trigger overflow exceptions.

---

### Swapping values with XOR

```c
#define SWAP(a, b) (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))
```

This is an old trick: swap `a` and `b` without a temporary.

On Jan 20, 2005, Iain A. Fleming pointed out that this macro fails when swapping the same memory location (e.g., `SWAP(a[i], a[j])` with `i == j`). So if that can happen, you can change it to:

`(((&(a) == &(b)) || (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))))` (the original text gave a similar suggestion)

On Jul 14, 2009, Hallvard Furuseth also suggested that on some machines the result of `(a) ^ (b)` can be reused to speed it up further (details omitted in the original here).

---

### Swapping individual bits with XOR

```c
unsigned int i, j; // positions of bit sequences to swap
unsigned int n;    // number of consecutive bits in each sequence
unsigned int b;    // bits to swap reside in b
unsigned int r;    // bit-swapped result goes here

unsigned int x = ((b >> i) ^ (b >> j)) & ((1U << n) - 1); // XOR temporary
r = b ^ ((x << i) | (x << j));
```

Example: suppose `b = 00101111` (binary). We swap 3 consecutive bits starting at `i = 1` (second bit from the right) with 3 consecutive bits starting at `j = 5`; the result will be `r = 11100011` (binary).

This is similar to the general XOR swap, but for individual bits (or bit ranges). The variable `x` first stores the XOR of the two bit ranges to swap, then XORing the original value flips the bits into the swapped state. If the ranges overlap, the result is undefined.

On Jul 14, 2009, Hallvard Furuseth suggested changing `1 << n` to `1U << n`, since the result is assigned to an unsigned type and it avoids shifting into the sign bit.

---

## Reversing bit sequences

### Reverse bits the obvious way

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

On Oct 15, 2004, Michael Hoisie pointed out a bug in the original version. On May 3, 2005, Randal E. Bryant suggested removing one extra operation. On May 18, 2005, Behdad Esfahbod suggested a small change to reduce one loop iteration. Later, on Feb 6, 2007, Liyong Zhou proposed a better version: change the loop condition to `v != 0` so it doesn’t have to traverse all bits and can terminate early (historical notes omitted).

---

### Reverse bits in word by lookup table

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

The first method takes about 17 operations; the second assumes the CPU is efficient at byte loads/stores, and takes about 12 operations.

On Jul 14, 2009, Hallvard Furuseth suggested using macros to compress the table definition.

---

### Reverse the bits in a byte with 3 operations (64-bit multiply and modulus)

```c
unsigned char b; // reverse this (8-bit) byte

b = (b * 0x0202020202ULL & 0x010884422010ULL) % 1023;
```

Multiplication fans the 8-bit byte pattern out into 5 copies in a 64-bit word. AND selects the bits that are in the correct (reversed) positions within each 10-bit group. Multiplication and AND together ensure each original bit appears in exactly one position within one 10-bit group. The final modulus by `2^10 - 1` merges the 10-bit groups. Since the groups do not overlap in the 64-bit word, the “addition” implied by modulus behaves like a bitwise OR.

This method is due to Rich Schroeppel; see the Programming Hacks section of Beeler, M., Gosper, R. W., and Schroeppel, R., “HAKMEM”, MIT AI Memo 239, Feb 29, 1972.

---

### Reverse the bits in a byte with 4 operations (64-bit multiply, no division)

```c
unsigned char b; // reverse this byte

b = ((b * 0x80200802ULL) & 0x0884422110ULL) * 0x0101010101ULL >> 32;
```

The original text followed with a bit-flow diagram (omitted). Note: on some processors, the last two steps can be combined because registers are byte-addressable: you can arrange the multiplication so some register holds the high 32 bits of the result, then just take its low byte. Thus the total operation count may drop to 6.

Sean Anderson proposed this method on Jul 13, 2001.

---

### Reverse the bits in a byte with 7 operations (no 64-bit)

```c
b = ((b * 0x0802LU & 0x22110LU) | (b * 0x8020LU & 0x88440LU)) * 0x10101LU >> 16;
```

Be sure to assign or cast the result to `unsigned char` to discard garbage in the high bits. Sean Anderson proposed this method on Jul 13, 2001. Mike Keith pointed out and fixed a typo on Jan 3, 2002.

---

### Reverse an N-bit quantity in parallel: 5 * lg(N) operations

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

The variant below is also `O(lg(N))`, but requires more operations to reverse `v`; its advantage is that it uses fewer constant values (the masks are computed dynamically inside the loop). The method above is suitable when N is large. If you apply the method above to 64-bit (or larger) integers, you must continue adding more lines following the pattern; otherwise it only reverses the low 32 bits, and the result will only be correct within those low 32 bits.

```c
unsigned int s = sizeof(v) * CHAR_BIT; // bit size; must be power of 2
unsigned int mask = ~0;
while ((s >>= 1) > 0)
{
  mask ^= (mask << s);
  v = ((v >> s) & mask) | ((v << s) & ~mask);
}
```

For more information, see Edwin Freed’s “Binary Magic Numbers” article in Dr. Dobb's Journal (1983). The second variant was suggested by Ken Raeburn on Sep 13, 2005. Veldmeijer mentioned on Mar 19, 2006 that the final line of the first version does not need the AND (historical notes omitted).

---

## Modulus division (aka computing remainders)

### Computing modulus division by 1 << s without a division operator

```c
const unsigned int n;          // numerator
const unsigned int s;
const unsigned int d = 1U << s; // So d will be one of: 1, 2, 4, 8, 16, 32, ...
unsigned int m;                // m will be n % d
m = n & (d - 1);
```

Most programmers learn this trick early; it is included here for completeness.

---

### Computing modulus division by (1 << s) - 1 without a division operator

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

This method for modulus by “one less than a power of two” needs at most
`5 + (4 + 5 * ceil(N / s)) * ceil(lg(N / s))` operations, where N is the number of bits in the numerator. In other words, its worst-case time complexity is `O(N * lg(N))`.

Sean Anderson proposed this method on Aug 15, 2001. On Jun 17, 2004 Sean A. Irvine corrected me: I had incorrectly said in the comment that “the end could be changed to assignment”. Michael Miller found a typo on Apr 25, 2005.

---

### Computing modulus division by (1 << s) - 1 in parallel without a division operator

> The code below uses a 32-bit word as an example!

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

This method sums the base-`(1 << s)` “digits” of the numerator in parallel, completing in at most `O(lg(N))` time (for the 32-bit code above, N=32). The upper bound on operations is about `12 + 9 * ceil(lg(N))`. If you know the denominator at compile time, you can remove the tables: extract the relevant entries and unroll the loop. It also extends easily to wider integers.

An intuitive explanation is: write the result on paper, cut the paper in half, align the halves, and add digit-wise onto a new sheet; repeat “cut and add” until you can’t cut further. After `lg(N/s/2)` cuts, stop cutting and just keep adding until each add leaves only a single s-bit value.

Sean Anderson proposed this method on Aug 20, 2001. Randy E. Bryant pointed out a typo on May 3, 2005 (after pasting code I later wrote `unsinged` in a variable declaration). Similar to the previous trick, I also once mistakenly wrote in a comment that “the end could be changed to assignment”; Donald Knuth corrected me on Apr 19, 2006 and suggested an alternative (omitted). On Jun 18, 2009 Sean Irvine proposed a change: use `((n >> s) & M[s])` instead of `((n & ~M[s]) >> s)`, which usually saves operations because the constant `M[s]` has already been loaded (the original included several alternative expressions at the end).

---

## Finding integer log base 2 of an integer

### Find the log base 2 ... in O(N) operations

```c
unsigned int v; // 32-bit word to find the log base 2 of
unsigned int r = 0; // r will be lg(v)

while (v >>= 1) // unroll for more speed...
{
  r++;
}
```

The integer log base 2 is equivalent to the position of the highest set bit (MSB). Faster methods follow.

---

### Find the log base 2 ... with an 64-bit IEEE float

```c
int v; // 32-bit integer to find the log base 2 of
int r; // result of log_2(v) goes here
union { unsigned int u[2]; double d; } t; // temp

t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] = 0x43300000;
t.u[__FLOAT_WORD_ORDER!=LITTLE_ENDIAN] = v;
t.d -= 4503599627370496.0;
r = (t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] >> 20) - 0x3FF;
```

This code constructs a 64-bit IEEE-754 `double` by writing the 32-bit integer (with no padding bits) into the mantissa and setting the exponent to `2^52`. Then it subtracts `2^52` (as a double, `4503599627370496.0`), which makes the exponent become the log2 of the input value `v`. Finally, it shifts the exponent bits down and subtracts the bias `0x3FF` (decimal 1023).

This trick needs only 5 operations, but many CPUs handle double arithmetic slowly, and it also requires handling endianness.

Eric Cole sent it to me on Jan 15, 2006. Evan Felix pointed out a typo on Apr 4, 2006. Vincent Lefèvre reminded me on Jul 9, 2008: the endianness check should use floating-point endianness, which may differ from integer endianness.

---

### Find the log base 2 ... with a lookup table

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

This lookup-table method finds log2 of a 32-bit value in about 7 operations. Extended to 64-bit it takes about 9. You can reduce one more operation by using 4 tables (encoding the additions into the entries). Using `int` table entries might be faster depending on your architecture.

The code above is optimized for uniformly distributed outputs. If your inputs are uniformly distributed over the 32-bit space, consider the following:

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

Algorithmic initialization for generating the log table:

```c
LogTable256[0] = LogTable256[1] = 0;
for (int i = 2; i < 256; i++)
{
  LogTable256[i] = 1 + LogTable256[i / 2];
}
LogTable256[0] = -1; // if you want log(0) to return -1
```

On May 18, 2005 Behdad Esfahbod and I shaved a tiny bit off the average operation count. On Nov 14, 2006 Emanuel Hoogeveen shaved off another tiny bit. On Sep 19, 2008 David A. Butterfield suggested adding the “uniform distribution input” variant. On Jan 5, 2009 Venkat Reddy noted `log(0)` should return `-1` to indicate an error, so I changed the first table entry to `-1`.

---

## Find the log base 2 ... with multiply and lookup

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

This method uses a small table and one multiplication to compute log2 of a 32-bit integer. It takes only 13 operations, saving over the previous general `O(lg(N))` method (which may take up to 20). The pure table method uses the fewest operations, but this provides a balance between “table size vs speed”.

If you know `v` is already a power of 2, then you only need:

```c
static const int MultiplyDeBruijnBitPosition2[32] =
{
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
  31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
};
r = MultiplyDeBruijnBitPosition2[(uint32_t)(v * 0x077CB531U) >> 27];
```

Eric Cole proposed this method on Jan 8, 2006: after reading the later “round up to a power of 2” and “multiply+lookup for trailing zeros (de Bruijn sequence)” sections, he realized it could be applied to log2. On Dec 10, 2009 Mark Dickinson reduced a few operations: it requires that `v` first be “rounded up to one less than the next power of 2” rather than directly rounded to a power of 2.

---

## Find integer log base 10 of an integer

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

This computes integer log10 by first getting `IntegerLogBase2(v)` using any of the log2 tricks above. Using `log10(v) = log2(v) / log2(10)`, we multiply by `1/log2(10)`, approximated as `1233/4096`, i.e. multiply by 1233 then shift right 12. We add 1 because `IntegerLogBase2` is floor. Finally, since `t` is only an approximation (may be off by 1), we correct it by testing `v < PowersOf10[t]` to get the exact result.

This method uses 6 more operations than `IntegerLogBase2`. If memory access is fast on your machine, you can modify the log2 lookup method above so the table entries store `t` directly (i.e. encode the addition/multiplication/shift into the table entries), reducing total operations to 9 (assuming 4 tables for the 4 bytes of v).

Eric Cole suggested I add this method on Jan 7, 2006.

---

### Find integer log base 10 ... the obvious way

```c
unsigned int v; // non-zero 32-bit integer value to compute the log base 10 of
int r;          // result goes here

r = (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
    (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
    (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
```

When the input is uniformly distributed over the 32-bit space, this method performs well: 76% of inputs hit on the first comparison, 21% on the second, 2% on the third, and so on. Each comparison shrinks the remaining range by about 90%. So the average is under 2.6 operations.

On Apr 18, 2007 Emanuel Hoogeveen proposed a variant using division for the conditionals, but it was slower than simple comparisons.

---

## Find integer log base 2 of a 32-bit IEEE float

```c
const float v; // find int(log2(v)), where v > 0.0 && finite(v) && isnormal(v)
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = (c >> 23) - 127;
```

This is fast, but IEEE 754 compatible architectures also support subnormal/denormal values. Their exponent bits are 0 (meaning `2^-127`), and the mantissa is no longer normalized, so you must recompute log2 from the mantissa. To handle subnormals:

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

> Note: On Jun 20, 2004 Sean A. Irvine suggested adding handling for subnormals. On Jun 11, 2005 Falk Hüffner pointed out that ISO C99 6.5/7 defines the common type-punning idiom `*(int *)&` as undefined behavior (even though it works on 99.9% of compilers). He recommended using `memcpy` for maximum portability, or using a `{ float; int; }` union to get better code generation than `memcpy`.

---

## Find integer log base 2 of the pow(2, r)-root ...

```c
const int r;
const float v; // find int(log2(pow((double) v, 1. / pow(2, r)))),
               // where isnormal(v) and v > 0
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = ((((c - 0x3f800000) >> r) + 0x3f800000) >> 23) - 127;
```

For example, when `r = 0`, `c = int(log2((double)v))`; when `r = 1`, `c = int(log2(sqrt((double)v)))`; when `r = 2`, `c = int(log2(pow((double)v, 1./4)))`.

On Jun 11, 2005 Falk Hüffner likewise pointed out the undefined behavior of `*(int *)&` and recommended `memcpy`.

---

## Counting consecutive trailing zero bits

### Count trailing zeros linearly

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

For random uniformly distributed binary numbers, the average number of trailing zeros is 1, so this `O(trailing zeros)` method is not bad.

Jim Cole suggested adding this linear method on Aug 15, 2007. On Oct 22, 2007 Jason Cunningham pointed out that I omitted the `unsigned` qualifier when I pasted the code.

---

### Count trailing zeros in parallel

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

This is basically equivalent to “parallel log2”, but first isolates the lowest 1 bit, then decrements `c` from its maximum. The upper bound on operations is about `3 * lg(N) + 4` (for an N-bit word).

Bill Burdick proposed an optimization on Feb 4, 2011, reducing the time from `4 * lg(N)`.

---

### Count trailing zeros by binary search

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

This is similar to the previous method, but it uses a “binary-search-like narrowing” by accumulating `c`: first check whether the low 16 bits are zero; if so, shift right 16 and `c += 16`. Each subsequent check halves the remaining range until only one bit remains. It is faster (about 33%) because fewer if bodies execute.

Matt Whitlock suggested adding this method on Jan 25, 2006. Andrew Shapira shaved off a few operations on Sep 5, 2007 (e.g., set `c=1` and subtract unconditionally at the end).

---

### Count trailing zeros by casting to a float

```c
unsigned int v;            // find the number of trailing zeros in v
int r;                     // the result goes here
float f = (float)(v & -v); // cast the least significant bit in v to a float
r = (*(uint32_t *)&f >> 23) - 0x7f;
```

Although it takes only about 6 operations, converting integer to float is expensive on some machines. This uses the IEEE 754 exponent: isolate the least significant set bit and cast it to float; subtract the bias to get the position. If `v` is 0, the result is `-127`.

---

### Count trailing zeros with modulus division and lookup

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

This uses the fact that the first 32 bit positions are relatively prime to 37, so taking mod 37 yields a unique value in 0..36, which a small table maps back to the number of trailing zeros. It needs only 4 operations, but the mod and lookup may make it unsuitable in some contexts. I discovered it independently, and later found that when searching for the table’s subsequence it is attributed to Reiser in “Hacker’s Delight”.

---

### Count trailing zeros with multiply and lookup (de Bruijn)

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

This is 1 operation more than “modulus + lookup”, but multiplication may be faster. The expression `(v & -v)` extracts the lowest set bit. The constant `0x077CB531U` is a de Bruijn sequence; multiplying by it yields a unique pattern in the high 5 bits corresponding to the bit position, which is then used to index the table. If no bits are set, it returns 0.

For more information see “Using de Bruijn Sequences to Index 1 in a Computer Word” (Charles E. Leiserson, Harald Prokof, Keith H. Randall).

Andrew Shapira suggested adding this method on Oct 8, 2005. On Apr 14, 2009 Dustin Spicuzza requested casting the multiplication result to 32-bit, otherwise it breaks when compiling with 64-bit ints.

---

## Round up to the next highest power of 2 by float casting

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

This uses 8 operations and works for all `v <= (1<<31)`.

Quick and dirty version (for `1 < v < (1<<25)`):

```c
float f = (float)(v - 1);
r = 1U << ((*(unsigned int*)(&f) >> 23) - 126);
```

Although the quick-and-dirty version needs only about 6 operations, benchmarks on an Athlon™ XP 2100+ show it is about 3x slower than the trick below (12 operations). Some CPUs may suit it better.

On Sep 27, 2005 Andi Smithers suggested adding a float-based lg method for rounding up to a power of 2. His version was similar to this one; due to mantissa rounding it only worked for `< (1<<25)`, but used 1 more operation.

---

## Round up to the next highest power of 2

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

This uses 12 operations to compute the next (or same) power of 2 for a 32-bit integer. The boundary case `v=0` returns 0 (not a power of 2); if you care, append `v += (v == 0)` to correct it. Using the formula `1U << (lg(v - 1) + 1)` with a lookup-table log2 can be 2 operations faster, but lookup tables may be unsuitable in some contexts, so the above may be preferable.

The idea is: copy the highest set bit into all lower bits, then add 1; the carry clears the lower bits and turns the bit above the highest set bit into 1. If the original number is already a power of 2, then `v--` turns it into all 1s below that bit, and adding back yields the original value.

Atul Divekar suggested on Sep 5, 2010 that one could also use a lookup-table `floor(lg(v))` and compute `1<<(1+floor(lg(v)))`, requiring only 8 or 9 operations.

Sean Anderson proposed this algorithm on Sep 14, 2001. Pete Hart pointed me (in Feb 1997) to several newsgroup posts by him and William Lewis where they derived the same algorithm.

---

## Interleaving bits (aka computing Morton Numbers)

### Interleave bits the obvious way

```c
unsigned short x;   // Interleave bits of x and y, so that all of the
unsigned short y;   // bits of x are in the even positions and y in the odd;
unsigned int z = 0; // z gets the resulting Morton Number.

for (int i = 0; i < sizeof(x) * CHAR_BIT; i++) // unroll for more speed...
{
  z |= (x & 1U << i) << i | (y & 1U << i) << (i + 1);
}
```

Interleaving bits (Morton numbers) is often used to linearize 2D integer coordinates: combine `x` and `y` into a single integer that can be compared directly and has the property that points with close x and y coordinates usually have close Morton numbers.

---

### Interleave bits by table lookup

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

To go faster, you can add another table: pre-shift the values of `MortonTable256` left by 1 bit for y lookups, saving 2 operations but nearly doubling the memory. You can go further with 4 tables (two of which are also pre-shifted by 16), reducing total operations to 11.

---

### Interleave bits with 64-bit multiply

The method below interleaves two bytes (not `unsigned short`) in 11 operations. But many operations are 64-bit multiplies, so it is not suitable for all machines. Inputs `x` and `y` must be less than 256.

Holger Bettag suggested adding this after being inspired by the multiply-based bit-reversal in this document (Oct 10, 2004).

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

### Interleave bits by Binary Magic Numbers

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

## Testing for ranges of bytes in a word

### Determine if a word has a zero byte

```c
// Fewer operations:
unsigned int v; // 32-bit word to check if any 8-bit byte in it is 0
bool hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
```

This is useful for fast string-copy routines that copy one word at a time; it uses only 5 operations. In contrast, the obvious methods below take at least 7 operations and up to 12.

```c
// More operations:
bool hasNoZeroByte = ((v & 0xff) && (v & 0xff00) && (v & 0xff0000) && (v & 0xff000000))
// OR:
unsigned char * p = (unsigned char *) &v;
bool hasNoZeroByte = *p && *(p + 1) && *(p + 2) && *(p + 3);
```

You can also do a faster pre-check (4 operations) to test “there may be a zero byte”. This test has false positives when the highest byte is `0x80`, so if it hits you can re-check with the more reliable version to improve overall performance while preserving correctness.

```c
bool hasZeroByte = ((v + 0x7efefeff) ^ ~v) & 0x81010100;
if (hasZeroByte) // or may just have 0x80 in the high byte
{
  hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
}
```

There is an even faster way—use `hasless(v, 1)` defined below; it takes only 4 operations and needs no follow-up verification. It can be simplified to:

```c
#define haszero(v) (((v) - 0x01010101UL) & ~(v) & 0x80808080UL)
```

Here, `(v - 0x01010101UL)` causes a borrow into the high bit of a byte when that byte is 0 or greater than `0x80`; `~v & 0x80808080UL` selects bytes whose high bit is not set (i.e. < 0x80). ANDing them leaves exactly the byte positions that are zero.

Paul Messmer suggested the improved faster pre-check on Oct 2, 2004. Juha Järvi suggested `haszero` on Apr 6, 2005 (he saw it in Paul Hsieh’s Assembly Lab; earlier it appeared in a newsgroup post by Alan Mycroft on Apr 27, 1987).

---

### Determine if a word has a byte equal to n

To test whether a word contains a byte equal to a given value, you can XOR `x` with a word whose bytes are all filled with n: equal bytes become 0, unequal remain nonzero; then feed the result to `haszero`.

```c
#define hasvalue(x,n) \
(haszero((x) ^ (~0UL/255 * (n))))
```

Stephen M Bennet suggested adding this trick on Dec 13, 2009.

---

### Determine if a word has a byte less than n

Test whether word `x` contains an unsigned byte `< n`. In particular, when `n=1`, this can be used to detect zero bytes (checking one long at a time), or after XOR with a mask to detect arbitrary bytes. If `n` is constant, it takes only 4 arithmetic/logical operations.

Requirements: `x >= 0`; `0 <= n <= 128`

```c
#define hasless(x,n) (((x)-~0UL/255*(n))&~(x)&~0UL/255*128)
```

To count how many bytes in `x` are less than n (7 operations):

```c
#define countless(x,n) \
(((~0UL/255*(127+(n))-((x)&~0UL/255*127))&~(x)&~0UL/255*128)/128%255)
```

Juha Järvi sent me this clever method on Apr 6, 2005. Sean Anderson was inspired on Apr 10, 2005 to add the macro definitions (and the `hasmore/countmore` etc. below).

---

### Determine if a word has a byte greater than n

Test whether word `x` contains an unsigned byte `> n`. When n is constant it takes only 3 operations.

Requirements: `x >= 0`; `0 <= n <= 127`

```c
#define hasmore(x,n) (((x)+~0UL/255*(127-(n))|(x))&~0UL/255*128)
```

Count bytes in `x` greater than n (6 operations):

```c
#define countmore(x,n) \
(((((x)&~0UL/255*127)+~0UL/255*(127-(n))|(x))&~0UL/255*128)/128%255)
```

---

### Determine if a word has a byte between m and n

When `m < n`, this tests whether word `x` contains an unsigned byte with `m < value < n`. When m and n are constants it takes 7 operations.

Note: `likelyhasbetween` may report false positives for bytes equal to n, so if you need strict correctness you must verify byte-by-byte.

Requirements: `x >= 0`; `0 <= m <= 127`; `0 <= n <= 128`

```c
#define likelyhasbetween(x,m,n) \
((((x)-~0UL/255*(n))&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

A variant that uses 1 more operation (8 total) but gives an exact answer is:

```c
#define hasbetween(x,m,n) \
((~0UL/255*(127+(n))-((x)&~0UL/255*127)&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

Count bytes between m and n (open interval) (10 operations):

```c
#define countbetween(x,m,n) (hasbetween(x,m,n)/128%255)
```

---

## Compute the lexicographically next bit permutation

Suppose an integer has N bits set to 1, and we want the next permutation (in lexicographic order) that also contains N ones. For example, with N=3 and the bit pattern `00010011`, the next patterns are: `00010101`, `00010110`, `00011001`, `00011010`, `00011100`, `00100011`, ... and so on. Below is a fast way to compute the next permutation.

GNU C on x86 provides the builtin `__builtin_ctz(v)`, which returns the number of trailing zeros. Under MSVC (x86), the corresponding intrinsic is `_BitScanForward`. Both generate the `bsf` instruction. Other architectures may have similar instructions; if not, you can use one of the trailing-zero methods above.

```c
unsigned int v; // current permutation of bits
unsigned int w; // next permutation of bits

unsigned int t = v | (v - 1); // t gets v's least significant 0 bits set to 1
// Next set to 1 the most significant bit to change,
// set to 0 the least significant ones, and add the necessary 1 bits.
w = (t + 1) | (((~t & -~t) - 1) >> (__builtin_ctz(v) + 1));
```

Here is another version, which is often slower because it includes division, but does not need to compute trailing zeros:

```c
unsigned int t = (v | (v - 1)) + 1;
w = t | ((((t & -t) / (v & -v)) >> 1) - 1);
```

Thanks to Dario Sneidermanis from Argentina, who provided this method on Nov 28, 2009.

---

A Belarusian translation is also available (provided by Webhostingrating).
