/** @type {import('next').NextConfig} */

const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
    output: 'export',
   basePath: '/Noel-Network-Open-Engage-Link-',
  images: {
    unoptimized: true,
  },
}

export default nextConfig
