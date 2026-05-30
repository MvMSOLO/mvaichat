---
name: Migration backup workflows permanently failed
description: .migration-backup/* workflows always fail — no node_modules, never restart them
---

The `.migration-backup/` directory contains old copies of artifacts. Their workflows (api-server, mockup-sandbox, mv-ai: web) always fail because node_modules are not present. **Never restart these workflows.** Ignore their FAILED status — it is permanent and expected.

**Why:** This directory is a snapshot from a migration operation. It has no installed dependencies.

**How to apply:** Any time you see FAILED status for .migration-backup/* workflows, skip them entirely. Only work with the main `artifacts/` workflows.
