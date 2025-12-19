/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  productionBrowserSourceMaps: false,
  turbopack: {
    // Prevent Turbopack from inferring a higher workspace root due to other lockfiles.
    root: __dirname,
  },
}

module.exports = nextConfig
