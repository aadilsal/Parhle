import { redirect } from "next/navigation"
import { createClient } from "@/lib/supabase/server"
import { SettingsPage } from "@/components/setting/settings-page"

export default async function Settings() {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()

  if (!user) {
    redirect("/auth/signin")
  }

  return <SettingsPage user={user} />
}
