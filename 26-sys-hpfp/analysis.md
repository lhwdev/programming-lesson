# `int_converter`
**Defect: Does not handle integer overflow correctly**
The specification requires that conversion overflow out of the `hpfp` range produces `+-Inf`. The `hpfp` format has a 5-bit exponent field with a max normal exponent value of 30, meaning its maximum representable magnitude is strictly less than $2^{16}$. Any `int` with an absolute magnitude $\ge 2^{16}$ inherently overflows.
Your implementation dynamically extracts `bitWidth` which can be as much as 30 for `INT_MAX`. It then blindly evaluates `(bitWidth + HPFP_BIAS) << HPFP_EXP_OFFSET`. For values like 131072 ($2^{17}$, `bitWidth` = 17), `bitWidth + HPFP_BIAS = 32`. Left-shifting this flows `1` into the sign bit and zeroes the exponent, returning `-0` (`1 00000 0000000000`) instead of the correct result `+Inf` (`0 11111 0000000000`).
```text
# Killer Case for int_converter
FUNC: int_converter
INPUT_INT: 131072
EXPECTED: 0111110000000000
```
*(Your code will evaluate this to `-0`)*

# `comparison_function`
**Defect: Fails on comparison of strictly negative values**
When performing magnitude comparison where `signA == signB`, you immediately check `expA != expB` and evaluate `expA > expB ? ">" : "<"`. However, for completely negative numbers, the number with the larger magnitude is actually mathematically smaller. For instance, `-2` (which has a larger exponent) is strictly `<` than `-1` (which has a smaller exponent) but your code will output `>`!
```text
# Killer Case for comparison_function
FUNC: comparison_function
A: 1100000000000000
B: 1011110000000000
EXPECTED: <
```
*(`A` is -2.0, `B` is -1.0. Your code outputs `>`)*

# `float_converter`
**Defect: Fails to map small float values to `hpfp` denormalized numbers**
The `hpfp` format supports denormal numbers, which maps `exp = 0` to $E = 1 - \text{bias} = -14$. This means `hpfp` can represent values down to $2^{-14} \times 2^{-10} = 2^{-24}$.
However, your code does:
```c
if (hpfp_exp < 0) // underflow -> +-0
  return signFlag;
```
It immediately gives up on elements where `E < -15` (`hpfp_exp < 0`) instead of gracefully sliding the bits into the fraction component to generate denormal values. Furthermore, even if `E = -15` (meaning `hpfp_exp == 0`), doing `frac >> 13` treats it like a normalized integer conversion and completely forgets the implicitly dropped `1` bit of the original float, mapping a valid float of exactly $2^{-15}$ to `$0$`. 
```text
# Killer Case for float_converter
FUNC: float_converter
INPUT_FLOAT: 0.000030517578125
EXPECTED: 0000001000000000
```
*(Input is exactly $2^{-15}$, expected format is denormalized `hpfp`. Your code will produce positive zero)*

# `hpfp_to_float_converter`
**Defect: Erroneously maps `hpfp` denormals to normalized floats of wrong magnitude**
When converting from `hpfp` back to float, if the input is denormalized (`exp = 0` but `frac != 0`), the mathematically correct value is $0.\text{frac} \times 2^{-14}$. 
Your logic effectively just adds the float bias mapping, keeping it normalized: `exp += FLOAT_BIAS - HPFP_BIAS` evaluates to `112`, mapping the explicit `0` to a floated `-15` exponent, giving $E = -15$, generating the float magnitude: $1.\text{frac} \times 2^{-15}$. This drastically alters the value; for instance the `hpfp` denormal $2^{-15}$ will unexpectedly become $1.5 \times 2^{-15}$.
```text
# Killer Case for hpfp_to_float_converter
FUNC: hpfp_to_float_converter
INPUT: 0000001000000000
EXPECTED: 0.000030517578125
```
*(Input is `hpfp` representable $2^{-15}$. Your code will calculate it as 0.000045776... ($1.5 \times 2^{-15}$))*
