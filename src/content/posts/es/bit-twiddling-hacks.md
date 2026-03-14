---
title: Técnicas de manipulación de bits
description: >-
  Colección clásica de trucos de operaciones a nivel de bits de Sean Eron
  Anderson (traducción). Se traduce solo el texto; los bloques de código se
  mantienen tal cual, para facilitar la copia directa y la lectura comparativa.
published: 2026-03-14T00:00:00.000Z
tags:
  - Operaciones a nivel de bits
  - C/C++
  - Trucos de código
lang: es
abbrlink: bit-twiddling-hacks
translationKey: bit-twiddling-hacks
---

# Bit Twiddling Hacks
By Sean Eron Anderson
seander@cs.stanford.edu

Cada fragmento de código de este documento (salvo que se indique lo contrario) pertenece al dominio público (public domain): puedes usarlo como quieras. Como colección recopilatoria, el copyright del conjunto del código y del texto explicativo pertenece a Sean Eron Anderson (© 1997-2005). El propósito de publicar este código y sus explicaciones es que te sean útiles, pero **no se ofrece ninguna garantía**; incluida, entre otras, cualquier garantía implícita de comerciabilidad o idoneidad para un fin particular.

Hasta el 5 de mayo de 2005, todo el código había sido probado exhaustivamente. Miles de personas lo habían leído. Además, el profesor Randal Bryant, decano de la School of Computer Science de la Carnegie Mellon University, probó personalmente casi todo usando su sistema de verificación de código Uclid. Para las partes que él no probó, yo también verifiqué todas las entradas posibles en una máquina de 32 bits.

Si eres la primera persona en informarme de un bug **real y razonable** en el código, pagaré una recompensa de 10 dólares (cheque o Paypal). Si prefieres que done el dinero a una organización benéfica, pagaré 20 dólares.

---

## Índice（Contents）

- Sobre la metodología de conteo de operaciones（About the operation counting methodology）
- Calcular el signo de un entero（Compute the sign of an integer）
- Detectar si dos enteros tienen signos opuestos（Detect if two integers have opposite signs）
- Calcular el valor absoluto entero abs sin ramificaciones（Compute the integer absolute value (abs) without branching）
- Calcular el mínimo/máximo de dos enteros sin ramificaciones（Compute the minimum (min) or maximum (max) of two integers without branching）
- Determinar si un entero es una potencia de 2（Determining if an integer is a power of 2）
- Extensión de signo（Sign extending）
- Extensión de signo desde un ancho de bits constante（Sign extending from a constant bit-width）
- Extensión de signo desde un ancho de bits variable（Sign extending from a variable bit-width）
- Extensión de signo desde un ancho de bits variable en 3 operaciones（Sign extending from a variable bit-width in 3 operations）
- Establecer/limpiar bits condicionalmente sin ramificaciones（Conditionally set or clear bits without branching）
- Negar condicionalmente un valor sin ramificaciones（Conditionally negate a value without branching）
- Combinar bits de dos valores según una máscara（Merge bits from two values according to a mask）
- Contar bits a 1（Counting bits set）
- Extensión de signo desde un ancho de bits constante（Sign extending from a constant bit-width）
- Extensión de signo desde un ancho de bits variable（Sign extending from a variable bit-width）
- ……（A continuación se añadirá la traducción por secciones）

> Nota: el índice es muy largo; este artículo irá añadiendo la traducción por secciones siguiendo el orden del texto original.

---

## Sobre la metodología de conteo de operaciones（About the operation counting methodology）

Al contabilizar el “número de operaciones” de los algoritmos de este artículo, **cualquier operador de C cuenta como 1 operación**. Las asignaciones a variables intermedias (que no necesariamente se escribirán en RAM) no se contabilizan. Por supuesto, este método de conteo solo aproxima de forma burda el número real de instrucciones de máquina y el tiempo de CPU.

Este artículo asume que todas las operaciones cuestan lo mismo; esto no es cierto en la realidad, pero con el tiempo, la evolución de las CPU hace que este supuesto sea, en cierta medida, más cercano a los hechos. La velocidad real depende de muchos detalles, como el tamaño de caché, el ancho de banda de memoria, el conjunto de instrucciones, etc.

En última instancia, **hacer benchmarks** es la mejor forma de determinar si un método realmente es más rápido. Por tanto, considera los siguientes trucos simplemente como candidatos que vale la pena probar en la arquitectura objetivo.

---

## Calcular el signo de un entero（Compute the sign of an integer）

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

La última expresión de arriba, para enteros de 32 bits, equivale a `sign = v >> 31`. Tiene 1 operación menos que la forma intuitiva `sign = -(v < 0)`. Este truco funciona porque, al desplazar a la derecha un entero con signo, el bit de signo más a la izquierda se copia al resto de bits. El bit más a la izquierda es 1 si el número es negativo y 0 en caso contrario; un patrón de bits todo a 1 corresponde a `-1`. Por desgracia, este comportamiento depende de la arquitectura/implementación.

Si quieres que el resultado sea `-1` o `+1`, puedes usar:

```c
sign = +1 | (v >> (sizeof(int) * CHAR_BIT - 1));  // if v < 0 then -1, else +1
```

Si quieres que el resultado sea `-1`, `0` o `+1`, puedes usar:

```c
sign = (v != 0) | -(int)((unsigned int)((int)v) >> (sizeof(int) * CHAR_BIT - 1));
// Or, for more speed but less portability:
sign = (v != 0) | (v >> (sizeof(int) * CHAR_BIT - 1));  // -1, 0, or +1
// Or, for portability, brevity, and (perhaps) speed:
sign = (v > 0) - (v < 0); // -1, 0, or +1
```

Si solo quieres comprobar si es no negativo (devuelve `1` si es no negativo, si no `0`), puedes usar:

> Nota: el 7 de marzo de 2003, Angus Duggan señaló que la norma ANSI C de 1989 define el resultado del “desplazamiento a la derecha con signo” como implementation-defined, por lo que este truco puede fallar en algunos sistemas. Para mejorar la portabilidad, Toby Speight sugirió el 28 de septiembre de 2005 que aquí y en todo el texto se use `CHAR_BIT` en lugar de asumir que 1 byte siempre son 8 bits. El 4 de marzo de 2006, Angus recomendó la versión portable con conversiones mostrada arriba. El 12 de septiembre de 2009, Rohit Garg aportó la siguiente versión para la “comprobación de no negatividad”.

```c
sign = 1 ^ ((unsigned int)v >> (sizeof(int) * CHAR_BIT - 1)); // if v < 0 then 0, else 1
```

---

## Detectar si dos enteros tienen signos opuestos（Detect if two integers have opposite signs）

```c
int x, y;               // input values to compare signs

bool f = ((x ^ y) < 0); // true iff x and y have opposite signs
```

Manfred Weis sugirió que añadiera este truco el 26 de noviembre de 2009.

---

## Calcular el valor absoluto entero abs sin ramificaciones（Compute the integer absolute value (abs) without branching）

```c
int v;           // we want to find the absolute value of v
unsigned int r;  // the result goes here
int const mask = v >> sizeof(int) * CHAR_BIT - 1;

r = (v + mask) ^ mask;
```

Variación patentada (Patented variation): algunas CPU no tienen instrucción de “valor absoluto entero” (o el compilador no la usa). En máquinas donde el coste de ramificar es alto, la expresión anterior puede ser más rápida que la forma intuitiva `r = (v < 0) ? -(unsigned)v : v`, aunque ambas tengan el mismo número de operaciones.

```c
r = (v ^ mask) - mask;
```

> Nota: el 7 de marzo de 2003, Angus Duggan señaló que la norma ANSI C de 1989 define el resultado del “desplazamiento a la derecha con signo” como implementation-defined, por lo que este truco puede fallar en algunos sistemas. También he leído que ANSI C no exige que los enteros se representen en complemento a dos (two's complement), por lo que podría fallar en las rarísimas máquinas antiguas que aún usan complemento a uno (one's complement).
>
> El 14 de marzo de 2004, Keith H. Duggar me envió la “variación patentada” anterior; es mejor que el método que yo había pensado originalmente porque no requiere multiplicación. Por desgracia, este método fue solicitado y concedido como patente en EE. UU. a Vladimir Yu Volkonsky el 6 de junio de 2000, y la titularidad fue transferida a Sun Microsystems.
>
> El 13 de agosto de 2006, Yuriy Kaminskiy me dijo que la patente probablemente es inválida, porque el método se publicó antes de solicitarla; por ejemplo, Agner Fog ya lo escribió en su libro *How to Optimize for the Pentium Processor* el 9 de noviembre de 1996. Yuriy también mencionó que el documento fue traducido al ruso en 1997, y que Vladimir podría haberlo leído; además, se pueden encontrar enlaces antiguos en Internet Archive.
>
> El 30 de enero de 2007, Peter Kankowski compartió una versión de abs inspirada en la salida del compilador Microsoft Visual C++, y la puse como la opción principal aquí.
>
> El 6 de diciembre de 2007, Hai Jin se quejó de que el resultado es con signo, así que al aplicar abs al mínimo negativo sigue siendo negativo.
>
> El 15 de abril de 2008, Andrew Shapira señaló que la forma intuitiva puede desbordar porque antes faltaba la conversión `(unsigned)`; para máxima portabilidad sugirió… pero Vincent Lefèvre el 9 de julio de 2008 me convenció citando la norma ISO C99 de que eliminara esa sugerencia: incluso en máquinas que no son de complemento a dos, `-(unsigned)v` sigue dando el resultado correcto.
>
> La razón es: al calcular `-(unsigned)v`, primero se convierte el valor negativo v a sin signo (sumando `2**N`), obteniendo la representación en complemento a dos U de v; después se niega U, obteniendo `-U = 0 - U = 2**N - U = 2**N - (v+2**N) = -v = abs(v)`.

---

## Calcular el mínimo/máximo de dos enteros sin ramificaciones（Compute the minimum (min) or maximum (max) of two integers without branching）

```c
int x;  // we want to find the minimum of x and y
int y;
int r;  // the result goes here

r = y ^ ((x ^ y) & -(x < y)); // min(x, y)
```

En algunas máquinas muy poco comunes, si ramificar es muy caro y no hay instrucción de movimiento condicional (conditional move), la expresión anterior puede ser más rápida que la forma intuitiva `r = (x < y) ? x : y`, aunque tenga dos instrucciones más. (Sin embargo, normalmente la forma intuitiva es la mejor.) Funciona porque:

- Si `x < y`, entonces `-(x < y)` se convierte en todo 1, así que
  `r = y ^ ((x ^ y) & ~0) = y ^ x ^ y = x`。
- En caso contrario `x >= y`, `-(x < y)` es todo 0, así que
  `r = y ^ ((x ^ y) & 0) = y`。

En algunas máquinas, calcular `(x < y)` como 0 o 1 requiere una instrucción de salto, por lo que puede no aportar ventaja.

Para el máximo, usa:

```c
r = x ^ ((x ^ y) & -(x < y)); // max(x, y)
```

Versión rápida pero “a lo bruto” (Quick and dirty):
Si estás seguro de que se cumple `INT_MIN <= x - y <= INT_MAX`, puedes usar la siguiente forma, que es más rápida porque `(x - y)` solo se calcula una vez. Nota: la norma ANSI C de 1989 no especifica el resultado del “desplazamiento a la derecha con signo”, por lo que estas dos líneas **no son portables**. Si el desbordamiento lanza una excepción, entonces x e y deberían ser sin signo, o convertirse a sin signo al restar, para evitar excepciones innecesarias; sin embargo, el desplazamiento a la derecha necesita un operando con signo para producir todo 1 cuando es negativo, así que ahí hay que convertir de vuelta a con signo.

```c
r = y + ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // min(x, y)
r = x - ((x - y) & ((x - y) >> (sizeof(int) * CHAR_BIT - 1))); // max(x, y)
```

> Nota: el 7 de marzo de 2003 Angus Duggan señaló el problema de portabilidad del desplazamiento a la derecha. El 3 de mayo de 2005 Randal E. Bryant recordó que debe cumplirse la precondición `INT_MIN <= x - y <= INT_MAX`, y sugirió usar la versión no quick-and-dirty para corregirlo. El 6 de julio de 2005 Nigel Horspoon observó que gcc en Pentium generaba el mismo código para la forma intuitiva (dependiendo de la implementación de `(x < y)`). El 9 de julio de 2008 Vincent Lefèvre señaló que una versión antigua `r = y + ((x - y) & -(x < y))` tenía riesgo si se habilitaban excepciones por desbordamiento. El 2 de junio de 2009 Timothy B. Terriberry sugirió usar xor en lugar de suma/resta para reducir conversiones de tipo y riesgos de desbordamiento.

---

## Determinar si un entero es una potencia de 2（Determining if an integer is a power of 2）

```c
unsigned int v; // we want to see if v is a power of 2
bool f;         // the result goes here

f = (v & (v - 1)) == 0;
```

Nota: aquí `0` se considera erróneamente una potencia de 2. Para corregirlo, usa:

```c
f = v && !(v & (v - 1));
```

---

## Extensión de signo desde un ancho de bits constante（Sign extending from a constant bit-width）

Para tipos integrados (por ejemplo `char`, `int`), la extensión de signo se realiza automáticamente. Pero supón que tienes un número con signo en complemento a dos `x`, almacenado usando solo `b` bits; ahora quieres convertirlo a un `int` con más bits. Si `x` es positivo, basta con copiarlo; pero si es negativo, hay que extender el bit de signo.

Por ejemplo, si solo hay 4 bits para almacenar un número, `-3` se representa como `1101`; con 8 bits sería `11111101`. Al convertir una representación de 4 bits a una de más bits, hay que copiar hacia la izquierda el bit más alto (el bit de signo) rellenando los bits superiores; este proceso es la **extensión de signo** (sign extending).

En C, extender el signo desde un ancho fijo de bits es sencillo porque puedes definir un campo de bits (bit field) en un `struct` o `union`. Por ejemplo, convertir un número de 5 bits a un `int` completo:

```c
int x; // convert this from using 5 bits to a full int
int r; // resulting sign extended number goes here
struct {signed int x:5;} s;
r = s.x = x;
```

A continuación hay una función plantilla en C++ que usa la misma característica del lenguaje para convertir un valor representado con B bits en 1 operación (aunque el compilador realmente generará más instrucciones):

```cpp
template <typename T, unsigned B>
inline T signextend(const T x)
{
  struct {T x:B;} s;
  return s.x = x;
}

int r = signextend<signed int,5>(x);  // sign extend 5 bit number x to r
```

> Nota: el 2 de mayo de 2005 John Byrd encontró un error tipográfico en el código (posiblemente causado por el formato HTML). El 4 de marzo de 2006 Pat Wood señaló que el estándar ANSI C exige que los campos de bits indiquen explícitamente `signed` para garantizar que sean con signo; de lo contrario, el signo es indeterminado.

---

## Extensión de signo desde un ancho de bits variable（Sign extending from a variable bit-width）

A veces necesitamos extender el signo pero no sabemos de antemano cuántos bits `b` representa el número. (O estás programando en un lenguaje como Java que no tiene campos de bits.) El método de ancho fijo anterior requiere 4 operaciones; pero cuando el ancho de bits es constante en lugar de variable, si los bits altos ya son 0, entonces bastan 2 operaciones rápidas.

```c
unsigned b; // number of bits representing the number in x
int x;      // sign extend this b-bit number to r
int r;      // resulting sign-extended number
int const m = 1U << (b - 1); // mask can be pre-computed if b is fixed

x = x & ((1U << b) - 1);  // (Skip this if bits in x above position b are already zero.)
r = (x ^ m) - m;
```

Un método algo más rápido pero menos portable, que no depende de si `x` tiene 0 por encima del bit b:

```c
int const m = CHAR_BIT * sizeof(x) - b;
r = (x << m) >> m;
```

> Nota: el 13 de junio de 2004 Sean A. Irvine sugirió que añadiera los métodos de extensión de signo a esta página y proporcionó un punto de partida, que optimicé a `m = 1U << (b - 1); r = (x ^ m) - m`。 El 11 de mayo de 2007 Shay Green sugirió la versión de arriba, que requiere 1 operación menos que mi versión anterior. El 15 de octubre de 2008 Vipin Sharma sugirió añadir un paso para manejar el caso en que `x` aún contenga 1 fuera de los b bits objetivo. El 31 de diciembre de 2009 Chris Pirazzi sugirió añadir la “versión más rápida”: con ancho constante solo necesita 2 operaciones, y con ancho variable 3 operaciones.

---

## Extensión de signo desde un ancho de bits variable en 3 operaciones（Sign extending from a variable bit-width in 3 operations）

El siguiente método puede ser más lento en algunas máquinas porque la multiplicación y la división tienen un coste alto. Esta versión requiere 4 operaciones. Si puedes garantizar que el ancho de bits inicial `b > 1`, entonces puedes usar formas como `r = (x * multipliers[b]) / divisors[b]` para reducirlo a 3 operaciones (solo necesitas una consulta a tabla).

El siguiente variante no es portable, pero debería ser rápida en arquitecturas que usan “desplazamiento aritmético a la derecha” (arithmetic right shift, preserva el signo al desplazar). Randal E. Bryant señaló un bug en una versión temprana el 3 de mayo de 2005 (se usaba `multipliers[]` por error en lugar de `divisors[]`), que fallaba con `x=1, b=1`.

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

## Establecer/limpiar bits condicionalmente sin ramificaciones（Conditionally set or clear bits without branching）

```c
bool f;         // conditional flag
unsigned int m; // the bit mask
unsigned int w; // the word to modify:  if (f) w |= m; else w &= ~m;

w ^= (-f ^ w) & m;

// OR, for superscalar CPUs:
w = (w & ~m) | (-f & m);
```

En algunas arquitecturas, el beneficio de no ramificar es suficiente para compensar la desventaja de “aparentemente duplicar el número de operaciones”. Por ejemplo, pruebas informales de velocidad en un AMD Athlon™ XP 2100+ indican que puede ser un 5–10% más rápido. En un Intel Core 2 Duo, la segunda forma (adecuada para superscalar) es aproximadamente un 16% más rápida que la primera.

Glenn Slayden me comunicó la primera expresión el 11 de diciembre de 2003. Marco Yu compartió la versión adecuada para superscalar el 3 de abril de 2007, y dos días después señaló un error tipográfico.

---

## Negar condicionalmente un valor sin ramificaciones（Conditionally negate a value without branching）

Si solo necesitas negar (negate) cuando un flag es false, puedes usar la siguiente forma para evitar ramificaciones; si solo necesitas negar cuando el flag es true, entonces usa la segunda.

Avraham Plotnitzky sugirió añadir la primera versión el 2 de junio de 2009. Para evitar la multiplicación, ideé la segunda versión el 8 de junio de 2009. Alfonso De Gregorio señaló que faltaban paréntesis el 26 de noviembre de 2009 y obtuvo la recompensa por el bug.

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

## Combinar bits de dos valores según una máscara（Merge bits from two values according to a mask）

```c
unsigned int a;    // value to merge in non-masked bits
unsigned int b;    // value to merge in masked bits
unsigned int mask; // 1 where bits from b should be selected; 0 where from a.
unsigned int r;    // result of (a & ~mask) | (b & mask) goes here

r = a ^ ((a ^ b) & mask);
```

Esto usa 1 operación menos que la forma intuitiva `(a & ~mask) | (b & mask)`. Si `mask` es constante, puede no haber ventaja.

Ron Jeffery me envió este truco el 9 de febrero de 2006.

---

## Contar bits a 1（Counting bits set）

### Método ingenuo（naive way）

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v

for (c = 0; v; v >>= 1)
{
  c += v & 1;
}
```

El método ingenuo procesa 1 bit por iteración hasta que no queda ningún bit a 1. Por tanto, para un entero de 32 bits, si solo el bit más alto es 1, iterará 32 veces.

---

### Por tabla de consulta（by lookup table）

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

El 14 de julio de 2009, Hallvard Furuseth sugirió usar macros para comprimir la definición de la tabla.

---

### Método de Brian Kernighan（Brian Kernighan's way）

```c
unsigned int v; // count the number of bits set in v
unsigned int c; // c accumulates the total bits set in v
for (c = 0; v; c++)
{
  v &= v - 1; // clear the least significant bit set
}
```

El método de Brian Kernighan itera tantas veces como bits a 1 haya. Así, para un entero de 32 bits, si solo el bit más alto es 1, el bucle se ejecuta 1 vez.

Este método aparece en el ejercicio 2-9 de *The C Programming Language (2nd Edition)* (1988). El 19 de abril de 2006, Donald Knuth me dijo que el método fue publicado primero por Peter Wegner en CACM 3 (1960), 322. (Además, Derrick Lehmer lo descubrió de forma independiente y lo publicó en algún libro de 1964, editado por Beckenbach.)

---

### Usar instrucciones de 64 bits para contar palabras de 14/24/32 bits（using 64-bit instructions）

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

Este método solo es eficiente si la CPU es de 64 bits y la división modular es rápida. La opción 1 requiere solo 3 operaciones; la opción 2 requiere 10; la opción 3 requiere 15.

Rich Schroeppel creó originalmente una versión de 9 bits (similar a la opción 1); ver Beeler, M., Gosper, R. W., and Schroeppel, R., *HAKMEM*, capítulo Programming Hacks, MIT AI Memo 239, 29 de febrero de 1972. Su método inspiró las variantes anteriores, diseñadas por Sean Anderson. Randal E. Bryant aportó varias correcciones de bugs el 3 de mayo de 2005. Bruce Dawson ajustó el 1 de febrero de 2007 la versión previa de 12 bits para que funcionara con 14 bits, manteniendo el mismo número de operaciones.

---

### Conteo en paralelo（in parallel）

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

En binario, el arreglo B es:

- `B[0] = 0x55555555 = 01010101 01010101 01010101 01010101`
- `B[1] = 0x33333333 = 00110011 00110011 00110011 00110011`
- `B[2] = 0x0F0F0F0F = 00001111 00001111 00001111 00001111`
- `B[3] = 0x00FF00FF = 00000000 11111111 00000000 11111111`
- `B[4] = 0x0000FFFF = 00000000 00000000 11111111 11111111`

Podemos adaptar este patrón de “números mágicos binarios” (Binary Magic Numbers) a anchos mayores: si hay k bits, entonces los arreglos S y B deben tener longitud `ceil(lg(k))`, y se deben calcular la misma cantidad de expresiones. Para un `v` de 32 bits, el método anterior usa 16 operaciones.

---

### El mejor método para conteo en 32 bits（The best method for 32-bit）

```c
v = v - ((v >> 1) & 0x55555555);                    // reuse input as temporary
v = (v & 0x33333333) + ((v >> 2) & 0x33333333);     // temp
c = ((v + (v >> 4) & 0xF0F0F0F) * 0x1010101) >> 24; // count
```

Este “mejor método” solo requiere 12 operaciones, igual que la tabla de consulta, pero evita el acceso a memoria y los posibles fallos de caché que introduce la tabla. Es un punto intermedio entre el “método puramente paralelo” anterior y los métodos anteriores de “multiplicación + instrucciones de 64 bits”: cuenta en paralelo por byte y luego suma los 4 conteos multiplicando por `0x1010101` y desplazando a la derecha 24 bits.

---

### Generalización hasta 128 bits（generalization up to 128-bit）

A continuación se da una generalización para enteros de hasta 128 bits (parametrizada por el tipo `T`):

```c
v = v - ((v >> 1) & (T)~(T)0/3);                           // temp
v = (v & (T)~(T)0/15*3) + ((v >> 2) & (T)~(T)0/15*3);      // temp
v = (v + (v >> 4)) & (T)~(T)0/255*15;                      // temp
c = (T)(v * ((T)~(T)0/255)) >> (sizeof(T) - 1) * CHAR_BIT; // count
```

Para más información sobre contar bits a 1 (también llamado sideways addition), ver el excelente post de Ian Ashdown en los grupos de noticias.

Andrew Shapira me llamó la atención sobre este “mejor método de conteo” el 5 de octubre de 2005: lo vio en las páginas 187–188 de *Software Optimization Guide for AMD Athlon™ 64 and Opteron™ Processors*. Charlie Gordon sugirió el 14 de diciembre de 2005 ahorrar 1 operación más en la versión puramente paralela; Don Clugston el 30 de diciembre de 2005 redujo otras 3. Al aplicar la sugerencia de Don, cometí un error en un punto, y Eric Cole señaló la errata el 8 de enero de 2006. Más tarde, el 17 de noviembre de 2006, Eric sugirió la “generalización a cualquier ancho de bits del mejor método”. El 5 de abril de 2007, Al Williams observó que yo tenía una línea de código muerto al inicio del primer método.

---

## Contar bits a 1 desde el bit más significativo hasta una posición dada (rank)（Count bits set (rank) from the most-significant bit upto a given position）

El siguiente código se usa para calcular el **rank** de un bit: es decir, contando desde el bit más significativo (MSB) hacia la derecha, hasta la posición dada `pos` (incluida), la suma de todos los bits a 1 (valor 1).

Juha Järvi me lo envió el 21 de noviembre de 2009, como la operación inversa del siguiente apartado “seleccionar la posición del bit según el rank”.

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

## Seleccionar la posición del bit (desde el bit más significativo) con el conteo (rank) dado（Select the bit position (from the most-significant bit) with the given count (rank)）

El siguiente código de 64 bits sirve para: contar, de izquierda a derecha (desde el MSB), la cantidad de bits a 1, encontrar la posición del enésimo 1 (el de rank `r`) y devolverla. Si el rank solicitado excede el número total de bits a 1, devuelve 64. Este código puede adaptarse a una versión de 32 bits o a contar de derecha a izquierda.

Si en tu CPU ramificar es rápido, considera descomentar las sentencias `if` comentadas y comentar las versiones sin ramificación que les siguen.

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

Juha Järvi me envió este código el 21 de noviembre de 2009.

---

## Calcular la paridad (parity)（Computing parity (1 if an odd number of bits set, 0 otherwise)）

Aquí, parity significa: si el número de bits a 1 es impar, entonces 1; si es par, entonces 0.

### Método ingenuo para paridad（Computing parity the naive way）

El siguiente código usa una idea similar al conteo de Brian Kernighan: se invierte la paridad cada vez que se limpia un bit a 1, así que el tiempo es proporcional al número de bits a 1.

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

### Calcular paridad con tabla de consulta（Compute parity by lookup table）

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

Randal E. Bryant me animó el 3 de mayo de 2005 a añadir la última “variación con p variable” (aunque es bastante directa). El 27 de septiembre de 2005 Bruce Rawles encontró un error tipográfico en el nombre de la tabla y obtuvo la recompensa de 10 dólares. El 9 de octubre de 2006 Fabrice Bellard sugirió las variantes de 32 bits anteriores, que solo requieren una consulta; la versión previa hacía 4 consultas (una por byte) y era más lenta. El 14 de julio de 2009 Hallvard Furuseth sugirió usar macros para comprimir la tabla.

---

### Calcular la paridad de un byte usando multiplicación de 64 bits y división modular（Compute parity of a byte using 64-bit multiply and modulus division）

```c
unsigned char b;  // byte value to compute the parity of
bool parity =
  (((b * 0x0101010101010101ULL) & 0x8040201008040201ULL) % 0x1FF) & 1;
```

Este método requiere aproximadamente 4 operaciones, pero solo funciona para bytes.

---

### Calcular la paridad de una palabra con una multiplicación（Compute parity of word with a multiply）

El siguiente método usa una multiplicación para calcular la paridad de un valor de 32 bits en 8 operaciones; para 64 bits también requiere solo 8 operaciones.

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

Andrew Shapira propuso este método y me lo envió el 2 de septiembre de 2007.

---

### Calcular paridad en paralelo（Compute parity in parallel）

```c
unsigned int v;  // word value to compute the parity of
v ^= v >> 16;
v ^= v >> 8;
v ^= v >> 4;
v &= 0xf;
return (0x6996 >> v) & 1;
```

Este método requiere aproximadamente 9 operaciones y aplica a palabras de 32 bits. Si solo es para bytes, puedes eliminar las dos líneas inmediatamente después de `unsigned int v;`, optimizando a unas 5 operaciones.

La idea es: primero plegar, con desplazamientos y xor, los 8 nibbles (4 bits) de un valor de 32 bits hasta el nibble menos significativo; luego usar el binario `0110 1001 1001 0110` (hex `0x6996`) como una “mini tabla de paridad de 16 entradas”: se desplaza a la derecha según el nibble y se enmascara el bit resultante.

Mathew Hendry señaló esta idea de “tabla por desplazamiento” el 15 de diciembre de 2002; esta optimización reduce 2 operaciones.

---

## Intercambiar valores（Swapping Values）

### Intercambiar con suma y resta（Swapping values with subtraction and addition）

```c
#define SWAP(a, b) ((&(a) == &(b)) || \
                    (((a) -= (b)), ((b) += (a)), ((a) = (b) - (a))))
```

Esta macro puede intercambiar los valores de `a` y `b` sin usar una variable temporal. La comprobación inicial de si `a` y `b` apuntan a la misma ubicación de memoria puede omitirse si estás seguro de que no ocurrirá. (El compilador también podría eliminarla como optimización.)

Si tienes habilitadas excepciones por desbordamiento, se recomienda pasar valores sin signo para evitar excepciones. La técnica de intercambio con XOR siguiente puede ser ligeramente más rápida en algunas máquinas. No uses esta macro con números de punto flotante (a menos que estés manipulando su representación entera subyacente).

Sanjeev Sivasankaran sugirió que añadiera esto el 12 de junio de 2007. Vincent Lefèvre señaló el 9 de julio de 2008 el problema de que suma/resta podría disparar excepciones por desbordamiento.

---

### Intercambiar con XOR（Swapping values with XOR）

```c
#define SWAP(a, b) (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))
```

Este es un truco clásico: intercambiar `a` y `b` sin variable temporal.

El 20 de enero de 2005, Iain A. Fleming señaló que cuando intercambias la misma ubicación de memoria (por ejemplo `SWAP(a[i], a[j])` con `i == j`), esta macro falla. Si esa situación puede ocurrir, puedes cambiarla a:

`(((&(a) == &(b)) || (((a) ^= (b)), ((b) ^= (a)), ((a) ^= (b)))))` (el original daba una sugerencia similar)

El 14 de julio de 2009, Hallvard Furuseth también sugirió que, en algunas máquinas, el resultado de `(a) ^ (b)` puede reutilizarse para acelerar aún más (detalles omitidos en el original).

---

### Intercambiar rangos individuales de bits con XOR（Swapping individual bits with XOR）

```c
unsigned int i, j; // positions of bit sequences to swap
unsigned int n;    // number of consecutive bits in each sequence
unsigned int b;    // bits to swap reside in b
unsigned int r;    // bit-swapped result goes here

unsigned int x = ((b >> i) ^ (b >> j)) & ((1U << n) - 1); // XOR temporary
r = b ^ ((x << i) | (x << j));
```

Ejemplo: supón que `b = 00101111` (binario). Queremos intercambiar 3 bits consecutivos empezando en `i = 1` (el segundo bit desde la derecha) con otros 3 bits consecutivos empezando en `j = 5`; el resultado será `r = 11100011` (binario).

Este método es similar al intercambio XOR general, pero orientado a bits individuales (o rangos de bits). La variable `x` guarda primero el XOR de los dos rangos a intercambiar, y luego al hacer XOR con el número original se invierten los bits para obtener el estado intercambiado. Si los rangos se solapan, el resultado es indefinido.

El 14 de julio de 2009, Hallvard Furuseth sugirió cambiar `1 << n` por `1U << n`, ya que el resultado se asigna a un valor sin signo y se evita desplazar dentro del bit de signo.

---

## Invertir secuencias de bits（Reversing bit sequences）

### Invertir bits de forma evidente（Reverse bits the obvious way）

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

El 15 de octubre de 2004, Michael Hoisie señaló un bug en la versión original. El 3 de mayo de 2005, Randal E. Bryant sugirió eliminar una operación extra. El 18 de mayo de 2005, Behdad Esfahbod sugirió un pequeño cambio para reducir una iteración del bucle. Más tarde, el 6 de febrero de 2007, Liyong Zhou propuso una versión mejor: cambiar la condición del bucle a `v != 0`, de modo que no haya que recorrer todos los bits y se pueda terminar antes (se omiten detalles históricos del original).

---

### Invertir bits de una palabra con tabla de consulta（Reverse bits in word by lookup table）

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

El primer método requiere alrededor de 17 operaciones; el segundo asume que la CPU facilita cargar/almacenar por bytes, y requiere alrededor de 12 operaciones.

El 14 de julio de 2009, Hallvard Furuseth sugirió usar macros para comprimir la tabla.

---

### Invertir los bits de un byte en 3 operaciones (multiplicación de 64 bits + módulo)（Reverse the bits in a byte with 3 operations）

```c
unsigned char b; // reverse this (8-bit) byte

b = (b * 0x0202020202ULL & 0x010884422010ULL) % 1023;
```

La multiplicación expande el patrón de 8 bits del byte en 5 copias dentro de 64 bits. El AND selecciona los bits que, relativos a cada grupo de 10 bits, están en la posición correcta (invertida). La multiplicación y el AND garantizan que cada bit del byte original aparezca solo en una posición de un único grupo de 10 bits. El último paso toma módulo `2^10 - 1` y combina los grupos de 10 bits. Como los grupos no se solapan dentro de los 64 bits, el efecto de “suma” implícito en el módulo es equivalente a un OR a nivel de bits.

Este método se atribuye a Rich Schroeppel; ver Beeler, M., Gosper, R. W., and Schroeppel, R., *HAKMEM*, MIT AI Memo 239, capítulo Programming Hacks, 29 de febrero de 1972.

---

### Invertir los bits de un byte en 4 operaciones (multiplicación de 64 bits, sin división)（Reverse the bits in a byte with 4 operations）

```c
unsigned char b; // reverse this byte

b = ((b * 0x80200802ULL) & 0x0884422110ULL) * 0x0101010101ULL >> 32;
```

El original a continuación daba un diagrama del flujo de bits (omitido). Nota: en algunos procesadores, los dos últimos pasos pueden combinarse porque se puede acceder al registro por bytes: basta con organizar la multiplicación para que algún registro contenga los 32 bits altos del resultado y luego tomar su byte bajo. Por tanto, el conteo total de operaciones podría bajar a 6.

Sean Anderson propuso este método el 13 de julio de 2001.

---

### Invertir los bits de un byte en 7 operaciones (sin 64 bits)（Reverse the bits in a byte with 7 operations）

```c
b = ((b * 0x0802LU & 0x22110LU) | (b * 0x8020LU & 0x88440LU)) * 0x10101LU >> 16;
```

Asegúrate de asignar el resultado o forzar la conversión a `unsigned char` para eliminar basura en los bits altos. Sean Anderson propuso este método el 13 de julio de 2001. Mike Keith señaló y corrigió un error tipográfico el 3 de enero de 2002.

---

### Invertir en paralelo una cantidad de N bits: 5 * lg(N) operaciones（Reverse an N-bit quantity in parallel）

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

La siguiente variante también es `O(lg(N))`, pero requiere más operaciones para invertir `v`; su ventaja es que ocupa menos memoria de constantes (las constantes se calculan dinámicamente dentro del bucle). El método anterior es adecuado cuando N es grande. Si aplicas el método anterior a enteros de 64 bits (o más), necesitas seguir añadiendo líneas siguiendo el patrón; de lo contrario, solo invertirás los 32 bits bajos, y el resultado también solo será correcto en los 32 bits bajos.

```c
unsigned int s = sizeof(v) * CHAR_BIT; // bit size; must be power of 2
unsigned int mask = ~0;
while ((s >>= 1) > 0)
{
  mask ^= (mask << s);
  v = ((v >> s) & mask) | ((v << s) & ~mask);
}
```

Para más información, ver el artículo de Edwin Freed “Binary Magic Numbers” en Dr. Dobb's Journal, 1983. Ken Raeburn sugirió la segunda variante el 13 de septiembre de 2005. Veldmeijer mencionó el 19 de marzo de 2006 que la última línea de la primera versión puede no necesitar AND (se omiten detalles históricos del original).

---

## División modular (también llamada cálculo de restos)（Modulus division (aka computing remainders)）

### Calcular n mod (1 << s) sin operador de división（Computing modulus division by 1 << s without a division operator）

```c
const unsigned int n;          // numerator
const unsigned int s;
const unsigned int d = 1U << s; // So d will be one of: 1, 2, 4, 8, 16, 32, ...
unsigned int m;                // m will be n % d
m = n & (d - 1);
```

La mayoría de programadores aprende este truco muy pronto; se incluye aquí por completitud.

---

### Calcular n mod ((1 << s) - 1) sin operador de división（Computing modulus division by (1 << s) - 1 without a division operator）

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

Este método de “módulo por un número que es una potencia de 2 menos 1” requiere, como máximo,
`5 + (4 + 5 * ceil(N / s)) * ceil(lg(N / s))` operaciones, donde N es el número de bits del numerador. En otras palabras, su complejidad temporal es a lo sumo `O(N * lg(N))`.

Sean Anderson propuso este método el 15 de agosto de 2001. Sean A. Irvine me corrigió el 17 de junio de 2004: yo había dicho erróneamente en un comentario que “se puede cambiar el final por una asignación”. Michael Miller encontró un error tipográfico el 25 de abril de 2005.

---

### Calcular n mod ((1 << s) - 1) en paralelo sin operador de división（Computing modulus division by (1 << s) - 1 in parallel without a division operator）

> ¡El siguiente código usa como ejemplo palabras de 32 bits!

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

Este método suma en paralelo los “dígitos” del numerador en base `(1 << s)`, completándolo en, como máximo, tiempo `O(lg(N))` (para el código de 32 bits anterior, N=32). El límite superior del número de operaciones es aproximadamente `12 + 9 * ceil(lg(N))`. Si conoces el denominador en tiempo de compilación, puedes eliminar las tablas: extraer solo las entradas relevantes y desenrollar el bucle. También es fácil extenderlo a más bits.

Una intuición es: escribe el resultado en papel, corta el papel por la mitad, alinea las dos mitades y suma columna a columna en un papel nuevo; repite el proceso de “cortar y sumar” hasta que ya no se pueda cortar. Tras `lg(N/s/2)` cortes, deja de cortar y solo sigue sumando hasta que en cada suma quede un único valor de s bits.

Sean Anderson propuso este método el 20 de agosto de 2001. Randy E. Bryant señaló un error tipográfico el 3 de mayo de 2005 (después de pegar el código, más tarde escribí `unsinged` en una declaración). Igual que en el truco anterior, yo también había escrito erróneamente en el comentario que “se puede cambiar el final por una asignación”; Donald Knuth me corrigió el 19 de abril de 2006 y propuso una forma alternativa (omitida en el original). El 18 de junio de 2009 Sean Irvine propuso un cambio: usar `((n >> s) & M[s])` en lugar de `((n & ~M[s]) >> s)`, normalmente con menos operaciones porque la constante `M[s]` ya está cargada (el original añadía varias alternativas al final).

---

## Calcular el logaritmo en base 2 entero de un entero (posición del bit a 1 más alto)（Finding integer log base 2 of an integer）

### Método ingenuo: si el MSB está en el bit N, O(N) operaciones（Find the log base 2 ... in O(N) operations）

```c
unsigned int v; // 32-bit word to find the log base 2 of
unsigned int r = 0; // r will be lg(v)

while (v >>= 1) // unroll for more speed...
{
  r++;
}
```

El logaritmo base 2 entero equivale a la “posición del bit a 1 más alto (MSB)”. A continuación hay métodos más rápidos.

---

### Calcular log2 con un float IEEE de 64 bits（Find the log base 2 ... with an 64-bit IEEE float）

```c
int v; // 32-bit integer to find the log base 2 of
int r; // result of log_2(v) goes here
union { unsigned int u[2]; double d; } t; // temp

t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] = 0x43300000;
t.u[__FLOAT_WORD_ORDER!=LITTLE_ENDIAN] = v;
t.d -= 4503599627370496.0;
r = (t.u[__FLOAT_WORD_ORDER==LITTLE_ENDIAN] >> 20) - 0x3FF;
```

Este código construye un `double` IEEE-754 de 64 bits escribiendo el entero de 32 bits (sin bits de relleno) en la mantisa, y poniendo el exponente a `2^52`. Luego resta `2^52` (en double es `4503599627370496.0`), haciendo que el exponente del resultado sea el log2 del valor de entrada `v`. Por último, desplaza los bits del exponente a su lugar y resta el sesgo `0x3FF` (1023 en decimal).

Este truco solo requiere 5 operaciones, pero muchas CPU hacen operaciones double más lento, y además hay que tratar la endianness.

Eric Cole me lo envió el 15 de enero de 2006. Evan Felix señaló un error tipográfico el 4 de abril de 2006. Vincent Lefèvre me recordó el 9 de julio de 2008 que la comprobación de endianness debe ser la del formato de punto flotante, porque puede diferir de la endianness de enteros.

---

### Calcular log2 con tabla de consulta（Find the log base 2 ... with a lookup table）

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

Este método con tabla para hallar log2 de un valor de 32 bits requiere aproximadamente solo 7 operaciones. Si se extiende a 64 bits, unas 9 operaciones. También puede usarse 4 tablas (codificando las sumas dentro de las entradas) para reducir 1 operación más. Usar `int` para las entradas quizá sea más rápido, dependiendo de tu arquitectura.

El código anterior está optimizado para el caso de “salida uniformemente distribuida”. Si tu entrada está uniformemente distribuida en el espacio de 32 bits, considera esta variante:

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

Forma de generar la tabla (inicialización algorítmica):

```c
LogTable256[0] = LogTable256[1] = 0;
for (int i = 2; i < 256; i++)
{
  LogTable256[i] = 1 + LogTable256[i / 2];
}
LogTable256[0] = -1; // if you want log(0) to return -1
```

El 18 de mayo de 2005 Behdad Esfahbod y yo redujimos un poco el promedio de operaciones. El 14 de noviembre de 2006 Emanuel Hoogeveen recortó un poco más. El 19 de septiembre de 2008 David A. Butterfield sugirió añadir la variante “para entradas uniformemente distribuidas”. El 5 de enero de 2009 Venkat Reddy señaló que `log(0)` debería devolver `-1` para indicar error, así que cambié el primer elemento de la tabla a `-1`.

---

## Calcular log2 con multiplicación de de Bruijn + tabla（Find the log base 2 ... with multiply and lookup）

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

Este método usa una tabla pequeña y una multiplicación para calcular el log2 de un entero de 32 bits. Solo requiere 13 operaciones, menos que el método general `O(lg(N))` (que podría requerir hasta 20). El método de tabla pura usa menos operaciones, pero este ofrece un equilibrio entre “tamaño de tabla vs. velocidad”.

Si sabes que `v` ya es una potencia de 2, entonces basta con:

```c
static const int MultiplyDeBruijnBitPosition2[32] =
{
  0, 1, 28, 2, 29, 14, 24, 3, 30, 22, 20, 15, 25, 17, 4, 8,
  31, 27, 13, 23, 21, 19, 16, 7, 26, 12, 18, 6, 11, 5, 10, 9
};
r = MultiplyDeBruijnBitPosition2[(uint32_t)(v * 0x077CB531U) >> 27];
```

Eric Cole propuso este método el 8 de enero de 2006: al leer más adelante “redondear hacia arriba a potencia de 2” y “usar multiplicación + tabla para trailing zeros (secuencia de de Bruijn)”, se le ocurrió aplicarlo a log2. El 10 de diciembre de 2009 Mark Dickinson redujo algunas operaciones más: exigió que `v` se “redondee hacia arriba al valor menor que la siguiente potencia de 2” en lugar de redondearlo directamente a la potencia de 2.

---

## Calcular el logaritmo entero en base 10（Find integer log base 10 of an integer）

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

El log10 entero se calcula primero obteniendo `IntegerLogBase2(v)` con cualquiera de los trucos de log2 anteriores. Por la relación `log10(v) = log2(v) / log2(10)`, necesitamos multiplicar por `1/log2(10)`, que se aproxima por `1233/4096`, es decir, multiplicar por 1233 y desplazar 12 bits a la derecha. Se suma 1 porque `IntegerLogBase2` redondea hacia abajo. Por último, como `t` es aproximado (puede errar por 1), se corrige con `v < PowersOf10[t]` para obtener el resultado exacto.

Este método requiere 6 operaciones más que `IntegerLogBase2`. Si tu máquina hace accesos a memoria muy rápido, puedes reemplazar el método de log2 por tabla por uno donde “las entradas de la tabla guardan directamente t” (es decir, codificando de antemano suma, multiplicación y desplazamientos en la tabla), y entonces el total puede bajar a 9 operaciones (suponiendo 4 tablas para los 4 bytes de v).

Eric Cole sugirió que añadiera este método el 7 de enero de 2006.

---

### Log10 ingenuo（Find integer log base 10 ... the obvious way）

```c
unsigned int v; // non-zero 32-bit integer value to compute the log base 10 of
int r;          // result goes here

r = (v >= 1000000000) ? 9 : (v >= 100000000) ? 8 : (v >= 10000000) ? 7 :
    (v >= 1000000) ? 6 : (v >= 100000) ? 5 : (v >= 10000) ? 4 :
    (v >= 1000) ? 3 : (v >= 100) ? 2 : (v >= 10) ? 1 : 0;
```

Cuando la entrada está uniformemente distribuida en el espacio de 32 bits, este método funciona muy bien: el 76% de las entradas aciertan en la primera comparación, el 21% en la segunda, el 2% en la tercera… Cada comparación reduce el rango restante en aproximadamente un 90%. Por tanto, en promedio requiere menos de 2.6 operaciones.

El 18 de abril de 2007 Emanuel Hoogeveen propuso una variante que usa divisiones como condiciones, pero no era más rápida que las comparaciones simples.

---

## Encontrar la parte entera del log2 de un float IEEE de 32 bits（Find integer log base 2 of a 32-bit IEEE float）

```c
const float v; // find int(log2(v)), where v > 0.0 && finite(v) && isnormal(v)
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = (c >> 23) - 127;
```

Esto es muy rápido, pero las arquitecturas compatibles con IEEE 754 también soportan subnormales (subnormal/denormal). En ellos, el campo de exponente es 0 (representa `2^-127`) y la mantisa ya no está normalizada, por lo que hay que recomputar log2 desde la mantisa. Para soportar subnormales:

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

> Nota: el 20 de junio de 2004 Sean A. Irvine sugirió añadir el manejo de subnormales. El 11 de junio de 2005 Falk Hüffner señaló que ISO C99 6.5/7 define el type punning típico `*(int *)&` como comportamiento indefinido (aunque funcione en el 99.9% de compiladores). Para máxima portabilidad, sugirió usar `memcpy`, o usar un `union` `{ float; int; }` para generar código mejor que `memcpy`.

---

## Encontrar el log2 entero de la raíz pow(2, r) de un float（Find integer log base 2 of the pow(2, r)-root ...）

```c
const int r;
const float v; // find int(log2(pow((double) v, 1. / pow(2, r)))),
               // where isnormal(v) and v > 0
int c;         // 32-bit int c gets the result;

c = *(const int *) &v;  // OR, for portability:  memcpy(&c, &v, sizeof c);
c = ((((c - 0x3f800000) >> r) + 0x3f800000) >> 23) - 127;
```

Por ejemplo, si `r = 0`, entonces `c = int(log2((double)v))`; si `r = 1`, entonces `c = int(log2(sqrt((double)v)))`; si `r = 2`, entonces `c = int(log2(pow((double)v, 1./4)))`.

El 11 de junio de 2005 Falk Hüffner también señaló el comportamiento indefinido de `*(int *)&` y recomendó `memcpy`.

---

## Contar ceros consecutivos al final (trailing zeros)（Counting consecutive trailing zero bits）

### Método lineal（Count trailing zeros linearly）

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

Un número binario aleatorio con distribución uniforme tiene, en promedio, 1 trailing zero, así que este método `O(trailing zeros)` no es tan malo.

Jim Cole sugirió añadir este método lineal el 15 de agosto de 2007. El 22 de octubre de 2007 Jason Cunningham señaló que al pegar el código se me olvidó el modificador `unsigned`.

---

### Método en paralelo（Count trailing zeros in parallel）

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

Esto es básicamente equivalente a “calcular log2 en paralelo”, pero primero aísla el bit a 1 menos significativo y luego decrementa `c` desde el máximo. El límite superior de operaciones es aproximadamente `3 * lg(N) + 4` (para una palabra de N bits).

Bill Burdick propuso una optimización el 4 de febrero de 2011, reduciendo el tiempo de `4 * lg(N)`.

---

### Búsqueda binaria（Count trailing zeros by binary search）

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

Esto es similar al método anterior, pero usa una reducción “a la mitad” acumulando `c`: primero verifica si los 16 bits bajos son 0; si lo son, desplaza 16 y suma `c += 16`; y así sucesivamente, reduciendo el rango a la mitad cada vez hasta quedar 1 bit. Es más rápido (aprox. 33%) porque se ejecutan menos cuerpos de `if`.

Matt Whitlock sugirió añadir este método el 25 de enero de 2006. Andrew Shapira redujo algunas operaciones el 5 de septiembre de 2007 (por ejemplo, iniciar `c=1` y al final restar una vez incondicionalmente).

---

### Contar trailing zeros por conversión a float（Count trailing zeros by casting to a float）

```c
unsigned int v;            // find the number of trailing zeros in v
int r;                     // the result goes here
float f = (float)(v & -v); // cast the least significant bit in v to a float
r = (*(uint32_t *)&f >> 23) - 0x7f;
```

Aunque requiere solo unas 6 operaciones, convertir entero a float puede ser caro en algunas máquinas. Aquí se usa el exponente de IEEE 754: se aísla el bit a 1 menos significativo, se convierte a float, y el exponente menos el sesgo da la posición del bit. Si `v` es 0, el resultado es `-127`.

---

### Contar trailing zeros con módulo + tabla（Count trailing zeros with modulus division and lookup）

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

Este método aprovecha el hecho de que las primeras 32 posiciones de bit son coprimas con 37, así que el módulo 37 produce un valor único en 0..36, y una tabla pequeña lo mapea de vuelta a los trailing zeros. Solo requiere 4 operaciones, pero el módulo y la consulta a tabla pueden hacerlo inadecuado en algunos casos. Lo ideé de forma independiente y luego, al buscar subsecuencias en los valores de tabla, descubrí que en *Hacker's Delight* se atribuye a Reiser.

---

### Contar trailing zeros con multiplicación + tabla (de Bruijn)（Count trailing zeros with multiply and lookup）

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

Esto requiere 1 operación más que “módulo + tabla”, pero la multiplicación puede ser más rápida. La expresión `(v & -v)` extrae el bit a 1 menos significativo. La constante `0x077CB531U` es una secuencia de de Bruijn; al multiplicar, produce un patrón único en los 5 bits altos que corresponde 1 a 1 con la posición del bit, permitiendo indexar la tabla. Si no hay bits a 1, devuelve 0.

Para más información, ver el paper *Using de Bruijn Sequences to Index 1 in a Computer Word* (Charles E. Leiserson, Harald Prokof, Keith H. Randall).

Andrew Shapira sugirió añadir este método el 8 de octubre de 2005. El 14 de abril de 2009 Dustin Spicuzza pidió convertir el resultado de la multiplicación a 32 bits, porque en compilaciones con `int` de 64 bits causaba problemas.

---

## Redondear hacia arriba a la siguiente potencia de 2 mediante conversión a float（Round up to the next highest power of 2 by float casting）

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

Este código usa 8 operaciones y funciona para todo `v <= (1<<31)`.

Versión rápida pero “a lo bruto” (dominio `1 < v < (1<<25)`):

```c
float f = (float)(v - 1);
r = 1U << ((*(unsigned int*)(&f) >> 23) - 126);
```

Aunque la versión quick-and-dirty requiere solo unas 6 operaciones, benchmarks en un Athlon™ XP 2100+ mostraron que es aproximadamente 3 veces más lenta que el siguiente truco (12 operaciones). Algunas CPU podrían favorecerla.

El 27 de septiembre de 2005 Andi Smithers sugirió añadir un método que use float para obtener lg y así redondear hacia arriba a potencia de 2. Su versión era similar a esta, pero por el redondeo de la mantisa solo funcionaba para `< (1<<25)` y tenía 1 operación más.

---

## Redondear hacia arriba a la siguiente potencia de 2（Round up to the next highest power of 2）

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

Este código usa 12 operaciones para calcular la siguiente (o la misma) potencia de 2 de un entero de 32 bits. En el caso borde `v=0` devuelve 0 (no es potencia de 2); si te importa, puedes añadir `v += (v == 0)` para corregirlo. Usar la fórmula `1U << (lg(v - 1) + 1)` junto con una tabla de log2 sería 2 operaciones más rápido, pero en algunos escenarios una tabla no es adecuada, así que la forma anterior puede ser preferible.

La idea es: copiar el bit a 1 más alto a todos los bits inferiores y luego sumar 1, de modo que el acarreo limpie los bits bajos y ponga a 1 el bit inmediatamente por encima del bit más alto original. Si el número ya era una potencia de 2, entonces `v--` lo convierte en todo 1, y al sumar se vuelve al valor original.

Atul Divekar sugirió el 5 de septiembre de 2010 mencionar que también puedes usar una tabla para `floor(lg(v))` y luego calcular `1<<(1+floor(lg(v)))`, lo que requiere solo 8 o 9 operaciones.

Sean Anderson propuso este algoritmo el 14 de septiembre de 2001. Pete Hart, en febrero de 1997, me llevó a varios posts en grupos de noticias suyos y de William Lewis donde llegaron al mismo algoritmo.

---

## Entrelazar bits (también llamado cálculo de números de Morton)（Interleaving bits (aka computing Morton Numbers)）

### Entrelazar bits de forma evidente（Interleave bits the obvious way）

```c
unsigned short x;   // Interleave bits of x and y, so that all of the
unsigned short y;   // bits of x are in the even positions and y in the odd;
unsigned int z = 0; // z gets the resulting Morton Number.

for (int i = 0; i < sizeof(x) * CHAR_BIT; i++) // unroll for more speed...
{
  z |= (x & 1U << i) << i | (y & 1U << i) << (i + 1);
}
```

El entrelazado de bits (números de Morton) se usa a menudo para linearizar coordenadas enteras 2D: combinar `x` e `y` en un único entero que se puede comparar directamente y que tiene la propiedad de que, si dos puntos tienen coordenadas x e y cercanas, sus números de Morton normalmente también son cercanos.

---

### Entrelazar bits por tabla de consulta（Interleave bits by table lookup）

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

Si quieres más velocidad, puedes añadir otra tabla: predesplazar a la izquierda 1 bit los valores de `MortonTable256` para la consulta de `y`, reduciendo 2 operaciones, pero casi duplicando la memoria. También puedes hacer 4 tablas (dos de ellas predesplazadas 16 bits), bajando el total a 11 operaciones.

---

### Entrelazar bits con multiplicación de 64 bits（Interleave bits with 64-bit multiply）

El método siguiente entrelaza dos bytes (no `unsigned short`) en 11 operaciones. Pero muchas de esas operaciones son multiplicaciones de 64 bits, así que no es apto para todas las máquinas. Las entradas `x` y `y` deben ser menores que 256.

Holger Bettag, inspirado por la inversión de bits por multiplicación en este documento, sugirió añadir este truco el 10 de octubre de 2004.

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

### Entrelazar bits con Números Mágicos Binarios（Interleave bits by Binary Magic Numbers）

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

## Probar rangos de bytes en una palabra (y contar ocurrencias)（Testing for ranges of bytes in a word）

### Determinar si una palabra tiene un byte cero（Determine if a word has a zero byte）

```c
// Fewer operations:
unsigned int v; // 32-bit word to check if any 8-bit byte in it is 0
bool hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
```

Esta forma es útil para “copias rápidas de strings por palabra”; solo usa 5 operaciones. En cambio, los métodos evidentes siguientes requieren al menos 7 operaciones y hasta 12.

```c
// More operations:
bool hasNoZeroByte = ((v & 0xff) && (v & 0xff00) && (v & 0xff0000) && (v & 0xff000000))
// OR:
unsigned char * p = (unsigned char *) &v;
bool hasNoZeroByte = *p && *(p + 1) && *(p + 2) && *(p + 3);
```

También puedes hacer una precomprobación más rápida (4 operaciones) para detectar “posible byte cero”. Esta prueba da falsos positivos cuando el byte más alto es `0x80`, así que si da positivo, puedes verificar con la versión más fiable para mejorar el rendimiento general manteniendo la corrección.

```c
bool hasZeroByte = ((v + 0x7efefeff) ^ ~v) & 0x81010100;
if (hasZeroByte) // or may just have 0x80 in the high byte
{
  hasZeroByte = ~((((v & 0x7F7F7F7F) + 0x7F7F7F7F) | v) | 0x7F7F7F7F);
}
```

Hay un método aún más rápido: usar `hasless(v, 1)` definido más abajo; solo requiere 4 operaciones y no necesita verificación posterior. Puede simplificarse a:

```c
#define haszero(v) (((v) - 0x01010101UL) & ~(v) & 0x80808080UL)
```

Aquí, `(v - 0x01010101UL)` provoca un préstamo en el bit alto de un byte cuando el byte es 0 o mayor que `0x80`; `~v & 0x80808080UL` selecciona los bytes cuyo bit alto no está a 1 (es decir, < 0x80); el AND de ambos deja las posiciones donde el byte es exactamente 0.

Paul Messmer propuso el 2 de octubre de 2004 la mejora de la precomprobación más rápida. Juha Järvi sugirió `haszero` el 6 de abril de 2005 (lo vio en Assembly Lab de Paul Hsieh; anteriormente apareció en un post de Alan Mycroft en grupos de noticias el 27 de abril de 1987).

---

### Determinar si una palabra tiene un byte igual a n（Determine if a word has a byte equal to n）

Si queremos saber si una palabra contiene algún byte igual a un valor dado, podemos hacer XOR entre `x` y una palabra con todos sus bytes rellenos con n: si son iguales, ese byte quedará en 0 tras el XOR; si no, será no cero. Luego pasamos el resultado a `haszero`.

```c
#define hasvalue(x,n) \
(haszero((x) ^ (~0UL/255 * (n))))
```

Stephen M Bennet sugirió añadir este truco el 13 de diciembre de 2009.

---

### Determinar si una palabra tiene un byte menor que n（Determine if a word has a byte less than n）

Comprueba si una palabra `x` contiene algún byte sin signo que cumpla `< n`. En particular, cuando `n=1`, sirve para detectar bytes 0 (comprobando un long cada vez), o para enmascarar con XOR y detectar cualquier byte. Si `n` es constante, solo requiere 4 operaciones aritmético/lógicas.

Requisitos: `x >= 0`; `0 <= n <= 128`

```c
#define hasless(x,n) (((x)-~0UL/255*(n))&~(x)&~0UL/255*128)
```

Para contar cuántos bytes de `x` son menores que n (7 operaciones):

```c
#define countless(x,n) \
(((~0UL/255*(127+(n))-((x)&~0UL/255*127))&~(x)&~0UL/255*128)/128%255)
```

Juha Järvi me envió este ingenioso método el 6 de abril de 2005. Sean Anderson, inspirado por ello, añadió las macros el 10 de abril de 2005 (y también `hasmore/countmore`, etc., más abajo).

---

### Determinar si una palabra tiene un byte mayor que n（Determine if a word has a byte greater than n）

Comprueba si una palabra `x` contiene algún byte sin signo que cumpla `> n`. Si n es constante, solo requiere 3 operaciones.

Requisitos: `x >= 0`; `0 <= n <= 127`

```c
#define hasmore(x,n) (((x)+~0UL/255*(127-(n))|(x))&~0UL/255*128)
```

Para contar cuántos bytes de `x` son mayores que n (6 operaciones):

```c
#define countmore(x,n) \
(((((x)&~0UL/255*127)+~0UL/255*(127-(n))|(x))&~0UL/255*128)/128%255)
```

---

### Determinar si una palabra tiene un byte entre m y n（Determine if a word has a byte between m and n）

Cuando `m < n`, este truco comprueba si una palabra `x` contiene algún byte sin signo que cumpla `m < value < n`. Si m y n son constantes, requiere 7 operaciones.

Nota: `likelyhasbetween` puede reportar falsos positivos para bytes “igual a n”, así que si necesitas exactitud estricta, hay que verificar byte a byte.

Requisitos: `x >= 0`; `0 <= m <= 127`; `0 <= n <= 128`

```c
#define likelyhasbetween(x,m,n) \
((((x)-~0UL/255*(n))&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

Una variante con 1 operación más (8 en total) pero que da una respuesta exacta es:

```c
#define hasbetween(x,m,n) \
((~0UL/255*(127+(n))-((x)&~0UL/255*127)&~(x)&((x)&~0UL/255*127)+~0UL/255*(127-(m)))&~0UL/255*128)
```

Para contar cuántos bytes están entre m y n (intervalo abierto) (10 operaciones):

```c
#define countbetween(x,m,n) (hasbetween(x,m,n)/128%255)
```

---

## Calcular la siguiente permutación de bits en orden lexicográfico（Compute the lexicographically next bit permutation）

Supón que un entero tiene N bits a 1 y queremos la siguiente permutación que también contiene N unos, en sentido “lexicográfico”. Por ejemplo, con N=3 y el patrón `00010011`, las siguientes serían `00010101`, `00010110`, `00011001`, `00011010`, `00011100`, `00100011`… etc. A continuación se muestra un método rápido para calcular la siguiente permutación.

El compilador GNU C en x86 tiene la función builtin `__builtin_ctz(v)` que devuelve el número de ceros al final. En MSVC (x86), el intrinsic equivalente es `_BitScanForward`. Ambos generan la instrucción `bsf`. Otras arquitecturas pueden tener instrucciones similares; si no, puedes usar uno de los métodos de trailing zeros anteriores.

```c
unsigned int v; // current permutation of bits
unsigned int w; // next permutation of bits

unsigned int t = v | (v - 1); // t gets v's least significant 0 bits set to 1
// Next set to 1 the most significant bit to change,
// set to 0 the least significant ones, and add the necessary 1 bits.
w = (t + 1) | (((~t & -~t) - 1) >> (__builtin_ctz(v) + 1));
```

Aquí hay otra versión, normalmente más lenta porque incluye división, pero no necesita contar trailing zeros:

```c
unsigned int t = (v | (v - 1)) + 1;
w = t | ((((t & -t) / (v & -v)) >> 1) - 1);
```

Gracias a Dario Sneidermanis (Argentina), que aportó este método el 28 de noviembre de 2009.

---

También hay disponible una traducción al bielorruso (aportada por Webhostingrating).
