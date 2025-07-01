import { AIChatAssistant } from "@/components/ai-chat-assistant"

export default function AssistantPage() {
  return (
    <div className="container mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">🤖 Your Personal JLPT N1 Assistant</h1>
        <p className="text-muted-foreground">
          Intensive preparation mode: Let&apos;s maximize your remaining 4 days to pass the N1 exam!
        </p>
      </div>
      
      <AIChatAssistant />
    </div>
  )
}
