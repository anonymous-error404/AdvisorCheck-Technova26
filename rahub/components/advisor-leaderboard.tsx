"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Card, CardContent } from "@/components/ui/card"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function AdvisorLeaderboard() {
  const [advisors, setAdvisors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [sortBy, setSortBy] = useState<"win_rate" | "return" | "trades">("win_rate")

  useEffect(() => {
    const fetchTopAdvisors = async () => {
      try {
        const { data } = await supabase
          .from("advisors")
          .select(
            `
            id,
            full_name,
            company_name,
            sebi_number,
            years_experience,
            advisor_stats (
              total_trades,
              winning_trades,
              win_rate,
              total_return_percent,
              trust_score
            )
          `,
          )
          .eq("verified", true)
          .limit(10)

        const advisorsWithStats = (data || [])
          .filter((a) => a.advisor_stats && a.advisor_stats.length > 0)
          .sort((a, b) => {
            const statsA = a.advisor_stats[0]
            const statsB = b.advisor_stats[0]
            if (sortBy === "win_rate") return (statsB.win_rate || 0) - (statsA.win_rate || 0)
            if (sortBy === "return") return (statsB.total_return_percent || 0) - (statsA.total_return_percent || 0)
            return (statsB.total_trades || 0) - (statsA.total_trades || 0)
          })
          .slice(0, 10)

        setAdvisors(advisorsWithStats)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching leaderboard:", error)
        setLoading(false)
      }
    }

    fetchTopAdvisors()
  }, [sortBy])

  if (loading) {
    return (
      <div className="py-8 text-center">
        <div className="text-primary animate-pulse">Loading leaderboard...</div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap gap-2 justify-center">
        <button
          onClick={() => setSortBy("win_rate")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            sortBy === "win_rate"
              ? "bg-primary text-background"
              : "bg-surface border border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          Top Win Rate
        </button>
        <button
          onClick={() => setSortBy("return")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            sortBy === "return"
              ? "bg-primary text-background"
              : "bg-surface border border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          Top Returns
        </button>
        <button
          onClick={() => setSortBy("trades")}
          className={`px-4 py-2 rounded-lg font-medium transition ${
            sortBy === "trades"
              ? "bg-primary text-background"
              : "bg-surface border border-border text-text-secondary hover:text-text-primary"
          }`}
        >
          Most Active
        </button>
      </div>

      <div className="space-y-3">
        {advisors.map((advisor, index) => {
          const stats = advisor.advisor_stats[0]
          const medals = ["🥇", "🥈", "🥉"]
          const medal = index < 3 ? medals[index] : `${index + 1}.`

          return (
            <Link key={advisor.id} href={`/advisor/${advisor.id}`}>
              <Card className="border-primary/30 hover:border-primary transition cursor-pointer">
                <CardContent className="pt-6">
                  <div className="flex items-center gap-4">
                    <div className="text-3xl font-bold text-primary w-12 text-center">{medal}</div>
                    <div className="flex-1">
                      <h3 className="font-bold text-text-primary">{advisor.full_name}</h3>
                      <p className="text-sm text-text-secondary">{advisor.company_name}</p>
                    </div>
                    <div className="grid grid-cols-4 gap-4 text-right">
                      <div>
                        <p className="text-xs text-text-secondary">Win Rate</p>
                        <p className="font-bold text-success">{stats.win_rate?.toFixed(1) || 0}%</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Return</p>
                        <p
                          className={`font-bold ${(stats.total_return_percent || 0) >= 0 ? "text-success" : "text-danger"}`}
                        >
                          {stats.total_return_percent?.toFixed(2) || 0}%
                        </p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Trades</p>
                        <p className="font-bold text-primary">{stats.total_trades}</p>
                      </div>
                      <div>
                        <p className="text-xs text-text-secondary">Trust</p>
                        <p className="font-bold text-primary">{stats.trust_score?.toFixed(0) || 0}/100</p>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </Link>
          )
        })}
      </div>

      <div className="text-center pt-4">
        <Link
          href="/auth/investor-signup"
          className="inline-block px-8 py-3 bg-primary text-background font-semibold rounded-lg hover:bg-primary-dark transition"
        >
          View All Advisors
        </Link>
      </div>
    </div>
  )
}
