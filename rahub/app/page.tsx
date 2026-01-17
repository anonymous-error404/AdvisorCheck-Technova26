"use client"
import { LandingNavbar } from "@/components/landing-navbar"
import { LandingHero } from "@/components/landing-hero"
import { LandingFeatures } from "@/components/landing-features"
import { LandingCTA } from "@/components/landing-cta"
import { LandingFooter } from "@/components/landing-footer"
import { AdvisorLeaderboard } from "@/components/advisor-leaderboard"

export default function Home() {

  return (
    <main className="min-h-screen bg-background">
      <LandingNavbar />
      <LandingHero />
      <LandingFeatures />

      {/* Leaderboard Section */}
      <section className="py-24 relative">
        <div className="container px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold mb-4">Top Trading Advisors</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Discover the best performing advisors on RA Hub, ranked by win rate, returns, and trust score.
            </p>
          </div>
          <AdvisorLeaderboard />
        </div>
      </section>

      <LandingCTA />
      <LandingFooter />
    </main>
  )
}
