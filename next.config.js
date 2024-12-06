/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config) => {
    config.resolve.alias = {
      ...config.resolve.alias,
      "undici": false // Disable undici to prevent parsing errors
    };
    return config;
  },
};

module.exports = nextConfig;