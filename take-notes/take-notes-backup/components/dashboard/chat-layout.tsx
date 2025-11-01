"use client"

import React, { useEffect, useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { FileText, Tags, Wand2, Languages } from "lucide-react"
import { AIToolsMenu } from "./ai-tools-menu"
import {
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

interface ChatLayoutProps {
  // when inline is true, the component renders as an inline panel instead of a Dialog
  inline?: boolean
  open?: boolean
  onOpenChange?: (open: boolean) => void
  noteId: string
  noteContent?: string
  // when true (and inline is false), render the chat as a full page overlay instead of a modal dialog
  fullPage?: boolean
}

type Message = {
  id: string
  sender: "ai" | "user"
  text: string
  timestamp?: number
}

export default function ChatLayout({ inline = false, open, onOpenChange, noteId, noteContent = "", fullPage = false }: ChatLayoutProps) {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const messagesRef = useRef<HTMLDivElement | null>(null)

  const storageKey = `parhle.chat.${noteId}`

  // load persisted messages for this note
  useEffect(() => {
    try {
      const raw = localStorage.getItem(storageKey)
      if (raw) {
        const parsed = JSON.parse(raw) as Message[]
        if (Array.isArray(parsed) && parsed.length) {
          setMessages(parsed)
          return
        }
      }
    } catch (e) {
      // ignore
    }
    // nothing to load
  }, [storageKey])

  // initial AI greeting (seed when appropriate)
  useEffect(() => {
    const shouldSeed = inline ? messages.length === 0 : Boolean(open && messages.length === 0)
    console.log("[chat-layout] seed check", { noteId, inline, open, messagesLength: messages.length, shouldSeed })
    if (shouldSeed) {
      const intro = `Hi — I can help you with this PDF / note. Here are some things I can do:\n\n• Summarize the document\n• Rephrase sections (formal, informal, concise)\n• Translate to another language\n• Generate tags\n• Create templates (meeting, project, daily, research)\n• Find related notes\n\nSelect an action or ask me a question.`
      console.log("[chat-layout] seeding initial AI greeting for note", noteId)
      setMessages((prev) => (prev.length ? prev : [{ id: "m0", sender: "ai", text: intro, timestamp: Date.now() }]))
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, inline])

  // persist
  useEffect(() => {
    try {
      localStorage.setItem(storageKey, JSON.stringify(messages))
    } catch (e) {
      // ignore
    }
  }, [messages, storageKey])

  useEffect(() => {
    const el = messagesRef.current
    if (!el) return
    // scroll to bottom
    requestAnimationFrame(() => {
      el.scrollTo({ top: el.scrollHeight, behavior: "smooth" })
    })
  }, [messages])

  const pushMessage = (m: Message) => {
    const withTs = { ...m, timestamp: m.timestamp ?? Date.now() }
    console.log("[chat-layout] pushMessage", withTs)
    setMessages((s) => {
      try {
        console.log("[chat-layout] previous messages length", s.length)
      } catch (e) {
        // ignore
      }
      return [...s, withTs]
    })
  }

  // debug: log messages state whenever it changes
  useEffect(() => {
    try {
      console.log("[chat-layout] messages state changed, length:", messages.length, messages)
    } catch (e) {
      // ignore
    }
  }, [messages])

  const callRag = async (query: string) => {
    try {
      console.log("[chat-layout] callRag request", { query, docId: noteId })
      const r = await fetch("/api/ai/rag", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ query, docId: noteId }) })
      const json = await r.json()
      console.log("[chat-layout] callRag response", json)
      // If RAG returned no sources/context, fallback to using the raw note content
      // via the summarize endpoint (this helps immediately after upload while
      // embeddings are being generated asynchronously on the server).
      const hasSources = json && Array.isArray(json.sources) && json.sources.length > 0
      if (!hasSources && noteContent && noteContent.trim().length > 20) {
        try {
          console.log("[chat-layout] callRag: no sources found, falling back to /api/ai/summarize with noteContent")
          const s = await fetch("/api/ai/summarize", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ text: noteContent, noteId }) })
          const sj = await s.json()
          console.log("[chat-layout] summarize fallback response", sj)
          if (sj?.result) return { ok: true, answer: sj.result, sources: [] }
        } catch (e) {
          console.error("[chat-layout] summarize fallback error", e)
          // fall through to return original rag response
        }
      }
      return json
    } catch (e) {
      console.error("[chat-layout] callRag error", e)
      return null
    }
  }

  const handleSummarize = async () => {
    const userText = "Summarize the document"
    pushMessage({ id: `u-${Date.now()}`, sender: "user", text: userText })
    setIsLoading(true)
    try {
      const pj = await callRag(userText)
      if (pj?.answer) pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: pj.answer })
      else pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: "Sorry, I couldn't generate a summary." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleGenerateTags = async () => {
    const userText = "Generate tags for this document"
    pushMessage({ id: `u-${Date.now()}`, sender: "user", text: userText })
    setIsLoading(true)
    try {
      const pj = await callRag(userText)
      const text = pj?.answer ?? "No tags generated"
      pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: text })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRephrase = async (style: "formal" | "informal" | "concise" | "extended") => {
    const userText = `Rephrase the document (${style})`
    pushMessage({ id: `u-${Date.now()}`, sender: "user", text: userText })
    setIsLoading(true)
    try {
      const pj = await callRag(userText)
      if (pj?.answer) pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: pj.answer })
      else pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: "Couldn't rephrase the document." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTranslate = async (language: string) => {
    const userText = `Translate the document to ${language}`
    pushMessage({ id: `u-${Date.now()}`, sender: "user", text: userText })
    setIsLoading(true)
    try {
      const pj = await callRag(userText)
      if (pj?.answer) pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: pj.answer })
      else pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: "Couldn't translate the document." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleTemplate = async (type: "meeting" | "project" | "daily" | "research") => {
    const userText = `Create a ${type} template based on this document`
    pushMessage({ id: `u-${Date.now()}`, sender: "user", text: userText })
    setIsLoading(true)
    try {
      const pj = await callRag(userText)
      if (pj?.answer) pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: pj.answer })
      else pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: "Couldn't create template." })
    } finally {
      setIsLoading(false)
    }
  }

  const handleRelated = async () => {
    const userText = "Find related notes"
    pushMessage({ id: `u-${Date.now()}`, sender: "user", text: userText })
    setIsLoading(true)
    try {
      const pj = await callRag(userText)
      const text = pj?.answer ?? "No related notes found"
      pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: text })
    } finally {
      setIsLoading(false)
    }
  }

  const handleSend = async () => {
    if (!input.trim()) return
    pushMessage({ id: `u-${Date.now()}`, sender: "user", text: input })
    setIsLoading(true)
    try {
      const pj = await callRag(input)
      if (pj?.answer) pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: pj.answer })
      else pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: "I couldn't generate a response." })
    } catch (e) {
      pushMessage({ id: `a-${Date.now()}`, sender: "ai", text: "Error contacting the assistant." })
    } finally {
      setIsLoading(false)
    }
    setInput("")
  }

  const panel = (
    <div className="border rounded p-3 bg-white">
      <div className="p-2 space-y-3">
        {/* Debug: show messages count and last message for quick visibility */}
        <div className="text-xs text-muted-foreground mb-1">
          Messages: {messages.length} {messages.length > 0 && <span>- last: "{String(messages[messages.length-1]?.text).slice(0,80)}"</span>}
        </div>
        <div ref={messagesRef} className="space-y-3 max-h-96 overflow-auto">
          {messages.map((m) => (
            <div key={m.id} className={m.sender === "ai" ? "text-sm text-left" : "text-sm text-right"}>
              <div className={m.sender === "ai" ? "bg-muted/40 p-2 rounded" : "bg-accent/30 p-2 rounded inline-block ml-auto"}>
                <div className="text-foreground break-words whitespace-pre-wrap">{m.text}</div>
                {m.timestamp && (
                  <div className="text-xs text-muted-foreground mt-1 opacity-80">
                    {new Date(m.timestamp).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-wrap gap-2 items-center">
          {/* Render the full AI tools menu inline so users see the same options after upload */}
          <AIToolsMenu
            onSummarize={handleSummarize}
            onRephrase={handleRephrase}
            onTranslate={handleTranslate}
            onGenerateTemplate={handleTemplate}
            onGenerateTags={handleGenerateTags}
            isLoading={isLoading}
          />

          <Button onClick={handleSummarize} size="sm" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Summarize
          </Button>
          <Button onClick={handleGenerateTags} size="sm" className="flex items-center gap-2">
            <Tags className="h-4 w-4" /> Generate Tags
          </Button>
          <Button onClick={() => handleTemplate("meeting")} size="sm" className="flex items-center gap-2">
            <Wand2 className="h-4 w-4" /> Meeting Template
          </Button>
          <Button onClick={handleRelated} size="sm" className="flex items-center gap-2">
            <FileText className="h-4 w-4" /> Related Notes
          </Button>
        </div>

        <div className="flex gap-2">
          <Input value={input} onChange={(e) => setInput(e.target.value)} placeholder="Ask the assistant (freeform)" />
          <Button onClick={handleSend} disabled={isLoading}>
            {isLoading ? "Thinking..." : "Ask"}
          </Button>
        </div>
      </div>
    </div>
  )

  if (inline) {
    // When rendered inline inside the editor, allow a close control if the parent
    // passed an onOpenChange handler. This provides a way to close the inline chat.
    return (
      <div className="relative">
        {onOpenChange && (
          <div className="absolute top-2 right-2 z-10">
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                console.log("[chat-layout] inline close clicked for note", noteId)
                try {
                  onOpenChange(false)
                } catch (e) {
                  console.error("[chat-layout] error calling onOpenChange", e)
                }
              }}
            >
              Close
            </Button>
          </div>
        )}
        {panel}
      </div>
    )
  }

  // If fullPage is requested, render a full-screen overlay instead of the modal dialog
  if (fullPage) {
    return (
      <div className="fixed inset-0 z-50 bg-white flex flex-col">
        <div className="border-b p-3 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold">AI Assistant</h2>
            <div className="text-sm text-muted-foreground">Chat with the model about your uploaded PDF</div>
          </div>
          <div>
            <Button variant="outline" onClick={() => onOpenChange?.(false)}>Close</Button>
          </div>
        </div>
        <div className="p-4 overflow-auto flex-1">{panel}</div>
      </div>
    )
  }

  return (
    <Dialog open={Boolean(open)} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-2xl">
        <DialogHeader>
          <DialogTitle>AI Assistant</DialogTitle>
          <DialogDescription>Chat with the model about your uploaded PDF</DialogDescription>
        </DialogHeader>
        {panel}
        <div className="flex justify-end p-4">
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
