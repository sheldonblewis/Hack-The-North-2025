export interface TestRun {
  id: string
  name: string
  executedOn: Date
  result: {
    passed: number
    failed: number
    error: number
  }
}

export interface Agent {
  id: string
  name: string
}

export interface ChatMessage {
  id: string
  role: "attacker" | "defender"
  content: string
  timestamp: Date
  status?: "success" | "failed" | "pending"
  flag?: {
    type: "jailbreak_attempt" | "safety_violation" | "prompt_injection"
    severity: "low" | "medium" | "high"
    description: string
  }
}