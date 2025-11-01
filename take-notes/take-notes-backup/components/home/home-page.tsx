"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Github, Sparkles, ArrowRight, Moon, Sun } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export function HomePage() {
  const { theme, setTheme } = useTheme();
  const [isHovered, setIsHovered] = useState(false);

  return (
    <div className="min-h-screen bg-background relative overflow-hidden">
      {/* Background gradient */}
      <div className="absolute inset-0 bg-gradient-to-br from-purple-50/50 via-blue-50/30 to-indigo-50/50 dark:from-purple-950/20 dark:via-blue-950/10 dark:to-indigo-950/20" />

      {/* Animated background elements */}
      <div className="absolute top-20 left-10 w-72 h-72 bg-purple-300/10 rounded-full blur-3xl animate-pulse-gradient" />
      <div
        className="absolute bottom-20 right-10 w-96 h-96 bg-blue-300/10 rounded-full blur-3xl animate-pulse-gradient"
        style={{ animationDelay: "1s" }}
      />

      {/* Header */}
      <header className="relative z-10 container mx-auto px-6 py-6">
        <nav className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <div className="flex items-center justify-center w-10 h-10 rounded-xl gradient-purple-blue">
              <Sparkles className="h-5 w-5 text-white" />
            </div>
            <span className="text-xl font-bold gradient-text">Parhle AI PDF Note Taker</span>
          </div>

          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
              className="h-9 w-9 p-0"
            >
              <Sun className="h-4 w-4 rotate-0 scale-100 transition-all dark:-rotate-90 dark:scale-0" />
              <Moon className="absolute h-4 w-4 rotate-90 scale-0 transition-all dark:rotate-0 dark:scale-100" />
            </Button>

            <Button
              className="btn-gradient text-white px-6 py-2 rounded-xl font-medium"
              asChild
            >
              <Link href="/auth/signin">
                Get Started
                <ArrowRight className="ml-2 h-4 w-4" />
              </Link>
            </Button>
          </div>
        </nav>
      </header>

      {/* Main content */}
      <main className="relative z-10 container mx-auto px-6 py-20">
        <div className="max-w-4xl mx-auto text-center space-y-8">
          {/* Hero section */}
          <div className="space-y-6">
           

            <h1 className="text-5xl md:text-7xl font-bold tracking-tight">
              <span className="gradient-text">Smart Notes</span>
              <br />
              <span className="text-foreground">Made Simple</span>
            </h1>

            <p className="text-xl md:text-2xl text-muted-foreground max-w-2xl mx-auto leading-relaxed">
              A beautiful, minimal note-taking app with AI-powered features.
            </p>
          </div>

          {/* CTA buttons */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 pt-8">
            <Button
              size="lg"
              className="btn-gradient text-white px-8 py-6 text-lg font-medium rounded-2xl"
              onMouseEnter={() => setIsHovered(true)}
              onMouseLeave={() => setIsHovered(false)}
              asChild
            >
              <Link href="/auth/signin">
                Start Taking Notes
                <ArrowRight
                  className={`ml-2 h-5 w-5 transition-transform ${
                    isHovered ? "translate-x-1" : ""
                  }`}
                />
              </Link>
            </Button>
          </div>

          {/* Features */}
          {/* <div className="grid md:grid-cols-3 gap-8 pt-20">
            <div className="card-enhanced rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-purple-blue flex items-center justify-center">
                <Sparkles className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">AI-Powered</h3>
              <p className="text-muted-foreground">
                Smart features to enhance your note-taking experience
              </p>
            </div>

            <div className="card-enhanced rounded-3xl p-8 text-center space-y-4">
              <div className="w-16 h-16 mx-auto rounded-2xl gradient-purple-blue flex items-center justify-center">
                <Github className="h-8 w-8 text-white" />
              </div>
              <h3 className="text-xl font-semibold">User Friendly Interface</h3>
              <p className="text-muted-foreground">
                Clean, minimal design focused on usability
              </p>
            </div>

            
          </div> */}

          
          <div className="max-w-4xl mx-auto text-center mt-20 space-y-8">
            <h2 className="text-3xl font-bold">How Parhle works</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Upload PDFs, let our AI extract and summarize the content, then
              organize your notes with smart tags and quick actions.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mt-6">
              <div className="card-enhanced p-6 rounded-2xl">
                <div className="text-xl font-semibold">1. Upload PDF</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Drop or select a PDF to import. Parhle will scan and extract
                  text automatically.
                </p>
              </div>

              <div className="card-enhanced p-6 rounded-2xl">
                <div className="text-xl font-semibold">2. AI Extract & Summarize</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Our AI highlights key points, generates concise summaries and
                  suggests tags for easier organization.
                </p>
              </div>

              <div className="card-enhanced p-6 rounded-2xl">
                <div className="text-xl font-semibold">3. Organize & Sync</div>
                <p className="text-muted-foreground mt-2 text-sm">
                  Save notes to projects, share with collaborators, and access
                  them across devices in real-time.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-center pt-8">
              <Button size="lg" className="btn-gradient text-white px-8 py-3 rounded-2xl" asChild>
                <Link href="/auth/signin">Try with a PDF</Link>
              </Button>
            </div>
          </div>

          {/* New: Key PDF-focused features */}
          <div className="max-w-5xl mx-auto mt-20">
            <h3 className="text-2xl font-bold text-center">Key features</h3>
            <div className="grid sm:grid-cols-2 md:grid-cols-4 gap-6 mt-6">
              <div className="card-enhanced p-6 rounded-2xl text-center">
                <div className="w-12 h-12 mx-auto rounded-lg gradient-purple-blue flex items-center justify-center">
                  <span className="text-white font-semibold">PDF</span>
                </div>
                <div className="mt-3 font-medium">Import PDFs</div>
                <p className="text-sm text-muted-foreground mt-2">Fast import & parsing of PDF documents.</p>
              </div>

              <div className="card-enhanced p-6 rounded-2xl text-center">
                <div className="w-12 h-12 mx-auto rounded-lg gradient-purple-blue flex items-center justify-center">
                  <span className="text-white font-semibold">AI</span>
                </div>
                <div className="mt-3 font-medium">AI Summaries</div>
                <p className="text-sm text-muted-foreground mt-2">Automatic summaries and highlights from any PDF.</p>
              </div>

              <div className="card-enhanced p-6 rounded-2xl text-center">
                <div className="w-12 h-12 mx-auto rounded-lg gradient-purple-blue flex items-center justify-center">
                  <span className="text-white font-semibold">Tags</span>
                </div>
                <div className="mt-3 font-medium">Smart Tags</div>
                <p className="text-sm text-muted-foreground mt-2">Auto-generated tags for quick search and organization.</p>
              </div>

              <div className="card-enhanced p-6 rounded-2xl text-center">
                <div className="w-12 h-12 mx-auto rounded-lg gradient-purple-blue flex items-center justify-center">
                  <span className="text-white font-semibold">Sync</span>
                </div>
                <div className="mt-3 font-medium">Sync & Share</div>
                <p className="text-sm text-muted-foreground mt-2">Real-time sync across devices and collaboration tools.</p>
              </div>
            </div>
          </div>
        </div>
      </main>

    
    </div>
  );
}
