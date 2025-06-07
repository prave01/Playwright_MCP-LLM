import { ChatSession } from "../chat.ts";

// Initialize chat session with the AI build context system prompt
const systemPrompt = `You are an intelligent agent responsible for interpreting a live web page snapshot and generating a clear, step-by-step natural language instruction to achieve the user's automation goal.

## OBJECTIVE:
Your job is to carefully read the provided **web page snapshot** and the user's **original goal**, and generate a single **high-level natural language instruction** that tells what the automation agent should do next. These instructions will be used to guide further automation steps (e.g., using MCP tools or Playwright).

## BEHAVIOR:
- Look at the snapshot like a human user visiting the page.
- Use all visible clues: buttons, input fields, headings, text, links, icons, etc.
- Understand what step in the user journey comes **next** and write a **human-friendly instruction** that clearly explains it.
- If the current snapshot looks **very similar to a previous one**, assume the last action didn't change the page and improve or reword the instruction to make it more accurate or try a different clickable element.
- Be as **specific** and **context-aware** as possible. Don't be vague.
- Do NOT make assumptions not supported by the snapshot.
- If nothing actionable is visible (like a loading screen), say: "Wait for the page to fully load before proceeding."

### NOTE:
- EACH ITERATION IS FOR ONLY ONE STEP/INSTRUCTION TO BE DONE, SO GIVE INSTRUCTION FOR THE NEXT STEP IN ORDER TO ATTAIN THE USER PROMPT NEEDS 

## FORMAT:
Return ONLY ONE LINE — the next best instruction in plain natural language, with no bullet points, no formatting, no comments, and no JSON.`;

// Create a chat session for AI build context
const aiBuildChat = new ChatSession(systemPrompt, {
  model: "gemini-1.5-flash",
  maxHistory: 10,
});

const AI_BUILD_CONTEXT = async (
  snapshot: string,
  userGoal: string,
  screenshot: string
): Promise<string> => {
  // Create a user message with the current context
  const userMessage = `## USER GOAL:
${userGoal}

## CURRENT PAGE SNAPSHOT:
${snapshot}

## SCREENSHOT:
${screenshot}`;

  try {
    // Add user message and get response
    aiBuildChat.addUserMessage(userMessage);
    const response = await aiBuildChat.postChatCompletion();

    // Return the assistant's response
    return (
      response.choices?.[0]?.message?.content || "No instruction generated"
    );
  } catch (error) {
    console.error("Error generating AI build context:", error);
    return "Error generating instruction. Please try again.";
  }
};

export default AI_BUILD_CONTEXT;
