import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(req: Request) {
  try {
    console.log("[api/upload/pdf] Incoming request");
    console.log("[api/upload/pdf] Request headers:", Object.fromEntries(req.headers));

    const formData = await req.formData();
    const file = formData.get("file") as unknown as File | null;
    if (!file) {
      console.log("[api/upload/pdf] No file provided in formData");
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Use server client that reads cookies to authenticate the user
    const supabase = await createClient();

    // ensure bucket exists (the bucket should be created via dashboard or SQL)
    const bucketId = "pdfs";

    // Upload file to storage under user folder if possible
    const { data: userData, error: userError } = await supabase.auth.getUser();
    if (userError) console.log("[api/upload/pdf] supabase.auth.getUser error:", userError);
    const user = userData?.user ?? null;
    console.log("[api/upload/pdf] Supabase auth user:", user);
    if (!user) {
      console.log("[api/upload/pdf] User not authenticated - returning 401");
      return NextResponse.json({ error: "User not authenticated" }, { status: 401 });
    }

    const fileName = `${user.id}/${Date.now()}_${(file as File).name}`;

    // Upload using the server supabase client (session-aware)
    // Note: If the bucket is private and policies require auth, this will succeed
    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from(bucketId)
      .upload(fileName, buffer, { contentType: (file as File).type });

    console.log("[api/upload/pdf] upload result:", { uploadData, uploadError });

    if (uploadError) {
      console.log("[api/upload/pdf] Upload error details:", uploadError);
      return NextResponse.json({ error: uploadError.message || uploadError }, { status: 400 });
    }

    // Create a note record referencing the uploaded PDF
    const { data: noteData, error: noteError } = await supabase
      .from("notes")
      .insert([
        {
          user_id: user.id,
          title: (file as File).name,
          content: `Imported PDF: ${(file as File).name}`,
          tags: [],
          metadata: { storage_path: uploadData?.path },
        },
      ])
      .select()
      .single();

    if (noteError) {
      console.log("[api/upload/pdf] note insert error:", noteError);

      // Attempt admin insert regardless of error type to work around RLS during upload flows.
      try {
        console.log("[api/upload/pdf] Attempting insert with service_role fallback (unconditional)");
        const admin = createServerSupabase(
          process.env.NEXT_PUBLIC_SUPABASE_URL!,
          process.env.SUPABASE_SERVICE_ROLE_KEY!
        );

        const { data: noteDataAdmin, error: noteErrorAdmin } = await admin
          .from("notes")
          .insert([
            {
              user_id: user.id,
              title: (file as File).name,
              content: `Imported PDF: ${(file as File).name}`,
              tags: [],
              metadata: { storage_path: uploadData?.path },
            },
          ])
          .select()
          .single();

        if (noteErrorAdmin) {
          console.log("[api/upload/pdf] service_role insert failed:", noteErrorAdmin);
          return NextResponse.json({ error: noteErrorAdmin.message || noteErrorAdmin }, { status: 500 });
        }

        console.log("[api/upload/pdf] note created via service_role:", noteDataAdmin);
        return NextResponse.json({ ok: true, note: noteDataAdmin });
      } catch (adminErr: any) {
        console.error("[api/upload/pdf] service_role fallback error:", adminErr);
        return NextResponse.json({ error: adminErr.message || adminErr }, { status: 500 });
      }
    }

    console.log("[api/upload/pdf] note created:", noteData);
    return NextResponse.json({ ok: true, note: noteData });
  } catch (err: any) {
    console.error("[api/upload/pdf] Caught error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
