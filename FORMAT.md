# FORMAT — caveman encoding for SPEC.md

Rules for writing and mutating `SPEC.md`. Read before any spec verb runs.

## Why caveman

The spec is read by an agent every time the `build` skill runs, not once by a human. This is not a
CI-enforced build step — no repo automation parses `SPEC.md`. Filler words cost context and add no
constraint. Write the shortest string that pins the meaning.

## Prose rules

- Drop articles and copulas. "money = integer cents", not "all of the money should be represented as
  integer cents".
- One claim per line. If a line has "and" joining two testable things, split it.
- Present tense, declarative. Invariants read as facts, not wishes.
- **Preserve verbatim**: identifiers, file paths, config keys, commands, versions, error strings.
  Never paraphrase `formatEurFromCents` into "the currency formatter".
- Cite location when a claim is checkable: `src/lib/calc/smartSplitter.ts`, `file.ts:63`.
- `?` marks inferred-not-verified. Never delete a `?` without checking the thing.
- No hedging, no rationale paragraphs, no "we should consider". A spec states; it does not muse.

## Sections

Fixed order. Right-size — omit a section that has no content rather than writing a stub. `§R` is the
only optional one in practice (present only after **research** runs).

| §   | name        | holds                                                                               |
| --- | ----------- | ----------------------------------------------------------------------------------- |
| §G  | goal        | 1–3 lines. what the thing does, for whom. no how.                                   |
| §C  | constraints | what is fixed and not up for debate: stack, budget, platform, policy.               |
| §I  | surfaces    | external interfaces: routes, public functions, storage keys, env vars, CLI, config. |
| §R  | research    | findings with sources. one row per fact. unsourced → flagged, never stated as fact. |
| §V  | invariants  | numbered `V1…`. must-hold properties. the thing tests exist to defend.              |
| §T  | tasks       | numbered `T1…`. ordered work. pipe table.                                           |
| §B  | bugs        | numbered `B1…`. every bug lands here. pipe table.                                   |

## Numbering

- Monotonic and permanent. `V7` means one thing forever.
- Never reuse a retired number. Leave the row as `V7. — retired, superseded by V<N>.` so the gap
  explains itself instead of reading as a lost line.
- Sharpening wording is an amendment, not a reuse — allowed while the subject is unchanged. A claim
  about a _different_ subject needs a new number.
- Reference by id across sections: a §T row cites `V2,I.api`; a §B row cites the `V<N>` that now
  guards it.

## §T shape

```
| id | st | task | cites |
|---|---|---|---|
| T5 | . | impl auth middleware | V2,I.api |
```

`st` glyphs:

| glyph | meaning                                          |
| ----- | ------------------------------------------------ |
| `.`   | pending                                          |
| `>`   | in progress                                      |
| `x`   | done                                             |
| `-`   | dropped (leave the row, it is a decision record) |

`task` is one imperative line. If it needs a paragraph it is two tasks. `cites` lists the §V/§I ids
the task depends on, or `—` when genuinely standalone.

## §B shape

```
| id | date | cause | fix |
|---|---|---|---|
| B1 | 2026-08-16 | matcher zeroed donor on sweep | V11 |
```

- `date` absolute, `YYYY-MM-DD`. never "last week".
- `cause` is the root cause, not the symptom. "button did nothing" is a symptom.
- `fix` cites the invariant that now catches recurrence, or `—` if none was added.
- Every bug gets a row. The invariant is optional but preferred — a §B row with no `V` is an
  admission the bug can come back silently.

## Ownership

`spec` is the sole mutator. Other verbs produce material and hand it off:

| verb     | writes into                 |
| -------- | --------------------------- |
| grill    | §G, §C                      |
| research | §R                          |
| review   | §V, plus a go/no-go verdict |
| deepen   | §I, §V, §T                  |
| build    | §T status glyphs            |
| backprop | §B, §V                      |

A handoff may only touch the sections it names. Rewriting a section nobody asked about is how a spec
quietly stops matching the code.

## Prettier

`SPEC.md` is kept prettier-formatted, but `bun run format` only covers `src/**/*.{ts,tsx,json,css}`
— run `prettier --write SPEC.md` directly. §V must be a markdown list (`- **V1.** …`), never bare
numbered prose lines — prettier reflows loose paragraphs and will merge every invariant into one
block. One invariant per list item, no wrapping.

## Diffs

Show the user a diff before writing. Apply on OK. No silent rewrites, ever.
