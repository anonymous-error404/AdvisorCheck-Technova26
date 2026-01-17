"use client"

import { useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Copy, X } from "lucide-react"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

interface CopyTradingModalProps {
  advisorId: string
  advisorName: string
  onClose: () => void
}

export function CopyTradingModal({ advisorId, advisorName, onClose }: CopyTradingModalProps) {
  const [loading, setLoading] = useState(false)
  const [investmentAmount, setInvestmentAmount] = useState(10000)
  const [copied, setCopied] = useState(false)

  const handleCopyPortfolio = async () => {
    setLoading(true)
    try {
      const {
        data: { session },
      } = await supabase.auth.getSession()

      if (!session) {
        alert("Please login to copy trades")
        setLoading(false)
        return
      }

      // Create copy portfolio record
      const { error } = await supabase.from("copy_portfolios").insert([
        {
          investor_id: session.user.id,
          advisor_id: advisorId,
          investment_amount: investmentAmount,
          status: "active",
        },
      ])

      if (!error) {
        setCopied(true)
        setTimeout(() => {
          onClose()
        }, 2000)
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <Card className="w-full max-w-md mx-4">
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Copy {advisorName}'s Portfolio</CardTitle>
          <button onClick={onClose} className="text-text-secondary hover:text-text-primary">
            <X size={20} />
          </button>
        </CardHeader>
        <CardContent className="space-y-4">
          {copied ? (
            <div className="bg-success/20 text-success p-4 rounded-lg text-center">
              <p className="font-medium">Portfolio copied successfully!</p>
              <p className="text-sm">You'll now automatically copy all trades from {advisorName}</p>
            </div>
          ) : (
            <>
              <div>
                <label className="text-sm font-medium mb-2 block">Investment Amount (₹)</label>
                <input
                  type="number"
                  value={investmentAmount}
                  onChange={(e) => setInvestmentAmount(Number(e.target.value))}
                  min="1000"
                  step="1000"
                  className="w-full bg-background border border-border rounded-lg p-3"
                />
              </div>

              <div className="bg-primary/10 border border-primary/20 rounded-lg p-4">
                <p className="text-sm text-text-secondary mb-2">How it works:</p>
                <ul className="text-sm text-text-secondary space-y-1">
                  <li>• You'll copy {advisorName}'s published trades</li>
                  <li>• Each trade is executed with proportional allocation</li>
                  <li>• Your portfolio's performance tracked separately</li>
                  <li>• Cancel anytime</li>
                </ul>
              </div>

              <div className="flex gap-2">
                <Button onClick={onClose} variant="outline" className="flex-1 bg-transparent">
                  Cancel
                </Button>
                <Button onClick={handleCopyPortfolio} disabled={loading} className="flex-1 bg-primary text-background">
                  <Copy size={18} />
                  Copy Portfolio
                </Button>
              </div>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
