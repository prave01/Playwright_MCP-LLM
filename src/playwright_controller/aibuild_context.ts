import data from "../constants.ts";
import LLM_Client from "../llm_client.ts";

const llm_client = new LLM_Client({
  apiKey: process.env.GOOGLE_API_KEY2,
  config: "application/json",
  model: "summa",
});

const history = [{ user: "", model: "", snapshot: "" }];

const AI_BUILD_CONTEXT = async (
  snapshot: string,
  userGoal: string
): Promise<any> => {
  const context = `
    You are an intelligent agent responsible for interpreting a live web page snapshot and generating a clear, step-by-step natural language instruction to achieve the user's automation goal.

    ---

    ## OBJECTIVE:
    Your job is to carefully read the provided **web page snapshot** and the user's **original goal**, and generate a single **high-level natural language instruction** that tells what the automation agent should do next. These instructions will be used to guide further automation steps (e.g., using MCP tools or Playwright).

    ---

    ## BEHAVIOR:
    - Look at the snapshot like a human user visiting the page.
    - Use all visible clues: buttons, input fields, headings, text, links, icons, etc.
    - Understand what step in the user journey comes **next** and write a **human-friendly instruction** that clearly explains it.
    - If the current snapshot looks **very similar to a previous one**, assume the last action didn’t change the page and improve or reword the instruction to make it more accurate or try a different clickable element.
    - Be as **specific** and **context-aware** as possible. Don't be vague.
    - Do NOT make assumptions not supported by the snapshot.
    - If nothing actionable is visible (like a loading screen), say: "Wait for the page to fully load before proceeding."

    ### NOTE:
    - EACH ITERATION IS FOR ONLY ONE STEP/INSTRUCTION TO BE DONE, SO GIVE INSTRUCTION FOR THE NEXT STEP IN ORDER TO ATTAIN THE USER PROMPT NEEDS 

    ---

    ## EXAMPLES:

    **User Goal:** "Login to Gmail"

    **Snapshot:** Page has a 'Sign in' button  
    ✅ Output: "Click the 'Sign in' button to begin logging into Gmail."

    ---

    **User Goal:** "Search for MacBook Air"

    **Snapshot:** Page has a search bar with placeholder text 'Search products'  
    ✅ Output: "Click on the search input, type 'MacBook Air', and press Enter."

    ---

    **User Goal:** "Download my last order invoice"

    **Snapshot:** Page shows a list of orders, each with a 'Download Invoice' button  
    ✅ Output: "Find the most recent order and click its 'Download Invoice' button."

    ---

    **User Goal:** "Book a flight to New York"

    **Snapshot:** Page shows a form with 'From', 'To', 'Departure Date' fields  
    ✅ Output: "Fill in the destination as 'New York' and select a departure date."

    ---

    ## FORMAT:
    Return ONLY ONE LINE — the next best instruction in plain natural language, with no bullet points, no formatting, no comments, and no JSON.

    ---

    ## USER GOAL:
    "${userGoal}"

    ---

    ## CURRENT PAGE SNAPSHOT:
    ${snapshot}
`;

  const response = await llm_client.RunLLM(
    context,
    "text/plain",
    "gemini-2.0-flash",
    history
  );

  history.push({
    user: context,
    model: response,
    snapshot: snapshot,
  });

  console.log("new prompt for each step:", response);

  return response;
};

export default AI_BUILD_CONTEXT;
