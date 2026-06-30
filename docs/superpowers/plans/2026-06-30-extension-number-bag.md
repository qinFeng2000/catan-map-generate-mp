# 5–6 Player Number Bag Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Update the 5–6 player preset so number tokens `2` and `12` each occur twice while preserving the 28-token total and all existing generation behavior.

**Architecture:** Keep the change inside the existing preset boundary. Add one exact-frequency regression test for `BOARD_PRESETS.extension.numberBag`, then change only the two affected counts in the extension preset; the generator continues consuming the same `BoardPreset` interface.

**Tech Stack:** TypeScript, Vitest, pnpm

---

## File Structure

- Modify `tests/presets.test.ts` to assert every 5–6 player number-token frequency.
- Modify `src/presets/board-presets.ts` to change only the extension counts for `2` and `12`.

### Task 1: Align the extension number bag with the rule document

**Files:**
- Modify: `tests/presets.test.ts`
- Modify: `src/presets/board-presets.ts`

- [ ] **Step 1: Write the failing frequency test**

Add this test inside the existing `describe('board presets', ...)` block in `tests/presets.test.ts`:

```ts
it('defines exact 5-6 player number token counts', () => {
  const counts = BOARD_PRESETS.extension.numberBag.reduce<Record<number, number>>((result, number) => {
    result[number] = (result[number] ?? 0) + 1
    return result
  }, {})

  expect(counts).toEqual({
    2: 2,
    3: 3,
    4: 3,
    5: 3,
    6: 3,
    8: 3,
    9: 3,
    10: 3,
    11: 3,
    12: 2,
  })
})
```

- [ ] **Step 2: Run the focused test and verify RED**

Run:

```bash
pnpm test -- tests/presets.test.ts
```

Expected: FAIL in `defines exact 5-6 player number token counts`; the old preset reports one `2` and three `12` tokens.

- [ ] **Step 3: Make the minimal preset change**

In `src/presets/board-presets.ts`, replace the first two extension entries with:

```ts
numberBag: numberBag([
  [2, 2],
  [12, 2],
  [3, 3],
  [4, 3],
  [5, 3],
  [6, 3],
  [8, 3],
  [9, 3],
  [10, 3],
  [11, 3],
]),
```

Do not change the base preset or generator logic.

- [ ] **Step 4: Run affected tests and verify GREEN**

Run:

```bash
pnpm test -- tests/presets.test.ts tests/number-search.test.ts tests/generate-board.test.ts
```

Expected: all selected test files pass, including exact token counts and extension generation.

- [ ] **Step 5: Run full verification**

Run:

```bash
pnpm typecheck
pnpm test
git diff --check
```

Expected: type checking passes, the full Vitest suite passes, and Git reports no whitespace errors.

- [ ] **Step 6: Commit the implementation**

```bash
git add tests/presets.test.ts src/presets/board-presets.ts
git commit -m "fix: align extension number token counts"
```
