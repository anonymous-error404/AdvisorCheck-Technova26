"use client"

import { useEffect, useState } from "react"
import { useRouter, useParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Badge } from "@/components/ui/badge"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { TradeCommentsSection } from "@/components/trade-comments-section"
import { FollowButton } from "@/components/follow-button"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function TradeDetailPage() {
  const router = useRouter()
  const params = useParams()
  const tradeId = params.id as string

  const [trade, setTrade] = useState<any>(null)
  const [advisor, setAdvisor] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const fetchData = async () => {
      try {
        // Fetch trade with advisor details
        const { data: tradeData, error: tradeError } = await supabase
          .from("trades")
          .select("*, advisors(*)")
          .eq("id", tradeId)
          .single()

        if (tradeError || !tradeData) {
          router.push("/marketplace")
          return
        }

        setTrade(tradeData)
        setAdvisor(tradeData.advisors)
        setLoading(false)
      } catch (error) {
        console.error("Error fetching trade:", error)
        setLoading(false)
      }
    }

    fetchData()
  }, [tradeId, router])

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading...</div>
      </div>
    )
  }

  if (!trade) {
    return null
  }

  const roi = trade.exit_price ? (((trade.exit_price - trade.entry_price) / trade.entry_price) * 100).toFixed(2) : null

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold text-primary">
            RA Hub
          </Link>
          <Link href="/marketplace" className="text-text-secondary hover:text-primary transition">
            Back to Marketplace
          </Link>
        </div>
      </header>

      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Trade Header */}
        <div className="mb-8">
          <div className="flex justify-between items-start mb-4">
            <div>
              <h1 className="text-4xl font-bold text-primary mb-2">{trade.symbol}</h1>
              <div className="flex gap-2">
                <Badge className={trade.side === "BUY" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}>
                  {trade.side}
                </Badge>
                <Badge
                  className={
                    trade.status === "open"
                      ? "bg-primary/20 text-primary"
                      : trade.status === "closed"
                        ? "bg-text-secondary/20 text-text-secondary"
                        : "bg-warning/20 text-warning"
                  }
                >
                  {trade.status === "open" ? "Open" : trade.status === "closed" ? "Closed" : "Draft"}
                </Badge>
                {trade.is_immutable && <Badge className="bg-warning/20 text-warning">🔒 Immutable</Badge>}
              </div>
            </div>
            {roi && trade.status === "closed" && (
              <div className="text-right">
                <p className="text-sm text-text-secondary">Return on Investment</p>
                <p className={`text-3xl font-bold ${roi >= 0 ? "text-success" : "text-danger"}`}>{roi}%</p>
              </div>
            )}
          </div>
        </div>

        {/* Advisor Card */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Advisor Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-text-secondary text-sm mb-1">Advisor Name</p>
                <p className="text-lg font-bold">{advisor.full_name}</p>
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-1">Company</p>
                <p className="text-lg font-bold">{advisor.company_name}</p>
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-1">SEBI Number</p>
                <p className="font-mono text-sm">{advisor.sebi_number}</p>
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-1">Status</p>
                {advisor.verified ? (
                  <Badge className="bg-success/20 text-success">✓ Verified</Badge>
                ) : (
                  <Badge className="bg-warning/20 text-warning">Pending</Badge>
                )}
              </div>
              <div className="md:col-span-2">
                <FollowButton advisorId={advisor.id} showFollowerCount={true} />
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Trade Details */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle>Trade Details</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid md:grid-cols-2 gap-6">
              <div>
                <p className="text-text-secondary text-sm mb-1">Entry Price</p>
                <p className="text-2xl font-bold text-primary">₹{trade.entry_price?.toFixed(2) || "N/A"}</p>
                {trade.published_at && (
                  <p className="text-xs text-text-secondary mt-1">
                    Locked on {new Date(trade.published_at).toLocaleString()}
                  </p>
                )}
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-1">Target Price</p>
                <p className="text-2xl font-bold">₹{trade.target_price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-text-secondary text-sm mb-1">Stop Loss</p>
                <p className="text-2xl font-bold text-danger">₹{trade.stop_loss?.toFixed(2)}</p>
              </div>
              {trade.exit_price && (
                <div>
                  <p className="text-text-secondary text-sm mb-1">Exit Price</p>
                  <p className="text-2xl font-bold">₹{trade.exit_price.toFixed(2)}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Analysis */}
        {trade.analysis && (
          <Card>
            <CardHeader>
              <CardTitle>Trade Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-text-secondary leading-relaxed whitespace-pre-wrap">{trade.analysis}</p>
            </CardContent>
          </Card>
        )}

        {/* Immutability Notice */}
        {trade.is_immutable && (
          <Card className="bg-primary/10 border-primary/20 mt-8">
            <CardContent className="pt-6">
              <p className="text-primary font-medium mb-2">🔒 Trade Immutability</p>
              <p className="text-sm text-text-secondary">
                This trade was published on {new Date(trade.published_at).toLocaleString()} and has been locked to
                ensure complete transparency and accountability. The entry price cannot be modified, guaranteeing an
                immutable record of the advisor's market timing and analysis.
              </p>
            </CardContent>
          </Card>
        )}

        <TradeCommentsSection tradeId={tradeId} advisorId={advisor.id} />
      </div>
    </div>
  )
}
