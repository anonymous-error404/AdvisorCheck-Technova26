"use client"

import { useEffect, useState } from "react"
import { createBrowserClient } from "@supabase/ssr"
import { Button } from "@/components/ui/button"
import { Heart } from "lucide-react"

const supabase = createBrowserClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!)

export function FollowButton({
  advisorId,
  showFollowerCount = false,
}: { advisorId: string; showFollowerCount?: boolean }) {
  const [isFollowing, setIsFollowing] = useState(false)
  const [investorId, setInvestorId] = useState<string | null>(null)
  const [followerCount, setFollowerCount] = useState(0)
  const [loading, setLoading] = useState(false)

  useEffect(() => {
    const getSession = async () => {
      const {
        data: { session },
      } = await supabase.auth.getSession()
      if (!session) {
        setInvestorId(null)
        return
      }

      // Map auth user to investor id (investors table)
      try {
        const { data: investor } = await supabase.from("investors").select("id").eq("user_id", session.user.id).single()
        setInvestorId(investor?.id || null)
      } catch (err) {
        setInvestorId(null)
      }
    }
    getSession()

    // fetch follower count and follow status once we have investorId
    fetchFollowerCount()
    // fetchFollowStatus will be invoked once investorId is set (below)
  }, [advisorId])

  useEffect(() => {
    if (!investorId) return
    fetchFollowStatus()
  }, [investorId])

  const fetchFollowStatus = async () => {
    if (!investorId) return

    try {
      const { data } = await supabase
        .from("advisor_followers")
        .select("id")
        .eq("advisor_id", advisorId)
        .eq("investor_id", investorId)
        .single()

      setIsFollowing(!!data)
    } catch (err) {
      setIsFollowing(false)
    }
  }

  const fetchFollowerCount = async () => {
    const { count } = await supabase
      .from("advisor_followers")
      .select("id", { count: "exact" })
      .eq("advisor_id", advisorId)

    setFollowerCount(count || 0)
  }

  const handleToggleFollow = async () => {
    if (!investorId) return

    setLoading(true)

    try {
      if (isFollowing) {
        await supabase.from("advisor_followers").delete().eq("advisor_id", advisorId).eq("investor_id", investorId)
        setIsFollowing(false)
        setFollowerCount((c) => Math.max(0, c - 1))
      } else {
        await supabase.from("advisor_followers").insert([{ advisor_id: advisorId, investor_id: investorId }])
        setIsFollowing(true)
        setFollowerCount((c) => c + 1)
      }
    } catch (err) {
      console.error("Follow toggle failed:", err)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="flex flex-col gap-2">
      <Button
        onClick={handleToggleFollow}
        disabled={loading || !investorId}
        className={`${isFollowing ? "bg-primary/20 text-primary border border-primary" : "bg-primary text-background"}`}
      >
        <Heart size={18} className={isFollowing ? "fill-primary" : ""} />
        {isFollowing ? "Following" : "Follow"}
      </Button>
      {showFollowerCount && <p className="text-xs text-text-secondary text-center">{followerCount} followers</p>}
    </div>
  )
}
