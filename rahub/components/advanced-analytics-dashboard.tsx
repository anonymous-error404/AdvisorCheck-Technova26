"use client"

import { useEffect, useState } from "react"
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Legend, ResponsiveContainer } from "recharts"
import { ChartContainer, ChartTooltip, ChartTooltipContent } from "@/components/ui/chart"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import {
  calculateMonthlyPerformance,
  calculateAllRiskMetrics,
  type MonthlyPerformance,
  type RiskMetrics,
} from "@/lib/advanced-analytics"

interface AdvancedAnalyticsDashboardProps {
  trades: any[]
}

export function AdvancedAnalyticsDashboard({ trades }: AdvancedAnalyticsDashboardProps) {
  const [monthlyPerformance, setMonthlyPerformance] = useState<MonthlyPerformance[]>([])
  const [riskMetrics, setRiskMetrics] = useState<RiskMetrics | null>(null)

  useEffect(() => {
    if (trades && trades.length > 0) {
      const monthly = calculateMonthlyPerformance(trades)
      setMonthlyPerformance(monthly)

      const metrics = calculateAllRiskMetrics(trades)
      setRiskMetrics(metrics)
    }
  }, [trades])

  if (!monthlyPerformance.length || !riskMetrics) {
    return (
      <div className="bg-surface border border-border rounded-lg p-8 text-center">
        <p className="text-text-secondary">Insufficient data for advanced analytics</p>
      </div>
    )
  }

  // Format data for charts
  const chartData = monthlyPerformance.map((m) => ({
    month: new Date(m.month).toLocaleDateString("en-US", { month: "short", year: "2-digit" }),
    winRate: Number.parseFloat(m.winRate.toFixed(1)),
    totalReturn: Number.parseFloat(m.totalReturn.toFixed(2)),
    avgReturnPerTrade: Number.parseFloat(m.avgReturnPerTrade.toFixed(2)),
  }))

  return (
    <div className="space-y-6">
      {/* Risk Metrics Grid */}
      <div className="grid md:grid-cols-5 gap-4">
        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">Sharpe Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{riskMetrics.sharpeRatio.toFixed(2)}</div>
            <p className="text-xs text-text-secondary mt-1">Risk-adjusted returns</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">Max Drawdown</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${riskMetrics.maxDrawdown > -5 ? "text-success" : "text-danger"}`}>
              {riskMetrics.maxDrawdown.toFixed(2)}%
            </div>
            <p className="text-xs text-text-secondary mt-1">Largest peak-to-trough</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">Sortino Ratio</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{riskMetrics.sortinoRatio.toFixed(2)}</div>
            <p className="text-xs text-text-secondary mt-1">Downside risk-adjusted</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">Volatility</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold text-primary">{riskMetrics.volatility.toFixed(2)}%</div>
            <p className="text-xs text-text-secondary mt-1">Annual std deviation</p>
          </CardContent>
        </Card>

        <Card className="bg-surface border-border">
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-text-secondary">Recovery Factor</CardTitle>
          </CardHeader>
          <CardContent>
            <div className={`text-3xl font-bold ${riskMetrics.recoveryFactor > 2 ? "text-success" : "text-warning"}`}>
              {riskMetrics.recoveryFactor.toFixed(2)}x
            </div>
            <p className="text-xs text-text-secondary mt-1">Return vs drawdown</p>
          </CardContent>
        </Card>
      </div>

      {/* Win Rate Trend */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Win Rate Trend</CardTitle>
          <CardDescription>Monthly win rate percentage over time</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              winRate: {
                label: "Win Rate %",
                color: "hsl(var(--color-success))",
              },
            }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E333A" />
                <XAxis dataKey="month" stroke="#B7BDC6" />
                <YAxis stroke="#B7BDC6" domain={[0, 100]} />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Line
                  type="monotone"
                  dataKey="winRate"
                  stroke="#0ECB81"
                  strokeWidth={2}
                  dot={{ fill: "#0ECB81", r: 4 }}
                  activeDot={{ r: 6 }}
                  name="Win Rate %"
                />
              </LineChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Monthly Returns Chart */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Monthly Returns</CardTitle>
          <CardDescription>Total and average returns per month</CardDescription>
        </CardHeader>
        <CardContent>
          <ChartContainer
            config={{
              totalReturn: {
                label: "Total Return %",
                color: "hsl(var(--color-primary))",
              },
              avgReturnPerTrade: {
                label: "Avg Return/Trade %",
                color: "hsl(var(--color-success))",
              },
            }}
            className="h-80"
          >
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="#2E333A" />
                <XAxis dataKey="month" stroke="#B7BDC6" />
                <YAxis stroke="#B7BDC6" />
                <ChartTooltip content={<ChartTooltipContent />} />
                <Legend />
                <Bar dataKey="totalReturn" fill="#FCD535" name="Total Return %" radius={[8, 8, 0, 0]} />
                <Bar dataKey="avgReturnPerTrade" fill="#0ECB81" name="Avg Return/Trade %" radius={[8, 8, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </ChartContainer>
        </CardContent>
      </Card>

      {/* Risk Metrics Explanation */}
      <Card className="bg-surface border-border">
        <CardHeader>
          <CardTitle>Risk Metrics Explained</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <h4 className="font-semibold text-primary mb-2">Sharpe Ratio</h4>
            <p className="text-sm text-text-secondary">
              Measures risk-adjusted returns. Higher is better. A ratio above 1.0 is considered good.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-2">Max Drawdown</h4>
            <p className="text-sm text-text-secondary">
              The largest peak-to-trough decline. Shows worst-case loss. Less negative is better.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-2">Sortino Ratio</h4>
            <p className="text-sm text-text-secondary">
              Like Sharpe but only penalizes downside volatility. Better reflects downside risk management.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-2">Volatility</h4>
            <p className="text-sm text-text-secondary">
              Annual standard deviation of returns. Measures how much returns vary month-to-month.
            </p>
          </div>
          <div>
            <h4 className="font-semibold text-primary mb-2">Recovery Factor</h4>
            <p className="text-sm text-text-secondary">
              Total return divided by max drawdown. Shows ability to recover from losses. Higher is better.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
