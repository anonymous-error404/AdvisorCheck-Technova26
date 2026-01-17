import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll() {
            return cookieStore.getAll()
          },
          setAll(cookiesToSet) {
            cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options))
          },
        },
      },
    )

    const { advisorId, tierName } = await request.json()

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()
    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // Get investor ID
    const { data: investor } = await supabase.from("investors").select("id").eq("user_id", user.id).single()

    if (!investor) {
      return NextResponse.json({ error: "Investor not found" }, { status: 404 })
    }

    // Verify advisor exists and is verified
    const { data: advisor, error: advisorError } = await supabase
      .from("advisors")
      .select("verified")
      .eq("id", advisorId)
      .single()

    if (advisorError || !advisor) {
      return NextResponse.json({ error: "Advisor not found" }, { status: 404 })
    }

    if (!advisor.verified) {
      return NextResponse.json({ error: "Can only subscribe to verified advisors" }, { status: 403 })
    }

    // Check existing subscription
    const { data: existingSub } = await supabase
      .from("investor_subscriptions")
      .select("id")
      .eq("investor_id", investor.id)
      .eq("advisor_id", advisorId)
      .single()

    if (existingSub) {
      return NextResponse.json({ error: "Already subscribed" }, { status: 400 })
    }

    // Create subscription (free for now, all tiers)
    const { data: subscription, error } = await supabase
      .from("investor_subscriptions")
      .insert([
        {
          investor_id: investor.id,
          advisor_id: advisorId,
          tier_name: tierName || "free",
          status: "active",
        },
      ])
      .select()
      .single()

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 400 })
    }

    return NextResponse.json(subscription)
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 })
  }
}
