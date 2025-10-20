/** @type {import('next').NextConfig} */

const nextConfig = {
  typescript: {
    // It's safer to remove this and fix any TypeScript errors.
    // ignoreBuildErrors: true,
  },
    output: 'export',
   basePath: '/Noel-Network-Open-Engage-Link-',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
