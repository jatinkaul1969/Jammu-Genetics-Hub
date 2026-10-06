import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Short, shareable URLs for the pages people search for — they redirect to
  // the real (canonical) city pages, so there is still only one version of
  // each page for Google to index.
  async redirects() {
    return [
      { source: "/genetic-testing-in-jammu", destination: "/jammu/genetic-tests", permanent: true },
      { source: "/genetic-tests-in-jammu", destination: "/jammu/genetic-tests", permanent: true },
      { source: "/genetic-counselling-in-jammu", destination: "/jammu/genetic-counselling", permanent: true },
      { source: "/geneticist-in-jammu", destination: "/jammu/genetic-counselling", permanent: true },
      { source: "/oncology-tests-in-jammu", destination: "/jammu/oncology-tests", permanent: true },
      { source: "/genetic-testing-in-mumbai", destination: "/mumbai/genetic-tests", permanent: true },
      { source: "/genetic-counselling-in-mumbai", destination: "/mumbai/genetic-counselling", permanent: true },
      { source: "/oncology-tests-in-mumbai", destination: "/mumbai/oncology-tests", permanent: true },
    ];
  },
};

export default nextConfig;
