import MCP_Client from "../mcp_client.ts";
import LLM_Client from "../llm_client.ts";
import * as readline from "node:readline";
import chalk from "chalk";
import BuildContext from "./buildContext.ts";
import fs from "node:fs/promises";
import * as path from "path";
import AI_BUILD_CONTEXT from "./aibuild_context.ts";

const HISTORY_PATH = path.join(process.cwd(), "history.json");

const mcp_client = new MCP_Client({
  name: "scraper",
  port: 8080,
  version: "v1.0.0",
});

const llm_client = new LLM_Client({
  apiKey: process.env.GOOGLE_API_KEY,
  config: "application/json",
  model: "summa",
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

const history = [{ user: "", model: "", snapshot: "" }];

const Controller2 = async (context: object = null) => {
  await mcp_client.Connect_Server();

  const tools = JSON.stringify(await mcp_client.get_tools());

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
      const need = await llm_client.RunLLM(
        new_context,
        "text/plain",
        "gemma-3-27b-it"
      );

      console.log("step1: ", need);

      while (true) {
        const snapshot = await mcp_client.client.callTool({
          name: "browser_snapshot",
        });

        const ai_context = await AI_BUILD_CONTEXT(
          snapshot.content[0].text,
          need
        );

        console.log("step 2: ", ai_context);

        const final_context = BuildContext(
          snapshot?.content[0].text,
          ai_context,
          tools
        );

        console.log("step 3: ", typeof final_context);

        const response = await llm_client.RunLLM(
          final_context,
          "application/json",
          "gemini-2.0-flash",
          history
        );

        console.log("step 4 procedures: ", response);

        history.push({
          user: result,
          model: JSON.stringify(response),
          snapshot: snapshot?.content[0]?.text,
        });

        console.log(response);

        // Process all actions sequentially
        for (const item of response) {
          await mcp_client.client.callTool({
            name: item.name,
            arguments: item.input_schema,
          });
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
