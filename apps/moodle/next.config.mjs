/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // Source-only workspace packages are transpiled by Next rather than pre-built.
  transpilePackages: [
    '@rpe/domain-kit',
    '@rpe/plugin-sdk',
    '@rpe/platform-kit',
    '@rpe/moodle-core',
  ],
  webpack: (config) => {
    // Workspace packages are source-only TS using NodeNext-style ".js" import
    // specifiers. Let webpack resolve those specifiers to the ".ts" sources.
    config.resolve.extensionAlias = {
      '.js': ['.ts', '.tsx', '.js'],
      ...config.resolve.extensionAlias,
    }
    return config
  },
}

export default nextConfig
