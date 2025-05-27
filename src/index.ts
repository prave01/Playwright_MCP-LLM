/*

* Current Goal - 
 * list the available tools from the mcp server and make it available for the AI to generate the procedure based on that.

Todo 1.The get_tools function need some work
Todo 2.Give the tools list to the ai and try to get the procedure json back

*/

import LLM_Client from "./llm_client.js";
import { MCP_Client } from "./mcp_client.js";
import Controller from "./playwright_controller/controller.ts";

let options = {
  name: "client_1",
  port: 8080,
  version: "v.1.0.0",
};

const new_client = new MCP_Client(options);

async function main() {
  // await new_client.Connect_Server();
  // await new_client.get_tools();
  await Controller();

  // const new_client = new LLM_Client({
  //   model: "gemma-3-27b-it",
  //   apiKey: process.env.GOOGLE_API_KEY,
  //   config: { responseMimeType: "application/json" },
  // });

  // new_client.RunLLM({
  //   model: "gemma3",
  //   outputType: { responseMimeType: "text/plain" },
  // });
}

main();
