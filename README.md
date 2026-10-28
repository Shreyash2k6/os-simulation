# OS Lab Simulator

An interactive browser-based Operating Systems laboratory built with React, TypeScript and Vite. The source includes simulations for CPU scheduling, memory allocation, paging, segmentation, deadlocks, synchronization, disk scheduling, file systems and other OS mechanisms.

> A successful production build verifies that the app compiles; it does not prove every simulation is bug-free. Test each simulator with representative inputs before relying on its results.

## Run locally

### Requirements

- Node.js 22.12 or newer (Node 22 or 24 recommended)
- npm, included with Node.js

### Install and start

```bash
npm install
npm run dev
```

Open the local URL printed in the terminal (the development server defaults to port 3000).

### Verify and build

```bash
npm run lint
npm run build
npm run preview
```

The production site is generated in `dist/`.

## Deploy to Vercel

1. Create a **Public** repository on GitHub.
2. Upload the *contents* of this folder to the repository root, not just the ZIP. Ensure `package.json`, `index.html`, `vite.config.ts`, `src/` and `public/` are at the root.
3. In Vercel, select **Add New → Project**, then import the GitHub repository.
4. The included `vercel.json` sets the Vite framework, `npm install`, `npm run build`, and `dist` output directory. Keep the Root Directory as `./` unless you put the app inside a subfolder.
5. Click **Deploy**. Vercel will show the public website URL when the deployment succeeds.

A connected GitHub repository will normally redeploy when you push commits to the configured branch.

## Environment variables and secrets

No environment variables are required for the current static simulator based on the source inspected. `.env.example` contains placeholders only. Do not add real API keys or secrets to GitHub or browser-side Vite variables. Any future AI API key must be used from a protected server-side endpoint, not exposed in client code.

If you later add environment variables in Vercel, add them under **Project → Settings → Environment Variables**, select the relevant deployment environments, save, and redeploy. Vite variables prefixed with `VITE_` are bundled into public client code and must never contain secrets.

## Progressive Web App

The project includes Vite PWA configuration. After deployment over HTTPS, supported browsers may offer installation. This is a browser-installable PWA, not a native Android APK.

## GitHub Actions

The workflow in `.github/workflows/ci.yml` installs dependencies, type-checks the TypeScript project and builds the production site on pushes and pull requests.

## Reporting a problem

Include the simulator section, exact input values, steps to reproduce, expected behavior and actual behavior.

## License

No license is included. Until a license is added, others should not assume they have permission to redistribute or modify this project beyond rights granted by applicable law.
