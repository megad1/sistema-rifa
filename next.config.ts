import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    unoptimized: true, // permite qualquer domínio (desativa otimização do Next)
  },
};

export default nextConfig;
