import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData.user;
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    // Get all notes (files) for the user
    const { data: notes, error: notesError } = await supabase
      .from("notes")
      .select("id, title, content, created_at, category_id, tags")
      .eq("user_id", user.id)
      .is("deleted_at", null)
      .order("created_at", { ascending: false });

    if (notesError) throw notesError;

    // Calculate file statistics
    const totalFiles = notes?.length || 0;

    // Estimate total size (rough calculation based on content length)
    const totalSize = notes?.reduce((acc, note) => {
      const contentSize = note.content ? note.content.length * 2 : 0; // Rough UTF-8 estimation
      const titleSize = note.title ? note.title.length * 2 : 0;
      return acc + contentSize + titleSize;
    }, 0) || 0;

    // Get recent uploads (last 10)
    const recentUploads = notes?.slice(0, 10).map(note => ({
      id: note.id,
      title: note.title,
      created_at: note.created_at,
      file_size: note.content ? note.content.length * 2 : 0, // Rough estimation
      category_id: note.category_id,
      tags: note.tags
    })) || [];

    // Get files by category (would need category join for names)
    const filesByCategory = [
      { category: "All Files", count: totalFiles, size: totalSize }
    ];

    return NextResponse.json({
      totalFiles,
      totalSize,
      recentUploads,
      filesByCategory
    });
  } catch (error) {
    console.error("Error fetching file stats:", error);
    return NextResponse.json({ error: "Failed to fetch file statistics" }, { status: 500 });
  }
}