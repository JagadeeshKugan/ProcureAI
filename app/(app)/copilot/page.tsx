"use client"

import { useRef, useState, useEffect } from "react"
import { PageHeader } from "@/components/page-header"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Avatar, AvatarFallback } from "@/components/ui/avatar"
import {
  InputGroup,
  InputGroupAddon,
  InputGroupButton,
  InputGroupTextarea,
} from "@/components/ui/input-group"
import { cn } from "@/lib/utils"
import { ArrowUp, Sparkles, User } from "lucide-react"

interface Message {
  id: string
  role: "user" | "assistant"
  content: string
}

const suggestions = [
  "Which vendor should I award the laptop RFQ to?",
  "Summarize this month's procurement spend.",
  "Which suppliers have the best on-time delivery?",
  "Where can I find cost savings this quarter?",
]

const cannedResponses: { match: RegExp; reply: string }[] = [
  {
    match: /laptop|rfq|award|quote/i,
    reply:
      "For RFQ-2026-0142 (120 Engineering Laptops), I recommend awarding to Lenovo Group. At $237,600 total it is the lowest effective cost, offers the fastest 18-day delivery, and carries a Low supplier risk rating. This represents roughly $26,400 in savings versus the estimated budget. Dell is a strong runner-up if longer on-site warranty is a priority.",
  },
  {
    match: /spend|budget|cost|month/i,
    reply:
      "August procurement spend reached $960K, up 9% month-over-month, while realized savings hit $224K. Manufacturing ($2.1M YTD) and IT Hardware ($1.84M YTD) remain the largest categories. The upward trend is driven by the Q3 aluminium supply agreement and the engineering hardware refresh.",
  },
  {
    match: /delivery|on-time|reliable|performance/i,
    reply:
      "Top performers by on-time delivery: Adobe Inc. (100%), Dell Technologies (96%), and Steelcase (92%). Alcoa Materials is lagging at 81% on-time — I'd suggest a performance review before renewing the commodity supply contract.",
  },
  {
    match: /saving|optimi|reduce|cheaper/i,
    reply:
      "I've identified three savings opportunities this quarter: (1) consolidate the laptop RFQ to Lenovo for ~$26K savings, (2) renegotiate HP Enterprise's Net 60 terms which are flagged Medium risk, and (3) bundle the Datadog and Adobe renewals for a potential 8% volume discount. Combined estimated impact: ~$310K.",
  },
]

function getReply(input: string): string {
  const found = cannedResponses.find((c) => c.match.test(input))
  return (
    found?.reply ??
    "I can help with vendor selection, RFQ analysis, spend insights, and supplier risk. Based on your current data, you have 37 pending requests and 19 active RFQs. Try asking about the laptop RFQ recommendation or this month's spend breakdown."
  )
}

export default function CopilotPage() {
  const [messages, setMessages] = useState<Message[]>([])
  const [input, setInput] = useState("")
  const [isTyping, setIsTyping] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isTyping])

  function send(text: string) {
    const content = text.trim()
    if (!content) return
    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)
    setTimeout(() => {
      setMessages((prev) => [
        ...prev,
        { id: crypto.randomUUID(), role: "assistant", content: getReply(content) },
      ])
      setIsTyping(false)
    }, 900)
  }

  const isEmpty = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <PageHeader
        title="Procurement Copilot"
        description="Ask anything about vendors, spend, RFQs, and savings opportunities."
      />

      <Card className="flex flex-1 flex-col overflow-hidden">
        <CardContent className="flex flex-1 flex-col overflow-hidden p-0">
          <div ref={scrollRef} className="flex-1 overflow-y-auto px-4 py-6 sm:px-6">
            {isEmpty ? (
              <div className="flex h-full flex-col items-center justify-center gap-6 text-center">
                <div className="flex size-14 items-center justify-center rounded-2xl bg-primary/10">
                  <Sparkles className="size-7 text-primary" />
                </div>
                <div className="flex flex-col gap-1">
                  <h2 className="text-lg font-semibold">How can I help with procurement today?</h2>
                  <p className="max-w-md text-sm text-muted-foreground">
                    I have access to your vendors, requests, RFQs, and spend data. Ask a question
                    or pick a suggestion below.
                  </p>
                </div>
                <div className="grid w-full max-w-2xl gap-2 sm:grid-cols-2">
                  {suggestions.map((s) => (
                    <button
                      key={s}
                      onClick={() => send(s)}
                      className="rounded-lg border border-border bg-card p-3 text-left text-sm transition-colors hover:border-primary/50 hover:bg-accent/40"
                    >
                      {s}
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              <div className="mx-auto flex max-w-3xl flex-col gap-6">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={cn(
                      "flex gap-3",
                      msg.role === "user" && "flex-row-reverse",
                    )}
                  >
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback
                        className={cn(
                          msg.role === "assistant"
                            ? "bg-primary/10 text-primary"
                            : "bg-secondary",
                        )}
                      >
                        {msg.role === "assistant" ? (
                          <Sparkles className="size-4" />
                        ) : (
                          <User className="size-4" />
                        )}
                      </AvatarFallback>
                    </Avatar>
                    <div
                      className={cn(
                        "max-w-[80%] rounded-xl px-4 py-3 text-sm leading-relaxed",
                        msg.role === "assistant"
                          ? "bg-secondary text-secondary-foreground"
                          : "bg-primary text-primary-foreground",
                      )}
                    >
                      {msg.content}
                    </div>
                  </div>
                ))}
                {isTyping && (
                  <div className="flex gap-3">
                    <Avatar className="size-8 shrink-0">
                      <AvatarFallback className="bg-primary/10 text-primary">
                        <Sparkles className="size-4" />
                      </AvatarFallback>
                    </Avatar>
                    <div className="flex items-center gap-1 rounded-xl bg-secondary px-4 py-4">
                      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.3s]" />
                      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50 [animation-delay:-0.15s]" />
                      <span className="size-2 animate-bounce rounded-full bg-muted-foreground/50" />
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>

          <div className="border-t border-border bg-card p-4 sm:px-6">
            <div className="mx-auto max-w-3xl">
              <InputGroup>
                <InputGroupTextarea
                  placeholder="Ask the procurement copilot..."
                  value={input}
                  onChange={(e) => setInput(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Enter" && !e.shiftKey) {
                      e.preventDefault()
                      send(input)
                    }
                  }}
                />
                <InputGroupAddon align="block-end">
                  <span className="text-xs text-muted-foreground">
                    Powered by ProcureAI · grounded in your live data
                  </span>
                  <InputGroupButton
                    size="icon-xs"
                    className="ml-auto rounded-full"
                    variant="default"
                    disabled={!input.trim()}
                    onClick={() => send(input)}
                  >
                    <ArrowUp />
                    <span className="sr-only">Send</span>
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
