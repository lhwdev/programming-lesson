#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <math.h>
#include <limits.h>
#include "hpfp.c"

// Metrics recording limits
int tests_run = 0;
int tests_failed = 0;

// Binary formatting dumpers mapping
void print_hpfp_binary(hpfp value)
{
    for (int i = 15; i >= 0; i--)
    {
        printf("%d", (value >> i) & 1);
        if (i == 15 || i == 10)
            printf(" ");
    }
}

void print_float_binary(float value)
{
    unsigned int *u = (unsigned int *)&value;
    for (int i = 31; i >= 0; i--)
    {
        printf("%d", (*u >> i) & 1);
        if (i == 31 || i == 23)
            printf(" ");
    }
}

// Float bitwise struct
float cast_bits_to_float(unsigned int bits)
{
    float f;
    memcpy(&f, &bits, sizeof(float));
    return f;
}

// Equality verifications
#define assert_hpfp_equals(expected, actual, info) \
    do                                             \
    {                                              \
        tests_run++;                               \
        if ((expected) != (actual))                \
        {                                          \
            printf("[FAIL] %s\n", info);           \
            printf("  Expected: ");                \
            print_hpfp_binary(expected);           \
            printf(" (0x%04x)\n", expected);       \
            printf("  Actual:   ");                \
            print_hpfp_binary(actual);             \
            printf(" (0x%04x)\n\n", actual);       \
            tests_failed++;                        \
        }                                          \
        else                                       \
        {                                          \
            printf("[PASS] %s\n", info);           \
        }                                          \
    } while (0)

#define assert_int_equals(expected, actual, info) \
    do                                            \
    {                                             \
        tests_run++;                              \
        if ((expected) != (actual))               \
        {                                         \
            printf("[FAIL] %s\n", info);          \
            printf("  Expected: %d\n", expected); \
            printf("  Actual:   %d\n\n", actual); \
            tests_failed++;                       \
        }                                         \
        else                                      \
        {                                         \
            printf("[PASS] %s\n", info);          \
        }                                         \
    } while (0)

#define assert_float_equals(expected, actual, info)     \
    do                                                  \
    {                                                   \
        tests_run++;                                    \
        float exp_val = (expected);                     \
        float act_val = (actual);                       \
        unsigned int *exp_u = (unsigned int *)&exp_val; \
        unsigned int *act_u = (unsigned int *)&act_val; \
        if (*exp_u != *act_u)                           \
        {                                               \
            printf("[FAIL] %s\n", info);                \
            printf("  Expected: ");                     \
            print_float_binary(exp_val);                \
            printf(" (%.12f)\n", exp_val);              \
            printf("  Actual:   ");                     \
            print_float_binary(act_val);                \
            printf(" (%.12f)\n\n", act_val);            \
            tests_failed++;                             \
        }                                               \
        else                                            \
        {                                               \
            printf("[PASS] %s\n", info);                \
        }                                               \
    } while (0)

#define assert_string_equals_allocated(expected, actual_ptr, info) \
    do                                                             \
    {                                                              \
        tests_run++;                                               \
        char *act = (actual_ptr);                                  \
        if (strcmp((expected), act) != 0)                          \
        {                                                          \
            printf("[FAIL] %s\n", info);                           \
            printf("  Expected: '%s'\n", expected);                \
            printf("  Actual:   '%s'\n\n", act);                   \
            tests_failed++;                                        \
        }                                                          \
        else                                                       \
        {                                                          \
            printf("[PASS] %s\n", info);                           \
        }                                                          \
        free(act);                                                 \
    } while (0)

#define assert_string_equals(expected, actual, info) \
    do                                               \
    {                                                \
        tests_run++;                                 \
        if (strcmp((expected), (actual)) != 0)       \
        {                                            \
            printf("[FAIL] %s\n", info);             \
            printf("  Expected: '%s'\n", expected);  \
            printf("  Actual:   '%s'\n\n", actual);  \
            tests_failed++;                          \
        }                                            \
        else                                         \
        {                                            \
            printf("[PASS] %s\n", info);             \
        }                                            \
    } while (0)

#define assert_float_isnan(actual, info)     \
    do                                       \
    {                                        \
        tests_run++;                         \
        float act_val = (actual);            \
        if (!isnan(act_val))                 \
        {                                    \
            printf("[FAIL] %s\n", info);     \
            printf("  Expected: NaN\n");     \
            printf("  Actual:   ");          \
            print_float_binary(act_val);     \
            printf(" (%.12f)\n\n", act_val); \
            tests_failed++;                  \
        }                                    \
        else                                 \
        {                                    \
            printf("[PASS] %s\n", info);     \
        }                                    \
    } while (0)

int main()
{
    printf("===== Executing hpfp.c Exhaustive Scale Benchmark =====\n\n");

    printf("%d", hpfp_to_int_converter(int_converter(INT_MIN)));
    // 1. int_converter execution
    printf("--- testing int_converter ---\n");
    assert_hpfp_equals((hpfp)0x7c00, int_converter(131072), "Case 1: Overflow scales robustly limits to +Inf boundaries");
    assert_hpfp_equals((hpfp)0xF400, int_converter(-16384), "Case 2: Exact Negative Power constraint evaluates accurately");
    assert_hpfp_equals((hpfp)0x6800, int_converter(2049), "Case 3: Truncating fraction scales limits cleanly down bits");
    assert_hpfp_equals((hpfp)0x0000, int_converter(0), "Case 4: Fixed zero evaluations returns boundary null bits");

    // 2. hpfp_to_int_converter execution
    printf("\n--- testing hpfp_to_int_converter ---\n");
    assert_int_equals(INT_MAX, hpfp_to_int_converter((hpfp)0x7C00), "Case 1: Positive Infinity maps structurally natively toward INT_MAX limits");
    assert_int_equals(3072, hpfp_to_int_converter((hpfp)0x6A00), "Case 2: Fractional representations natively shift out correctly");
    assert_int_equals(1, hpfp_to_int_converter((hpfp)0x3C00), "Case 3: Precision mapping bounds evaluate exactly");
    assert_int_equals(0, hpfp_to_int_converter((hpfp)0x0200), "Case 4: Denormal fractions underflow structurally toward bounded zero limits");

    // 3. float_converter execution
    printf("\n--- testing float_converter ---\n");
    assert_hpfp_equals((hpfp)0x0200, float_converter(0.000030517578125f), "Case 1: Normalized elements properly implicit-shift mapped to subnormal spaces");
    assert_hpfp_equals((hpfp)0x7BFF, float_converter(65504.0f), "Case 2: Strict limit boundaries explicitly max valid outputs successfully");
    assert_hpfp_equals((hpfp)0x7E00, float_converter(NAN), "Case 3: C-level native generic NaN constants inherit fallback boundaries correctly");
    assert_hpfp_equals((hpfp)0x0000, float_converter(cast_bits_to_float(0x32800000)), "Case 4: Standard numeric representations dropping threshold clamp mapping towards exactly +0.0"); // 2^-25 float cast

    // 4. hpfp_to_float_converter execution
    printf("\n--- testing hpfp_to_float_converter ---\n");
    assert_float_equals(0.000030517578125f, hpfp_to_float_converter((hpfp)0x0200), "Case 1: Inverse subnormal logic efficiently shifts limits restoring baseline precision");
    assert_float_equals(-INFINITY, hpfp_to_float_converter((hpfp)0xFC00), "Case 2: Evaluation maps special bounds preserving structural values identically matching `-Inf`");
    assert_float_equals(2.0f, hpfp_to_float_converter((hpfp)0x4000), "Case 3: Exact representations explicitly resolve bounds limits clearly mapping native values");
    assert_float_equals(-0.0f, hpfp_to_float_converter((hpfp)0x8000), "Case 4: IEEE-754 structures accurately inherit sign limits scaling inverse zero boundaries identically");

    // 5. addition_function execution
    printf("\n--- testing addition_function ---\n");
    assert_hpfp_equals((hpfp)0x7E00, addition_function((hpfp)0x7C00, (hpfp)0xFC00), "Case 1: +Inf + (-Inf) equals NaN");
    assert_hpfp_equals((hpfp)0x0000, addition_function((hpfp)0x3C00, (hpfp)0xBC00), "Case 2: Exact numerical cancellation maps logically identical down +0.0");
    assert_hpfp_equals((hpfp)0x3C01, addition_function((hpfp)0x3C00, (hpfp)0x1000), "Case 3: Round-to-Odd parity shifted evaluated mapping edge bounds correctly by resolving sticky blocks");
    assert_hpfp_equals((hpfp)0x7E00, addition_function((hpfp)0x7E00, (hpfp)0x4000), "Case 4: Operands containing explicitly failed bounds natively force mapping limits cascading boundaries");

    // 6. multiply_function execution
    printf("\n--- testing multiply_function ---\n");
    assert_hpfp_equals((hpfp)0x7E00, multiply_function((hpfp)0x0000, (hpfp)0xFC00), "Case 1: (+0 * -Inf) triggers strictly mathematical NaN bindings");
    assert_hpfp_equals((hpfp)0x0200, multiply_function((hpfp)0x0400, (hpfp)0x3800), "Case 2: Valid mapped normalization explicitly inherits fraction boundaries identically across spaces");
    assert_hpfp_equals((hpfp)0x7BFF, multiply_function((hpfp)0x7BFF, (hpfp)0x4000), "Case 3: Exponential mapped out limits evaluates safely checking TMax thresholds");
    assert_hpfp_equals((hpfp)0x4400, multiply_function((hpfp)0xC000, (hpfp)0xC000), "Case 4: Negative magnitude inversions evaluate valid scaling constraints properly resolving identical mappings");
    assert_hpfp_equals((hpfp)0x01FF, multiply_function((hpfp)0x03FF, (hpfp)0x3800), "Case 5: Largest denorm times 0.5 stays denormal and rounds to odd at the midpoint");
    assert_hpfp_equals((hpfp)0x0201, multiply_function((hpfp)0x0401, (hpfp)0x3800), "Case 6: Smallest offset normal times 0.5 preserves midpoint rounding into odd denorm");

    // 7. comparison_function execution
    printf("\n--- testing comparison_function ---\n");
    assert_string_equals("<", comparison_function((hpfp)0xC000, (hpfp)0xBC00), "Case 1: Magnitude constraints validate inverted logic mathematically handling boundaries naturally (-2.0 < -1.0)");
    assert_string_equals("=", comparison_function((hpfp)0x0000, (hpfp)0x8000), "Case 2: Representational variations resolve accurately towards exactly equal parameters identically");
    assert_string_equals("=", comparison_function((hpfp)0x7E00, (hpfp)0x7E00), "Case 3: Invalid structural comparisons identically fallback to exact equivalence boundaries");
    assert_string_equals("<", comparison_function((hpfp)0x0200, (hpfp)0x0400), "Case 4: Extraneous mappings resolving lower constraints evaluate completely successfully limits testing");

    // 8. hpfp_to_bits_converter execution
    printf("\n--- testing hpfp_to_bits_converter ---\n");
    assert_string_equals_allocated("0000000000000000", hpfp_to_bits_converter((hpfp)0x0000), "Case 1: All Zeros boundary");
    assert_string_equals_allocated("1111111111111111", hpfp_to_bits_converter((hpfp)0xFFFF), "Case 2: All Ones boundary");
    assert_string_equals_allocated("0111110000000000", hpfp_to_bits_converter((hpfp)0x7C00), "Case 3: +Inf mapping boundary");
    assert_string_equals_allocated("1100000000000000", hpfp_to_bits_converter((hpfp)0xC000), "Case 4: -2.0 mapping boundary");
    assert_string_equals_allocated("0000000111111111", hpfp_to_bits_converter((hpfp)0x01FF), "Case 5: Returned bit strings are null-terminated for denormal outputs");

    // 9. float_flipper execution
    printf("\n--- testing float_flipper ---\n");
    assert_float_isnan(float_flipper(0.0f), "Case 1: NaN resolution properly checks flipped memory bounds structures mapping directly constraints natively");

    // Summarize mapping bounds
    printf("\n===== Benchmark Summary =====\n");
    printf("Total Executed: %d\n", tests_run);
    printf("Tests Failed:   %d\n", tests_failed);
    printf("Tests Passed:   %d\n", tests_run - tests_failed);

    if (tests_failed == 0)
    {
        printf("\n✅ ALL 36 KILLER CASES DEFEATED SUCCESSFULLY!\n");
    }
    else
    {
        printf("\n❌ SOME TESTS FAILED BOUNDARY MAPPING. REVIEW CONSOLE LOGS.\n");
    }

    return tests_failed == 0 ? 0 : 1;
}
