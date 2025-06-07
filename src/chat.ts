import OpenAI from "openai";

// Interface for chat message
export type ChatMessage = {
  role: "system" | "user" | "assistant";
  content: string;
};

// Interface for chat options
export type ChatOptions = {
  model?: string;
  seed?: number;
  referrer?: string;
  maxHistory?: number; // Maximum number of messages to keep in history
  maxTokens?: number; // Maximum tokens for the completion
  maxContextTokens?: number; // Maximum context size (prompt + completion)
};

export class ChatSession {
  private history: ChatMessage[] = [];
  private options: ChatOptions;
  private readonly DEFAULT_MAX_TOKENS = 2048;
  private readonly DEFAULT_MAX_CONTEXT_TOKENS = 8000; // Default for gpt-4.1

  constructor(systemPrompt?: string, options: ChatOptions = {}) {
    if (systemPrompt) {
      this.history.push({
        role: "system",
        content: systemPrompt,
      });
    }
    this.options = {
      model: "openai/gpt-4.1",
      maxHistory: options.maxHistory || 20,
      maxTokens: options.maxTokens || this.DEFAULT_MAX_TOKENS,
      maxContextTokens:
        options.maxContextTokens || this.DEFAULT_MAX_CONTEXT_TOKENS,
      ...options,
    };
  }

  // Add a user message to the history
  addUserMessage(content: string): void {
    this.history.push({
      role: "user",
      content,
    });
    this.trimHistory();
  }

  // Add an assistant message to the history
  addAssistantMessage(content: string): void {
    this.history.push({
      role: "assistant",
      content,
    });
    this.trimHistory();
  }

  // Get the current chat history
  getHistory(): ChatMessage[] {
    return [...this.history];
  }

  // Clear the chat history
  clearHistory(): void {
    this.history = [];
  }

  // Estimate token count for a message (rough approximation)
  private estimateTokens(text: string): number {
    // Rough estimate: 4 characters ≈ 1 token
    return Math.ceil(text.length / 4);
  }

  // Calculate total tokens in history
  private calculateHistoryTokens(): number {
    return this.history.reduce(
      (total, msg) => total + this.estimateTokens(msg.content) + 4, // +4 for metadata
      0,
    );
  }

  // Trim history to fit within token limits
  private trimHistoryToFit(maxTokens: number): void {
    let totalTokens = this.calculateHistoryTokens();

    // Remove oldest messages (except system message) until we're under the limit
    while (totalTokens > maxTokens && this.history.length > 1) {
      const systemMessage =
        this.history[0]?.role === "system" ? this.history[0] : null;
      const removableMessages = systemMessage
        ? this.history.slice(1)
        : [...this.history];

      if (removableMessages.length === 0) break;

      // Remove the oldest non-system message
      const removedMessage = removableMessages.shift();
      totalTokens -= this.estimateTokens(removedMessage!.content) + 4;

      this.history = systemMessage
        ? [systemMessage, ...removableMessages]
        : [...removableMessages];
    }
  }

  // Keep the history within the maxHistory limit and token limits
  private trimHistory(): void {
    // First trim by message count
    if (
      this.options.maxHistory &&
      this.history.length > this.options.maxHistory
    ) {
      const systemMessage = this.history.find((m) => m.role === "system");
      const otherMessages = this.history
        .filter((m) => m.role !== "system")
        .slice(-(this.options.maxHistory - (systemMessage ? 1 : 0)));

      this.history = systemMessage
        ? [systemMessage, ...otherMessages]
        : [...otherMessages];
    }

    // Then trim by token count
    const maxContextTokens =
      this.options.maxContextTokens || this.DEFAULT_MAX_CONTEXT_TOKENS;
    const maxPromptTokens =
      maxContextTokens - (this.options.maxTokens || this.DEFAULT_MAX_TOKENS);
    this.trimHistoryToFit(maxPromptTokens);
  }

  // Send chat completion with current history
  async postChatCompletion(options: ChatOptions = {}): Promise<any> {
    const mergedOptions = { ...this.options, ...options };

    try {
      // Debug: Log environment variables
      console.log("Environment variables:", {
        GITHUB_KEY: process.env.GITHUB_KEY ? "***" : "Not set",
        NODE_ENV: process.env.NODE_ENV || "development",
      });

      // Ensure the API key is available
      const apiKey = process.env.GITHUB_KEY || "";
      if (!apiKey) {
        throw new Error("GitHub API key is not set in environment variables");
      }

      // Initialize the OpenAI client with GitHub's inference endpoint
      const client = new OpenAI({
        baseURL: "https://models.github.ai/inference",
        apiKey: apiKey.trim(),
        defaultHeaders: {
          Authorization: `Bearer ${apiKey.trim()}`,
        },
      });

      // Ensure we have enough context space
      const maxTokens = Math.min(
        mergedOptions.maxTokens || this.DEFAULT_MAX_TOKENS,
        mergedOptions.maxContextTokens || this.DEFAULT_MAX_CONTEXT_TOKENS,
      );

      // Ensure history fits within context window
      const maxContextTokens =
        mergedOptions.maxContextTokens || this.DEFAULT_MAX_CONTEXT_TOKENS;
      this.trimHistoryToFit(maxContextTokens - maxTokens);

      // Use the chat completions API
      const completion = await client.chat.completions.create({
        model: "openai/gpt-4o",
        messages: this.history,
        temperature: 1.0,
        top_p: 1.0,
      });

      // Add assistant's response to history
      const assistantMessage = completion.choices[0]?.message?.content;
      if (assistantMessage) {
        this.addAssistantMessage(assistantMessage);
      }

      // Return the completion response directly
      return completion;
    } catch (error) {
      console.error("Error in postChatCompletion:", error);
      if (error instanceof Error) {
        throw new Error(`Failed to get chat completion: ${error.message}`);
      }
      throw new Error(
        "An unknown error occurred while getting chat completion",
      );
    }
  }
}
