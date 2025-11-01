import { NextResponse } from "next/server";
import { createClient as createServerSupabase } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";
import pdf from "pdf-parse";
import { embedText, saveVectors } from "@/lib/embeddings";

// Simple chunker: split text into ~chunkSize-character chunks with overlap.
// Uses a fixed step (chunkSize - overlap) to avoid infinite loops when text length < chunkSize.
function chunkText(text: string, chunkSize = 1000, overlap = 200) {
  if (!text) return [];
  if (chunkSize <= 0) throw new Error("chunkSize must be > 0");
  if (overlap < 0) overlap = 0;
  const step = chunkSize - overlap;
  if (step <= 0) throw new Error("chunkSize must be larger than overlap");

  const chunks: string[] = [];
  for (let start = 0; start < text.length; start += step) {
    const end = Math.min(start + chunkSize, text.length);
    const chunk = text.slice(start, end).trim();
    if (chunk) chunks.push(chunk);
    if (end === text.length) break;
  }
  return chunks;
}

// Canonical single implementation for PDF complete route.
export async function POST(req: Request) {
  try {
    const body = await req.json();
    const { path, title } = body ?? {};
    if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

    const supabase = await createClient();
    const { data: userData } = await supabase.auth.getUser();
    const user = userData?.user ?? null;
    if (!user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

    console.debug("[api/upload/pdf/complete] start", { path, title, userId: user.id });

    const payloadBase: any = {
      user_id: user.id,
      title: title ?? path.split("/").pop(),
      content: `Imported PDF: ${title ?? path.split("/").pop()}`,
      tags: [],
    };

    // Attempt server-side extraction using service role client if configured
    let extractedText: string | null = null;
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const admin = createServerSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data: fileData, error: downloadError } = await admin.storage.from("pdfs").download(path);
        if (!downloadError && fileData) {
          const arrayBuffer = await (fileData as any).arrayBuffer();
          const buffer = Buffer.from(arrayBuffer);
          try {
            const pdfResult: any = await pdf(buffer as Buffer);
            extractedText = pdfResult?.text ? String(pdfResult.text).trim() : null;
            console.debug("[api/upload/pdf/complete] extracted length", extractedText ? extractedText.length : 0);
          } catch (parseErr: any) {
            console.error("[api/upload/pdf/complete] pdf-parse failed:", parseErr);
          }
        } else if (downloadError) {
          console.debug("[api/upload/pdf/complete] storage download error", downloadError);
        }
      } catch (err: any) {
        console.error("[api/upload/pdf/complete] download/extract error:", err);
      }
    } else {
      console.debug("[api/upload/pdf/complete] service role not configured; skipping server-side extraction");
    }

    if (extractedText) {
      const maxLen = 40_000;
      payloadBase.content = extractedText.length > maxLen ? extractedText.slice(0, maxLen) + "\n\n[Truncated]" : extractedText;
    } else {
      payloadBase.content = `${payloadBase.content} (storage_path: ${path})`;
    }

    // If a Supabase service role is available we prefer using it here for inserts
    // to avoid RLS policy issues. Upload/complete is already running server-side
    // and may need service permissions to access storage; use admin client when present.
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const admin = createServerSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data: noteDataAdmin, error: noteErrorAdmin } = await admin.from("notes").insert([payloadBase]).select().single();
        if (!noteErrorAdmin) {
          console.debug("[api/upload/pdf/complete] note created via service_role (preferred)", { id: noteDataAdmin?.id });

          // Fire-and-forget embedding creation for admin-inserted note
          if (extractedText && noteDataAdmin?.id) {
            (async () => {
              try {
                const chunks = chunkText(extractedText);
                const withVecs: { text: string; vector: number[] }[] = [];
                for (const c of chunks) {
                  const v = await embedText(c);
                  withVecs.push({ text: c, vector: v });
                }
                await saveVectors(String(noteDataAdmin.id), withVecs);
                console.debug("[api/upload/pdf/complete] saved vectors for note (admin)", { noteId: noteDataAdmin.id, chunks: withVecs.length });
              } catch (e) {
                console.error("[api/upload/pdf/complete] embedding save failed (admin):", e);
              }
            })();
          }

          return NextResponse.json({ ok: true, note: noteDataAdmin });
        }
        console.error("[api/upload/pdf/complete] service_role insert failed:", noteErrorAdmin);
      } catch (adminErr: any) {
        console.error("[api/upload/pdf/complete] service_role insert exception:", adminErr);
      }
    } else {
      // Fallback: attempt authenticated insert when no service role configured
      try {
        const { data: noteData, error: noteError } = await supabase.from("notes").insert([payloadBase]).select().single();
        if (!noteError) {
          console.debug("[api/upload/pdf/complete] inserted note (auth)", { id: noteData?.id });

          // Fire-and-forget: create embeddings for the extracted text when available
          if (extractedText && noteData?.id) {
            (async () => {
              try {
                const chunks = chunkText(extractedText);
                const withVecs: { text: string; vector: number[] }[] = [];
                for (const c of chunks) {
                  const v = await embedText(c);
                  withVecs.push({ text: c, vector: v });
                }
                await saveVectors(String(noteData.id), withVecs);
                console.debug("[api/upload/pdf/complete] saved vectors for note", { noteId: noteData.id, chunks: withVecs.length });
              } catch (e) {
                console.error("[api/upload/pdf/complete] embedding save failed:", e);
              }
            })();
          }

          return NextResponse.json({ ok: true, note: noteData });
        }
        console.debug("[api/upload/pdf/complete] authenticated insert failed", noteError);
      } catch (err: any) {
        console.error("[api/upload/pdf/complete] authenticated insert exception:", err);
      }
    }

    // Fallback to service-role insert if auth insert failed
    if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
      try {
        const admin = createServerSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
        const { data: noteDataAdmin, error: noteErrorAdmin } = await admin.from("notes").insert([payloadBase]).select().single();
        if (noteErrorAdmin) {
          console.error("[api/upload/pdf/complete] service_role insert failed:", noteErrorAdmin);
          return NextResponse.json({ error: noteErrorAdmin.message || noteErrorAdmin }, { status: 500 });
        }
        console.debug("[api/upload/pdf/complete] note created via service_role", { id: noteDataAdmin?.id });

        // Fire-and-forget embedding creation for admin-inserted note
        if (extractedText && noteDataAdmin?.id) {
          (async () => {
            try {
              const chunks = chunkText(extractedText);
              const withVecs: { text: string; vector: number[] }[] = [];
              for (const c of chunks) {
                const v = await embedText(c);
                withVecs.push({ text: c, vector: v });
              }
              await saveVectors(String(noteDataAdmin.id), withVecs);
              console.debug("[api/upload/pdf/complete] saved vectors for note (admin)", { noteId: noteDataAdmin.id, chunks: withVecs.length });
            } catch (e) {
              console.error("[api/upload/pdf/complete] embedding save failed (admin):", e);
            }
          })();
        }

        return NextResponse.json({ ok: true, note: noteDataAdmin });
      } catch (adminErr: any) {
        console.error("[api/upload/pdf/complete] service_role fallback exception:", adminErr);
        return NextResponse.json({ error: adminErr.message || adminErr }, { status: 500 });
      }
    }

    return NextResponse.json({ error: "Authenticated insert failed and service role not configured" }, { status: 500 });
  } catch (err: any) {
    console.error("[api/upload/pdf/complete] top-level error:", err);
    return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}

// import { NextResponse } from "next/server";
// import { createClient as createServerSupabase } from "@supabase/supabase-js";
// import { createClient } from "@/lib/supabase/server";
// import pdf from "pdf-parse";

// // Clean, single implementation for PDF complete route.
// // Downloads the uploaded PDF (service role), extracts text via pdf-parse,
// // stores the extracted text in `notes.content` (truncated) and inserts a note.
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { path, title } = body ?? {};
//     if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

//     const supabase = await createClient();
//     const { data: userData } = await supabase.auth.getUser();
//     const user = userData?.user ?? null;
//     if (!user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

//     console.debug("[api/upload/pdf/complete] start", { path, title, userId: user.id });

//     const payloadBase: any = {
//       user_id: user.id,
//       title: title ?? path.split("/").pop(),
//       content: `Imported PDF: ${title ?? path.split("/").pop()}`,
//       tags: [],
//     };

//     // Attempt server-side extraction using service role client if configured
//     let extractedText: string | null = null;
//     if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
//       try {
//         const admin = createServerSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
//         const { data: fileData, error: downloadError } = await admin.storage.from("pdfs").download(path);
//         if (!downloadError && fileData) {
//           const arrayBuffer = await (fileData as any).arrayBuffer();
//           const buffer = Buffer.from(arrayBuffer);
//           try {
//             const pdfResult: any = await pdf(buffer as Buffer);
//             extractedText = pdfResult?.text ? String(pdfResult.text).trim() : null;
//             console.debug("[api/upload/pdf/complete] extracted length", extractedText ? extractedText.length : 0);
//           } catch (parseErr: any) {
//             console.error("[api/upload/pdf/complete] pdf-parse failed:", parseErr);
//           }
//         } else if (downloadError) {
//           console.debug("[api/upload/pdf/complete] storage download error", downloadError);
//         }
//       } catch (err: any) {
//         console.error("[api/upload/pdf/complete] download/extract error:", err);
//       }
//     } else {
//       console.debug("[api/upload/pdf/complete] service role not configured; skipping server-side extraction");
//     }

//     if (extractedText) {
//       const maxLen = 40_000;
//       payloadBase.content = extractedText.length > maxLen ? extractedText.slice(0, maxLen) + "\n\n[Truncated]" : extractedText;
//     } else {
//       payloadBase.content = `${payloadBase.content} (storage_path: ${path})`;
//     }

//     // Try inserting as the authenticated user first
//     try {
//       const { data: noteData, error: noteError } = await supabase.from("notes").insert([payloadBase]).select().single();
//       if (!noteError) {
//         console.debug("[api/upload/pdf/complete] inserted note (auth)", { id: noteData?.id });
//         return NextResponse.json({ ok: true, note: noteData });
//       }
//       console.debug("[api/upload/pdf/complete] authenticated insert failed", noteError);
//     } catch (err: any) {
//       console.error("[api/upload/pdf/complete] authenticated insert exception:", err);
//     }

//     // Fallback to service-role insert if auth insert failed
//     if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
//       try {
//         const admin = createServerSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
//         const { data: noteDataAdmin, error: noteErrorAdmin } = await admin.from("notes").insert([payloadBase]).select().single();
//         if (noteErrorAdmin) {
//           console.error("[api/upload/pdf/complete] service_role insert failed:", noteErrorAdmin);
//           return NextResponse.json({ error: noteErrorAdmin.message || noteErrorAdmin }, { status: 500 });
//         }
//         console.debug("[api/upload/pdf/complete] note created via service_role", { id: noteDataAdmin?.id });
//         return NextResponse.json({ ok: true, note: noteDataAdmin });
//       } catch (adminErr: any) {
//         console.error("[api/upload/pdf/complete] service_role fallback exception:", adminErr);
//         return NextResponse.json({ error: adminErr.message || adminErr }, { status: 500 });
//       }
//     }

//     return NextResponse.json({ error: "Authenticated insert failed and service role not configured" }, { status: 500 });
//   } catch (err: any) {
//     console.error("[api/upload/pdf/complete] top-level error:", err);
//     return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
//   }
// }
// import { NextResponse } from "next/server";
// import { createClient as createServerSupabase } from "@supabase/supabase-js";
// import { createClient } from "@/lib/supabase/server";
// import pdf from "pdf-parse";

// // Server route: complete PDF upload by extracting text and inserting a note
// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { path, title } = body ?? {};
//     if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

//     const supabase = await createClient();
//     const { data: userData } = await supabase.auth.getUser();
//     const user = userData?.user ?? null;
//     if (!user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

//     console.debug("[api/upload/pdf/complete] starting complete flow", { path, title, userId: user.id });

//     const payloadBase: any = {
//       user_id: user.id,
//       title: title ?? path.split("/").pop(),
//       content: `Imported PDF: ${title ?? path.split("/").pop()}`,
//       tags: [],
//     };

//     // Try to download the PDF and extract text server-side using service role
//     let extractedText: string | null = null;
//     try {
//       const admin = createServerSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
//       console.debug("[api/upload/pdf/complete] downloading file from storage", { path });
//       const { data: fileData, error: downloadError } = await admin.storage.from("pdfs").download(path);
//       if (downloadError) {
//         console.debug("[api/upload/pdf/complete] storage download error", downloadError);
//       } else if (fileData) {
//         const arrayBuffer = await (fileData as any).arrayBuffer();
//         const buffer = Buffer.from(arrayBuffer);
//         console.debug("[api/upload/pdf/complete] download succeeded (bytes)", buffer.length);

//         try {
//           const pdfResult: any = await pdf(buffer as Buffer);
//           extractedText = pdfResult?.text ? String(pdfResult.text).trim() : null;
//           console.debug("[api/upload/pdf/complete] extracted text length", extractedText ? extractedText.length : 0);
//         } catch (parseErr: any) {
//           console.error("[api/upload/pdf/complete] pdf-parse failed:", parseErr);
//         }
//       }
//     } catch (err: any) {
//       console.error("[api/upload/pdf/complete] download/extract error:", err);
//     }

//     if (extractedText) {
//       const maxLen = 40_000;
//       payloadBase.content = extractedText.length > maxLen ? extractedText.slice(0, maxLen) + "\n\n[Truncated]" : extractedText;
//     } else {
//       payloadBase.content = `${payloadBase.content} (storage_path: ${path})`;
//     }

//     // Try authenticated insert
//     try {
//       console.debug("[api/upload/pdf/complete] inserting note (authenticated)");
//       const { data: noteData, error: noteError } = await supabase.from("notes").insert([payloadBase]).select().single();
//       if (!noteError) {
//         console.debug("[api/upload/pdf/complete] note created (auth)", { id: noteData?.id });
//         return NextResponse.json({ ok: true, note: noteData });
//       }
//       console.debug("[api/upload/pdf/complete] authenticated insert error", noteError);
//     } catch (err: any) {
//       console.error("[api/upload/pdf/complete] authenticated insert exception:", err);
//     }

//     // Fallback to service role insert
//     try {
//       console.debug("[api/upload/pdf/complete] attempting service_role fallback insert");
//       const admin = createServerSupabase(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.SUPABASE_SERVICE_ROLE_KEY!);
//       const { data: noteDataAdmin, error: noteErrorAdmin } = await admin.from("notes").insert([payloadBase]).select().single();
//       if (noteErrorAdmin) {
//         console.error("[api/upload/pdf/complete] service_role insert failed:", noteErrorAdmin);
//         return NextResponse.json({ error: noteErrorAdmin.message || noteErrorAdmin }, { status: 500 });
//       }
//       console.debug("[api/upload/pdf/complete] note created via service_role", { id: noteDataAdmin?.id });
//       return NextResponse.json({ ok: true, note: noteDataAdmin });
//     } catch (adminErr: any) {
//       console.error("[api/upload/pdf/complete] service_role fallback exception:", adminErr);
//       return NextResponse.json({ error: adminErr.message || adminErr }, { status: 500 });
//     }
//   } catch (err: any) {
//     console.error("[api/upload/pdf/complete] Caught error:", err);
//     return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
//   }
// }

// import { NextResponse } from "next/server";
// import { createClient as createServerSupabase } from "@supabase/supabase-js";
// import { createClient } from "@/lib/supabase/server";
// import pdf from "pdf-parse";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { path, title } = body ?? {};
//     if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

//     const supabase = await createClient();
//     const { data: userData } = await supabase.auth.getUser();
//     const user = userData?.user ?? null;
//     if (!user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

//     console.debug("[api/upload/pdf/complete] starting complete flow", { path, title, userId: user.id });

//     const payloadBase: any = {
//       user_id: user.id,
//       title: title ?? path.split("/").pop(),
//       content: `Imported PDF: ${title ?? path.split("/").pop()}`,
//       tags: [],
//     };

//     // Attempt to download the PDF and extract text server-side
//     let extractedText: string | null = null;
//     try {
//       console.debug("[api/upload/pdf/complete] creating admin client for storage operations");
//       const admin = createServerSupabase(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.SUPABASE_SERVICE_ROLE_KEY!
//       );

//       console.debug("[api/upload/pdf/complete] downloading file from storage", { path });
//       const { data: fileData, error: downloadError } = await admin.storage.from("pdfs").download(path);
//       if (downloadError) {
//         console.debug("[api/upload/pdf/complete] storage download error", downloadError);
//       } else if (fileData) {
//         try {
//           // convert to Buffer (works in Node server environment)
//           const arrayBuffer = await (fileData as any).arrayBuffer();
//           const buffer = Buffer.from(arrayBuffer);
//           console.debug("[api/upload/pdf/complete] download succeeded (bytes)", buffer.length);

//           try {
//             const pdfResult: any = await pdf(buffer as Buffer);
//             extractedText = pdfResult?.text ? String(pdfResult.text).trim() : null;
//             console.debug("[api/upload/pdf/complete] pdf-parse extracted length", extractedText ? extractedText.length : 0);
//           } catch (parseErr: any) {
//             console.error("[api/upload/pdf/complete] pdf-parse error:", parseErr);
//           }
//         } catch (bufErr: any) {
//           console.error("[api/upload/pdf/complete] buffer conversion failed:", bufErr);
//         }
//       }
//     } catch (err: any) {
//       console.error("[api/upload/pdf/complete] download/extract error:", err);
//     }

//     // Use extracted text when available (truncate to a sane max length)
//     if (extractedText) {
//       const maxLen = 40_000;
//       payloadBase.content = extractedText.length > maxLen ? extractedText.slice(0, maxLen) + "\n\n[Truncated]" : extractedText;
//     } else {
//       payloadBase.content = `${payloadBase.content} (storage_path: ${path})`;
//     }

//     // Try authenticated insert first
//     try {
//       console.debug("[api/upload/pdf/complete] inserting note (authenticated)");
//       const { data: noteData, error: noteError } = await supabase.from("notes").insert([payloadBase]).select().single();
//       if (!noteError) {
//         console.debug("[api/upload/pdf/complete] note created (auth)", { id: noteData?.id });
//         return NextResponse.json({ ok: true, note: noteData });
//       }
//       console.debug("[api/upload/pdf/complete] authenticated insert error", noteError);
//     } catch (err: any) {
//       console.error("[api/upload/pdf/complete] authenticated insert exception:", err);
//     }

//     // Fallback to service_role insert when RLS prevents authenticated insert
//     try {
//       console.debug("[api/upload/pdf/complete] attempting service_role fallback insert");
//       const admin = createServerSupabase(
//         process.env.NEXT_PUBLIC_SUPABASE_URL!,
//         process.env.SUPABASE_SERVICE_ROLE_KEY!
//       );

//       const { data: noteDataAdmin, error: noteErrorAdmin } = await admin.from("notes").insert([payloadBase]).select().single();
//       if (noteErrorAdmin) {
//         console.error("[api/upload/pdf/complete] service_role insert failed:", noteErrorAdmin);
//         return NextResponse.json({ error: noteErrorAdmin.message || noteErrorAdmin }, { status: 500 });
//       }

//       console.debug("[api/upload/pdf/complete] note created via service_role", { id: noteDataAdmin?.id });
//       return NextResponse.json({ ok: true, note: noteDataAdmin });
//     } catch (adminErr: any) {
//       console.error("[api/upload/pdf/complete] service_role fallback exception:", adminErr);
//       return NextResponse.json({ error: adminErr.message || adminErr }, { status: 500 });
//     }
//   } catch (err: any) {
//     console.error("[api/upload/pdf/complete] Caught error:", err);
//     return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
//   }
// }
// import { NextResponse } from "next/server";
// import { createClient as createServerSupabase } from "@supabase/supabase-js";
// import { createClient } from "@/lib/supabase/server";
// import pdf from "pdf-parse";

// export async function POST(req: Request) {
//   try {
//     const body = await req.json();
//     const { path, title } = body ?? {};
//     if (!path) return NextResponse.json({ error: "path required" }, { status: 400 });

//     const supabase = await createClient();
//     const { data: userData } = await supabase.auth.getUser();
//     const user = userData?.user ?? null;
//     if (!user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

//     // Try inserting including `metadata` (if the schema supports it).
//     const payloadBase: any = {
//       user_id: user.id,
//       const supabase = await createClient();
//       const { data: userData } = await supabase.auth.getUser();
//       const user = userData?.user ?? null;
//       if (!user) return NextResponse.json({ error: "User not authenticated" }, { status: 401 });

//       console.debug("[api/upload/pdf/complete] starting complete flow", { path, title, userId: user.id });

//       // Prepare base payload; content will be replaced with extracted text when available
//       const payloadBase: any = {
//         user_id: user.id,
//         title: title ?? path.split("/").pop(),
//         content: `Imported PDF: ${title ?? path.split("/").pop()}`,
//         tags: [],
//       };

//       // Try to download the PDF and extract text (server-side) using service role client
//       let extractedText: string | null = null;
//       try {
//         console.debug("[api/upload/pdf/complete] creating admin client for download");
//         const admin = createServerSupabase(
//           process.env.NEXT_PUBLIC_SUPABASE_URL!,
//           process.env.SUPABASE_SERVICE_ROLE_KEY!
//         );

//         console.debug("[api/upload/pdf/complete] attempting file download from storage", { path });
//         const { data: fileData, error: downloadError } = await admin.storage.from("pdfs").download(path);
//         if (downloadError) {
//           console.debug("[api/upload/pdf/complete] download error", downloadError);
//         } else if (fileData) {
//           // convert to Buffer in Node environment
//           try {
//             const arrayBuffer = await (fileData as any).arrayBuffer();
//             const buffer = Buffer.from(arrayBuffer);
//             console.debug("[api/upload/pdf/complete] download succeeded, bytes:", buffer.length);

//             // attempt to parse PDF using pdf-parse
//             try {
//               const pdfResult: any = await pdf(buffer as Buffer);
//               extractedText = (pdfResult && pdfResult.text) ? String(pdfResult.text).trim() : null;
//               console.debug("[api/upload/pdf/complete] extracted text length", extractedText ? extractedText.length : 0);
//             } catch (parseErr: any) {
//               console.error("[api/upload/pdf/complete] pdf-parse failed:", parseErr);
//             }
//           } catch (bufErr: any) {
//             console.error("[api/upload/pdf/complete] failed converting download to buffer:", bufErr);
//           }
//         }
//       } catch (downErr: any) {
//         console.error("[api/upload/pdf/complete] error during download/extract:", downErr);
//       }

//       // If we have extracted text, use it as the note content (truncate to a reasonable size)
//       if (extractedText) {
//         const maxLen = 40_000; // cap stored length to avoid huge rows
//         payloadBase.content = extractedText.length > maxLen ? extractedText.slice(0, maxLen) + "\n\n[Truncated]" : extractedText;
//       } else {
//         // append storage_path for traceability if no extraction
//         payloadBase.content = `${payloadBase.content} (storage_path: ${path})`;
//       }

//       // Attempt authenticated insert first
//       try {
//         console.debug("[api/upload/pdf/complete] attempting authenticated insert", { title: payloadBase.title });
//         const { data: noteData, error: noteError } = await supabase.from("notes").insert([payloadBase]).select().single();
//         if (!noteError) {
//           console.debug("[api/upload/pdf/complete] created note (auth):", { id: noteData?.id });
//           return NextResponse.json({ ok: true, note: noteData });
//         }
//         console.debug("[api/upload/pdf/complete] authenticated insert failed:", noteError);
//       } catch (err: any) {
//         console.error("[api/upload/pdf/complete] error during authenticated insert:", err);
//       }

//       // If authenticated insert failed (RLS/policy), fallback to service_role insert
//       try {
//         console.debug("[api/upload/pdf/complete] attempting service_role fallback insert");
//         const admin = createServerSupabase(
//           process.env.NEXT_PUBLIC_SUPABASE_URL!,
//           process.env.SUPABASE_SERVICE_ROLE_KEY!
//         );

//         const { data: noteDataAdmin, error: noteErrorAdmin } = await admin
//           .from("notes")
//           .insert([payloadBase])
//           .select()
//           .single();

//         if (noteErrorAdmin) {
//           console.error("[api/upload/pdf/complete] service_role insert failed:", noteErrorAdmin);
//           return NextResponse.json({ error: noteErrorAdmin.message || noteErrorAdmin }, { status: 500 });
//         }

//         console.debug("[api/upload/pdf/complete] note created via service_role:", noteDataAdmin);
//         return NextResponse.json({ ok: true, note: noteDataAdmin });
//       } catch (adminErr: any) {
//         console.error("[api/upload/pdf/complete] service_role fallback error:", adminErr);
//         return NextResponse.json({ error: adminErr.message || adminErr }, { status: 500 });
//       }
//         if (noteErrorAdmin) {
//           console.log("[api/upload/pdf/complete] service_role insert failed:", noteErrorAdmin);
//           return NextResponse.json({ error: noteErrorAdmin.message || noteErrorAdmin }, { status: 500 });
//         }

//         console.log("[api/upload/pdf/complete] note created via service_role:", noteDataAdmin);
//         return NextResponse.json({ ok: true, note: noteDataAdmin });
//       } catch (adminErr: any) {
//         console.error("[api/upload/pdf/complete] service_role fallback error:", adminErr);
//         return NextResponse.json({ error: adminErr.message || adminErr }, { status: 500 });
//       }
//     } catch (err: any) {
//       console.error("[api/upload/pdf/complete] caught during insert attempt:", err);
//       return NextResponse.json({ error: err.message || "Insert failed" }, { status: 500 });
//     }
//   } catch (err: any) {
//     console.error("[api/upload/pdf/complete] Caught error:", err);
//     return NextResponse.json({ error: err.message || "Internal error" }, { status: 500 });
//   }
// }
