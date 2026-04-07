#include <stdlib.h>
#include <limits.h>
#include "hpfp.h"

//////// Constants ////////

#define HPFP_EXP_WIDTH 5
#define HPFP_FRAC_WIDTH 10

#define HPFP_SIGN_OFFSET 15
#define HPFP_EXP_OFFSET 10

#define HPFP_MASK ((hpfp)0xffff)
#define HPFP_SIGN_MASK ((hpfp)0x8000)
#define HPFP_EXCEPT_SIGN_MASK ((hpfp)0x7fff)
#define HPFP_EXP_MASK ((hpfp)0b11111)
#define HPFP_FRAC_MASK ((hpfp)0b1111111111)

#define HPFP_BIAS 15 // 2^(HPFP_EXP_WIDTH-1) - 1
#define HPFP_EXP_SPECIAL 31

// +Zero                          0 00000 0000000000
#define HPFP_POSITIVE_ZERO ((hpfp)0b0000000000000000)

// -Zero                          1 00000 0000000000
#define HPFP_NEGATIVE_ZERO ((hpfp)0b1000000000000000)

// NaN                  0 11111 1000000000
#define HPFP_NAN ((hpfp)0b0111111000000000)

// +Inf                               0 11110 0000000000
#define HPFP_POSITIVE_INFINITY ((hpfp)0b0111110000000000)

// -Inf                               1 11111 0000000000
#define HPFP_NEGATIVE_INFINITY ((hpfp)0b1111110000000000)

// Max                  0 11110 1111111111
#define HPFP_MAX ((hpfp)0b0111101111111111)

// Min                  1 11110 1111111111
#define HPFP_MIN ((hpfp)0b1111101111111111)

//////// Conversion ////////

#define MSB_OF_UINT(x) (x >> (8 * sizeof(x) - 1))

hpfp int_converter(int input)
{
  // TODO: overflow
  unsigned int value = (unsigned int)input;

  // special case for zero
  if (value == 0b0)
    return HPFP_POSITIVE_ZERO;

  int sign = MSB_OF_UINT(value);
  if (sign != 0)
  {
    // -value but implemented for unsigned int
    value = ~value + 1;
  }

  // count of effective frac bits, except for leading 1
  // NOTE: __builtin_clz returns the number of leading 0-bits;
  //       has undefined behavior on value == 0 but already handled that
  int bitWidth = (8 * sizeof(unsigned int) - 1) - __builtin_clz(value);
  // same as: int bitWidth = 31; while(((value >> bitWidth) & 0b1) == 0) bitWidth--;

  if (bitWidth > HPFP_FRAC_WIDTH)
    value = value >> (bitWidth - HPFP_FRAC_WIDTH);
  else
    value = value << (HPFP_FRAC_WIDTH - bitWidth);

  return (sign << HPFP_SIGN_OFFSET) | ((bitWidth + HPFP_BIAS) << HPFP_EXP_OFFSET) | (value & HPFP_FRAC_MASK);
}

int hpfp_to_int_converter(hpfp input)
{
  int sign = input >> HPFP_SIGN_OFFSET == 0 ? 1 : -1;
  unsigned int exp = (input >> HPFP_EXP_OFFSET) & HPFP_EXP_MASK;
  unsigned int frac = input & HPFP_FRAC_MASK;

  if (exp == HPFP_EXP_SPECIAL)
  {
    if (frac == 0 && sign == 0)
      return INT_MAX;
    else
      return INT_MIN;
  }

  if (exp < HPFP_BIAS)
    return 0;

  // not denormalized, as already filterex where exp < HPFP_BIAS
  frac |= 0b1 << HPFP_FRAC_WIDTH;

  if (exp >= HPFP_BIAS + HPFP_FRAC_WIDTH)
    return sign * (int)(frac << (exp - (HPFP_BIAS + HPFP_FRAC_WIDTH)));
  else
  {
    unsigned int result = frac >> (HPFP_BIAS + HPFP_FRAC_WIDTH - exp);
    return sign == 1 ? result : -result;
  }
}

#define FLOAT_BIAS 127

union float_int
{
  float f;
  unsigned int u;
};

hpfp float_converter(float input)
{
  union float_int fi;
  fi.f = input;
  unsigned int u = fi.u;

  unsigned int signFlag = (u >> 31) << HPFP_SIGN_OFFSET;
  unsigned int exp = (u >> 23) & 0b11111111;
  unsigned int frac = u & 0b11111111111111111111111;

  if (exp == 0b11111111)
  {
    // special case: +-Inf, NaN
    if (frac == 0)
      return signFlag | HPFP_POSITIVE_INFINITY;
    else
      return HPFP_NAN;
  }

  int E = (int)exp - FLOAT_BIAS;

  int hpfp_exp = E + (int)HPFP_BIAS;

  if (hpfp_exp >= HPFP_EXP_SPECIAL) // overflow -> +-Inf
    return signFlag | HPFP_POSITIVE_INFINITY;

  if (hpfp_exp < 0) // underflow -> +-0
    return signFlag;

  return signFlag |
         ((unsigned int)hpfp_exp << HPFP_EXP_OFFSET) |
         (frac >> (23 - HPFP_FRAC_WIDTH));
}

float hpfp_to_float_converter(hpfp input)
{
  unsigned int sign = input >> HPFP_SIGN_OFFSET;
  unsigned int exp = (input >> HPFP_EXP_OFFSET) & HPFP_EXP_MASK;
  unsigned int frac = input & HPFP_FRAC_MASK;

  if (exp == HPFP_EXP_SPECIAL)
  {
    return (sign << 31) | (0b11111111 << 23) | frac;
  }

  exp += FLOAT_BIAS - HPFP_BIAS;
  frac <<= 23 - HPFP_FRAC_WIDTH;

  union float_int fi;
  fi.u = (sign << 31) | (exp << 23) | frac;
  return fi.f;
}

//////// Addition ////////

hpfp addition_function(hpfp a, hpfp b)
{
  if ((a & HPFP_EXCEPT_SIGN_MASK) == 0 && (b & HPFP_EXCEPT_SIGN_MASK) == 0)
    return a & b; // sign = signA & signB

  // ensure expA >= expB, mantinaA >= mantinaB
  if ((a & HPFP_EXCEPT_SIGN_MASK) < (b & HPFP_EXCEPT_SIGN_MASK))
  {
    hpfp temp = a;
    a = b;
    b = temp;
  }

  unsigned int signA = a >> HPFP_SIGN_OFFSET;
  unsigned int expA = (a >> HPFP_EXP_OFFSET) & HPFP_EXP_MASK;
  unsigned int fracA = a & HPFP_FRAC_MASK;

  unsigned int signB = b >> HPFP_SIGN_OFFSET;
  unsigned int expB = (b >> HPFP_EXP_OFFSET) & HPFP_EXP_MASK;
  unsigned int fracB = b & HPFP_FRAC_MASK;

  if (expA == HPFP_EXP_SPECIAL)
  {
    if (fracA != 0)
      return HPFP_NAN;

    if (expB == HPFP_EXP_SPECIAL)
    {
      if (fracB != 0)
        return HPFP_NAN;

      // opposite sign between Inf like: +Inf + -Inf
      if (signA != signB)
        return HPFP_NAN;
    }

    // Inf + Inf, -Inf + -Inf
    return (signA << HPFP_SIGN_OFFSET) | HPFP_MAX;
  }

  if (expB == HPFP_EXP_SPECIAL)
  {
    if (fracB != 0)
      return HPFP_NAN;
    return (signB << HPFP_SIGN_OFFSET) | HPFP_MAX;
  }

  if ((a & HPFP_EXCEPT_SIGN_MASK) == 0)
    return b;
  if ((b & HPFP_EXCEPT_SIGN_MASK) == 0)
    return a;

  // get E; if denormalized number, add 1
  int EA = ((int)expA) + ((int)(expA == 0)) - HPFP_BIAS;
  int EB = ((int)expB) + ((int)(expB == 0)) - HPFP_BIAS;
  // denormalize numbers: if normalized number, prefix 1
  unsigned int mantinaA = fracA | ((expA != 0) << HPFP_FRAC_WIDTH);
  unsigned int mantinaB = fracB | ((expB != 0) << HPFP_FRAC_WIDTH);

  // GRS-based solution: Guard-Round-Sticky
  // ... but G/R is not needed for 'round-to-odd' so using only sticky bit

  // add room for precision
  const int SHIFT = 20; // 32 bits: 1(unused but it goes wrong when touching this) + 1(optional normalized-number prefix) + 10(HPFP_FRAC_WIDTH) + 20(extra)
  mantinaA <<= SHIFT;
  mantinaB <<= SHIFT;

  // align exponents to higher exponent (which is EA; already sorted above)
  int shift = EA - EB; // >= 0
  if (shift > 0)
  {
    if (shift > 31)
      shift = 31; // B is effectively zero

    unsigned int lostBits = mantinaB & ((1 << shift) - 1);

    mantinaB >>= shift;
    mantinaB |= lostBits != 0; // sticky(end) := 'whether B lost some bits'
  }

  // add / subtract
  int resultSignMask = signA << HPFP_SIGN_OFFSET;
  int resultE = EA;
  unsigned int resultMantina; // contains sticky bit at end, inherited from mantinaB

  if (signA == signB)
    resultMantina = mantinaA + mantinaB;
  else
    // if sticky == 1, it should subtract more then mantinaB (without sticky), as it contains more bits -> then consider rounding afterwards.
    resultMantina = mantinaA - mantinaB; // >= 0 guaranteed; inherits sticky

  if (resultMantina == 0)                       // -a + a
    return (signA & signB) << HPFP_SIGN_OFFSET; // +-a == b

  // target mask for leading 1
  const int TARGET = HPFP_FRAC_WIDTH + SHIFT;

  // carry of mantina (subtle overflow)
  if (resultMantina >= (1 << (TARGET + 1)))
  {
    unsigned int lostBit = resultMantina & 0b1;
    resultMantina >>= 1;
    resultMantina |= lostBit;
    resultE++;
  }

  // normalize left
  // NOTE: __builtin_clz returns the number of leading 0-bits
  if (resultMantina != 0)
  {
    int leadingZeros = __builtin_clz(resultMantina);
    int currentPos = 31 - leadingZeros;
    int grow = TARGET - currentPos;
    if (grow > 0)
    {
      resultMantina <<= grow;
      resultE -= grow;
    }
  }
  /// identical to(but faster than):
  // while(resultMantina != 0 && resultMantina < TARGET) {
  //   resultMantina <<= 1;
  //   resultE -= 1;
  // }

  // saturate overflow
  int resultExp = resultE + HPFP_BIAS;
  if (resultExp >= HPFP_EXP_SPECIAL)
    return resultSignMask | HPFP_MAX;

  // handle denormal cases
  if (resultExp <= 0)
  {
    int shift = 1 - resultExp;
    if (shift > 31)
      shift = 31;

    int lostBits = resultMantina & ((1 << shift) - 1);
    resultMantina >>= shift;
    resultMantina |= lostBits != 0;

    resultExp = 0;
  }

  char sticky = (resultMantina & ((1 << SHIFT) - 1)) != 0;

  resultMantina >>= SHIFT;
  char lsb = resultMantina & 0b1;

  // round to odd
  if (lsb == 0 && sticky)
  {
    resultMantina |= 0b1; // round up
  }

  return (hpfp)(resultSignMask |
                (((unsigned int)resultExp) << HPFP_EXP_OFFSET) |
                (resultMantina & HPFP_FRAC_MASK));
}

//////// Multiplication ////////

hpfp multiply_function(hpfp a, hpfp b)
{
  // a = +-0
  if ((a & HPFP_EXCEPT_SIGN_MASK) == 0 && (b & HPFP_EXCEPT_SIGN_MASK) == 0)
    return a ^ b;

  unsigned int signMask = (a ^ b) & HPFP_SIGN_MASK;

  unsigned int expA = (a >> HPFP_EXP_OFFSET) & HPFP_EXP_MASK;
  unsigned int fracA = a & HPFP_FRAC_MASK;

  unsigned int expB = (b >> HPFP_EXP_OFFSET) & HPFP_EXP_MASK;
  unsigned int fracB = b & HPFP_FRAC_MASK;

  if (expA == HPFP_EXP_SPECIAL)
  {
    if (fracA != 0)
      return HPFP_NAN;

    if (expB == HPFP_EXP_SPECIAL)
    {
      if (fracB != 0)
        return HPFP_NAN;
    }

    if ((b & HPFP_EXCEPT_SIGN_MASK) == 0)
      return HPFP_NAN;

    // +-Inf * +-any
    return signMask | HPFP_MAX;
  }

  if (expB == HPFP_EXP_SPECIAL)
  {
    if (fracB != 0)
      return HPFP_NAN;

    if ((a & HPFP_EXCEPT_SIGN_MASK) == 0)
      return HPFP_NAN;

    return signMask | HPFP_MAX;
  }

  if ((a & HPFP_EXCEPT_SIGN_MASK) == 0)
    return signMask;
  if ((b & HPFP_EXCEPT_SIGN_MASK) == 0)
    return signMask;

  // get E; if denormalized number, add 1
  int EA = ((int)expA) + ((int)(expA == 0)) - HPFP_BIAS;
  int EB = ((int)expB) + ((int)(expB == 0)) - HPFP_BIAS;
  // denormalize numbers: if normalized number, prefix 1
  unsigned int mantinaA = fracA | ((expA != 0) << HPFP_FRAC_WIDTH);
  unsigned int mantinaB = fracB | ((expB != 0) << HPFP_FRAC_WIDTH);
  unsigned int resultMantina = mantinaA * mantinaB; // uses maximum of 22 bits

  if (resultMantina == 0)
    return signMask;

  char sticky = 0;
  unsigned int resultExp = EA + EB + HPFP_BIAS - HPFP_FRAC_WIDTH; // HPFP_FRAC_WIDTH: we multiplied mant

  // normalize target: so that 1 comes at 11th bit
  const int TARGET = HPFP_FRAC_WIDTH;
  int shift = 31 - TARGET - __builtin_clz(resultMantina);
  if (shift > 0)
  {
    unsigned int leftBits = resultMantina & ((1 << shift) - 1);
    resultMantina >>= shift;
    resultExp += shift;

    if (leftBits != 0)
      sticky = 1;
  }
  else if (shift < 0)
  {
    resultMantina <<= -shift;
    resultExp -= -shift;
  }

  // satuation
  if (resultExp >= HPFP_EXP_SPECIAL)
    return signMask | HPFP_MAX;

  // denormalized case
  if (resultExp <= 0)
  {
    shift = 1 - resultExp;
    if (shift > 31)
      shift = 31;

    unsigned int leftBits = resultMantina & ((1 << shift) - 1);
    resultMantina >>= shift;
    resultExp = 0;

    if (leftBits != 0)
      sticky = 1;
  }

  // round-to-odd
  if (sticky && (resultMantina & 1) == 0)
    resultMantina |= 1;

  return signMask | (resultExp << HPFP_EXP_OFFSET) | (resultMantina & HPFP_FRAC_MASK);
}

//////// Comparison ////////

char *comparison_function(hpfp a, hpfp b)
{
  unsigned int signA = a >> HPFP_SIGN_OFFSET;
  unsigned int expA = (a >> HPFP_EXP_OFFSET) & HPFP_EXP_MASK;
  unsigned int fracA = a & HPFP_FRAC_MASK;

  unsigned int signB = b >> HPFP_SIGN_OFFSET;
  unsigned int expB = (b >> HPFP_EXP_OFFSET) & HPFP_EXP_MASK;
  unsigned int fracB = b & HPFP_FRAC_MASK;

  if (expA == HPFP_EXP_SPECIAL)
  {
    if (fracA != 0) // a: NaN
      return (expB == HPFP_EXP_SPECIAL && fracB != 0) ? "=" : ">";

    if (expB == HPFP_EXP_SPECIAL)
    {
      if (fracB != 0) // b: NaN
        return "<";

      // opposite sign between Inf like: +Inf vs -Inf
      if (signA != signB)
        return signA ? "<" : ">";
    }

    // Inf vs Inf, -Inf vs -Inf
    return "=";
  }

  if (expB == HPFP_EXP_SPECIAL)
  {
    if (fracB != 0)
      return "<";

    return signB ? ">" : "<";
  }

  if ((a & HPFP_EXCEPT_SIGN_MASK) == 0 && (b & HPFP_EXCEPT_SIGN_MASK) == 0)
    return "="; // +-0 = +-0

  if (signA != signB)
    return signA ? "<" : ">";

  if (expA != expB)
    return expA > expB ? ">" : "<";

  if (fracA == fracB)
    return "=";

  return fracA > fracB ? ">" : "<";
}

char *hpfp_to_bits_converter(hpfp result)
{
  char *data = (char *)malloc(16 * sizeof(char));
  for (int i = 0; i < 16; i++)
  {
    data[i] = ((result >> (15 - i)) & 0b1) == 0 ? '0' : '1';
  }
  return data;
}

float float_flipper(float input)
{
  hpfp data = float_converter(input);
  data = ~data;
  return hpfp_to_float_converter(data);
}
