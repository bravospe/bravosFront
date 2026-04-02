import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      { protocol: 'https', hostname: 'wongio.vtexassets.com' },
      { protocol: 'https', hostname: 'falabella.scene7.com' },
      { protocol: 'https', hostname: 'falabella.com' },
      { protocol: 'https', hostname: 'plazavea.vteximg.com.br' },
      { protocol: 'https', hostname: 'sodimac.scene7.com' },
      { protocol: 'https', hostname: 'metroio.vtexassets.com' },
      { protocol: 'https', hostname: '**.vtexassets.com' },
      { protocol: 'https', hostname: '**.vteximg.com.br' },
      { protocol: 'https', hostname: '**.scene7.com' },
      { protocol: 'https', hostname: 'bravos-bucket.s3.amazonaws.com' },
      { protocol: 'https', hostname: 'api.bravos.pe' },
    ],
  },
};

export default nextConfig;
