"use client"

import { useEffect, useState } from "react"
import { Card, CardContent } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { getLiveStockPrice } from "@/lib/market-data"

interface MonitoredTrade {
  id: string
  symbol: string
  side: "BUY" | "SELL"
  entry_price: number
  target_price: number
  stop_loss: number
  published_at: string
  status: string
  current_price?: number
  roi_percent?: number
  progress?: number
}

export function TradeMonitoringDashboard({ trades }: { trades: MonitoredTrade[] }) {
  const [monitoredTrades, setMonitoredTrades] = useState<MonitoredTrade[]>(trades)
  const [isMonitoring, setIsMonitoring] = useState(false)

  // Update prices every 5 seconds
  useEffect(() => {
    const updatePrices = async () => {
      const updated = await Promise.all(
        monitoredTrades.map(async (trade) => {
          if (trade.status !== "open") return trade

          try {
            const priceData = await getLiveStockPrice(trade.symbol)
            const currentPrice = priceData.price

            // Calculate ROI
            let roi = 0
            if (trade.side === "BUY") {
              roi = ((currentPrice - trade.entry_price) / trade.entry_price) * 100
            } else {
              roi = ((trade.entry_price - currentPrice) / trade.entry_price) * 100
            }

            // Calculate progress towards target/stop-loss
            let progress = 0
            if (trade.side === "BUY") {
              const range = trade.target_price - trade.stop_loss
              const current = currentPrice - trade.stop_loss
              progress = (current / range) * 100
            } else {
              const range = trade.stop_loss - trade.target_price
              const current = trade.stop_loss - currentPrice
              progress = (current / range) * 100
            }

            return { ...trade, current_price: currentPrice, roi_percent: roi, progress: Math.min(100, progress) }
          } catch (error) {
            console.error(`[v0] Error fetching price for ${trade.symbol}:`, error)
            return trade
          }
        }),
      )

      setMonitoredTrades(updated)
    }

    const interval = setInterval(updatePrices, 5000)
    updatePrices() // Initial call

    return () => clearInterval(interval)
  }, [monitoredTrades])

  const handleCheckClosures = async () => {
    setIsMonitoring(true)
    try {
      const response = await fetch("/api/trades/close", { method: "POST" })
      const result = await response.json()

      if (result.closedTrades?.length > 0) {
        // Remove closed trades from monitoring
        const closedIds = result.closedTrades.map((t: any) => t.id)
        setMonitoredTrades((prev) => prev.filter((t) => !closedIds.includes(t.id)))
      }
    } catch (error) {
      console.error("[v0] Error checking closures:", error)
    } finally {
      setIsMonitoring(false)
    }
  }

  if (monitoredTrades.length === 0) {
    return (
      <Card>
        <CardContent className="pt-8 text-center">
          <p className="text-text-secondary">No open trades to monitor</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-bold text-primary">Live Trade Monitoring</h3>
        <Button
          onClick={handleCheckClosures}
          disabled={isMonitoring}
          className="bg-primary hover:bg-primary-dark text-background"
        >
          {isMonitoring ? "Checking..." : "Check Closures"}
        </Button>
      </div>

      {monitoredTrades.map((trade) => (
        <Card key={trade.id} className="border-primary/30">
          <CardContent className="pt-6">
            <div className="flex justify-between items-start mb-4">
              <div>
                <h3 className="text-xl font-bold text-primary">{trade.symbol}</h3>
                <div className="flex gap-2 mt-2">
                  <Badge
                    className={`${trade.side === "BUY" ? "bg-success/20 text-success" : "bg-danger/20 text-danger"}`}
                  >
                    {trade.side}
                  </Badge>
                  <Badge className="bg-warning/20 text-warning">🔴 Live</Badge>
                </div>
              </div>
              <div className="text-right">
                <p className={`text-2xl font-bold ${(trade.roi_percent || 0) >= 0 ? "text-success" : "text-danger"}`}>
                  {trade.roi_percent?.toFixed(2) || "0.00"}%
                </p>
                <p className="text-sm text-text-secondary">Current ROI</p>
              </div>
            </div>

            <div className="grid md:grid-cols-5 gap-4 text-sm mb-4">
              <div>
                <p className="text-text-secondary">Entry</p>
                <p className="font-bold text-primary">₹{trade.entry_price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Current</p>
                <p className="font-bold">₹{trade.current_price?.toFixed(2) || "Loading..."}</p>
              </div>
              <div>
                <p className="text-text-secondary">Target</p>
                <p className="font-bold text-success">₹{trade.target_price?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Stop Loss</p>
                <p className="font-bold text-danger">₹{trade.stop_loss?.toFixed(2)}</p>
              </div>
              <div>
                <p className="text-text-secondary">Progress</p>
                <p className="font-bold">{Math.max(0, Math.min(100, trade.progress || 0)).toFixed(0)}%</p>
              </div>
            </div>

            {/* Progress bar */}
            <div className="w-full bg-background rounded-full h-2 overflow-hidden">
              <div
                className={`h-full transition-all duration-500 ${
                  (trade.roi_percent || 0) >= 0 ? "bg-success" : "bg-danger"
                }`}
                style={{ width: `${Math.max(0, Math.min(100, trade.progress || 0))}%` }}
              />
            </div>
          </CardContent>
        </Card>
      ))}
    </div>
  )
}
