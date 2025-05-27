import MCP_Client from "../mcp_client.ts";
import LLM_Client from "../llm_client.ts";
import * as readline from "node:readline";
import chalk from "chalk";
import { findDoubleNewlineIndex } from "openai/internal/decoders/line.mjs";

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

await mcp_client.Connect_Server();

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

const add = {
  commands: [
    {
      name: "browser_snapshot",
      title: "Page snapshot",
      description:
        "Capture accessibility snapshot of the current page, this is better than screenshot",
      parameters: null,
      readOnly: true,
    },
    {
      name: "browser_click",
      title: "Click",
      description: "Perform click on a web page",
      parameters: {
        element: "string",
        ref: "string",
      },
      readOnly: false,
    },
    {
      name: "browser_drag",
      title: "Drag mouse",
      description: "Perform drag and drop between two elements",
      parameters: {
        startElement: "string",
        startRef: "string",
        endElement: "string",
        endRef: "string",
      },
      readOnly: false,
    },
    {
      name: "browser_hover",
      title: "Hover mouse",
      description: "Hover over element on page",
      parameters: {
        element: "string",
        ref: "string",
      },
      readOnly: true,
    },
    {
      name: "browser_type",
      title: "Type text",
      description: "Type text into editable element",
      parameters: {
        element: "string",
        ref: "string",
        text: "string",
        submit: "boolean (optional)",
        slowly: "boolean (optional)",
      },
      readOnly: false,
    },
    {
      name: "browser_select_option",
      title: "Select option",
      description: "Select an option in a dropdown",
      parameters: {
        element: "string",
        ref: "string",
        values: "array",
      },
      readOnly: false,
    },
    {
      name: "browser_press_key",
      title: "Press a key",
      description: "Press a key on the keyboard",
      parameters: {
        key: "string",
      },
      readOnly: false,
    },
    {
      name: "browser_wait_for",
      title: "Wait for",
      description:
        "Wait for text to appear or disappear or a specified time to pass",
      parameters: {
        time: "number (optional)",
        text: "string (optional)",
        textGone: "string (optional)",
      },
      readOnly: true,
    },
    {
      name: "browser_file_upload",
      title: "Upload files",
      description: "Upload one or multiple files",
      parameters: {
        paths: "array",
      },
      readOnly: false,
    },
    {
      name: "browser_handle_dialog",
      title: "Handle a dialog",
      description: "Handle a dialog",
      parameters: {
        accept: "boolean",
        promptText: "string (optional)",
      },
      readOnly: false,
    },
    {
      name: "browser_navigate",
      title: "Navigate to a URL",
      description: "Navigate to a URL",
      parameters: {
        url: "string",
      },
      readOnly: false,
    },
    {
      name: "browser_navigate_back",
      title: "Go back",
      description: "Go back to the previous page",
      parameters: null,
      readOnly: true,
    },
    {
      name: "browser_navigate_forward",
      title: "Go forward",
      description: "Go forward to the next page",
      parameters: null,
      readOnly: true,
    },
    {
      name: "browser_take_screenshot",
      title: "Take a screenshot",
      description:
        "Take a screenshot of the current page. You can't perform actions based on the screenshot, use browser_snapshot for actions.",
      parameters: {
        raw: "boolean (optional)",
        filename: "string (optional)",
        element: "string (optional)",
        ref: "string (optional)",
      },
      readOnly: true,
    },
    {
      name: "browser_pdf_save",
      title: "Save as PDF",
      description: "Save page as PDF",
      parameters: {
        filename: "string (optional)",
      },
      readOnly: true,
    },
    {
      name: "browser_network_requests",
      title: "List network requests",
      description: "Returns all network requests since loading the page",
      parameters: null,
      readOnly: true,
    },
    {
      name: "browser_console_messages",
      title: "Get console messages",
      description: "Returns all console messages",
      parameters: null,
      readOnly: true,
    },
  ],
};

const Flow = async (context: string = null) => {
  const input = await get_input();

  const tools = await mcp_client.get_tools();

  const _context = {
    base_context: `
      ${context ? context : ""}
      
      \nYour_Role: You are an expert browser automation assistant specialized in generating Playwright procedures.
      
      \nConstraints:
      - Only use the tools available in the Playwright MCP environment.
      - Only output steps up to and including the "browser_navigate" action. Do not include any steps beyond that.
      - Do not include explanations, comments, or unrelated content.
      - Always respond in the following JSON format:
      - If you find any URL dont forget to return it in valid format (http://,https://)
      
      [
          {
          "name": "action_name",               // must match a tool from the tools list
          "description": "Short description of the action",
          "input_schema": { ... }             // schema must match the tool's expected input
          }
      ]

      the above schema is should have all the necessary parameters that are in the additional_info_about_tools
      
      Only respond with valid JSON. Do not wrap the JSON in backticks or markdown formatting.
      `,

    playwright_tools: tools,

    additional_info_about_tools: add,

    prompt: input,

    note: `\n\nGenerate a browser automation procedure using the tools above. Only include steps up to the "browser_navigate" tool call. Format the response as a JSON array of actions, following the specified schema. Read the full prompt before you generate`,
  };

  const response: Array<{
    name: string;
    description: string;
    input_schema: any;
  }> = await llm_client.RunLLM(_context, "application/json");

  console.log(chalk.yellow(JSON.stringify(response)));

  const findNavigate = response.filter(
    (item) => item.name === "browser_navigate"
  );

  console.log(chalk.bgCyan(JSON.stringify(findNavigate)));

  if (findNavigate && findNavigate.length > 0) {
    try {
      await mcp_client.client.callTool({
        name: findNavigate[0].name,
        arguments: findNavigate[0].input_schema,
      });

      const page_content = await mcp_client.client.callTool({
        name: "browser_snapshot",
      });

      console.log(page_content.content);

      const new_context = `I have attached the snapshot of the current page that you want me to navigate now give procedures to do what the prompt is expecting, i also gave the previous procedure that had done and now give me wat next to do to satisfy the prompts needs
      
      \nsnapshot/pagecontent:\n ${page_content.content[0].text}\n
      `;

      Flow(new_context);
      return;
    } catch (error) {
      throw Error(`Error executing tool :`, error);
    }
  }

  // Process each action with a 1-second delay between executions
  for (const item of response) {
    try {
      console.log("Executing:", item.name, "with args:", item.input_schema);

      // Execute the current action
      await mcp_client.client.callTool({
        name: item.name,
        arguments: item.input_schema,
      });

      // Add a 1-second delay before next action
      await new Promise((resolve) => setTimeout(resolve, 1000));
    } catch (error) {
      console.error(`Error executing ${item.name}:`, error);
    }
  }

  // After all actions, continue the flow
  await Flow();

  //   if (response && response.length > 0) {
  //     for (const item of response) {
  //       try {
  //         await mcp_client.client.callTool({
  //           name: item.name,
  //           arguments: item.input_schema,
  //         });
  //         Flow();
  //       } catch (error) {
  //         console.error(`Error executing tool ${item.name}:`, error);
  //       }
  //     }
  //   } else {
  //     console.warn("No valid actions to execute");
  //   }
};

export default Flow;
