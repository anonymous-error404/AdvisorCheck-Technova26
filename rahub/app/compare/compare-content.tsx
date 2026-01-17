"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function CompareContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const [advisors, setAdvisors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchInput, setSearchInput] = useState("")
  const [selectedAdvisors, setSelectedAdvisors] = useState<string[]>([])
  const [allAdvisors, setAllAdvisors] = useState<any[]>([])

  useEffect(() => {
    const fetchAdvisors = async () => {
      try {
        const {
          data: { session },
        } = await supabase.auth.getSession()
        if (!session) {
          router.push("/auth/login")
          return
        }

        const { data } = await supabase
          .from("advisors")
          .select(
            `
            id,
            full_name,
            company_name,
            sebi_number,
            years_experience,
            bio,
            verified,
            advisor_stats (
              total_trades,
              winning_trades,
              losing_trades,
              win_rate,
              total_return_percent,
              trust_score,
              avg_winning_trade,
              avg_losing_trade
            )
          `,
          )
          .eq("verified", true)

        setAllAdvisors(data || [])

        // Check if advisors are in URL params
        const advisorIds = searchParams.get("ids")?.split(",") || []
        if (advisorIds.length > 0) {
          const compared = (data || []).filter((a) => advisorIds.includes(a.id))
          setAdvisors(compared)
          setSelectedAdvisors(advisorIds)
        }

        setLoading(false)
      } catch (error) {
        console.error("Error fetching advisors:", error)
        setLoading(false)
      }
    }

    fetchAdvisors()
  }, [router, searchParams])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const toggleAdvisor = (id: string) => {
    let newSelected: string[]
    if (selectedAdvisors.includes(id)) {
      newSelected = selectedAdvisors.filter((a) => a !== id)
    } else {
      if (selectedAdvisors.length >= 5) {
        return // Max 5 advisors
      }
      newSelected = [...selectedAdvisors, id]
    }
    setSelectedAdvisors(newSelected)
    const compareAdvisors = allAdvisors.filter((a) => newSelected.includes(a.id))
    setAdvisors(compareAdvisors)

    // Update URL
    if (newSelected.length > 0) {
      router.push(`/compare?ids=${newSelected.join(",")}`)
    } else {
      router.push("/compare")
    }
  }

  const filteredAvailableAdvisors = allAdvisors
    .filter(
      (a) =>
        (a.full_name.toLowerCase().includes(searchInput.toLowerCase()) ||
          a.company_name?.toLowerCase().includes(searchInput.toLowerCase())) &&
        !selectedAdvisors.includes(a.id),
    )
    .slice(0, 5)

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading comparison tool...</div>
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
              Marketplace
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
        {/* Title */}
        <Card className="mb-8">
          <CardHeader>
            <CardTitle className="text-3xl">Compare Advisors</CardTitle>
            <p className="text-text-secondary mt-2">Side-by-side comparison of trading performance and metrics</p>
          </CardHeader>
        </Card>

        <div className="grid lg:grid-cols-4 gap-6">
          {/* Search Sidebar */}
          <Card className="lg:sticky lg:top-24 lg:h-fit">
            <CardHeader>
              <CardTitle className="text-lg">Select Advisors</CardTitle>
              <p className="text-xs text-text-secondary mt-2">{selectedAdvisors.length}/5 selected</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <input
                type="text"
                placeholder="Search advisors..."
                value={searchInput}
                onChange={(e) => setSearchInput(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-2 text-sm text-text-primary focus:outline-none focus:border-primary"
              />

              {/* Selected Advisors */}
              {selectedAdvisors.length > 0 && (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-medium text-text-secondary">Selected:</p>
                  {advisors.map((advisor) => (
                    <div
                      key={advisor.id}
                      className="bg-background p-2 rounded border border-primary/20 flex justify-between items-center"
                    >
                      <div className="text-sm">
                        <p className="font-medium text-primary">{advisor.full_name}</p>
                        <p className="text-xs text-text-secondary">{advisor.company_name}</p>
                      </div>
                      <button
                        onClick={() => toggleAdvisor(advisor.id)}
                        className="text-xs text-danger hover:text-danger-dark transition font-medium"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                </div>
              )}

              {/* Available Advisors */}
              {filteredAvailableAdvisors.length > 0 && (
                <div className="space-y-2 border-t border-border pt-4">
                  <p className="text-xs font-medium text-text-secondary">Available:</p>
                  {filteredAvailableAdvisors.map((advisor) => (
                    <button
                      key={advisor.id}
                      onClick={() => toggleAdvisor(advisor.id)}
                      className="w-full text-left bg-background p-2 rounded border border-border hover:border-primary/50 transition text-sm"
                    >
                      <p className="font-medium text-text-primary hover:text-primary">{advisor.full_name}</p>
                      <p className="text-xs text-text-secondary">{advisor.company_name}</p>
                    </button>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>

          {/* Comparison Table */}
          <div className="lg:col-span-3">
            {advisors.length === 0 ? (
              <Card>
                <CardContent className="pt-12 text-center">
                  <p className="text-text-secondary mb-4">Select advisors to compare their performance metrics</p>
                  <Link
                    href="/marketplace"
                    className="inline-block px-6 py-2 bg-primary text-background rounded-lg hover:bg-primary-dark transition"
                  >
                    Browse All Advisors
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <div className="space-y-4">
                {/* Metrics Cards */}
                {[
                  {
                    title: "Win Rate",
                    key: "win_rate",
                    suffix: "%",
                    format: (v: number) => v.toFixed(1),
                    color: "success",
                  },
                  {
                    title: "Total Return",
                    key: "total_return_percent",
                    suffix: "%",
                    format: (v: number) => v.toFixed(2),
                    color: "text",
                  },
                  {
                    title: "Total Trades",
                    key: "total_trades",
                    suffix: "",
                    format: (v: number) => v,
                    color: "primary",
                  },
                  {
                    title: "Winning Trades",
                    key: "winning_trades",
                    suffix: "",
                    format: (v: number) => v,
                    color: "success",
                  },
                  {
                    title: "Losing Trades",
                    key: "losing_trades",
                    suffix: "",
                    format: (v: number) => v,
                    color: "danger",
                  },
                  {
                    title: "Avg Winning Trade",
                    key: "avg_winning_trade",
                    suffix: "%",
                    format: (v: number) => v.toFixed(2),
                    color: "success",
                  },
                  {
                    title: "Avg Losing Trade",
                    key: "avg_losing_trade",
                    suffix: "%",
                    format: (v: number) => v.toFixed(2),
                    color: "danger",
                  },
                  {
                    title: "Trust Score",
                    key: "trust_score",
                    suffix: "/100",
                    format: (v: number) => v.toFixed(0),
                    color: "primary",
                  },
                ].map((metric) => (
                  <Card key={metric.key} className="border-primary/30">
                    <CardContent className="pt-6">
                      <p className="text-sm font-medium text-text-secondary mb-4">{metric.title}</p>
                      <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${advisors.length}, 1fr)` }}>
                        {advisors.map((advisor) => {
                          const stats = advisor.advisor_stats[0]
                          const value = stats[metric.key as keyof typeof stats]
                          const formatted = metric.format(value || 0)
                          const colorClass =
                            metric.color === "success"
                              ? "text-success"
                              : metric.color === "danger"
                                ? "text-danger"
                                : metric.color === "primary"
                                  ? "text-primary"
                                  : "text-text-primary"

                          return (
                            <div key={advisor.id} className="bg-background rounded p-3 text-center">
                              <p className="text-xs text-text-secondary mb-2 line-clamp-2">{advisor.full_name}</p>
                              <p className={`text-2xl font-bold ${colorClass}`}>
                                {formatted}
                                <span className="text-sm ml-1">{metric.suffix}</span>
                              </p>
                            </div>
                          )
                        })}
                      </div>
                    </CardContent>
                  </Card>
                ))}

                {/* Details Section */}
                <Card className="border-primary/30">
                  <CardHeader>
                    <CardTitle className="text-lg">Advisor Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${advisors.length}, 1fr)` }}>
                      {advisors.map((advisor) => (
                        <div key={advisor.id} className="bg-background rounded p-4 border border-border">
                          <p className="font-bold text-primary mb-3">{advisor.full_name}</p>
                          <div className="space-y-2 text-sm">
                            <div>
                              <p className="text-text-secondary">Company</p>
                              <p className="font-medium">{advisor.company_name}</p>
                            </div>
                            <div>
                              <p className="text-text-secondary">SEBI</p>
                              <p className="font-medium text-xs">{advisor.sebi_number}</p>
                            </div>
                            <div>
                              <p className="text-text-secondary">Experience</p>
                              <p className="font-medium">{advisor.years_experience} years</p>
                            </div>
                            <Link
                              href={`/advisor/${advisor.id}`}
                              className="inline-block mt-3 px-3 py-1 bg-primary text-background text-xs rounded hover:bg-primary-dark transition"
                            >
                              View Profile
                            </Link>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
