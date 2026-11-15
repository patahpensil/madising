# Development standards

These requirements apply to every change in this repository.

## Language and naming

- Source code, identifiers, file names, technical comments and test names use English. User-facing text uses Bahasa Indonesia.
- Rename legacy Indonesian identifiers only when their file is touched, in a separate behavior-preserving commit. Do not rename public interfaces without compatibility review.
- Keep implementation focused. Comments explain constraints and non-obvious decisions rather than restating code.

## Verification per feature

- Add positive, negative, boundary and realistic synthetic scenario tests. Run relevant checks and record the exact commands, environment, outcomes and outstanding gaps.
- Review asynchronous behavior, race conditions, loops, memory/resource leaks, deadlocks, TOCTOU, missing parameters, invalid inputs and spelling. Exercise concurrency and resource cleanup where applicable. Mark checks not applicable or not run with reasons.
- Security decisions use trusted server-side records. Recheck mutable authorization and state within the write transaction. Never use patient production data in development.
- Do not claim defect-free code or passed tests without evidence. Do not weaken checks to complete a release.

## Repository and interface quality

- No automated authorship watermarks, promotional attribution, session URLs or unsolicited co-author trailers in source, comments, interfaces, documentation, commits or pull requests. Retain required licensing, security controls, audit history and truthful authorship metadata.
- For UI work, read docs/PANDUAN-UI-UX.md, the current PRD and applicable supplied design references before implementation. Use purposeful layout, native typography, honest states, Indonesian copy and accessible controls. Validate screenshots and real device interactions; reject decorative clutter, dummy metrics and inactive controls in production.
- Preserve project locks and existing clinical, privacy, release and review gates. Use separate feature branches and reviewable commits. No clinical production activation before required institutional approvals.
