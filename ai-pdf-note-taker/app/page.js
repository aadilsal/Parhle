"use client";
import { Button } from "../components/ui/button";
import { UserButton, useUser } from "@clerk/nextjs";
import { useMutation } from "convex/react";
import { api } from "../convex/_generated/api";
import Image from "next/image";
import { useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function Home() {
  const { user, isLoaded } = useUser();
  const createUser = useMutation(api.user.createuser);
  const router = useRouter();

  useEffect(() => {
    if (isLoaded && user) {
      // User is signed in, redirect to dashboard
      CheckUser();
      router.push("/dashboard");
    }
  }, [user, isLoaded, router]);

  const CheckUser = async () => {
    if (user) {
      const res = await createUser({
        email: user?.primaryEmailAddress?.emailAddress,
        imageUrl: user?.imageUrl,
        name: user?.fullName,
      });
      console.log(res);
    }
  };

  // Show loading state while checking authentication
  if (!isLoaded) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Only show landing page if user is not signed in
  return (
    <div className="flex flex-col items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-purple-50">
      <div className="text-center space-y-6 p-8">
        <h1 className="text-5xl font-bold text-gray-900">
          🎓 AI PDF Note Taker
        </h1>
        <p className="text-xl text-gray-600 max-w-2xl">
          Transform your PDFs into interactive learning experiences with AI-powered conversations
        </p>
        <div className="flex gap-4 justify-center items-center pt-4">
          <Link href="/sign-up">
            <Button size="lg" className="bg-blue-600 hover:bg-blue-700">
              Get Started
            </Button>
          </Link>
          <Link href="/sign-in">
            <Button size="lg" variant="outline">
              Sign In
            </Button>
          </Link>
        </div>
        <div className="pt-8 text-sm text-gray-500">
          <p>✨ Upload PDFs • 💬 Chat with AI • 📚 Study Effectively</p>
        </div>
      </div>
    </div>
  );
}
