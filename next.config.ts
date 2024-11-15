// next.config.js

/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "avatars.githubusercontent.com",
        // The pathname can be adjusted based on the image URL structure
        // For GitHub avatars, they typically follow /u/{id}
        pathname: "/u/**",
      },
      // Add additional patterns if needed
      // {
      //   protocol: 'https',
      //   hostname: 'example.com',
      //   pathname: '/images/**',
      // },
    ],
  },
  // Add other Next.js configurations here if necessary
};

module.exports = nextConfig;
