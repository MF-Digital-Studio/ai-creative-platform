import type { MetadataRoute } from "next";

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: "Klay.ai",
    short_name: "Klay.ai",
    description: "Turn product photos into campaign-ready visuals and short-form videos.",
    start_url: "/",
    display: "standalone",
  };
}
