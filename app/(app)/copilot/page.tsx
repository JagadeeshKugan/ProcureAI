"use client"

import { useRef, useState, useEffect } from "react"
import ReactMarkdown from "react-markdown"
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { PurchaseRequestMode } from "@/components/requestor/purchase-request-mode"
import { createPurchaseRequestAction } from "@/actions/requestor.actions"
import {
  getRFQByNumberForRecommendation,
  getVendorRecommendation,
} from "@/actions/rfq-vendor-recommendation.actions"
import { cn } from "@/lib/utils"
import { ArrowUp, Sparkles, User, Plus } from "lucide-react"

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
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false)
  const [isSubmittingRequest, setIsSubmittingRequest] = useState(false)
  const scrollRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: "smooth" })
  }, [messages, isTyping])

  async function send(text: string) {
    const content = text.trim()
    if (!content) return

    const userMsg: Message = { id: crypto.randomUUID(), role: "user", content }
    setMessages((prev) => [...prev, userMsg])
    setInput("")
    setIsTyping(true)

    try {
      // Detect RFQ number pattern: RFQ-YYYY-NNNNN
      const rfqMatch = content.match(/RFQ-\d{4}-\d+/i)
      
      if (rfqMatch) {
        const rfqNumber = rfqMatch[0].toUpperCase()
        
        // Check if user is asking about vendor recommendation
        if (
          /best|recommend|vendor|compare|who|which|award/i.test(content)
        ) {
          // Fetch RFQ and quotations
          const rfqResult = await getRFQByNumberForRecommendation(rfqNumber)
          
          if (!rfqResult.success || !rfqResult.data) {
            const errorMsg: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `I couldn't find RFQ ${rfqNumber}. Could you verify the RFQ number?`,
            }
            setMessages((prev) => [...prev, errorMsg])
            setIsTyping(false)
            return
          }

          const { rfq, quotations } = rfqResult.data

          if (quotations.length === 0) {
            const noQuotesMsg: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: `No vendor quotations have been submitted yet for ${rfqNumber}.`,
            }
            setMessages((prev) => [...prev, noQuotesMsg])
            setIsTyping(false)
            return
          }

          // Get AI recommendation
          try {
            const recommendation = await getVendorRecommendation(
              rfqNumber,
              rfq.title,
              quotations.map((q) => ({
                vendorName: q.vendorName,
                price: q.price,
                deliveryDays: q.deliveryDays,
                warranty: q.warranty,
                notes: q.notes,
              }))
            )

            const assistantMsg: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: recommendation.markdown,
            }
            setMessages((prev) => [...prev, assistantMsg])
          } catch (error) {
            console.error("[copilot] Recommendation error:", error)
            const errorMsg: Message = {
              id: crypto.randomUUID(),
              role: "assistant",
              content: "I encountered an error analyzing the vendors. Please try again.",
            }
            setMessages((prev) => [...prev, errorMsg])
          }
          setIsTyping(false)
          return
        }
      }

      // Fall back to canned responses
      setTimeout(() => {
        setMessages((prev) => [
          ...prev,
          { id: crypto.randomUUID(), role: "assistant", content: getReply(content) },
        ])
        setIsTyping(false)
      }, 900)
    } catch (error) {
      console.error("[copilot] Error:", error)
      const errorMsg: Message = {
        id: crypto.randomUUID(),
        role: "assistant",
        content: "An error occurred. Please try again.",
      }
      setMessages((prev) => [...prev, errorMsg])
      setIsTyping(false)
    }
  }



  const isEmpty = messages.length === 0

  return (
    <div className="flex h-[calc(100vh-7rem)] flex-col gap-4">
      <PageHeader
        title="Procurement Copilot"
        description="Ask anything about vendors, spend, RFQs, and savings opportunities."
      >
        <Button
          onClick={() => setIsCreateDialogOpen(true)}
          className="gap-2"
        >
          <Plus className="h-4 w-4" />
          Create Request with AI
        </Button>
      </PageHeader>

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
                      {msg.role === "assistant" ? (
                        <article className="prose prose-sm max-w-none dark:prose-invert">
                          <ReactMarkdown
                            components={{
                              h2: ({ children }) => (
                                <h2 className="text-lg font-bold text-primary mb-3">
                                  {children}
                                </h2>
                              ),
                              h3: ({ children }) => (
                                <h3 className="text-base font-semibold text-foreground mb-2">
                                  {children}
                                </h3>
                              ),
                              strong: ({ children }) => (
                                <strong className="font-semibold text-foreground">
                                  {children}
                                </strong>
                              ),
                              li: ({ children }) => (
                                <li className="mb-1 ml-4 list-disc">
                                  {children}
                                </li>
                              ),
                              ul: ({ children }) => (
                                <ul className="mb-2">
                                  {children}
                                </ul>
                              ),
                              p: ({ children }) => (
                                <p className="mb-2">
                                  {children}
                                </p>
                              ),
                            }}
                          >
                            {msg.content}
                          </ReactMarkdown>
                        </article>
                      ) : (
                        msg.content
                      )}
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

      {/* Create Purchase Request Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Create Purchase Request</DialogTitle>
            <DialogDescription>
              Use AI to generate a purchase request from natural language or fill out the form manually.
            </DialogDescription>
          </DialogHeader>
          <PurchaseRequestMode
            //onSubmit={handleCreateRequest}
            isLoading={isSubmittingRequest}
          />
        </DialogContent>
      </Dialog>
    </div>
  )
}
