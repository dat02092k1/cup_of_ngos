---
name: grill-me-spec
description: Interview the user relentlessly about a plan or design until reaching shared understanding, then freeze the result into spec.md + plan.md files that the implementation layer (cheap subagents) can read. Use when the user wants to stress-test a plan, get grilled on their design, mentions "grill me", or wants to brainstorm/spec a feature before coding. This is the THINKING layer, run by a strong model (Opus) — do NOT write production code here, only think and produce spec/plan documents.
---

Interview me relentlessly about every aspect of this plan until we reach a shared understanding. Walk down each branch of the design tree, resolving dependencies between decisions one-by-one. For each question, provide your recommended answer.
Ask the questions one at a time.
If a question can be answered by exploring the codebase, explore the codebase instead.

---

## After the interview: produce spec & plan

This skill is the thinking layer of a two-layer workflow:

1. **Thinking layer (this skill, strong model):** the relentless interview above → freeze every resolved decision into `specs/<feature>/spec.md` and `specs/<feature>/plan.md`.
2. **Execution layer (`implement-from-spec`, cheap model):** reads the plan file and spawns subagents to write code.

Core token-saving idea: **all the expensive thinking must be frozen into files**, so that implementation never has to drag the whole brainstorming conversation back into context.

### Hard rule

- **Do NOT write production code in this skill.** Pseudo-code or an interface signature to illustrate a decision is fine. Real code is the subagent's job.

### When the interview is done

Once you've reached shared understanding (no open questions remain), confirm with the user one last time, then create two files:

- `specs/<feature-slug>/spec.md` — follow `references/spec-template.md`
- `specs/<feature-slug>/plan.md` — follow `references/plan-template.md`

`<feature-slug>` is a short kebab-case name you propose.

**Quality bar for plan.md:** each task must be **self-contained enough for a fresh-read subagent (with no conversation context) to execute it**. That means every task states: which files to create/edit, what to do, the constraints/conventions, and the done criteria. This is what makes the implementation layer cheap.

### Handoff

After creating the files, report the paths and tell the user:
> Spec & plan are ready. To implement cheaply, run `implement-from-spec` pointed at `specs/<feature-slug>/plan.md` — subagents (Sonnet) will code from the plan without re-reading this conversation.

Read `references/spec-template.md` and `references/plan-template.md` when you reach this step.
