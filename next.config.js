/** @type {import('next').NextConfig} */
const nextConfig = {
  // Enable serving static files from public directory
  async rewrites() {
    return [
      {
        source: '/frameworks/:path*',
        destination: '/frameworks/:path*',
      },
      {
        source: '/clients/:path*',
        destination: '/clients/:path*',
      },
    ];
  },
  // Enable React strict mode
  reactStrictMode: true,
  // Optimize images
  images: {
    domains: [],
    unoptimized: true,
  },
};

module.exports = nextConfig;