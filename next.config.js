/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'localhost',
      },
      {
        protocol: 'https',
        hostname: 'ggi07ikrbkj85ug8.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: '*.public.blob.vercel-storage.com',
      },
      {
        protocol: 'https',
        hostname: 'images.unsplash.com',
      },
      {
        protocol: 'https',
        hostname: 'via.placeholder.com',
      },      {
        protocol: 'https',
        hostname: 'drwgroup.id',
      },
      {
        protocol: 'https',
        hostname: 'storage.googleapis.com',
      },
      // Public catalog API image hosts (assets.drwskincare.com, *.drwapp.com)
      {
        protocol: 'https',
        hostname: 'drwskincare.com',
      },
      {
        protocol: 'https',
        hostname: '*.drwskincare.com',
      },
      {
        protocol: 'https',
        hostname: '*.drwapp.com',
      },
    ],
    dangerouslyAllowSVG: true,
    contentDispositionType: 'attachment',
    contentSecurityPolicy: "default-src 'self'; script-src 'none'; sandbox;",
  },
}

module.exports = nextConfig