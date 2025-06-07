import MCP_Client from "../mcp_client.ts";
import * as readline from "node:readline";
import chalk from "chalk";
import BuildContext from "./buildContext.ts";
import AI_BUILD_CONTEXT from "./aibuild_context.ts";
import * as fs from "fs";
import * as path from "path";
import { ChatSession } from "../chat.ts";

// Helper function to parse markdown-formatted JSON responses
const parseMarkdownJson = (text: string): any => {
  try {
    // Try parsing as regular JSON first
    return JSON.parse(text);
  } catch (e) {
    // If that fails, try extracting JSON from markdown code blocks
    const jsonMatch = text.match(/```(?:json)?\s*([\s\S]*?)\s*```/);
    if (jsonMatch && jsonMatch[1]) {
      try {
        return JSON.parse(jsonMatch[1].trim());
      } catch (innerError) {
        console.error("Failed to parse JSON from markdown:", innerError);
      }
    }
    throw e; // Re-throw if we couldn't parse it
  }
};

const IMAGE_PATH = path.join(process.cwd(), "image/");

console.log(IMAGE_PATH);

const mcp_client = new MCP_Client({
  name: "scraper",
  port: 8080,
  version: "v1.0.0",
});

// Initialize ChatSession with system prompt
const systemPrompt = `You are an expert prompt engineer helping a browser automation agent that uses Playwright MCP tools to automate web interactions.  
Your job is to **translate a raw user request** into a **precise, step-by-step instruction** for a single Playwright MCP action.

---

🔧 CONTEXT:
- The automation agent can only perform **one action per request**.
- The agent has access to tools like navigation, clicking, typing, waiting for elements, extracting text, etc.
- After each action, a snapshot of the page is taken.
- Your instruction must reflect the **first high-level interaction needed** to accomplish the goal.
- Do **not simplify the action**—include details like navigation, UI detection, element state handling, and interaction.

---

📏 FORMAT RULES:
- Your output should be **one complete instruction string**.
- It must include **all necessary substeps** to achieve the action cleanly.
- **No JSON, no explanation. Just the instruction as plain text.**
- It's OK if the instruction is **long**—include everything needed.`;

const chatSession = new ChatSession(systemPrompt, {
  model: "gemini-1.5-flash",
  maxHistory: 10,
});

const input = readline.createInterface({
  input: process.stdin,
  output: process.stdout,
});

const get_input = async (): Promise<string> => {
  return new Promise((resolve) => {
    console.log(chalk.bgMagenta(chalk.white("You:")));
    input.question("\n", (answer) => {
      resolve(answer);
    });
  });
};

// Function to optimize snapshot by removing unnecessary data
const optimizeSnapshot = (snapshot: string): string => {
  try {
    // Remove script and style tags
    let optimized = snapshot
      .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
      .replace(/<style\b[^<]*(?:(?!<\/style>)<[^<]*)*<\/style>/gi, '')
      // Remove comments
      .replace(/<!--.*?-->/gs, '')
      // Remove inline styles
      .replace(/\s+style="[^"]*"/g, '')
      // Remove class and id attributes
      .replace(/\s+(class|id)="[^"]*"/g, '')
      // Remove excessive whitespace
      .replace(/\s+/g, ' ')
      .trim();
    
    // Limit snapshot size to ~4000 characters (roughly ~1000 tokens)
    if (optimized.length > 4000) {
      optimized = optimized.substring(0, 4000) + '... [truncated]';
    }
    return optimized;
  } catch (e) {
    console.error('Error optimizing snapshot:', e);
    return snapshot; // Return original if optimization fails
  }
};

// Keep limited history to prevent token overflow
const MAX_HISTORY_ITEMS = 3;
const history: Array<{user: string, model: string, snapshot: string}> = [];

const Controller2 = async (visionMode: boolean = false) => {
  await mcp_client.Connect_Server();

  const tools = JSON.stringify(await mcp_client.get_tools());

  console.log(tools);

  await get_input()
    .then(async (result) => {
      const new_context = ` You are an expert prompt engineer helping a browser automation agent that uses Playwright MCP tools to automate web interactions.  
      Your job is to **translate a raw user request** into a **precise, step-by-step instruction** for a single Playwright MCP action.
      
      ---
      
      🔧 CONTEXT:
      - The automation agent can only perform **one action per request**.
      - The agent has access to tools like navigation, clicking, typing, waiting for elements, extracting text, etc.
      - After each action, a snapshot of the page is taken.
      - Your instruction must reflect the **first high-level interaction needed** to accomplish the goal.
      - Do **not simplify the action**—include details like:
        - Navigation ("go to"),
        - UI detection ("find the 'Sign in' button"),
        - Element state handling ("wait for the search bar to be visible"),
        - Interaction ("click", "type", "extract", etc.).
      
      ---
      
      📏 FORMAT RULES:
      - Your output should be **one complete instruction string**.
      - It must include **all necessary substeps** to achieve the action cleanly.
      - **No JSON, no explanation. Just the instruction as plain text.**
      - It’s OK if the instruction is **long**—include everything needed.
      
      ---
      
      🧠 Examples:
      
      **Input:** "I want to log in to Google"  
      **Output:** "Navigate to 'https://www.google.com', wait for the 'Sign in' button at the top right corner, then click on it"
      
      **Input:** "I need to search for shoes on Amazon"  
      **Output:** "Go to 'https://www.amazon.com', wait for the search bar to appear at the top of the page, click on it, then type 'shoes' and press Enter"
      
      **Input:** "Download the invoice from my last order on Flipkart"  
      **Output:** "Navigate to 'https://www.flipkart.com', sign in if not already logged in, go to 'My Orders', find the most recent order, then click on the 'Download Invoice' button for that order"
      
      **Input:** "Scrape all product names from the home page"  
      **Output:** "Wait for all product cards to load, then extract the text content of each element that contains a product name"
      
      **Input:** "Check weather for New York on weather.com"  
      **Output:** "Go to 'https://weather.com', wait for the search bar to appear, click it, type 'New York', select the correct result from the dropdown, and wait for the forecast to load"
      
      ---
      
      Now, based on the following user prompt, return **only one detailed Playwright-style action instruction** (no explanations or lists):
      
      USER PROMPT: "${result}"
`;
      // Add user message and get response
      chatSession.addUserMessage(new_context);
      const response = await chatSession.postChatCompletion();
      const need = response.choices?.[0]?.message?.content || "";

      await mcp_client.client.callTool({
        name: "browser_navigate",
        arguments: {
          url: "https://www.google.com",
        },
      });

      while (true) {
        const snapshot = await mcp_client.client.callTool({
          name: "browser_snapshot",
        });

        const screenshot = await mcp_client.client.callTool({
          name: "browser_screen_capture",
          arguments: {
            raw: true,
          },
        });

        // const base64Data = screenshot.content[0].data.replace(
        //   /^data:image\/\w+;base64,/,
        //   ""
        // );

        // const buffer = Buffer.from(base64Data, "base64");

        // // Create screenshots directory if it doesn't exist
        // const screenshotsDir = path.join(process.cwd(), "screenshots");
        // if (!fs.existsSync(screenshotsDir)) {
        // Optimize snapshot
        const optimizedSnapshot = optimizeSnapshot(snapshot.content[0].text);
        
        // Only get screenshot if in vision mode
        let screenshotData = '';
        if (visionMode) {
          screenshotData = screenshot.content[0].data;
        }

        // Get AI context with optimized snapshot
        const ai_context = await AI_BUILD_CONTEXT(
          visionMode ? screenshotData : optimizedSnapshot,
          need,
          screenshotData
        );

        // Build final context with optimized content
        const final_context = BuildContext(
          visionMode ? screenshotData : optimizedSnapshot,
          ai_context,
          tools,
          visionMode,
          screenshotData
        );

        // Create a new chat session with optimized settings
        const toolChat = new ChatSession(final_context, {
          model: "openai/gpt-4.1",
          maxHistory: 1,
          maxTokens: 500, // Limit response tokens
          maxContextTokens: 7000 // Stay well under 8k limit
        });

        // Add limited history
        if (history.length > 0) {
          // Only include the most recent interaction in the history
          const recent = history[history.length - 1];
          toolChat.addUserMessage(
            `Previous Goal: ${recent.user.substring(0, 200)}...`
          );
          if (recent.model) {
            toolChat.addAssistantMessage(recent.model);
          }
        }

        const response = await toolChat.postChatCompletion();
        let actions = [];

        try {
          const content = response.choices?.[0]?.message?.content;
          if (content) {
            // Try to parse the response, handling both raw JSON and markdown-formatted JSON
            const parsed = parseMarkdownJson(content);
            actions = Array.isArray(parsed) ? parsed : [];
          }
        } catch (e) {
          console.error("Failed to parse LLM response as JSON:", e);
          console.log("Raw response was:", response.choices?.[0]?.message?.content);
          actions = [];
        }

        // Update history with the interaction
        const modelResponse = response.choices?.[0]?.message?.content || "";
        if (history.length >= MAX_HISTORY_ITEMS) {
          history.shift();
        }
        history.push({
          user: result.substring(0, 200), // Truncate to avoid excessive tokens
          model: modelResponse,
          snapshot: visionMode 
            ? "[vision mode active]" 
            : optimizeSnapshot(snapshot.content[0].text)
        });

        // Process all actions sequentially
        for (const item of actions) {
          if (!item || !item.name) continue;

          const tool_response = await mcp_client.client.callTool({
            name: item.name,
            arguments: item.input_schema || {},
          });

          console.log(tool_response);

          // console.log("tool response: ", JSON.parse(tool_response));
          console.log(
            `\n[LOG] [CURRENT_ACTION] ${chalk.magenta(
              item.name
            )} [DESCRIPTION] ${chalk.bgBlue(" " + item.description + " \n")}`
          );
        }
      }
    })
    .catch((err) => {
      throw Error(err);
    });
};

export default Controller2;
