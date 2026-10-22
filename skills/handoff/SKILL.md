---
name: handoff
description: Compact the current conversation into a handoff prompt for another agent to pick up.
argument-hint: "What will the next session be used for?"
disable-model-invocation: true
---

Write a handoff prompt summarising the current conversation so a fresh agent can continue the work.

Do not duplicate content already captured in other artifacts (specs, plans, ADRs, issues, commits, diffs). Reference them by path or URL instead.

Redact any sensitive information, such as API keys, passwords, or personally identifiable information.

If the user passed arguments, treat them as a description of what the next session will focus on and tailor the prompt accordingly.

## Write no file

The prompt is chat output and nothing else. Do not save it anywhere - not to the repository, not to a scratchpad, not to a temp directory - and do not offer to. A file here is one more thing to find and delete later, while the prompt is only ever needed once, in the next session's first message.

## Deliver it copy-pasteable in the chat

Print the **entire** prompt in the chat inside a single fenced code block, so the user can copy it in one gesture and paste it into a fresh session. Never a shortened variant.

- Wrap the prompt in a `~~~markdown` fence (tildes), so any ``` blocks inside the prompt survive intact.
- Put nothing inside the fence except the prompt itself - no preamble, no "here is the handoff", no trailing commentary.
- Keep the whole thing inside one fence. Do not split it across several blocks or interleave explanations between sections.
- Add nothing outside the fence either. The fence is the whole answer.
