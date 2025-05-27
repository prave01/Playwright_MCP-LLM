import { ControlReferenceImage } from "@google/genai";
import LLM_Client from "../llm_client.ts";
import { MCP_Client } from "../mcp_client.ts";
import chalk from "chalk";
import { url } from "inspector";

const Controller = async () => {
  const mcp_client = new MCP_Client({
    name: "first_Scraper",
    port: 8080,
    version: "v1.0.0",
  });

  await mcp_client.Connect_Server();

  const tools = await mcp_client.get_tools();

  if (!tools) {
    throw Error("No Procedure Given");
  }

  const constrained_prompt = {
    base_context: `
    You are an expert browser automation assistant specialized in generating Playwright procedures.
    
    Constraints:
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
    
    Only respond with valid JSON. Do not wrap the JSON in backticks or markdown formatting.`,

    tools_available_in_playwright_mcp: tools,
  };

  const llm = new LLM_Client({
    apiKey: process.env.GOOGLE_API_KEY,
    config: { responseMimeType: "application/json" },
    model: "summa",
  });

  const response: Array<{
    name: string;
    description: string;
    input_schema: any;
  }> = await llm.RunLLM(constrained_prompt, "application/json");

  if (!response) {
    throw Error("LLM is not responding");
  }

  console.log(chalk.italic(JSON.stringify(response)));

  const findNavigate = response.filter(
    (item) => item.name === "browser_navigate"
  );

  const highlightOptions = {
    highlightOnAction: true, // Enable highlighting
    highlightColor: "#FF0000", // Red color for the highlight
    highlightThickness: 2, // Border thickness in pixels
    highlightStyle: "dashed", // Can be 'solid', 'dotted', 'dashed', etc.
  };

  const args = {
    ...findNavigate[0].input_schema,
    ...highlightOptions,
  };

  if (findNavigate) {
    await mcp_client.client.callTool({
      name: "browser_navigate",
      arguments: { url: findNavigate[0].input_schema.url, highlightOptions },
    });
    const content = await mcp_client.client.callTool({
      name: "browser_snapshot",
    });

    console.log(content);

    const new_content = {
      base_context: `I have attached the snapshot of the current page that you want me to navigate now give procedures to do what the prompt is expecting, i also gave the previous procedure that had done and now give me wat next to do to satisfy the prompts needs

        Constraints:
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
        `,
      previous_procedures: response,

      tools_available_in_playwright_mcp: tools,

      playwright_snapshot: content,
    };

    const res2: Array<{
      name: string;
      description: string;
      input_schema: any;
    }> = await llm.RunLLM(new_content, "application/json");

    console.log(res2);

    res2.map(async (item) => {
      await mcp_client.client.callTool({
        name: item.name,
        arguments: item.input_schema,
      });
    });
  }
};

export default Controller;
