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
    // Perf pass — serve modern formats where the browser supports them
    // instead of always falling back to whatever the source file is.
    formats: ["image/avif", "image/webp"],
  },
  // @xenova/transformers pulls in onnxruntime-node's native .node bindings.
  // Webpack can't bundle those, so we tell Next to require them at runtime
  // instead of bundling — otherwise any route importing lib/ai/embeddings.ts
  // (via the Inngest document-processing function) fails to build.
  experimental: {
    serverComponentsExternalPackages: ["@xenova/transformers", "onnxruntime-node", "sharp"],
    // Perf pass — these packages are imported via named/barrel imports
    // throughout the app (lucide-react icons especially, on nearly every
    // component). This rewrites those imports to pull only the specific
    // module used instead of the whole package, which meaningfully cuts
    // client bundle size without touching any call sites.
    optimizePackageImports: [
      "lucide-react",
      "framer-motion",
      "@radix-ui/react-dialog",
      "@radix-ui/react-dropdown-menu",
      "@radix-ui/react-tabs",
      "@radix-ui/react-toast",
      "@radix-ui/react-tooltip",
    ],
  },
};

export default nextConfig;
