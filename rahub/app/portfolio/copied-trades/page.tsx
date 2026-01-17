"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function CopiedTradesPage() {
  const router = useRouter()
  const [portfolios, setPortfolios] = useState<any[]>([])
  const [copiedTrades, setCopiedTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()

        if (!session) {
          router.push("/auth/login")
          return
        }

        // Fetch copied portfolios
        const { data: portfolioData } = await supabase
          .from("copy_portfolios")
          .select("*, advisors(full_name)")
          .eq("investor_id", session.user.id)
          .eq("status", "active")

        setPortfolios(portfolioData || [])

        // Fetch copied trades from followed advisors
        if (portfolioData && portfolioData.length > 0) {
          const advisorIds = portfolioData.map((p) => p.advisor_id)
          const { data: tradesData } = await supabase
            .from("trades")
            .select("*, advisors(full_name)")
            .in("advisor_id", advisorIds)
            .eq("status", "open")
            .order("published_at", { ascending: false })

          setCopiedTrades(tradesData || [])
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleCancelPortfolio = async (portfolioId: string) => {
    await supabase.from("copy_portfolios").update({ status: "cancelled" }).eq("id", portfolioId)

    setPortfolios(portfolios.filter((p) => p.id !== portfolioId))
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            RA Hub
          </Link>
          <Link href="/marketplace" className="text-text-secondary hover:text-primary transition">
            Back to Marketplace
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <h1 className="text-3xl font-bold mb-8">My Copied Portfolios</h1>

        {portfolios.length === 0 ? (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-text-secondary mb-4">You're not copying any portfolios yet</p>
              <Link href="/marketplace" className="text-primary hover:underline">
                Browse advisors and start copying
              </Link>
            </CardContent>
          </Card>
        ) : (
          <>
            {/* Active Portfolios */}
            <div className="grid md:grid-cols-2 gap-6 mb-8">
              {portfolios.map((portfolio) => (
                <Card key={portfolio.id}>
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle>{portfolio.advisors.full_name}</CardTitle>
                        <p className="text-sm text-text-secondary mt-1">Investment: ₹{portfolio.investment_amount}</p>
                      </div>
                      <Badge className="bg-success/20 text-success">Active</Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <button
                      onClick={() => handleCancelPortfolio(portfolio.id)}
                      className="w-full px-4 py-2 bg-danger/20 text-danger rounded-lg hover:bg-danger/30 transition text-sm"
                    >
                      Cancel Copy
                    </button>
                  </CardContent>
                </Card>
              ))}
            </div>

            {/* Copied Trades */}
            <div>
              <h2 className="text-2xl font-bold mb-4">Active Trades from Copied Portfolios</h2>
              {copiedTrades.length === 0 ? (
                <Card>
                  <CardContent className="pt-8 text-center">
                    <p className="text-text-secondary">No active trades from your copied portfolios</p>
                  </CardContent>
                </Card>
              ) : (
                <div className="space-y-4">
                  {copiedTrades.map((trade) => (
                    <Card key={trade.id}>
                      <CardContent className="pt-6">
                        <div className="flex justify-between items-start mb-4">
                          <div>
                            <h3 className="text-xl font-bold text-primary">{trade.symbol}</h3>
                            <p className="text-sm text-text-secondary">by {trade.advisors.full_name}</p>
                          </div>
                          <Badge
                            className={trade.side === "BUY" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}
                          >
                            {trade.side}
                          </Badge>
                        </div>
                        <div className="grid md:grid-cols-4 gap-4 text-sm">
                          <div>
                            <p className="text-text-secondary">Entry Price</p>
                            <p className="font-bold text-primary">₹{trade.entry_price?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">Target</p>
                            <p className="font-bold">₹{trade.target_price?.toFixed(2)}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">Stop Loss</p>
                            <p className="font-bold">₹{trade.stop_loss?.toFixed(2)}</p>
                          </div>
                          <div>
                            <Link href={`/trade/${trade.id}`} className="text-primary hover:underline font-medium">
                              View Details →
                            </Link>
                          </div>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}
