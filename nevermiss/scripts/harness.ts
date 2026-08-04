/**
 * Tiny zero-dependency assert harness shared by the test scripts.
 *
 * Deliberately not a test framework: these suites run under `tsx` in CI and on
 * a laptop with no install step, and a runner would be more machinery than the
 * handful of pure functions here need.
 */

let failures = 0;
let passes = 0;

/** Record a pass/fail with a one-line report. */
export function expect(name: string, pass: boolean, detail = ""): void {
  if (pass) {
    passes++;
    console.log(`PASS  ${name}${detail ? `  → ${detail}` : ""}`);
  } else {
    failures++;
    console.log(`FAIL  ${name}${detail ? `  → ${detail}` : ""}`);
  }
}

/** Deep-equality assertion via JSON shape; enough for plain data. */
export function expectEqual(name: string, actual: unknown, expected: unknown): void {
  const a = JSON.stringify(actual);
  const e = JSON.stringify(expected);
  expect(name, a === e, a === e ? a : `got ${a}, want ${e}`);
}

/** Print the tally and exit non-zero if anything failed. */
export function finish(suite: string): never {
  console.log(
    failures === 0
      ? `\n${suite}: ALL ${passes} TESTS PASSED`
      : `\n${suite}: ${failures} FAILED (${passes} passed)`,
  );
  process.exit(failures === 0 ? 0 : 1);
}
