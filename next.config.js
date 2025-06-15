import createMDX from "@next/mdx";

/*eslint-env node*/
/** @type {import('next').NextConfig} */
const nextConfig = {
  output: "standalone",
  pageExtensions: ["ts", "tsx", "md", "mdx"],
  webpack: (config) => {
    config.module.rules.push({ test: /\.ts$/, exclude: /scripts\/db\// });
    return config;
  },
};

const withMDX = createMDX({ extension: /\.(md|mdx)$/ });

export default withMDX(nextConfig);
