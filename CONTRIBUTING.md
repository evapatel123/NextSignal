# Contributing to NextSignal

Thank you for your interest in contributing to NextSignal!

Contributions that improve the application's reliability, data integrity, user experience, documentation, and analytical accuracy are welcome.

## Before Contributing

- Review existing issues and pull requests to avoid duplicate work.
- For major changes, open an issue first to discuss the proposed solution.
- Keep each contribution focused on a clear problem or improvement.
- Never publish credentials, personal information, private data, or unredacted logs.

## Development Setup

Follow the installation instructions in `README.md`.

In general, local development requires:

- Node.js and pnpm for the frontend.
- Python and a virtual environment for the backend.
- A local `.env` file created from `.env.example`.

Run the frontend and backend in separate terminals.

## Recommended Workflow

1. Fork the repository or create a working branch if you have write access.
2. Create a descriptive branch name.
3. Make the smallest change that correctly addresses the issue.
4. Add or update tests when appropriate.
5. Run relevant tests and build checks.
6. Update documentation if behavior or configuration changes.
7. Open a pull request explaining the problem, solution, and verification performed.

Example branch names:

- `fix/kalshi-market-ingestion`
- `fix/calibration-metrics`
- `feature/event-filtering`
- `docs/setup-instructions`

## Code Quality

### Backend

- Follow the existing Python conventions and project structure.
- Validate and normalize external provider data.
- Handle provider errors without unnecessarily disabling other sources.
- Keep database operations and calculations predictable and testable.
- Add regression tests for bug fixes.

Run the backend tests with:

```bash
python -m pytest src/server/tests
```

To check live provider connectivity when network access is available:

```bash
python -m src.server.scripts.verify_live
```

Live verification depends on upstream service availability and may fail because of network restrictions or changes in provider responses.

### Frontend

- Preserve the existing visual design and responsive behavior.
- Keep loading, empty, and error states understandable.
- Avoid introducing unnecessary dependencies.
- Ensure frontend requests use the configured backend URL.
- Run a production build before submitting frontend changes:

```bash
pnpm build
```

### Analytics and Data Integrity

- Do not fabricate market prices, historical predictions, or resolved outcomes.
- Ensure calibration metrics use valid predictions matched to genuine outcomes.
- Do not interpret a zero-observation sample as perfect accuracy.
- Treat differences between market probabilities as potential signals, not guaranteed arbitrage.
- Do not assume that similar event descriptions across platforms have identical settlement conditions.

## Environment and Sensitive Files

Never commit:

- `.env` files containing local configuration or secrets.
- API keys, access tokens, passwords, or credentials.
- Python virtual environments such as `.venv/`.
- Frontend dependencies such as `node_modules/`.
- Local databases such as `nextsignal.db`.
- Python caches, test caches, logs, and temporary files.
- Generated frontend build output such as `.next/`, `out/`, `dist/`, or `build/`.

Commit `.env.example` with safe, non-secret defaults so other developers can configure the application.

If you accidentally expose a credential, revoke or rotate it immediately. Removing it from the latest commit alone may not remove it from Git history.

## Pull Request Checklist

Before submitting a pull request, confirm:

- [ ] The change addresses the stated issue.
- [ ] The scope is limited to the intended improvement.
- [ ] Tests were added or updated where appropriate.
- [ ] Backend tests pass, or any failure is documented.
- [ ] `pnpm build` passes for frontend changes.
- [ ] Configuration and documentation are updated where necessary.
- [ ] No secrets, local databases, or generated artifacts are included.
- [ ] Screenshots are included for significant visual changes.
- [ ] Known limitations and manual testing steps are explained.

## Reporting Bugs

Please include:

- A concise description of the issue.
- Expected and actual behavior.
- Steps to reproduce the issue.
- Relevant operating system and runtime versions.
- Sanitized logs or error messages.
- Whether the problem persists on the latest version.

Remove credentials, personal data, and private URLs before sharing diagnostic information.

## Feature Requests

Describe the user problem first, then the proposed feature. Explain how the feature would fit into the current workflow and whether it requires new dependencies, external services, or data sources.

## Licensing

Review the repository's `LICENSE` file before contributing. If no license exists, do not assume the project is available for unrestricted reuse or redistribution. Contributions are subject to the repository's applicable licensing terms.
