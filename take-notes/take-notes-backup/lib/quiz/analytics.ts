import type { SupabaseClient } from "@supabase/supabase-js";

export async function getUserAttempts(supabase: SupabaseClient, userId: string, limit = 20, offset = 0) {
  const { data, error } = await supabase
    .from("quiz_attempts")
    .select("*, quizzes(title, category_id)")
    .eq("user_id", userId)
    .order("created_at", { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) throw error;
  return data;
}

export async function getCategoryPerformance(supabase: SupabaseClient, userId: string) {
  // Aggregates average score by quiz category for a user
  const query = `
    SELECT q.category_id, c.name as category_name, AVG(a.score::float / NULLIF(a.max_score,0)) as avg_ratio, COUNT(*) as attempts
    FROM quiz_attempts a
    JOIN quizzes q ON q.id = a.quiz_id
    LEFT JOIN categories c ON c.id = q.category_id
    WHERE a.user_id = $1
    GROUP BY q.category_id, c.name
    ORDER BY avg_ratio DESC
  `;

  const { data, error } = await supabase.rpc('sql', { sql: query, params: [userId] } as any);
  if (error) throw error;
  return data;
}
