import React from "react";
import QuizSession from "@/components/quiz/quiz-session";

type Props = {
  // `params` may be a promise-like object in Next's runtime; allow any here to avoid
  // TypeScript incompatibilities with generated `PageProps` types.
  params: any;
};

// Server component that fetches the quiz and renders a client session
export default async function QuizPage({ params }: Props) {
  // In Next.js dynamic server routes `params` may be async; await it before using.
  // See: https://nextjs.org/docs/messages/sync-dynamic-apis
  const { quizId } = await params as any;

  // Fetch quiz from our API
  const res = await fetch(`${process.env.NEXT_PUBLIC_APP_URL ?? "http://localhost:3000"}/api/quiz/get?quizId=${quizId}`, { cache: "no-store" });
  const data = await res.json().catch(() => null);

  const initialQuiz = data?.quiz && data?.questions ? {
    id: quizId,
    title: data.quiz.title,
    questions: data.questions,
    timerEnabled: data.quiz.timerEnabled,
    timePerQuestion: data.quiz.timePerQuestion
  } : null;

  // Render client session with fetched quiz
  return (
    <div className="p-6">
      {initialQuiz ? (
        // @ts-ignore - QuizSession is client component
        <QuizSession initialQuiz={initialQuiz} />
      ) : (
        <div>Unable to load quiz.</div>
      )}
    </div>
  );
}
