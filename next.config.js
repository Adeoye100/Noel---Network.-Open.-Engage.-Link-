/** @type {import('next').NextConfig} */

// When deploying to GitHub Pages, the assets need to be prefixed with the repository name.
const isGithubActions = process.env.GITHUB_ACTIONS || false;

let assetPrefix = '';
let basePath = '';

if (isGithubActions) {
  const repo = process.env.GITHUB_REPOSITORY.replace(/.*?\//, '');

  assetPrefix = `/${repo}/`;
  basePath = `/${repo}`;
}

const nextConfig = {
  output: 'export', // Enables static HTML export
  assetPrefix: assetPrefix,
  basePath: basePath,
};

module.exports = nextConfig;
