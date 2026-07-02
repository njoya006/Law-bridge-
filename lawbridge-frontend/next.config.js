/** @type {import('next').NextConfig} */
const apiGateway = process.env.API_GATEWAY_URL || 'http://32.197.83.70'

const nextConfig = {
  reactStrictMode: true,
  async rewrites() {
    return [
      { source: '/api/v1/auth/:path*', destination: `${apiGateway}/api/v1/auth/:path*` },
      { source: '/api/v1/clients/:path*', destination: `${apiGateway}/api/v1/clients/:path*` },
      { source: '/api/v1/lawyers/:path*', destination: `${apiGateway}/api/v1/lawyers/:path*` },
      { source: '/api/v1/firms/:path*', destination: `${apiGateway}/api/v1/firms/:path*` },
      { source: '/api/v1/cases/:path*', destination: `${apiGateway}/api/v1/cases/:path*` },
      { source: '/api/v1/documents/:path*', destination: `${apiGateway}/api/v1/documents/:path*` },
      { source: '/api/v1/notifications/:path*', destination: `${apiGateway}/api/v1/notifications/:path*` },
      { source: '/api/v1/payments/:path*', destination: `${apiGateway}/api/v1/payments/:path*` },
      { source: '/api/v1/calendar/:path*', destination: `${apiGateway}/api/v1/calendar/:path*` },
      { source: '/api/v1/monitoring/:path*', destination: `${apiGateway}/api/v1/monitoring/:path*` },
      { source: '/api/v1/search/:path*', destination: `${apiGateway}/api/v1/search/:path*` },
      { source: '/api/v1/ai/:path*', destination: `${apiGateway}/api/v1/ai/:path*` },
    ]
  },
}

module.exports = nextConfig
