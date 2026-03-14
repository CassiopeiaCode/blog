---
title: Trucos de C++
description: >-
  Esta es una entrada clásica de blog de Codeforces, del autor HosseinYousefi,
  que abarca muchos trucos prácticos de programación en C++, incluyendo listas
  de inicialización, trucos de macros, funciones integradas, nuevas
  características de C++11 y más.
published: 2026-03-14T00:00:00.000Z
tags:
  - Algoritmos
  - C++
  - Codeforces
  - Trucos de programación
lang: es
abbrlink: cpp-tricks
translationKey: cpp-tricks
---

Veo que muchos programadores escriben el código así:

```cpp
pair<int, int> p;
vector<int> v;
p = make_pair(3, 4);
v.push_back(4); v.push_back(5);
```

En realidad, perfectamente se puede escribir así:

```cpp
pair<int, int> p;
vector<int> v;
p = {3, 4};
v = {4, 5};
```

## 1. Usar llaves `{}` para asignar valores a contenedores

Mucha gente escribe:

```cpp
pair<int, int> p;
p = make_pair(3, 4);
```

Pero se puede hacer así:

```cpp
pair<int, int> p;
p = {3, 4};
```

Los `pair` más complejos tampoco son problema:

```cpp
pair<int, pair<char, long long>> p;
p = {3, {'a', 8ll}};
```

¿Y otros contenedores como `vector`, `deque`, `set`, etc.? También aplica.

**Nota:** `stack` y `queue` **no admiten** esta forma.

## 2. Obtener el nombre del parámetro en una macro

Se puede usar el símbolo `#` para obtener la **cadena del nombre original** del parámetro pasado a la macro:

```cpp
#define what_is(x) cerr << #x << " is " << x << endl;
int a_variable = 376;
what_is(a_variable);       // imprime "a_variable is 376"
what_is(a_variable * 2 + 1) // imprime "a_variable * 2 + 1 is 753"
```

## 3. ¡Adiós a un montón de `#include`!

Usa directamente:

```cpp
#include <bits/stdc++.h>
```

Esta librería incluye casi todos los headers que se necesitan en competiciones, como `algorithm`, `iostream`, `vector`, etc. Créeme, ¡ya no necesitas incluir nada por separado!

## 4. Funciones ocultas (en realidad no están ocultas, solo se usan poco)

### I) `__gcd(value1, value2)`

No hace falta implementar el algoritmo de Euclides; usa esta función directamente para calcular el máximo común divisor de dos números.

Ej.: `__gcd(18, 27) = 9`

### II) `__builtin_ffs(x)`

Devuelve el índice + 1 del bit menos significativo (el 1 más a la derecha) de `x`. Si `x == 0`, devuelve 0. El tipo del parámetro es `int`; con sufijo `l` acepta `long`, y con sufijo `ll` acepta `long long`.

Ej.: `__builtin_ffs(10) = 2`, porque en binario 10 es `...1010`; el 1 más a la derecha está en el índice 1 (base 0), y la función devuelve 1+1=2.

### III) `__builtin_clz(x)`

Devuelve el **número de ceros a la izquierda** (leading zeros) de `x` empezando desde el bit más significativo. El parámetro es `unsigned int`; los sufijos `l`/`ll` análogamente. Cuando `x==0` el valor devuelto no está definido.

Ej.: `__builtin_clz(16) = 27`, porque 16 es `...10000`; `unsigned int` tiene 32 bits, así que 32-5=27.

### IV) `__builtin_ctz(x)`

Devuelve el **número de ceros al final** (trailing zeros) de `x` empezando desde el bit menos significativo. El parámetro es `unsigned int`; cuando `x==0` el valor devuelto no está definido.

Ej.: `__builtin_ctz(16) = 4`, porque 16 es `...10000` y tiene 4 ceros al final.

### V) `__builtin_popcount(x)`

Devuelve el **número de 1s** en la representación binaria de `x`. El parámetro es `unsigned int`; cuando `x==0` el valor devuelto no está definido.

Ej.: `__builtin_popcount(14) = 3`, porque 14 es `...1110` y tiene tres 1s.

> Nota: hay otras funciones `__builtin`, pero estas son las más comunes. Si te interesa, puedes buscarlas.

## 5. Funciones y macros con número variable de argumentos

Podemos escribir una función que acepte cualquier cantidad de enteros y devuelva su suma.

En C++14, se puede usar `auto sum(T a, Args... args)` para manejar sumas de tipos mixtos.

### Macro variádica:

```cpp
#define a_macro(args...) sum(args)
```

Combinado con plantillas variádicas, se puede escribir una función de depuración muy útil (gracias a Igorjan94):

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

Salida:

```
a = 4
b = 8
c = 9
```

Esta función es muy útil al depurar.

## 6. CF ya soporta C++0x, ¿por qué seguir usando C++ antiguo?

Las funciones variádicas son una característica nueva de C++11/C++0x. A continuación algunas funciones interesantes de C++11:

### I) Bucle for basado en rango (Range-based for-loop)

Forma antigua:

```cpp
set<int> s = {8, 2, 3, 1};
for (set<int>::iterator it = s.begin(); it != s.end(); ++it)
    cout << *it << ' ';
```

Forma nueva, mucho más concisa:

```cpp
set<int> s = {8, 2, 3, 1};
for (auto it: s)
    cout << it << ' ';
```

Si necesitas modificar el valor, usa `auto &`:

```cpp
vector<int> v = {8, 2, 3, 1};
for (auto &it: v)
    it *= 2;
```

### II) El poder de `auto`

Ya no necesitas escribir manualmente nombres de tipos complejos: el compilador los deduce automáticamente. Por ejemplo, para iterar sobre `set<pair<int, pair<int, int>>>`, antes había que escribir una cadena larguísima; ahora basta con `auto it = s.begin()`.

Además, `x.begin()` y `x.end()` ahora también pueden escribirse como `begin(x)` y `end(x)`.

## Consejos adicionales de los comentarios

### Salto de línea inteligente

Aporte de un comentario de Ximera:

Este código:

```cpp
for(i = 1; i <= n; i++) {
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " ";
    cout << "\n";
}
```

Es equivalente a:

```cpp
for(i = 1; i <= n; i++)
    for(j = 1; j <= m; j++)
        cout << a[i][j] << " \n"[j == m];
```

Idea: `" \n"` es un `char*`; `" \n"[0]` es un espacio `' '`, y `" \n"[1]` es un salto de línea `'\n'`.

### Uso de `tie` y `emplace_back`

Aporte de un comentario de tubo28:

La razón por la que `emplace_back` es más rápido que `push_back`: `emplace_back` **construye** el objeto **en el lugar** directamente al final del vector; mientras que `push_back` primero construye en otro lugar y luego lo mueve dentro.

`tie` también soporta la palabra clave `ignore` para **ignorar un valor**:

```cpp
tuple<int, int, int, char> t (3, 4, 5, 'g');
int a, b;
tie(b, ignore, a, ignore) = t;
cout << a << ' ' << b << '\n';
// imprime: 5 3
```

El autor también compartió una macro de recorrido bidireccional:

```cpp
#define rep(i, begin, end) for (__typeof(end) i = (begin) - ((begin) > (end)); i != (end) - ((begin) > (end)); i += 1 - 2 * ((begin) > (end)))
```

Ventajas: no hay que especificar el tipo; según la condición `begin > end` decide automáticamente si recorre hacia adelante o hacia atrás.

- `rep(i, 1, 10)` → 1, 2, ..., 9
- `rep(i, 10, 1)` → 9, 8, ..., 1

También se puede usar con iteradores:

```cpp
vector<int> v = {4, 5, 6, 4, 8};
rep(it, end(v), begin(v))
    cout << *it << ' ';
// imprime "8 4 6 5 4"
```

### Funciones lambda

C++11 también introdujo las funciones lambda, con la siguiente sintaxis:

```
[lista de captura](lista de parámetros) -> tipo de retorno { cuerpo de la función }
```

- Lista de captura: si no se necesita, se escribe `[]`
- Lista de parámetros: como `int x, string s`
- Tipo de retorno: en la mayoría de los casos se puede omitir
- Cuerpo de la función: se escribe normal

Ejemplo:

```cpp
auto f = [] (int a, int b) -> int { return a + b; };
cout << f(1, 2); // imprime "3"
```

Se puede usar en funciones STL como `sort`, `for_each`, etc.:

```cpp
vector<int> v = {3, 1, 2, 1, 8};
sort(begin(v), end(v), [] (int a, int b) { return a > b; });
// imprime: 8 3 2 1 1
```

### Uso de `move`

Aporte de un comentario de Igorjan94:

Al trabajar con contenedores STL, puedes usar `move` para **mover** en lugar de copiar el contenedor, ahorrando mucho costo:

```cpp
vector<int> v = {1, 2, 3, 4};
vector<int> w = move(v);
// v ahora está vacío, w tiene el contenido original de v
```

## 7. Cadenas en C++0x

### I) Cadenas crudas (Raw Strings) (del comentario de IvayloS)

Definir una cadena cruda:

```cpp
string s = R"(Hello, World!)";
```

Las cadenas crudas **ignoran todos los caracteres de escape**, como `\n`, `\"`. También soportan cadenas multilínea; solo hay que añadir un separador personalizado:

```cpp
string r_str = R"(Dear Programmers,
I'm using C++11
Regards, Swift!)";
```

### II) Expresiones regulares (Regular Expressions)

C++11 soporta `regex`; se recomienda usarlo junto con cadenas crudas (porque en las regex suelen aparecer barras invertidas y otros caracteres especiales):

```cpp
regex email_pattern(R"(^[a-zA-Z0-9_.+-]+@[a-zA-Z0-9-]+\.[a-zA-Z0-9-.]+$)");
```

### III) Literales definidos por el usuario (User-defined literals)

Puedes definir tus propios sufijos literales, por ejemplo para conversión de unidades de longitud:

```cpp
long long operator "" _m(unsigned long long literal) { return literal; }
long double operator "" _cm(unsigned long long literal) { return literal / 100.0; }
long long operator "" _km(unsigned long long literal) { return literal * 1000; }

cout << 250_m;   // 250
cout << 12_km;   // 12000
cout << 421_cm;  // 4.21
```

El nombre del literal definido por el usuario debe comenzar con guion bajo `_`, y el tipo del parámetro solo puede ser uno de los siguientes: `const char *`, `unsigned long long int`, `long double`, `char`, etc.

---

**Enlace al original:** [Codeforces - C++ Tricks](https://codeforces.com/blog/entry/64793)

**Autor:** HosseinYousefi

**Traducción:** Recopilado por este sitio

**Etiquetas:** c++，c++0x，tricks

**Me gusta:** +971
