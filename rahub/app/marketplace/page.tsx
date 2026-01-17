"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { createBrowserClient } from "@supabase/ssr"
import Link from "next/link"
import { SubscriptionButton } from "@/components/subscription-button"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export default function Marketplace() {
  const router = useRouter()
  const [advisors, setAdvisors] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [searchFilter, setSearchFilter] = useState("")
  const [compareIds, setCompareIds] = useState<string[]>([])
  const [subscriptions, setSubscriptions] = useState<Record<string, any>>({})
  const [investorId, setInvestorId] = useState<string | null>(null)

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

        // Fetch investor data
        const { data: investor } = await supabase
          .from("investors")
          .select("id")
          .eq("user_id", session.user.id)
          .single()

        if (investor) {
          setInvestorId(investor.id)
          
          // Fetch subscriptions
          const { data: subs } = await supabase
            .from("investor_subscriptions")
            .select("advisor_id, tier_name")
            .eq("investor_id", investor.id)
          
          // Convert to map for easy lookup
          const subsMap: Record<string, any> = {}
          subs?.forEach((sub) => {
            subsMap[sub.advisor_id] = sub
          })
          setSubscriptions(subsMap)
        }

        const { data } = await supabase
          .from("advisors")
          .select(`
            id,
            full_name,
            company_name,
            sebi_number,
            verified,
            years_experience,
            bio,
            avatar_url,
            advisor_stats (
              total_trades,
              winning_trades,
              win_rate,
              total_return_percent
            )
          `)
          .eq("verified", true)
          .order("created_at", { ascending: false })

        setAdvisors(data || [])
        setLoading(false)
      } catch (error) {
        console.error("Error fetching advisors:", error)
        setLoading(false)
      }
    }

    fetchAdvisors()
  }, [router])

  const handleLogout = async () => {
    await supabase.auth.signOut()
    router.push("/")
  }

  const refreshSubscriptions = async (advisorId: string) => {
    if (!investorId) return
    
    // Refresh subscriptions for this advisor
    const { data: subs } = await supabase
      .from("investor_subscriptions")
      .select("advisor_id, tier_name")
      .eq("investor_id", investorId)
    
    const subsMap: Record<string, any> = {}
    subs?.forEach((sub) => {
      subsMap[sub.advisor_id] = sub
    })
    setSubscriptions(subsMap)
  }

  const toggleCompare = (advisorId: string) => {
    let newIds: string[]
    if (compareIds.includes(advisorId)) {
      newIds = compareIds.filter((id) => id !== advisorId)
    } else {
      if (compareIds.length >= 5) return
      newIds = [...compareIds, advisorId]
    }
    setCompareIds(newIds)
  }

  const handleGoToCompare = () => {
    if (compareIds.length > 0) {
      router.push(`/compare?ids=${compareIds.join(",")}`)
    }
  }

  const filteredAdvisors = advisors.filter(
    (advisor) =>
      advisor.full_name.toLowerCase().includes(searchFilter.toLowerCase()) ||
      advisor.company_name?.toLowerCase().includes(searchFilter.toLowerCase()),
  )

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-primary animate-pulse">Loading advisors...</div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="bg-surface border-b border-border">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold text-primary">RA Hub Marketplace</h1>
          <div className="flex gap-4 items-center">
            <Link href="/subscriptions" className="text-text-secondary hover:text-primary transition">
              My Subscriptions
            </Link>
            <button onClick={handleLogout} className="text-text-secondary hover:text-primary transition">
              Sign Out
            </button>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Search and Compare Bar */}
        <div className="mb-8 space-y-4">
          <input
            type="text"
            placeholder="Search advisors by name or company..."
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            className="w-full bg-surface border border-border rounded-lg px-4 py-3 text-text-primary focus:outline-none focus:border-primary"
          />
          {compareIds.length > 0 && (
            <div className="bg-primary/10 border border-primary/30 rounded-lg p-4 flex justify-between items-center">
              <p className="text-text-primary">
                {compareIds.length} advisor{compareIds.length !== 1 ? "s" : ""} selected for comparison
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setCompareIds([])}
                  className="px-4 py-2 text-text-secondary hover:text-text-primary transition text-sm"
                >
                  Clear
                </button>
                <button
                  onClick={handleGoToCompare}
                  className="px-6 py-2 bg-primary text-background font-semibold rounded-lg hover:bg-primary-dark transition text-sm"
                >
                  Compare
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Advisors Grid */}
        <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
          {filteredAdvisors.length === 0 ? (
            <div className="col-span-full text-center py-12">
              <p className="text-text-secondary">No verified advisors found</p>
            </div>
          ) : (
            filteredAdvisors.map((advisor) => {
              const subscription = subscriptions[advisor.id]
              return (
                <div key={advisor.id} className="flex flex-col gap-2">
                  <Link href={`/advisor/${advisor.id}`}>
                    <div className="bg-surface border border-border rounded-lg p-6 hover:border-primary transition cursor-pointer h-full flex flex-col flex-1">
                      <div className="flex-1">
                        <h3 className="text-xl font-bold text-primary mb-1">{advisor.full_name}</h3>
                        <p className="text-text-secondary text-sm mb-2">{advisor.company_name}</p>
                        <p className="text-xs text-text-secondary mb-4">SEBI: {advisor.sebi_number}</p>
                        <p className="text-sm text-text-secondary mb-4 line-clamp-2">
                          {advisor.bio || "Trading advisor"}
                        </p>
                      </div>

                      {advisor.advisor_stats && advisor.advisor_stats.length > 0 && (
                        <div className="grid grid-cols-2 gap-2 text-sm mb-4">
                          <div className="bg-background rounded p-2">
                            <div className="text-text-secondary text-xs">Win Rate</div>
                            <div className="font-bold text-success">{advisor.advisor_stats[0].win_rate.toFixed(1)}%</div>
                          </div>
                          <div className="bg-background rounded p-2">
                            <div className="text-text-secondary text-xs">Total Trades</div>
                            <div className="font-bold text-primary">{advisor.advisor_stats[0].total_trades}</div>
                          </div>
                          <div className="bg-background rounded p-2">
                            <div className="text-text-secondary text-xs">Return</div>
                            <div
                              className={`font-bold ${
                                advisor.advisor_stats[0].total_return_percent >= 0 ? "text-success" : "text-danger"
                              }`}
                            >
                              {advisor.advisor_stats[0].total_return_percent.toFixed(2)}%
                            </div>
                          </div>
                          <div className="bg-background rounded p-2">
                            <div className="text-text-secondary text-xs">Exp</div>
                            <div className="font-bold text-primary">{advisor.years_experience}y</div>
                          </div>
                        </div>
                      )}

                      <button className="w-full bg-primary text-background font-semibold py-2 rounded-lg hover:bg-primary-dark transition">
                        View Profile
                      </button>
                    </div>
                  </Link>
                  <div className="flex gap-2">
                    <div className="flex-1">
                      <SubscriptionButton
                        advisorId={advisor.id}
                        advisorName={advisor.full_name}
                        currentTierName={subscription?.tier_name}
                        onSubscriptionChange={() => refreshSubscriptions(advisor.id)}
                      />
                    </div>
                    <button
                      onClick={() => toggleCompare(advisor.id)}
                      className={`px-4 py-2 font-medium rounded-lg transition ${
                        compareIds.includes(advisor.id)
                          ? "bg-primary text-background"
                          : "bg-text-secondary/10 text-text-secondary hover:bg-text-secondary/20"
                      }`}
                    >
                      {compareIds.includes(advisor.id) ? "✓" : "Compare"}
                    </button>
                  </div>
                </div>
              )
            })
          )}
        </div>
      </div>
    </div>
  )
}
