import type { NextConfig } from 'next'

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: '25mb',
    },
  },
  serverExternalPackages: ['xlsx', 'pdf-parse', 'mammoth', 'jszip'],
}

export default nextConfig
