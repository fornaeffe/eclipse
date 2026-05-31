# eclipse
Educational visualization of Sun - Earth - Moon positions

## Deployment

GitHub Pages is deployed by the `Deploy GitHub Pages` workflow in `.github/workflows/deploy-pages.yml`.

The workflow runs on pushes to `main` and can also be started manually from the Actions tab. It installs dependencies with `npm ci`, builds the webpack bundles with `npm run build`, packages the static site files, and publishes them through GitHub Pages Actions.

In the repository settings, set **Pages > Build and deployment > Source** to **GitHub Actions**.
