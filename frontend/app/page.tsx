"use client";
import Link from "next/link";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function Home() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && user) router.push("/dashboard");
  }, [user, loading]);

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-50 to-purple-50 flex flex-col items-center justify-center p-8">
      <div className="max-w-2xl text-center">
        <h1 className="text-5xl font-bold text-indigo-700 mb-4">VoiceGen</h1>
        <p className="text-xl text-gray-600 mb-8">
          AI-powered Text-to-Speech and Voice Cloning. Turn any text into
          natural speech, or clone any voice in seconds.
        </p>
        <div className="flex gap-4 justify-center">
          <Link
            href="/signup"
            className="bg-indigo-600 text-white px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-700 transition"
          >
            Get Started
          </Link>
          <Link
            href="/login"
            className="border border-indigo-600 text-indigo-600 px-8 py-3 rounded-lg text-lg font-medium hover:bg-indigo-50 transition"
          >
            Login
          </Link>
        </div>
      </div>
    </main>
  );
}