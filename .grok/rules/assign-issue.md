# Assign yourself when you start an issue

When you start implementing a GitHub issue in this repo (`/serato-issue`, "work on #N", "ship #N", or any task that names an issue as the work item), assign the active GitHub account before any other write:

```bash
gh issue edit <n> --add-assignee @me
```

If you are already assigned, skip. If it is assigned only to someone else, stop and name that assignee unless the user said to take it. Read-only view, list, and triage do not assign. QA review of a pull request is not starting issue work.

See `docs/agents/issue-tracker.md`.
