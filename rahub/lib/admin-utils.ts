import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function isAdmin(userId: string): Promise<boolean> {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
          setAll: (_newCookies: Array<{ name: string; value: string; options?: any }>) => {},
        },
      },
    )

    const { data } = await supabase.from("admins").select("id").eq("user_id", userId).single()

    return !!data
  } catch (error) {
    return false
  }
}

export async function getPendingAdvisors() {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
          setAll: (_newCookies: Array<{ name: string; value: string; options?: any }>) => {},
        },
      },
    )

    const { data } = await supabase
      .from("advisors")
      .select("*")
      .eq("verified", false)
      .order("created_at", { ascending: true })

    return data || []
  } catch (error) {
    console.error("Failed to fetch pending advisors:", error)
    return []
  }
}

export async function verifyAdvisor(advisorId: string, adminId: string, notes?: string) {
  try {
    const cookieStore = await cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          getAll: () => cookieStore.getAll().map(({ name, value }) => ({ name, value })),
          setAll: (_newCookies: Array<{ name: string; value: string; options?: any }>) => {},
        },
      },
    )

    const { error } = await supabase
      .from("advisors")
      .update({ verified: true, verification_date: new Date().toISOString() })
      .eq("id", advisorId)

    return !error
  } catch (error) {
    console.error("Failed to verify advisor:", error)
    return false
  }
}
