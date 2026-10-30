---
name: interview
description: Interview the user relentlessly about a plan, decision, or idea until you reach a shared understanding — walking the design tree in rounds, asking every question whose prerequisites are settled, each with your recommended answer, looking up facts yourself and leaving only decisions to the user. Use when the user wants to stress-test their thinking before acting — "interview me about X", "challenge this plan", "ask me the hard questions", "poke holes in this idea". Conversation only — acts on nothing until the user confirms shared understanding.
---

# interview

Interview the user and keep questioning the user until you reach a shared understanding. Structure this as a **design tree**: each decision gives rise to branches—subsequent decisions that follow from it.

Work through the tree in **rounds**. The **frontier** consists of all the decisions for which the prerequisites have already been met—that is, questions you can ask *right now* without having to guess answers you don’t yet know. In each round, pose all the questions that fall within this frontier; number each question and provide your own suggested answer. Then, wait for the user’s responses before moving on to the next round.

Format a round like so:

```
❓ **Q1** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>

---

❓ **Q2** - **<question title>**: <question body, might be multiple paragraphs, including multiple choices>

➡️ <your recommended answer>
```

With each stage of user responses, the tree structure evolves: the decisions made expand the range of available options and unlock access to questions that were contingent upon those decisions. Once this occurs, the scope is updated, and the questions for the next stage are presented. If the answer to a particular question depends on another question that remains unresolved at the current stage, then that question is assigned to a _subsequent_ stage rather than the current one.

Finding _facts_ is your job, never the user's. When a frontier question needs a fact from the environment (filesystem, tools, etc.), dispatch a sub-agent to find it — or look it up yourself if sub-agents aren't available; don't ask the user for anything you could look up yourself. Don't block on it: a running exploration is an unsettled prerequisite, so only the questions downstream of it wait for the result; ask the rest of the frontier now. The _decisions_ are the user's: put each to them and wait.

Speak in the user's language.

The session is done when the frontier is empty: every branch of the design tree visited, nothing left silently assumed. Do not act on it until the user confirms you have reached a shared understanding.
