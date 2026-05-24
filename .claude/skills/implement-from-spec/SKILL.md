---
name: implement-from-spec
description: Read a plan.md file (produced by the grill-me-spec skill) and orchestrate cheap-model subagents (Sonnet) to implement code task by task, saving tokens versus having a strong model code directly. Use when the user says "implement this spec", "code from the plan", "build the feature from spec", "run implement", or points at an existing plan/spec file. This is the EXECUTION layer — your role is orchestrator: do NOT write code yourself, split the work and delegate to the code-implementer + code-reviewer subagents.
---

# Implement From Spec (Orchestrator)

This is the execution layer of a two-layer workflow. Your role here is **orchestrator**, not coder. You read the plan, split the work, spawn cheap subagents to code, then control quality.

Token philosophy: the strong model already did the thinking (spec/plan). Typing code from a clear spec is mechanical work → delegate it to **Sonnet subagents** via the `Task` tool. You (the orchestrator) keep a thin context: only the plan + task state, never the whole codebase.

## Principles

- **Do NOT implement code yourself.** If you catch yourself writing a production function, stop and hand it to a subagent.
- **Each subagent gets one self-contained task.** Pass it: the `spec.md` path, the specific task content, and the relevant file paths. Do NOT pass the brainstorming conversation.
- **Respect dependencies.** Dependent tasks run sequentially; independent tasks can run in parallel (spawn multiple subagents at once).
- **You are the quality gate:** after coding, use the `code-reviewer` subagent to check, then synthesize.

## Workflow

### Step 1 — Load the plan
- Take the `specs/<feature>/plan.md` path from the user (or find it under `specs/`).
- Read `plan.md` + `spec.md` in the same folder.
- Build the task list with order & dependencies. If the plan lacks enough info for a subagent to run on its own → tell the user and suggest filling the gap (or going back to `grill-me-spec`). Do NOT guess.

### Step 2 — Schedule execution
Identify which tasks can run in parallel and which must be sequential. Briefly tell the user the plan before running.

### Step 3 — Spawn code-implementer subagents
For each task (or parallel group), spawn a subagent via the `Task` tool with `subagent_type` set to `code-implementer`. The prompt must include:

```
Read the spec file: specs/<feature>/spec.md (only the relevant parts).
Task — Task <N>: <paste the full task content from plan.md>
Files involved: <paths>
Constraints: <conventions from the task>
When done, report back: files changed, summary of changes, verification result.
Do NOT expand beyond the scope of this task.
```

The subagent defined in `.claude/agents/code-implementer.md` is already pinned to the `sonnet` model.

### Step 4 — Review
After the implementers finish, spawn the `code-reviewer` subagent (also Sonnet) to check the diff against each task's done criteria and the conventions in the spec. Pass: the spec path, the list of changed files, the done criteria.

### Step 5 — Synthesize & handle errors
- If the reviewer passes → synthesize results, tick the acceptance checklist, report to the user.
- If there are issues → create a self-contained fix task and re-spawn an implementer for just that task (don't redo everything).
- Only escalate to yourself (the orchestrator) if the issue is a **design decision** not covered in the spec — then ask the user or suggest going back to `grill-me-spec`.

## When NOT to spawn a subagent
- A task is trivial (one-line edit) where spawning costs more than doing it → you may do it yourself, but this is a rare exception.
- A new design decision is needed → that belongs to the thinking layer, not implementation.
