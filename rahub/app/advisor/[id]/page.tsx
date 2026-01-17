"use client"

import { useEffect, useState, use } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { getTrustScoreTier } from "@/lib/trust-score"
import { CopyTradingModal } from "@/components/copy-trading-modal"
import { FollowButton } from "@/components/follow-button"
import { SubscriptionButton } from "@/components/subscription-button"
import { AdvancedAnalyticsDashboard } from "@/components/advanced-analytics-dashboard"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AdvisorProfile({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter()
  const { id } = use(params)
  const [advisor, setAdvisor] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [showCopyModal, setShowCopyModal] = useState(false)
  const [subscription, setSubscription] = useState<any>(null)
  const [subscriptionLoading, setSubscriptionLoading] = useState(false)
  const [activeTab, setActiveTab] = useState<"overview" | "analytics">("overview")

  useEffect(() => {
    const fetchData = async () => {
      try {
        const { data: advisorData } = await supabase.from("advisors").select("*").eq("id", id).single()

        if (!advisorData) {
          router.push("/marketplace")
          return
        }

        setAdvisor(advisorData)

        const { data: statsData } = await supabase
          .from("advisor_stats")
          .select("*")
          .eq("advisor_id", advisorData.id)
          .single()

        setStats(statsData)

        const { data: tradesData } = await supabase
          .from("trades")
          .select("*")
          .eq("advisor_id", advisorData.id)
          .eq("status", "published")
          .order("published_at", { ascending: false })

        setTrades(tradesData || [])

        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session) {
          const { data: investor } = await supabase
            .from("investors")
            .select("id")
            .eq("user_id", session.user.id)
            .single()

          if (investor) {
            const { data: sub } = await supabase
              .from("investor_subscriptions")
              .select("*")
              .eq("investor_id", investor.id)
              .eq("advisor_id", advisorData.id)
              .single()

            setSubscription(sub)
          }
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching advisor:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [id, router])

  const handleSubscriptionChange = () => {
    setSubscriptionLoading(true)
    setTimeout(() => {
      const fetchSubscription = async () => {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (session && advisor) {
          const { data: investor } = await supabase
            .from("investors")
            .select("id")
            .eq("user_id", session.user.id)
            .single()

          if (investor) {
            const { data: sub } = await supabase
              .from("investor_subscriptions")
              .select("*")
              .eq("investor_id", investor.id)
              .eq("advisor_id", advisor.id)
              .single()

            setSubscription(sub || null)
          }
        }
        setSubscriptionLoading(false)
      }
      fetchSubscription()
    }, 500)
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!advisor) {
    return null
  }

  const trustScoreTier = stats ? getTrustScoreTier(stats.trust_score || 0) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/marketplace" className="text-primary hover:text-primary-dark">
            ← Back to Marketplace
          </Link>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <div className="bg-surface border border-border rounded-lg p-8 mb-8">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h1 className="text-4xl font-bold mb-2">{advisor.full_name}</h1>
              <p className="text-text-secondary text-lg mb-4">{advisor.company_name}</p>
              <div className="flex gap-4 mb-4">
                <div>
                  <p className="text-text-secondary text-sm">SEBI Registration</p>
                  <p className="font-semibold">{advisor.sebi_number}</p>
                </div>
                <div>
                  <p className="text-text-secondary text-sm">Experience</p>
                  <p className="font-semibold">{advisor.years_experience} years</p>
                </div>
              </div>
              <span className="inline-block px-4 py-2 bg-success/20 text-success rounded-lg font-semibold">
                ✓ SEBI Verified
              </span>
            </div>
            <div className="flex flex-col gap-3">
              <FollowButton advisorId={advisor.id} showFollowerCount={true} />
              <SubscriptionButton
                advisorId={advisor.id}
                currentTierName={subscription?.tier_name}
                onSubscriptionChange={handleSubscriptionChange}
              />
              {subscription?.tier_name === "elite" && (
                <button
                  onClick={() => setShowCopyModal(true)}
                  className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition text-sm font-medium"
                >
                  Copy Portfolio
                </button>
              )}
            </div>
          </div>
          {advisor.bio && (
            <div>
              <h3 className="font-semibold mb-2">About</h3>
              <p className="text-text-secondary">{advisor.bio}</p>
            </div>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-4 mb-8 border-b border-border">
          <button
            onClick={() => setActiveTab("overview")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "overview" ? "text-primary border-b-2 border-primary" : "text-text-secondary"
            }`}
          >
            Overview
          </button>
          <button
            onClick={() => setActiveTab("analytics")}
            className={`px-4 py-2 font-medium transition ${
              activeTab === "analytics" ? "text-primary border-b-2 border-primary" : "text-text-secondary"
            }`}
          >
            Advanced Analytics
          </button>
        </div>

        {/* Content Based on Active Tab */}
        {activeTab === "analytics" ? (
          <AdvancedAnalyticsDashboard trades={trades} />
        ) : (
          <>
            {/* Stats Grid with Trust Score */}
            {stats && (
              <div>
                <div className="grid md:grid-cols-4 gap-4 mb-8">
                  <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="text-text-secondary text-sm mb-2">Total Trades</div>
                    <div className="text-4xl font-bold text-primary">{stats.total_trades}</div>
                  </div>
                  <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="text-text-secondary text-sm mb-2">Win Rate</div>
                    <div className="text-4xl font-bold text-success">{stats.win_rate.toFixed(1)}%</div>
                  </div>
                  <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="text-text-secondary text-sm mb-2">Total Return</div>
                    <div
                      className={`text-4xl font-bold ${stats.total_return_percent >= 0 ? "text-success" : "text-danger"}`}
                    >
                      {stats.total_return_percent.toFixed(2)}%
                    </div>
                  </div>
                  <div className="bg-surface border border-border rounded-lg p-6">
                    <div className="text-text-secondary text-sm mb-2">Avg Win / Loss</div>
                    <div className="text-sm">
                      <div className="text-success font-semibold">{stats.avg_winning_trade?.toFixed(2) || "N/A"}%</div>
                      <div className="text-danger font-semibold">{stats.avg_losing_trade?.toFixed(2) || "N/A"}%</div>
                    </div>
                  </div>
                </div>

                {trustScoreTier && (
                  <div className="bg-linear-to-r from-surface to-surface border border-border rounded-lg p-8 mb-8">
                    <div className="flex items-center justify-between">
                      <div>
                        <h2 className="text-xl font-bold mb-2">Trust Score</h2>
                        <p className="text-text-secondary">
                          Calculated from win rate, risk management, consistency, and trade volume
                        </p>
                      </div>
                      <div className="text-right">
                        <div className="text-6xl font-bold mb-2">
                          <span className={trustScoreTier.color}>{Math.round(stats.trust_score || 0)}</span>/100
                        </div>
                        <div className={`text-lg font-semibold ${trustScoreTier.color}`}>{trustScoreTier.label}</div>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Published Trades */}
            <div>
              <h2 className="text-2xl font-bold mb-6">Published Trades</h2>
              <div className="space-y-4">
                {trades.length === 0 ? (
                  <div className="bg-surface border border-border rounded-lg p-8 text-center">
                    <p className="text-text-secondary">No published trades yet</p>
                  </div>
                ) : (
                  trades.map((trade) => (
                    <div key={trade.id} className="bg-surface border border-border rounded-lg p-6">
                      <div className="flex justify-between items-start mb-4">
                        <div>
                          <h3 className="text-2xl font-bold text-primary mb-2">{trade.symbol}</h3>
                          <div className="flex gap-2">
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                trade.trade_type === "LONG" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                              }`}
                            >
                              {trade.trade_type}
                            </span>
                            <span
                              className={`px-3 py-1 rounded-full text-sm font-medium ${
                                trade.status === "closed"
                                  ? "bg-text-secondary/20 text-text-secondary"
                                  : "bg-primary/20 text-primary"
                              }`}
                            >
                              {trade.status === "closed" ? "Closed" : "Open"}
                            </span>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-text-secondary text-sm">Published</p>
                          <p className="font-semibold">{new Date(trade.published_at).toLocaleDateString()}</p>
                        </div>
                      </div>

                      {trade.description && <p className="text-text-secondary mb-4">{trade.description}</p>}

                      <div className="grid md:grid-cols-4 gap-4">
                        <div>
                          <p className="text-text-secondary text-sm mb-1">Entry Price</p>
                          <p className="text-lg font-bold text-primary">₹{trade.entry_price.toFixed(2)}</p>
                          <p className="text-xs text-text-secondary mt-1">
                            {new Date(trade.entry_timestamp).toLocaleTimeString()}
                          </p>
                        </div>
                        {trade.exit_price && (
                          <div>
                            <p className="text-text-secondary text-sm mb-1">Exit Price</p>
                            <p className="text-lg font-bold">{trade.exit_price.toFixed(2)}</p>
                            <p className="text-xs text-text-secondary mt-1">
                              Return: {(((trade.exit_price - trade.entry_price) / trade.entry_price) * 100).toFixed(2)}%
                            </p>
                          </div>
                        )}
                        {trade.target_price && (
                          <div>
                            <p className="text-text-secondary text-sm mb-1">Target</p>
                            <p className="text-lg font-bold text-success">₹{trade.target_price.toFixed(2)}</p>
                          </div>
                        )}
                        {trade.stop_loss && (
                          <div>
                            <p className="text-text-secondary text-sm mb-1">Stop Loss</p>
                            <p className="text-lg font-bold text-danger">₹{trade.stop_loss.toFixed(2)}</p>
                          </div>
                        )}
                      </div>
                    </div>
                  ))
                )}
              </div>
            </div>
          </>
        )}

        {/* Copy Trading Modal */}
        {showCopyModal && (
          <CopyTradingModal
            advisorId={advisor.id}
            advisorName={advisor.full_name}
            onClose={() => setShowCopyModal(false)}
          />
        )}
      </div>
    </div>
  )
}
