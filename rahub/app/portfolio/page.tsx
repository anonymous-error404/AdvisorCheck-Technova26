"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function InvestorPortfolio() {
  const router = useRouter()
  const [investor, setInvestor] = useState<any>(null)
  const [subscriptions, setSubscriptions] = useState<any[]>([])
  const [copiedPortfolios, setCopiedPortfolios] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState<"subscriptions" | "portfolio" | "trades">("subscriptions")
  const [loading, setLoading] = useState(true)
  const [portfolioStats, setPortfolioStats] = useState<any>(null)

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

        const { data: investorData } = await supabase
          .from("investors")
          .select("*")
          .eq("user_id", session.user.id)
          .single()

        if (!investorData) {
          router.push("/auth/login")
          return
        }

        setInvestor(investorData)

        // Fetch subscriptions
        const { data: subsData } = await supabase
          .from("investor_subscriptions")
          .select(
            `
            *,
            advisor:advisors (
              id,
              full_name,
              company_name,
              avatar_url,
              advisor_stats (
                win_rate,
                total_trades,
                total_return_percent,
                trust_score
              )
            )
          `,
          )
          .eq("investor_id", investorData.id)

        setSubscriptions(subsData || [])

        // Fetch copied portfolios
        const { data: portfoliosData } = await supabase
          .from("copy_portfolios")
          .select(
            `
            *,
            advisor:advisors (
              id,
              full_name,
              company_name
            )
          `,
          )
          .eq("investor_id", investorData.id)

        setCopiedPortfolios(portfoliosData || [])

        // Calculate portfolio stats
        if (portfoliosData && portfoliosData.length > 0) {
          const totalInvestment = portfoliosData.reduce((sum, p) => sum + (p.investment_amount || 0), 0)
          const totalReturn = portfoliosData.reduce((sum, p) => sum + (p.current_value - p.investment_amount || 0), 0)
          const returnPercent = (totalReturn / totalInvestment) * 100

          setPortfolioStats({
            totalInvestment,
            totalReturn,
            returnPercent,
            activePortfolios: portfoliosData.filter((p) => p.status === "active").length,
          })
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching portfolio data:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading portfolio...</div>
      </div>
    )
  }

  if (!investor) {
    return null
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            RA Hub
          </Link>
          <div className="flex gap-4 items-center">
            <Link href="/marketplace" className="text-text-secondary hover:text-primary transition text-sm">
              Explore Advisors
            </Link>
            <button onClick={handleLogout} className="text-text-secondary hover:text-primary transition text-sm">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Portfolio Overview */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">My Investment Portfolio</CardTitle>
            <p className="text-text-secondary mt-2">Track your subscriptions and portfolio performance</p>
          </CardHeader>
        </Card>

        {/* Portfolio Stats */}
        {portfolioStats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-text-secondary text-sm mb-2">Total Invested</div>
                <div className="text-3xl font-bold text-primary">₹{portfolioStats.totalInvestment?.toFixed(0)}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-text-secondary text-sm mb-2">Total Return</div>
                <div
                  className={`text-3xl font-bold ${portfolioStats.totalReturn >= 0 ? "text-success" : "text-danger"}`}
                >
                  ₹{portfolioStats.totalReturn?.toFixed(0)}
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-text-secondary text-sm mb-2">Return %</div>
                <div
                  className={`text-3xl font-bold ${portfolioStats.returnPercent >= 0 ? "text-success" : "text-danger"}`}
                >
                  {portfolioStats.returnPercent?.toFixed(2)}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-text-secondary text-sm mb-2">Active Portfolios</div>
                <div className="text-3xl font-bold text-warning">{portfolioStats.activePortfolios}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab("subscriptions")}
            className={`pb-4 font-medium transition whitespace-nowrap ${
              activeTab === "subscriptions"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Subscriptions ({subscriptions.length})
          </button>
          <button
            onClick={() => setActiveTab("portfolio")}
            className={`pb-4 font-medium transition whitespace-nowrap ${
              activeTab === "portfolio"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Copied Portfolios ({copiedPortfolios.length})
          </button>
          <button
            onClick={() => setActiveTab("trades")}
            className={`pb-4 font-medium transition whitespace-nowrap ${
              activeTab === "trades"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            My Trades
          </button>
        </div>

        {/* Subscriptions Tab */}
        {activeTab === "subscriptions" && (
          <div className="space-y-4">
            {subscriptions.length === 0 ? (
              <Card>
                <CardContent className="pt-8 text-center">
                  <p className="text-text-secondary mb-4">No active subscriptions</p>
                  <Link
                    href="/marketplace"
                    className="inline-block px-6 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition"
                  >
                    Browse Advisors
                  </Link>
                </CardContent>
              </Card>
            ) : (
              subscriptions.map((sub) => (
                <Card key={sub.id} className="border-primary/30">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-primary">{sub.advisor.full_name}</h3>
                        <p className="text-text-secondary text-sm">{sub.advisor.company_name}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge className="bg-primary/20 text-primary capitalize">{sub.tier} Tier</Badge>
                          <Badge className="bg-success/20 text-success">
                            Subscribed {new Date(sub.subscribed_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                      <Link
                        href={`/advisor/${sub.advisor.id}`}
                        className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition text-sm"
                      >
                        View Profile
                      </Link>
                    </div>
                    {sub.advisor.advisor_stats && sub.advisor.advisor_stats.length > 0 && (
                      <div className="grid grid-cols-4 gap-2 text-sm">
                        <div className="bg-background rounded p-2">
                          <div className="text-text-secondary text-xs">Win Rate</div>
                          <div className="font-bold text-success">
                            {sub.advisor.advisor_stats[0].win_rate?.toFixed(1)}%
                          </div>
                        </div>
                        <div className="bg-background rounded p-2">
                          <div className="text-text-secondary text-xs">Trades</div>
                          <div className="font-bold text-primary">{sub.advisor.advisor_stats[0].total_trades}</div>
                        </div>
                        <div className="bg-background rounded p-2">
                          <div className="text-text-secondary text-xs">Return</div>
                          <div
                            className={`font-bold ${(sub.advisor.advisor_stats[0].total_return_percent || 0) >= 0 ? "text-success" : "text-danger"}`}
                          >
                            {sub.advisor.advisor_stats[0].total_return_percent?.toFixed(2)}%
                          </div>
                        </div>
                        <div className="bg-background rounded p-2">
                          <div className="text-text-secondary text-xs">Trust</div>
                          <div className="font-bold text-primary">
                            {sub.advisor.advisor_stats[0].trust_score?.toFixed(0)}/100
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Copied Portfolios Tab */}
        {activeTab === "portfolio" && (
          <div className="space-y-4">
            {copiedPortfolios.length === 0 ? (
              <Card>
                <CardContent className="pt-8 text-center">
                  <p className="text-text-secondary mb-4">No active portfolio copies</p>
                  <Link
                    href="/marketplace"
                    className="inline-block px-6 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition"
                  >
                    Copy a Portfolio
                  </Link>
                </CardContent>
              </Card>
            ) : (
              copiedPortfolios.map((portfolio) => (
                <Card key={portfolio.id} className="border-primary/30">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-primary">{portfolio.advisor.full_name}</h3>
                        <p className="text-text-secondary text-sm">{portfolio.advisor.company_name}</p>
                        <div className="flex gap-2 mt-2">
                          <Badge
                            className={`${
                              portfolio.status === "active"
                                ? "bg-success/20 text-success"
                                : "bg-text-secondary/20 text-text-secondary"
                            }`}
                          >
                            {portfolio.status === "active" ? "Active" : "Inactive"}
                          </Badge>
                          <Badge className="bg-primary/20 text-primary">
                            Started {new Date(portfolio.created_at).toLocaleDateString()}
                          </Badge>
                        </div>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-text-secondary mb-1">Investment</p>
                        <p className="font-bold text-primary">₹{portfolio.investment_amount?.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary mb-1">Current Value</p>
                        <p className="font-bold">{portfolio.current_value?.toFixed(0)}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary mb-1">Return</p>
                        <p
                          className={`font-bold ${(portfolio.current_value - portfolio.investment_amount) >= 0 ? "text-success" : "text-danger"}`}
                        >
                          ₹{(portfolio.current_value - portfolio.investment_amount)?.toFixed(0)}
                        </p>
                      </div>
                      <div>
                        <p className="text-text-secondary mb-1">Return %</p>
                        <p
                          className={`font-bold ${(((portfolio.current_value - portfolio.investment_amount) / portfolio.investment_amount) * 100) >= 0 ? "text-success" : "text-danger"}`}
                        >
                          {(
                            ((portfolio.current_value - portfolio.investment_amount) / portfolio.investment_amount) *
                            100
                          ).toFixed(2)}
                          %
                        </p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Trades Tab */}
        {activeTab === "trades" && (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-text-secondary">Trades from all copied portfolios will appear here</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
