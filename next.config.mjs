/** @type {import('next').NextConfig} */

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
    output: 'export',
   basePath: '/p2p-chat-app',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
