"use client"

import { useEffect, useState, useCallback } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import AddTradeForm from "@/components/add-trade-form"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { getLiveStockPrice } from "@/lib/market-data"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function AdvisorDashboard() {
  const router = useRouter()
  const [advisor, setAdvisor] = useState<any>(null)
  const [stats, setStats] = useState<any>(null)
  const [trades, setTrades] = useState<any[]>([])
  const [activeTab, setActiveTab] = useState("monitoring")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [editingTrade, setEditingTrade] = useState<any>(null)

  useEffect(() => {
    let isMounted = true
    let timeoutId: NodeJS.Timeout

    const fetchData = async () => {
      try {
        console.log("Fetching user...")
        const {
          data: { user },
          error: userError,
        } = await supabase.auth.getUser()

        console.log("User fetch result:", { user, error: userError })

        if (userError || !user) {
          console.log("No user, redirecting to login")
          if (isMounted) {
            setLoading(false)
            router.push("/auth/login")
          }
          return
        }

        console.log("Fetching advisor data for user:", user.id)
        const { data: advisorData, error: advisorError } = await supabase
          .from("advisors")
          .select("*")
          .eq("user_id", user.id)
          .single()

        console.log("Advisor fetch result:", { advisorData, error: advisorError })

        if (advisorError || !advisorData) {
          if (isMounted) {
            setError("Advisor profile not found")
            setLoading(false)
          }
          return
        }

        if (!isMounted) return
        setAdvisor(advisorData)

        // Fetch stats
        const { data: statsData } = await supabase
          .from("advisor_stats")
          .select("*")
          .eq("advisor_id", advisorData.id)
          .single()

        if (isMounted) {
          setStats(statsData)
        }

        // Fetch trades
        const { data: tradesData, error: tradesError } = await supabase
          .from("trades")
          .select("*")
          .eq("advisor_id", advisorData.id)
          .order("created_at", { ascending: false })

        if (!tradesError && isMounted) {
          setTrades(tradesData || [])
        }

        if (isMounted) {
          clearTimeout(timeoutId)
          setLoading(false)
        }
      } catch (error) {
        console.error("Error fetching data:", error)
        if (isMounted) {
          clearTimeout(timeoutId)
          setError(`Failed to load dashboard data: ${error instanceof Error ? error.message : "Unknown error"}`)
          setLoading(false)
        }
      }
    }

    // Add timeout after 30 seconds
    timeoutId = setTimeout(() => {
      if (isMounted) {
        console.error("Dashboard loading timeout")
        setError("Dashboard loading took too long. Please refresh the page.")
        setLoading(false)
      }
    }, 30000)

    fetchData()

    return () => {
      isMounted = false
      clearTimeout(timeoutId)
    }
  }, [])

  const handleLogout = useCallback(async () => {
    await supabase.auth.signOut()
    router.push("/")
  }, [router])

  const handlePublish = useCallback(async (tradeId: string) => {
    try {
      // Find the trade to get the symbol
      const trade = trades.find(t => t.id === tradeId)
      if (!trade) return

      // Fetch live price
      const priceData = await getLiveStockPrice(trade.symbol)
      const entryPrice = priceData.price

      const response = await fetch("/api/trades/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId, entryPrice }),
      })

      if (!response.ok) {
        throw new Error("Failed to publish trade")
      }

      // Refresh trades
      const { data: tradesData, error: tradesError } = await supabase
        .from("trades")
        .select("*")
        .eq("advisor_id", advisor.id)
        .order("created_at", { ascending: false })

      if (!tradesError) {
        setTrades(tradesData || [])
      }
    } catch (error) {
      console.error("Error publishing trade:", error)
      setError("Failed to publish trade")
    }
  }, [advisor, trades])

  const handleEdit = useCallback((trade: any) => {
    setEditingTrade(trade)
    setActiveTab("add-trade")
  }, [])

  const handleUpdate = useCallback(async () => {
    // Refresh trades
    const { data: tradesData, error: tradesError } = await supabase
      .from("trades")
      .select("*")
      .eq("advisor_id", advisor.id)
      .order("created_at", { ascending: false })

    if (!tradesError) {
      setTrades(tradesData || [])
    }
    setEditingTrade(null)
    setActiveTab("drafts")
  }, [advisor])

  const publishedTrades = trades.filter((t) => t.status === "published" || t.status === "closed")
  const openTrades = trades.filter((t) => t.status === "published" && !t.closed_at)
  const draftTrades = trades.filter((t) => t.status === "draft")

  const handleRefresh = useCallback(() => {
    window.location.reload()
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading dashboard...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-danger text-center">
          <p className="mb-4">{error}</p>
          <button
            onClick={() => router.push("/auth/login")}
            className="px-4 py-2 bg-primary text-background rounded-lg"
          >
            Back to Login
          </button>
        </div>
      </div>
    )
  }

  if (!advisor) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-text-secondary">Redirecting...</div>
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
          <div className="flex gap-4 items-center">
            <Link href="/marketplace" className="text-text-secondary hover:text-primary transition text-sm">
              Explore
            </Link>
            <Link href="/portfolio" className="text-text-secondary hover:text-primary transition text-sm">
              Portfolio
            </Link>
            <button onClick={handleLogout} className="text-text-secondary hover:text-primary transition text-sm">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Profile Card */}
        <Card className="mb-8">
          <CardHeader>
            <div className="flex justify-between items-start">
              <div>
                <CardTitle className="text-3xl mb-2">{advisor.full_name}</CardTitle>
                <p className="text-text-secondary">{advisor.company_name}</p>
                <p className="text-sm text-text-secondary mt-2">SEBI: {advisor.sebi_number}</p>
                <div className="mt-3">
                  {advisor.verified ? (
                    <Badge className="bg-success/20 text-success">✓ Verified</Badge>
                  ) : (
                    <Badge className="bg-warning/20 text-warning">Pending Verification</Badge>
                  )}
                </div>
              </div>
              <Link
                href="/dashboard/edit-profile"
                className="px-4 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition text-sm"
              >
                Edit Profile
              </Link>
            </div>
          </CardHeader>
        </Card>

        {/* Stats Cards */}
        {stats && (
          <div className="grid md:grid-cols-4 gap-4 mb-8">
            <Card>
              <CardContent className="pt-6">
                <div className="text-text-secondary text-sm mb-2">Total Trades</div>
                <div className="text-3xl font-bold text-primary">{stats.total_trades}</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-text-secondary text-sm mb-2">Win Rate</div>
                <div className="text-3xl font-bold text-success">{stats.win_rate?.toFixed(1) || 0}%</div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-text-secondary text-sm mb-2">Total Return</div>
                <div
                  className={`text-3xl font-bold ${(stats.total_return_percent || 0) >= 0 ? "text-success" : "text-danger"}`}
                >
                  {stats.total_return_percent?.toFixed(2) || 0}%
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-text-secondary text-sm mb-2">Open Trades</div>
                <div className="text-3xl font-bold text-warning">{openTrades.length}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tabs */}
        <div className="flex gap-4 mb-6 border-b border-border overflow-x-auto">
          <button
            onClick={() => setActiveTab("monitoring")}
            className={`pb-4 font-medium transition whitespace-nowrap ${
              activeTab === "monitoring"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Live Monitoring ({openTrades.length})
          </button>
          <button
            onClick={() => setActiveTab("trades")}
            className={`pb-4 font-medium transition whitespace-nowrap ${
              activeTab === "trades"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            All Trades ({publishedTrades.length})
          </button>
          <button
            onClick={() => setActiveTab("drafts")}
            className={`pb-4 font-medium transition whitespace-nowrap ${
              activeTab === "drafts"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Drafts ({draftTrades.length})
          </button>
          <button
            onClick={() => setActiveTab("add-trade")}
            className={`pb-4 font-medium transition whitespace-nowrap ${
              activeTab === "add-trade"
                ? "text-primary border-b-2 border-primary"
                : "text-text-secondary hover:text-text-primary"
            }`}
          >
            Add Trade
          </button>
        </div>

        {/* Live Monitoring Tab */}
        {activeTab === "monitoring" && (
          <div className="space-y-4">
            {openTrades.length === 0 ? (
              <Card>
                <CardContent className="pt-8 text-center">
                  <p className="text-text-secondary">No open trades</p>
                </CardContent>
              </Card>
            ) : (
              openTrades.map((trade) => (
                <Card key={trade.id} className="border-primary/30">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h3 className="text-xl font-bold text-primary">{trade.symbol}</h3>
                        <p className="text-sm text-text-secondary mt-2">Entry: ₹{trade.entry_price?.toFixed(2) || 'N/A'}</p>
                      </div>
                      <Badge className={trade.trade_type === "LONG" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}>
                        {trade.trade_type}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Published Trades */}
        {activeTab === "trades" && (
          <div className="space-y-4">
            {publishedTrades.length === 0 ? (
              <Card>
                <CardContent className="pt-8 text-center">
                  <p className="text-text-secondary">No published trades yet</p>
                </CardContent>
              </Card>
            ) : (
              publishedTrades.map((trade) => (
                <Card key={trade.id} className="border-primary/30">
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-primary">{trade.symbol}</h3>
                        <div className="flex gap-2 mt-2">
                          <Badge
                            className={`${
                              trade.trade_type === "LONG" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"
                            }`}
                          >
                            {trade.trade_type}
                          </Badge>
                          <Badge
                            className={`${
                              trade.status === "published"
                                ? "bg-primary/20 text-primary"
                                : "bg-text-secondary/20 text-text-secondary"
                            }`}
                          >
                            {trade.status === "published" ? "Active" : "Closed"}
                          </Badge>
                          {trade.is_immutable && <Badge className="bg-warning/20 text-warning">🔒 Locked</Badge>}
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-secondary">Published</p>
                        <p className="text-sm">
                          {trade.published_at ? new Date(trade.published_at).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-text-secondary">Entry Price</p>
                        <p className="font-bold text-primary">₹{trade.entry_price?.toFixed(2) || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Target</p>
                        <p className="font-bold">₹{trade.target_price?.toFixed(2) || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Stop Loss</p>
                        <p className="font-bold">₹{trade.stop_loss?.toFixed(2) || "N/A"}</p>
                      </div>
                      {trade.exit_price && (
                        <>
                          <div>
                            <p className="text-text-secondary">Exit Price</p>
                            <p className="font-bold">{trade.exit_price?.toFixed(2) || "N/A"}</p>
                          </div>
                          <div>
                            <p className="text-text-secondary">ROI</p>
                            <p
                              className={`font-bold ${(trade.roi_percent || 0) >= 0 ? "text-success" : "text-danger"}`}
                            >
                              {trade.roi_percent?.toFixed(2) || "0"}%
                            </p>
                          </div>
                        </>
                      )}
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Draft Trades */}
        {activeTab === "drafts" && (
          <div className="space-y-4">
            {draftTrades.length === 0 ? (
              <Card>
                <CardContent className="pt-8 text-center">
                  <p className="text-text-secondary">No draft trades</p>
                </CardContent>
              </Card>
            ) : (
              draftTrades.map((trade) => (
                <Card key={trade.id}>
                  <CardContent className="pt-6">
                    <div className="flex justify-between items-start mb-4">
                      <div>
                        <h3 className="text-xl font-bold text-primary">{trade.symbol}</h3>
                        <Badge className="bg-warning/20 text-warning mt-2">Draft</Badge>
                      </div>
                      <div className="text-right">
                        <p className="text-xs text-text-secondary">Created</p>
                        <p className="text-sm">
                          {trade.created_at ? new Date(trade.created_at).toLocaleDateString() : "N/A"}
                        </p>
                      </div>
                    </div>
                    <div className="grid md:grid-cols-4 gap-4 text-sm">
                      <div>
                        <p className="text-text-secondary">Type</p>
                        <p className="font-bold">{trade.trade_type}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Target</p>
                        <p className="font-bold">₹{trade.target_price?.toFixed(2) || "N/A"}</p>
                      </div>
                      <div>
                        <p className="text-text-secondary">Stop Loss</p>
                        <p className="font-bold">₹{trade.stop_loss?.toFixed(2) || "N/A"}</p>
                      </div>
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        onClick={() => handleEdit(trade)}
                        variant="outline"
                        size="sm"
                      >
                        Edit
                      </Button>
                      <Button
                        onClick={() => handlePublish(trade.id)}
                        variant="default"
                        size="sm"
                        className="bg-success hover:bg-success-dark"
                      >
                        Publish
                      </Button>
                    </div>
                  </CardContent>
                </Card>
              ))
            )}
          </div>
        )}

        {/* Add Trade Form */}
        {activeTab === "add-trade" && advisor.verified && (
          <AddTradeForm
            advisorId={advisor.id}
            onTradeAdded={() => setActiveTab("trades")}
            trade={editingTrade}
            onUpdate={handleUpdate}
          />
        )}

        {activeTab === "add-trade" && !advisor.verified && (
          <Card>
            <CardContent className="pt-8 text-center">
              <p className="text-warning mb-4 font-medium">Your account must be verified to publish trades.</p>
              <p className="text-text-secondary">Contact admin for SEBI verification</p>
            </CardContent>
          </Card>
        )}
      </div>
    </div>
  )
}
