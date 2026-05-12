# Developer Guide

This guide explains how to set up your local development environment and create a pull request for the `fr-config-manager` project.

## Prerequisites

Before you start, ensure you have the following installed:

- \*\*Node.js (managed via `.nvmrc` - use nvm, fnm, or similar)
- **npm** (comes with Node.js)
- **Git**
- Access to the repository (fork or write permission)

### Setting up Node.js

This project uses Node.js managed in `.vnmrc`. If you use a Node version manager:

**Using nvm:**

```bash
nvm install
nvm use
```

**Using fnm:**

```bash
fnm use
```

**Using other tools:**
Check `.nvmrc` and manually install the version.

## Local Setup

### 1. Clone the Repository

```bash
git clone https://github.com/forgerock/fr-config-manager.git
cd fr-config-manager
```

### 2. Install Dependencies

```bash
npm ci
```

This installs dependencies using the exact lock file, ensuring consistency across environments.

### 3. Verify Setup

Run the full local validation:

```bash
npm test
```

All should pass before proceeding.

## Project Structure

This is an npm workspaces monorepo with the following layout:

```
fr-config-manager/
├── packages/                          # Workspace packages
│   ├── fr-config-common/              # Shared utilities & API client
│   ├── fr-config-delete/              # Delete config tool
│   ├── fr-config-promote/             # Promote config tool
│   ├── fr-config-pull/                # Pull config tool
│   └── fr-config-push/                # Push config tool
├── scripts/                           # Build & utility scripts
├── docs/                              # Documentation
├── .github/workflows/                 # CI/CD pipelines
├── .husky/                            # Git hooks (pre-commit, commit-msg)
├── .nvmrc                             # Node.js version requirement
├── .prettierrc                        # Prettier config
├── eslint.config.js                   # ESLint config
├── commitlint.config.js               # Commit message linting config
└── package.json                       # Root package.json (workspaces definition)
```

### Monorepo Concepts

- All packages share dependencies defined in the root `package.json`
- Workspace packages in `packages/*/` inherit root dependencies
- All packages are published together with synchronized versions
- Changes to one package can impact others; test thoroughly

## Development Workflow

### Making Changes

1. **Create a feature branch:**

   ```bash
   git checkout -b feature/my-feature
   ```

2. **Make your changes** in any of the workspace packages or root files.

3. **Run tests:**

   ```bash
   npm test
   ```

   Tests run across all workspace packages. Add new tests in `packages/*/tests/` as `.test.js` files.

### Commit Message Format

**Pre-commit Hook** (runs automatically on `git commit`):

- Lints staged JavaScript files with ESLint
- Formats staged files with Prettier

If the hook fails, fix the errors and stage your changes again before committing.

**Commit Message Format** (conventional commits):

Your commit messages must follow the [Conventional Commits](https://www.conventionalcommits.org/) standard:

```
<type>(<scope>): <subject>

<body>

<footer>
```

**Type** (required): `feat`, `fix`, `docs`, `refactor`, `perf`, `test`, `chore`

**Scope** (optional): Package or area, e.g., `fr-config-push`, `restClient`

**Subject** (required): Concise description (imperative mood, lowercase, no period)

**Examples:**

```
feat: add user authentication
fix(fr-config-push): resolve JSON parsing error
docs: update installation guide
chore: update dependencies
```

Invalid message:

```
❌ WIP
❌ Added new feature
❌ fixed bug in restClient
```

The commit-msg hook validates this automatically. If your message is invalid, you'll see:

```
❌ Invalid commit message format.
Example: 'feat: add user login' or 'fix: resolve crash on startup'
```

Edit the commit and try again:

```bash
git commit --amend
```

## Useful npm Scripts

```bash
npm test                    # Run all tests (Jest)
npm run lint              # Check code with ESLint
npm run format-code       # Format with Prettier
npm run security:audit    # Check for high/critical vulnerabilities
npm run security:lockfile # Verify package-lock.json integrity
```

## Creating a Pull Request

### 1. Push Your Branch

```bash
git push origin feature/my-feature
```

### 2. Open a PR on GitHub

Visit [https://github.com/forgerock/fr-config-manager](https://github.com/forgerock/fr-config-manager) and click "New Pull Request".

Select:

- **Base:** `main`
- **Compare:** your feature branch

### 3. PR Title & Description

**Title:** Follow conventional commits format (same as commit messages):

```
feat: add new export format option
fix(fr-config-pull): handle SAML metadata timeouts
```

**Description:** Explain:

- What problem this solves
- How it was tested
- Any breaking changes or migration notes
- Related issues (e.g., "Closes #123")

### 4. What Happens Next

Once you push, GitHub Actions automatically:

1. **Validates PR** (if PR):

   - Runs ESLint checks
   - Runs security audit
   - Verifies package-lock.json integrity
   - Runs all tests

   All must pass. Fix any failures and push updates to your branch.

2. **Releases to npm** (if merged to main):
   - release-please creates a release PR with version bump and changelog
   - Merging that release PR triggers npm publish to all workspaces
   - New version is tagged in Git

## Troubleshooting

### Pre-commit hook fails with "Linting failed"

**Solution:** ESLint found issues. Fix them:

```bash
npx eslint . --fix   # Auto-fix most issues
npm run format-code  # Format with Prettier
```

Then stage and commit again:

```bash
git add .
git commit -m "feat: ..."
```

### Pre-push hook fails with "Tests failed"

**Solution:** Run tests locally to diagnose:

```bash
npm test
```

Fix the failing tests and commit again.

### Commit message rejected with "Invalid commit message format"

**Solution:** Use the conventional commits format:

```bash
git commit --amend
# Change message to: "type(scope): subject"
```

### `npm ci` fails with dependency errors

**Solution:** Clear npm cache and retry:

```bash
npm cache clean --force
rm -rf node_modules package-lock.json
npm ci
```

### Tests pass locally but fail in GitHub Actions

**Solution:** GitHub Actions uses Node.js version from `.nvmrc`. Ensure you're using the same:

```bash
node --version
```

If yours differs, update your local Node.js version using nvm/fnm and retry tests.

## Additional Resources

- **Conventional Commits:** https://www.conventionalcommits.org/
- **ESLint Docs:** https://eslint.org/docs/rules/
- **Prettier Docs:** https://prettier.io/docs/
- **Jest Testing:** https://jestjs.io/docs/getting-started
- **npm Workspaces:** https://docs.npmjs.com/cli/using-npm/workspaces

## Questions?

Open an issue or discussion on the [GitHub repository](https://github.com/forgerock/fr-config-manager).
