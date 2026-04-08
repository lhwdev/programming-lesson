# Killer Cases Expansion

## int_converter
- **Case 1 (Overflow to Inf):** 
  - **Input:** `131072` ($2^{17}$)
  - **Expected `hpfp` Output:** `0111110000000000` (`+Inf`, 0x7C00)
- **Case 2 (Exact Negative Power of Two):**
  - **Input:** `-16384`
  - **Expected `hpfp` Output:** `1111010000000000` (0xF800)
- **Case 3 (Precision Loss Mapping):**
  - **Input:** `2049`
  - **Expected `hpfp` Output:** `0110100000000000` (`2048`, 0x6800)
- **Case 4 (Zero Mapping):**
  - **Input:** `0`
  - **Expected `hpfp` Output:** `0000000000000000` (+0.0, 0x0000)

## hpfp_to_int_converter
- **Case 1 (Infinity Bounds):**
  - **Input:** `0111110000000000` (`+Inf`, 0x7C00)
  - **Expected Integer Output:** `2147483647` (`INT_MAX`)
- **Case 2 (Standard Positive Mapping):**
  - **Input:** `0110101000000000` (0x6A00, $1.5 \times 2^{11}$)
  - **Expected Integer Output:** `3072`
- **Case 3 (Fraction Truncation):**
  - **Input:** `0011110000000000` (0x3C00, 1.0)
  - **Expected Integer Output:** `1`
- **Case 4 (Complete Underflow):**
  - **Input:** `0000001000000000` (0x0200, $2^{-15}$)
  - **Expected Integer Output:** `0`

## float_converter
- **Case 1 (Subnormal implicit-1 mapping):**
  - **Input:** `0.000030517578125` ($2^{-15}$)
  - **Expected `hpfp` Output:** `0000001000000000` (0x0200)
- **Case 2 (Exact Maximum Boundary):**
  - **Input:** `65504.0f`
  - **Expected `hpfp` Output:** `0111101111111111` (`Max Normal`, 0x7BFF)
- **Case 3 (NaN Pass-through):**
  - **Input:** `NAN` Float Constant
  - **Expected `hpfp` Output:** `0111111000000000` (`NaN`, 0x7E00)
- **Case 4 (Float underflow cut-off):**
  - **Input:** `0.0000000298023223876953125` ($2^{-25}$)
  - **Expected `hpfp` Output:** `0000000000000000` (`+0.0`, 0x0000)

## hpfp_to_float_converter
- **Case 1 (Subnormal float reconstruction):**
  - **Input:** `0000001000000000` (0x0200)
  - **Expected Float Output:** `0.000030517578125`
- **Case 2 (Negative Infinity):**
  - **Input:** `1111110000000000` (0xFC00, `-Inf`)
  - **Expected Float Output:** `-INFINITY`
- **Case 3 (Exact standard representation):**
  - **Input:** `0100000000000000` (0x4000, 2.0)
  - **Expected Float Output:** `2.0`
- **Case 4 (Negative Zero preservation):**
  - **Input:** `1000000000000000` (0x8000, -0.0)
  - **Expected Float Output:** `-0.0`

## addition_function
- **Case 1 (Opposite Infinity Cancellation):**
  - **Input A:** `0111110000000000` (`+Inf`, 0x7C00)
  - **Input B:** `1111110000000000` (`-Inf`, 0xFC00)
  - **Expected Output:** `0111111000000000` (`NaN`, 0x7E00)
- **Case 2 (Exact cancellation):**
  - **Input A:** `0011110000000000` (`1.0`, 0x3C00)
  - **Input B:** `1011110000000000` (`-1.0`, 0xBC00)
  - **Expected Output:** `0000000000000000` (`+0.0`, 0x0000)
- **Case 3 (Round-to-Odd via sticky bit):**
  - **Input A:** `0011110000000000` (`1.0`, 0x3C00)
  - **Input B:** `0001000000000000` (`2^-11`, 0x1000)
  - **Expected Output:** `0011110000000001` (0x3C01)
- **Case 4 (NaN persistence limit):**
  - **Input A:** `0111111000000000` (`NaN`, 0x7E00)
  - **Input B:** `0100000000000000` (`2.0`, 0x4000)
  - **Expected Output:** `0111111000000000` (`NaN`, 0x7E00)

## multiply_function
- **Case 1 (Zero times Infinity):**
  - **Input A:** `0000000000000000` (`+0.0`, 0x0000)
  - **Input B:** `1111110000000000` (`-Inf`, 0xFC00)
  - **Expected Output:** `0111111000000000` (`NaN`, 0x7E00)
- **Case 2 (Denormal creation):**
  - **Input A:** `0000010000000000` (`2^-14`, 0x0400)
  - **Input B:** `0011100000000000` (`2^-1`, 0x3800)
  - **Expected Output:** `0000001000000000` (0x0200)
- **Case 3 (Max overflow limits):**
  - **Input A:** `0111101111111111` (0x7BFF)
  - **Input B:** `0100000000000000` (0x4000)
  - **Expected Output:** `0111110000000000` (`+Inf`, 0x7C00)
- **Case 4 (Negative Cancellation Mapping):**
  - **Input A:** `1100000000000000` (`-2.0`, 0xC000)
  - **Input B:** `1100000000000000` (`-2.0`, 0xC000)
  - **Expected Output:** `0100010000000000` (`4.0`, 0x4400)

## comparison_function
- **Case 1 (Negative Magnitudes):**
  - **Input A:** `1100000000000000` (`-2.0`, 0xC000)
  - **Input B:** `1011110000000000` (`-1.0`, 0xBC00)
  - **Expected Output:** `<`
- **Case 2 (Signed Zeros):**
  - **Input A:** `0000000000000000` (`+0.0`, 0x0000)
  - **Input B:** `1000000000000000` (`-0.0`, 0x8000)
  - **Expected Output:** `=`
- **Case 3 (NaN comparisons):**
  - **Input A:** `0111111000000000` (`NaN`, 0x7E00)
  - **Input B:** `0111111000000000` (`NaN`, 0x7E00)
  - **Expected Output:** `=`
- **Case 4 (Subnormal values comparisons):**
  - **Input A:** `0000001000000000` (`2^-15`, 0x0200)
  - **Input B:** `0000010000000000` (`2^-14`, 0x0400)
  - **Expected Output:** `<`

## hpfp_to_bits_converter
- **Case 1 (All Zeros bounds):**
  - **Input:** `0000000000000000` (+0.0)
  - **Expected String:** `"0000000000000000"`
- **Case 2 (All Ones bounds):**
  - **Input:** `1111111111111111` (-NaN)
  - **Expected String:** `"1111111111111111"`
- **Case 3 (+Inf mapping):**
  - **Input:** `0111110000000000` (+Inf, 0x7C00)
  - **Expected String:** `"0111110000000000"`
- **Case 4 (-2.0 mapping):**
  - **Input:** `1100000000000000` (-2.0, 0xC000)
  - **Expected String:** `"1100000000000000"`

## float_flipper
- **Case 1 (Zero to flipped NaN array check):**
  - **Input:** `0.0f`
  - **Expected Float Output:** `NAN` (Tests against math.h isnan limit properties)
- **Case 2 (2.0 flipped logic mappings):**
  - **Input:** `2.0f`
  - **Expected Float Output:** `-1.9990234375` (Due to precision loss and signed bit-flip constraints)
- **Case 3 (-2.0 mapped representations limits):**
  - **Input:** `-2.0f`
  - **Expected Float Output:** `1.9990234375`
- **Case 4 (+Inf subnormal evaluation boundary bounds):**
  - **Input:** `INFINITY`
  - **Expected Float Output:** `-0.00006097555` (~ $-1023/1024 \times 2^{-14}$)
