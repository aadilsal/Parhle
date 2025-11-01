import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { HomePage } from "@/components/home/home-page";
export default async function Home() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (user) {
    redirect("/dashboard");
  }

  // Show landing page for non-authenticated users
  return <HomePage />;
}
