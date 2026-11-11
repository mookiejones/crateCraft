# Visual A/B choices

When the user must pick a layout, look, chrome, placement, or other thing they will see, show the choice as lettered A/B (or A–D) cards with a wireframe inside each card. Do not ask first whether to show mockups. Do not describe the layouts in prose only.

## Chat

- One visual question per turn.
- Label options **A**, **B**, … with a short title and one line of why.
- Paste the full companion URL including `?key=`.
- End with: click A or B, or type the letter in chat.

## Companion

- Use the Superpowers visual companion (`brainstorming/visual-companion.md`). Start `scripts/start-server.sh --project-dir <repo> --open` if the server is down. Reuse the live session when `server-info` exists and `server-stopped` does not.
- Write a new HTML fragment each question. Never reuse a filename.
- Each option: `data-choice`, letter, title, one-line why, and a small wireframe mockup of the real chrome (AppBar, Drawer, Main).
- After they reply, read `state/events` and treat the chat letter as the source of truth.
- Push a waiting screen when the next question is not visual.
- Mockups live under `.superpowers/brainstorm/` (gitignored).

## Do not use this for

- Git, CI, merge, secrets, or irreversible actions.
- “What does X mean” or a yes/no with no picture.
- Security warnings (use plain prose).

This rule overrides brainstorming’s “offer the companion first” and “no list of answers on the question” for visual picks.
