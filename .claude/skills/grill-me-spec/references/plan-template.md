# Plan — <Feature name>

> Every task MUST be self-contained: a fresh-read subagent (no conversation context) must be able to execute it with just the task + spec.md.
> Read `spec.md` in the same folder for overall context.

## Execution order
List tasks in dependency order. Mark tasks that can run in parallel as "(parallel with Tx)".

---

## Task 1 — <short title>
- **Type:** [create | edit | refactor | test]
- **Files involved:** `path/to/file` (state exact paths)
- **Depends on:** none / Task X must finish first
- **What to do:**
  -
- **Constraints / conventions:** (from spec section 6)
  -
- **Done criteria:**
  - [ ]
- **How to verify:** (test/build command / what to check by eye)

---

## Task 2 — <short title>
- **Type:**
- **Files involved:**
- **Depends on:**
- **What to do:**
- **Constraints / conventions:**
- **Done criteria:**
- **How to verify:**

---

(add more tasks...)

## Overall acceptance checklist
- [ ] All tasks done
- [ ] Build/tests pass
- [ ] Matches Done criteria in spec.md
