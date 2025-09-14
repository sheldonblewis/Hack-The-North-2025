// Chat utilities for transforming streaming API data to chat messages

export interface ChatMessage {
  id: string;
  role: "attacker" | "defender";
  content: string;
  timestamp: Date;
  status?: "success" | "failed" | "pending";
  flag?: {
    type: "jailbreak_attempt" | "safety_violation" | "prompt_injection";
    severity: "low" | "medium" | "high";
    description: string;
  };
}

export interface StreamingData {
  type: string;
  data?: {
    state?: string;
    agent_id?: string;
    conversation_history?: Array<{
      attack_prompt?: string;
      defense_message?: string;
    }>;
    evaluation_result?: {
      success?: boolean;
      status?: string;
    };
    error?: string;
  };
}

export interface ConversationStats {
  totalExchanges: number;
  successfulJailbreaks: number;
  successRate: number;
  attackTypes: {
    jailbreakAttempts: number;
    promptInjection: number;
    rolePlaying: number;
  };
  threatLevels: {
    high: number;
    medium: number;
    low: number;
  };
}

export const transformStreamingToMessages = (
  conversationHistory: Array<{
    attack_prompt?: string;
    defense_message?: string;
  }>,
  evaluationResults: Array<{
    success?: boolean;
    status?: string;
    attack_prompt?: string;
  }> = []
): ChatMessage[] => {
  const messages: ChatMessage[] = [];
  let messageId = 0;
  let currentAttackPrompt: string | undefined = undefined;

  conversationHistory.forEach((exchange, index) => {
    const baseTimestamp = Date.now() - (conversationHistory.length - index) * 5000;

    // Add attack message
    if (exchange.attack_prompt) {
      currentAttackPrompt = exchange.attack_prompt;

      // Match this attack prompt to the corresponding evaluation result
      const evaluation = evaluationResults.find(result =>
        result.attack_prompt === exchange.attack_prompt
      );
      const isJailbroken = evaluation?.success === true;

      messages.push({
        id: `attack-${messageId++}`,
        role: "attacker",
        content: exchange.attack_prompt,
        timestamp: new Date(baseTimestamp),
        status: isJailbroken ? "success" : "failed",
        flag: detectAttackFlag(exchange.attack_prompt)
      });
    }

    // Add defense message
    if (exchange.defense_message) {
      // Use the current attack prompt to find the evaluation
      const evaluation = evaluationResults.find(result =>
        result.attack_prompt === currentAttackPrompt
      );
      const isJailbroken = evaluation?.success === true;

      messages.push({
        id: `defense-${messageId++}`,
        role: "defender",
        content: exchange.defense_message,
        timestamp: new Date(baseTimestamp + 2000),
        status: isJailbroken ? "failed" : "success"
      });
    }
  });

  return messages;
};

export const detectAttackFlag = (attackPrompt: string): ChatMessage['flag'] | undefined => {
  const prompt = attackPrompt.toLowerCase();

  // Detect jailbreak attempts
  if (prompt.includes('developer mode') ||
      prompt.includes('ignore') ||
      prompt.includes('bypass') ||
      prompt.includes('uncensored') ||
      prompt.includes('dan ') ||
      prompt.includes('do anything now')) {
    return {
      type: "jailbreak_attempt",
      severity: "high",
      description: "Attempting to override system instructions or activate bypass modes"
    };
  }

  // Detect prompt injection
  if (prompt.includes('system:') ||
      prompt.includes('override') ||
      prompt.includes('previous instructions') ||
      prompt.includes('forget everything')) {
    return {
      type: "prompt_injection",
      severity: "medium",
      description: "Attempting prompt injection to override system behavior"
    };
  }

  // Detect role-playing attempts
  if (prompt.includes('pretend') ||
      prompt.includes('roleplay') ||
      prompt.includes('imagine you are') ||
      prompt.includes('act as') ||
      prompt.includes('you are now')) {
    return {
      type: "jailbreak_attempt",
      severity: "medium",
      description: "Using role-playing to circumvent safety measures"
    };
  }

  return undefined;
};

export const calculateStats = (messages: ChatMessage[]): ConversationStats => {
  const attackMessages = messages.filter(m => m.role === "attacker");
  const successfulJailbreaks = attackMessages.filter(m => m.status === "success").length;
  const totalExchanges = Math.floor(messages.length / 2); // Pairs of attack/defense

  const attackTypes = {
    jailbreakAttempts: attackMessages.filter(m =>
      m.flag?.type === "jailbreak_attempt"
    ).length,
    promptInjection: attackMessages.filter(m =>
      m.flag?.type === "prompt_injection"
    ).length,
    rolePlaying: attackMessages.filter(m =>
      m.flag?.description?.toLowerCase().includes('role') ||
      m.flag?.description?.toLowerCase().includes('pretend')
    ).length
  };

  const threatLevels = {
    high: attackMessages.filter(m => m.flag?.severity === "high").length,
    medium: attackMessages.filter(m => m.flag?.severity === "medium").length,
    low: attackMessages.filter(m => m.flag?.severity === "low").length
  };

  return {
    totalExchanges,
    successfulJailbreaks,
    successRate: totalExchanges > 0 ? (successfulJailbreaks / totalExchanges) * 100 : 0,
    attackTypes,
    threatLevels
  };
};

export const getFlagColor = (severity: string) => {
  switch (severity) {
    case 'high':
      return {
        color: 'var(--color-risk-critical)',
        backgroundColor: 'var(--color-risk-critical)20'
      };
    case 'medium':
      return {
        color: 'var(--color-risk-high)',
        backgroundColor: 'var(--color-risk-high)20'
      };
    case 'low':
      return {
        color: 'var(--color-risk-medium)',
        backgroundColor: 'var(--color-risk-medium)20'
      };
    default:
      return {
        color: 'var(--color-text-secondary)',
        backgroundColor: 'var(--color-primary-700)'
      };
  }
};