---
title: RFC Process & State Machine
description: Guidelines on the lifecycle and status transitions of Vyasa RFC documents.
---

# Vyasa RFC Process & State Machine

This document defines the lifecycle, states, and transitions for Vyasa Request for Comments (RFC) documents. This state machine ensures alignment across all contributors without requiring complex external CI/CD tooling.

## RFC States

Every RFC document must include a `**Status**: [State]` line in its metadata block. The allowed states are:

1. **Draft**: The RFC is currently being written or is under active discussion. The implementation is either non-existent or highly experimental.
2. **Prototyping**: The RFC is actively exploring choices through experimental code, proofs-of-concept, or research before finalizing the design.
3. **Accepted**: The architecture and proposal within the RFC have been approved. Implementation may begin or is currently in progress, but it is not yet complete.
4. **Implemented**: The features described in the RFC are fully implemented, merged into the main codebase, verified, AND user-facing documentation + reference implementation are available.
5. **Deferred**: The RFC proposal is sound, but implementation is postponed indefinitely due to shifting priorities or technical blockers.
6. **Rejected**: The proposal was considered but ultimately rejected. The document is kept for historical context to prevent revisiting the same dead ends.

## State Transitions

- **Draft → Prototyping**: Occurs when active coding or research is needed to validate the RFC's assumptions.
- **Draft/Prototyping → Accepted**: Occurs when the team reviews the RFC and agrees on the design.
- **Accepted → Implemented**: Occurs when the code implementing the RFC is verified, merged, and fully documented for end-users.
- **Draft/Accepted → Deferred**: Occurs when a blocker arises or priorities shift.
- **Draft → Rejected**: Occurs if the proposal is deemed unsuitable for the project.

## Revising an Implemented RFC

If an implemented RFC is found to have flaws or requires significant architectural updates, we do **not** create a new superseding RFC. Instead, we maintain the same document identity (RFC#) and version it:

1. Revert the RFC's status back to **Draft** or **Prototyping**.
2. Add a **Revision History** section to the document to log the changes (e.g., `v2: Updated to address flaw in X`).
3. Proceed through the normal state transitions until the revised architecture is **Implemented** once again.
