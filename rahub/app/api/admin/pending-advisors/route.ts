import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"
import { NextResponse } from "next/server"
import { isAdmin } from "@/lib/admin-utils"

export async function GET() {
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

    const { data, error } = await supabase
      .from("advisors")
      .select("*")
      .eq("verified", false)
      .order("created_at", { ascending: true })

    if (error) {
      return withCookies(NextResponse.json({ error: "Failed to fetch advisors" }, { status: 500 }))
    }

    return withCookies(NextResponse.json({ advisors: data || [] }))
  } catch (error) {
    console.error("Error fetching pending advisors:", error)
    return NextResponse.json({ error: "Internal server error" }, { status: 500 })
  }
}
