import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { type NextRequest, NextResponse } from "next/server"
import { logAuditEvent } from "@/lib/audit-logging"
import { isAdmin } from "@/lib/admin-utils"

export async function POST(request: NextRequest) {
  try {
    const cookieStore = await cookies()
    const cookiesToSet: Array<{ name: string; value: string; options?: any }> = []

    const withCookies = (response: NextResponse) => {
      for (const { name, value, options } of cookiesToSet) {
        response.cookies.set(name, value, options)
      }
      return response
    }

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
          setAll: (newCookies: Array<{ name: string; value: string; options?: any }>) => {
            cookiesToSet.push(...newCookies)
          },
        },
      },
    )

    const {
      data: { user },
      error: userError,
    } = await supabase.auth.getUser()

    if (userError || !user) {
      return withCookies(NextResponse.json({ error: "Unauthorized" }, { status: 401 }))
    }

    const admin = await isAdmin(user.id)
    if (!admin) {
      return withCookies(NextResponse.json({ error: "Not an admin" }, { status: 403 }))
    }

    const body = await request.json()
    const { advisorId, reason } = body

    const { error } = await supabase.from("advisors").delete().eq("id", advisorId)

    if (!error) {
      await logAuditEvent("ADVISOR_REJECTED", "advisor", advisorId, user.id, null, null, reason)

      return withCookies(NextResponse.json({ success: true }))
    }

    return withCookies(NextResponse.json({ error: "Failed to reject advisor" }, { status: 500 }))
  } catch (error) {
    console.error("Error rejecting advisor:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
