/** @type {import('next').NextConfig} */
const nextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "img.clerk.com" },
      { protocol: "https", hostname: "*.supabase.co" },
    ],
  },
  // @xenova/transformers pulls in onnxruntime-node's native .node bindings.
  // Webpack can't bundle those, so we tell Next to require them at runtime
  // instead of bundling — otherwise any route importing lib/ai/embeddings.ts
  // (via the Inngest document-processing function) fails to build.
  experimental: {
    serverComponentsExternalPackages: ["@xenova/transformers", "onnxruntime-node", "sharp"],
  },
};

export default nextConfig;
