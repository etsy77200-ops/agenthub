/** Shown at top of /browse when ?category=slug matches (footer & deep links). */
export const CATEGORY_INTROS: Record<
  string,
  { title: string; description: string }
> = {
  "customer-support": {
    title: "Customer support AI agents",
    description:
      "Find agents built to answer tickets, live chat, and email around the clock. Compare ratings, pricing, and integrations so you can automate support without losing a human touch when it matters.",
  },
  "data-analysis": {
    title: "Data analysis AI agents",
    description:
      "Discover agents that connect to your data sources, surface trends, and turn numbers into clear reports. Ideal for teams that want faster insights without building everything in-house.",
  },
  "code-dev": {
    title: "Code & development AI agents",
    description:
      "Browse agents focused on coding, reviews, documentation, and developer workflows. Each listing explains what the agent does, how it’s delivered, and what you need to get started.",
  },
};
