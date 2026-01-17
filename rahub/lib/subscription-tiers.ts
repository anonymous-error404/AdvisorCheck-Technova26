export const DEFAULT_TIERS = [
  {
    name: "free",
    price: 0,
    features: ["View advisor profile", "View published trades", "Access to trust score"],
  },
  {
    name: "pro",
    price: 99,
    features: [
      "View advisor profile",
      "View published trades",
      "Access to trust score",
      "Real-time trade notifications",
      "Access to advisor analysis",
      "Priority support",
    ],
  },
  {
    name: "elite",
    price: 299,
    features: [
      "View advisor profile",
      "View published trades",
      "Access to trust score",
      "Real-time trade notifications",
      "Access to advisor analysis",
      "Copy portfolio feature",
      "Direct messaging with advisor",
      "Custom alerts",
      "Priority support",
    ],
  },
]

export function getTierFeatures(tierName: string) {
  const tier = DEFAULT_TIERS.find((t) => t.name === tierName)
  return tier?.features || []
}

export function getTierPrice(tierName: string) {
  const tier = DEFAULT_TIERS.find((t) => t.name === tierName)
  return tier?.price || 0
}

export function isPremium(tierName: string) {
  return tierName !== "free"
}
