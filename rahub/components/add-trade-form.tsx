"use client"

import type React from "react"
import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { getLiveStockPrice, STOCK_SYMBOLS } from "@/lib/market-data"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Alert, AlertDescription } from "@/components/ui/alert"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface AddTradeFormProps {
  advisorId: string
  onTradeAdded: () => void
  trade?: any // Optional trade object for editing
  onUpdate?: () => void // Callback for when trade is updated
}

export default function AddTradeForm({ advisorId, onTradeAdded, trade, onUpdate }: AddTradeFormProps) {
  const [loading, setLoading] = useState(false)
  const [publishing, setPublishing] = useState(false)
  const [livePrice, setLivePrice] = useState<number | null>(null)
  const [fetchingPrice, setFetchingPrice] = useState(false)
  const [error, setError] = useState("")
  const [success, setSuccess] = useState("")

  const [formData, setFormData] = useState({
    symbol: trade?.symbol || "",
    side: (trade?.trade_type || "LONG") as "LONG" | "SHORT",
    targetPrice: trade?.target_price?.toString() || "",
    stopLoss: trade?.stop_loss?.toString() || "",
    analysis: trade?.analysis || "",
    status: "draft" as "draft" | "published",
  })

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target
    setFormData((prev) => ({ ...prev, [name]: value }))
  }

  const handleSymbolChange = (value: string) => {
    setFormData((prev) => ({ ...prev, symbol: value }))
    setLivePrice(null)
  }

  const handleSideChange = (value: "LONG" | "SHORT") => {
    setFormData((prev) => ({ ...prev, side: value }))
  }

  const fetchLivePrice = async () => {
    if (!formData.symbol) {
      setError("Please select a stock symbol")
      return
    }

    setFetchingPrice(true)
    setError("")
    try {
      const priceData = await getLiveStockPrice(formData.symbol)
      setLivePrice(priceData.price)
    } catch (err) {
      setError("Failed to fetch live price. Please try again.")
      console.error("Error fetching price:", err)
    } finally {
      setFetchingPrice(false)
    }
  }

  const handleSaveDraft = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError("")
    setSuccess("")

    try {
      if (!formData.symbol || !formData.targetPrice || !formData.stopLoss) {
        throw new Error("Please fill in all required fields")
      }

      if (trade) {
        // Update existing trade
        const { error: updateError } = await supabase
          .from("trades")
          .update({
            symbol: formData.symbol.toUpperCase(),
            trade_type: formData.side,
            target_price: Number.parseFloat(formData.targetPrice),
            stop_loss: Number.parseFloat(formData.stopLoss),
            analysis: formData.analysis,
          })
          .eq("id", trade.id)

        if (updateError) throw updateError

        setSuccess("Trade updated successfully!")
        setTimeout(() => {
          onUpdate?.()
        }, 1000)
      } else {
        // Create new draft
        const { error: insertError } = await supabase.from("trades").insert({
          advisor_id: advisorId,
          symbol: formData.symbol.toUpperCase(),
          trade_type: formData.side,
          target_price: Number.parseFloat(formData.targetPrice),
          stop_loss: Number.parseFloat(formData.stopLoss),
          analysis: formData.analysis,
          status: "draft",
          created_at: new Date().toISOString(),
        })

        if (insertError) throw insertError

        setSuccess("Trade saved as draft successfully!")
        setFormData({
          symbol: "",
          side: "LONG",
          targetPrice: "",
          stopLoss: "",
          analysis: "",
          status: "draft",
        })
        setLivePrice(null)

        setTimeout(() => {
          onTradeAdded()
        }, 1000)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Error saving trade")
      console.error("Error saving trade:", err)
    } finally {
      setLoading(false)
    }
  }

  const handlePublish = async (e: React.FormEvent) => {
    e.preventDefault()
    setPublishing(true)
    setError("")
    setSuccess("")

    try {
      if (!formData.symbol || !formData.targetPrice || !formData.stopLoss || !livePrice) {
        throw new Error("Please fill all fields and fetch live price before publishing")
      }

      let tradeId: string

      if (trade) {
        // Update existing trade
        const { error: updateError } = await supabase
          .from("trades")
          .update({
            symbol: formData.symbol.toUpperCase(),
            trade_type: formData.side,
            target_price: Number.parseFloat(formData.targetPrice),
            stop_loss: Number.parseFloat(formData.stopLoss),
            analysis: formData.analysis,
          })
          .eq("id", trade.id)

        if (updateError) throw updateError
        tradeId = trade.id
      } else {
        // First create the draft trade
        const { data: tradeData, error: insertError } = await supabase.from("trades").insert({
          advisor_id: advisorId,
          symbol: formData.symbol.toUpperCase(),
          trade_type: formData.side,
          target_price: Number.parseFloat(formData.targetPrice),
          stop_loss: Number.parseFloat(formData.stopLoss),
          description: formData.analysis,
          status: "draft",
          is_immutable: false,
          created_at: new Date().toISOString(),
        }).select()

        if (insertError) {
          throw new Error(`Failed to create draft trade: ${insertError.message}`)
        }
        if (!tradeData || tradeData.length === 0) {
          throw new Error("Failed to create trade - no data returned")
        }

        tradeId = tradeData[0].id
      }

      // Then publish it via API
      const response = await fetch("/api/trades/publish", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ tradeId, entryPrice: livePrice }),
      })

      let result
      try {
        result = await response.json()
      } catch (parseErr) {
        throw new Error(`Failed to parse API response: ${response.statusText}`)
      }

      if (!response.ok) {
        throw new Error(result?.error || `API Error: ${response.status} ${response.statusText}`)
      }

      setSuccess("Trade published successfully! Entry price is now locked and immutable.")
      setFormData({
        symbol: "",
        side: "LONG",
        targetPrice: "",
        stopLoss: "",
        analysis: "",
        status: "draft",
      })
      setLivePrice(null)

      setTimeout(() => {
        onTradeAdded()
      }, 1000)
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : JSON.stringify(err) || "Error publishing trade"
      setError(errorMessage)
      console.error("Error publishing trade:", err)
    } finally {
      setPublishing(false)
    }
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>{trade ? "Edit Trade" : "Add New Trade"}</CardTitle>
          <CardDescription>
            {trade ? "Update your draft trade details" : "Create a draft trade or publish immediately with locked entry price"}
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form className="space-y-6">
            {error && (
              <Alert className="border-danger bg-danger/10">
                <AlertDescription className="text-danger">{error}</AlertDescription>
              </Alert>
            )}

            {success && (
              <Alert className="border-success bg-success/10">
                <AlertDescription className="text-success">{success}</AlertDescription>
              </Alert>
            )}

            {/* Stock Symbol Selection */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="symbol">Stock Symbol *</Label>
                <Select value={formData.symbol} onValueChange={handleSymbolChange}>
                  <SelectTrigger id="symbol" className="w-full">
                    <SelectValue placeholder="Select stock..." />
                  </SelectTrigger>
                  <SelectContent>
                    {STOCK_SYMBOLS.map((symbol) => (
                      <SelectItem key={symbol} value={symbol}>
                        {symbol}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="side">Trade Side *</Label>
                <Select value={formData.side} onValueChange={handleSideChange}>
                  <SelectTrigger id="side" className="w-full">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="LONG">Long</SelectItem>
                    <SelectItem value="SHORT">Short</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>

            {/* Live Price Section */}
            <div className="bg-surface border border-border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <p className="text-sm font-medium">Live Market Price</p>
                  {livePrice ? (
                    <div className="mt-2">
                      <p className="text-3xl font-bold text-primary">₹{livePrice.toFixed(2)}</p>
                      <p className="text-xs text-text-secondary">This will be locked as entry price on publish</p>
                    </div>
                  ) : (
                    <p className="text-text-secondary text-sm mt-2">Fetch current market price</p>
                  )}
                </div>
                <Button
                  type="button"
                  variant="outline"
                  onClick={fetchLivePrice}
                  disabled={!formData.symbol || fetchingPrice}
                  className="mt-1 bg-transparent"
                >
                  {fetchingPrice ? "Fetching..." : "Fetch Price"}
                </Button>
              </div>
            </div>

            {/* Target & Stop Loss */}
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <Label htmlFor="targetPrice">Target Price *</Label>
                <Input
                  id="targetPrice"
                  type="number"
                  name="targetPrice"
                  value={formData.targetPrice}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
              <div>
                <Label htmlFor="stopLoss">Stop Loss *</Label>
                <Input
                  id="stopLoss"
                  type="number"
                  name="stopLoss"
                  value={formData.stopLoss}
                  onChange={handleChange}
                  step="0.01"
                  placeholder="0.00"
                  className="w-full"
                />
              </div>
            </div>

            {/* Analysis */}
            <div>
              <Label htmlFor="analysis">Trade Analysis</Label>
              <Textarea
                id="analysis"
                name="analysis"
                value={formData.analysis}
                onChange={handleChange}
                placeholder="Share your analysis, technical levels, and reasoning..."
                rows={4}
                className="w-full"
              />
            </div>

            {/* Buttons */}
            <div className="flex gap-4 pt-4">
              <Button type="button" variant="outline" onClick={handleSaveDraft} disabled={loading}>
                {loading ? "Saving..." : trade ? "Update Draft" : "Save as Draft"}
              </Button>
              <Button
                type="button"
                onClick={handlePublish}
                disabled={publishing || !livePrice}
                className="bg-primary text-background hover:bg-primary-dark"
              >
                {publishing ? "Publishing..." : trade ? "Publish Updated Trade" : "Publish Trade (Lock Entry Price)"}
              </Button>
            </div>

            <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
              <p className="text-sm text-primary font-medium">🔒 Immutability Notice</p>
              <p className="text-xs text-text-secondary mt-1">
                Once published, your trade entry price will be locked at the current market rate. Published trades
                cannot be edited or deleted, ensuring complete transparency and accountability.
              </p>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  )
}
