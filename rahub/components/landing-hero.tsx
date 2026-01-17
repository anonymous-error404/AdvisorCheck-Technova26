import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Shield, TrendingUp, Lock, ArrowRight } from "lucide-react"
import Link from "next/link"

export function LandingHero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center overflow-hidden pt-16">
      <div className="absolute inset-0 bg-gradient-to-b from-primary/5 via-transparent to-transparent" />
      <div className="absolute top-1/4 -left-1/4 w-1/2 h-1/2 bg-primary/10 rounded-full blur-[120px]" />
      <div className="absolute bottom-1/4 -right-1/4 w-1/2 h-1/2 bg-primary/5 rounded-full blur-[120px]" />

      <div className="container relative z-10 px-4 py-20 md:py-32">
        <div className="max-w-4xl mx-auto text-center">
          <div className="flex flex-wrap justify-center gap-3 mb-8">
            <Badge variant="outline" className="py-1.5 px-4 text-sm border-primary/30 bg-primary/5">
              <Shield className="h-4 w-4 mr-2 text-primary" />
              SEBI Verified Advisors
            </Badge>
            <Badge variant="outline" className="py-1.5 px-4 text-sm border-primary/30 bg-primary/5">
              <Lock className="h-4 w-4 mr-2 text-primary" />
              Immutable Records
            </Badge>
            <Badge variant="outline" className="py-1.5 px-4 text-sm border-primary/30 bg-primary/5">
              <TrendingUp className="h-4 w-4 mr-2 text-primary" />
              Real Performance
            </Badge>
          </div>

          <h1 className="text-4xl md:text-6xl lg:text-7xl font-bold tracking-tight mb-6">
            Discover{" "}
            <span className="bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent">Verified</span>{" "}
            Trading Advisors
          </h1>

          <p className="text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            India's most transparent platform to find SEBI-registered advisors with{" "}
            <span className="text-foreground font-medium">proven track records</span> and{" "}
            <span className="text-foreground font-medium">immutable trade history</span>.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <Link href="/auth/investor-signup">
              <Button size="lg" className="text-lg px-8 h-14">
                Get Started
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Link href="/marketplace">
              <Button
                size="lg"
                variant="outline"
                className="text-lg px-8 h-14 border-border hover:bg-card bg-transparent"
              >
                Browse Advisors
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-3 gap-8 mt-20 max-w-xl mx-auto">
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">500+</div>
              <div className="text-sm text-muted-foreground mt-1">Verified Advisors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">50K+</div>
              <div className="text-sm text-muted-foreground mt-1">Active Investors</div>
            </div>
            <div className="text-center">
              <div className="text-3xl md:text-4xl font-bold text-primary">₹10Cr+</div>
              <div className="text-sm text-muted-foreground mt-1">Trades Tracked</div>
            </div>
          </div>
        </div>
      </div>
    </section>
  )
}
