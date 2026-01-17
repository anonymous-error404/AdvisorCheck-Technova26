import { Shield, Eye, TrendingUp, Lock, Users, BarChart3 } from "lucide-react"
import { Card, CardContent } from "@/components/ui/card"

const features = [
  {
    icon: Shield,
    title: "SEBI Verified Only",
    description: "Every advisor is verified against SEBI records before they can publish any trades.",
  },
  {
    icon: Lock,
    title: "Immutable Records",
    description: "Once published, trade signals cannot be modified or deleted. Complete transparency.",
  },
  {
    icon: TrendingUp,
    title: "Real Performance",
    description: "Trust scores and win rates calculated from actual trade outcomes, not claims.",
  },
  {
    icon: Eye,
    title: "Full Transparency",
    description: "See every trade an advisor has ever made, including entry, target, and results.",
  },
  {
    icon: BarChart3,
    title: "Advanced Analytics",
    description: "Compare advisors by risk level, trading style, and historical performance.",
  },
  {
    icon: Users,
    title: "Community Trust",
    description: "See subscriber counts and community feedback for each advisor.",
  },
]

export function LandingFeatures() {
  return (
    <section className="py-24 relative w-full flex justify-center">
      <div className="w-full px-4">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            Why Choose <span className="text-primary">RA Hub</span>?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            We've built the most transparent trading advisor platform in India. No fake track records, no hidden trades.
          </p>
        </div>

        <div className="flex justify-center w-full">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6 w-full max-w-6xl">
            {features.map((feature) => (
              <Card key={feature.title} className="border-border/50 hover:border-primary/30 transition-colors">
                <CardContent className="p-6">
                  <div className="h-12 w-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                    <feature.icon className="h-6 w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">{feature.title}</h3>
                  <p className="text-muted-foreground text-sm">{feature.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </div>
    </section>
  )
}
