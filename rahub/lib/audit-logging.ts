import { createServerClient } from "@supabase/ssr"
import { cookies } from "next/headers"

export async function logAuditEvent(
  action: string,
  entityType: string,
  entityId: string,
  actorId: string,
  oldValues?: any,
  newValues?: any,
  reason?: string,
) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => cookieStore.set(name, value, options),
          remove: (name: string, options: any) => cookieStore.delete(name),
        },
      },
    )

    const { error } = await supabase.from("audit_logs").insert({
      action,
      entity_type: entityType,
      entity_id: entityId,
      actor_id: actorId,
      actor_type: "admin",
      old_values: oldValues,
      new_values: newValues,
      reason,
    })

    if (error) {
      console.error("Audit logging error:", error)
    }
  } catch (error) {
    console.error("Failed to log audit event:", error)
  }
}

export async function getAuditLogs(filters?: { action?: string; entityType?: string; limit?: number }) {
  try {
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get: (name: string) => cookieStore.get(name)?.value,
          set: (name: string, value: string, options: any) => cookieStore.set(name, value, options),
          remove: (name: string, options: any) => cookieStore.delete(name),
        },
      },
    )

    let query = supabase.from("audit_logs").select("*")

    if (filters?.action) {
      query = query.eq("action", filters.action)
    }

    if (filters?.entityType) {
      query = query.eq("entity_type", filters.entityType)
    }

    const { data } = await query.order("created_at", { ascending: false }).limit(filters?.limit || 100)

    return data || []
  } catch (error) {
    console.error("Failed to fetch audit logs:", error)
    return []
  }
}
