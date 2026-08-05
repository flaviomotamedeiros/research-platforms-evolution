/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: [
    '@rpe/domain-kit', '@rpe/plugin-sdk', '@rpe/platform-kit', '@rpe/glpi-core',
    '@rpe/asset-computer', '@rpe/asset-network', '@rpe/asset-printer',
  ],
  webpack: (config) => {
    config.resolve.extensionAlias = { '.js': ['.ts', '.tsx', '.js'], ...config.resolve.extensionAlias }
    return config
  },
}
export default nextConfig
