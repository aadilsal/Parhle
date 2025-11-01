import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const filename = body?.filename;
    if (!filename) return NextResponse.json({ error: "filename required" }, { status: 400 });

    const bucketId = "pdfs";

    // Resolve the user from the incoming cookies (session-aware)
    const supabase = await createClient();
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) console.log("[api/upload/pdf/presign] supabase.auth.getUser error:", userError);
    const user = userData?.user ?? null;
    if (!user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

    // Build a safe path for the user
    const filePath = `${user.id}/${Date.now()}_${filename}`;

    // Use the service role client to create a signed upload URL/token
    const admin = createServerSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const { data: signedData, error: signedError } = await admin.storage
      .from(bucketId)
      .createSignedUploadUrl(filePath, { upsert: false });

    if (signedError) {
      console.log("[api/upload/pdf/presign] createSignedUploadUrl error:", signedError);
      return NextResponse.json({ error: signedError.message || signedError }, { status: 500 });
    }

    return NextResponse.json({ ok: true, data: signedData });
  } catch (err: any) {
    console.error("[api/upload/pdf/presign] Caught error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
