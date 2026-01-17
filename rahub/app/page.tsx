"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import { LandingNavbar } from "@/components/landing-navbar"
import { LandingHero } from "@/components/landing-hero"
import { LandingFeatures } from "@/components/landing-features"
import { LandingCTA } from "@/components/landing-cta"
import { LandingFooter } from "@/components/landing-footer"
import { AdvisorLeaderboard } from "@/components/advisor-leaderboard"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Home() {
  const router = useRouter()
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const checkUser = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      setLoading(false)

      if (session) {
        router.push("/dashboard")
      }
    }
    checkUser()
  }, [router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    )
  }

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
