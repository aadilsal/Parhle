import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@supabase/supabase-js";

export async function POST() {
  try {
    const admin = createServerSupabase(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!
    );

    const bucketId = "pdfs";

    // Check existing buckets
    const { data: buckets, error: listError } = await admin.storage.listBuckets();
    if (listError) {
      console.error("[admin/create-pdfs-bucket] listBuckets error:", listError);
      return NextResponse.json({ error: listError.message || listError }, { status: 500 });
    }

    if (buckets?.some((b: any) => b.id === bucketId)) {
      return NextResponse.json({ ok: true, message: "bucket already exists" });
    }

    const { data, error } = await admin.storage.createBucket(bucketId, { public: false });
    if (error) {
      console.error("[admin/create-pdfs-bucket] createBucket error:", error);
      return NextResponse.json({ error: error.message || error }, { status: 500 });
    }

    return NextResponse.json({ ok: true, bucket: data });
  } catch (err: any) {
    console.error("[admin/create-pdfs-bucket] caught:", err);
    return NextResponse.json({ error: err.message || err }, { status: 500 });
  }
}
