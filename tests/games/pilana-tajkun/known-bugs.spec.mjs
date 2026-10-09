// Open bugs from docs/games/pilana-tajkun/BUGS.md, written as tests that are EXPECTED TO FAIL.
// When someone fixes a bug, its test starts passing and Playwright reports "expected to fail, but passed":
// remove the test.fail line, close the bug in BUGS.md, add a LEDGER entry.
import { test, expect } from './fixtures.mjs';

test.describe('Pilana Tajkun · known bugs (expected to fail)', () => {
});
