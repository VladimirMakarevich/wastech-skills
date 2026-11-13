---
name: interview
description: Interview the user about a plan, decision, or idea, one question at a time, digging deeper until you both fully understand it. Each question comes with your recommended answer. Look up facts yourself; ask the user only for decisions. Use when the user wants to test their thinking before acting — "interview me about X", "challenge this plan", "ask me the hard questions", "poke holes in this idea". Conversation only — do nothing until the user confirms you share the same understanding.
---

# interview

Interview the user until you both understand the plan the same way.

**Ask one question per turn.** Pick the most important open question, ask it, give your recommended answer, then wait for the reply.

Format:

```
❓ **<question title>**: <question, with options if useful>

➡️ <your recommended answer>
```

**Keep digging.** After each answer, ask yourself: is this clear and complete? If not — the answer is vague, raises new questions, or hides an assumption — ask a follow-up on the same topic. Move to the next topic only when the current one is fully clear.

**Facts are your job, decisions are the user's.** If a question needs a fact (code, files, tools, docs), look it up yourself or send a sub-agent. Never ask the user for something you can find. Ask the user only about choices.

Speak in the user's language.

**Finish** when no open questions remain and nothing is silently assumed. Sum up what was agreed and ask the user to confirm. Do not act until they confirm.
