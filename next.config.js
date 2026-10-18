/** @type {import('next').NextConfig} */
const isGitHubPages = process.env.GITHUB_PAGES === "true";
const backendUrl = process.env.BACKEND_URL || "http://127.0.0.1:8000";
const repoName = process.env.GITHUB_REPOSITORY?.split("/")[1] || "";

const nextConfig = {
  reactStrictMode: true,
  ...(isGitHubPages
    ? {
        output: "export",
        trailingSlash: true,
        images: { unoptimized: true },
        ...(repoName && repoName !== `${process.env.GITHUB_REPOSITORY_OWNER}.github.io`
          ? { basePath: `/${repoName}`, assetPrefix: `/${repoName}/` }
          : {}),
      }
    : {
        output: "standalone",
        async rewrites() {
          return [
            {
              source: "/api/backend/:path*",
              destination: `${backendUrl}/api/:path*`,
            },
          ];
        },
      }),
};

module.exports = nextConfig;
