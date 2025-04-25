import { Output } from "@mui/icons-material";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: "standalone",
};

module.exports = {
  reactStrictMode: true,
  output: "standalone"
}

export default nextConfig;
