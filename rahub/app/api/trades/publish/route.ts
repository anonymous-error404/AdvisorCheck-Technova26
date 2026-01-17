import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"

export async function POST(request: Request) {
  try {
    const cookieStore = await cookies()
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

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const body = await request.json()
    const { tradeId, entryPrice } = body

    if (!tradeId || !entryPrice) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 })
    }

    // Verify the trade belongs to the advisor
    const { data: trade, error: tradeError } = await supabase
      .from("trades")
      .select("*")
      .eq("id", tradeId)
      .single()

    if (tradeError || !trade) {
      return NextResponse.json({ error: "Trade not found" }, { status: 404 })
    }

    // Get advisor to verify ownership
    const { data: advisor, error: advisorError } = await supabase
      .from("advisors")
      .select("user_id")
      .eq("id", trade.advisor_id)
      .single()

    if (advisorError || !advisor || advisor.user_id !== user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 })
    }

    // Ensure trade is still in draft
    if (trade.status !== "draft") {
      return NextResponse.json({ error: "Only draft trades can be published" }, { status: 400 })
    }

    const { error: updateError } = await supabase
      .from("trades")
      .update({
        entry_price: entryPrice,
        entry_timestamp: new Date().toISOString(),
        status: "published",
        published_at: new Date().toISOString(),
        is_immutable: true,
      })
      .eq("id", tradeId)

    if (updateError) {
      console.error("Error updating trade:", updateError)
      throw updateError
    }

    return NextResponse.json({ success: true, message: "Trade published and locked successfully" })
  } catch (error) {
    console.error("Error publishing trade:", error)
    const errorMsg = error instanceof Error ? error.message : JSON.stringify(error)
    return NextResponse.json({ error: `Failed to publish trade: ${errorMsg}` }, { status: 500 })
  }
}
