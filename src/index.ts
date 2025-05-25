/*

* Current Goal - 
 * list the available tools from the mcp server and make it available for the AI to generate the procedure based on that.

Todo 1.The get_tools function need some work
Todo 2.Create db and seed the indformation about the tools for ai to get it from there or plan some thing else.

*/

import MCP_Client from "./mcp_client";

let options = {
  name: "client_1",
  port: 8080,
  version: "v.1.0.0",
};

const new_client = new MCP_Client(options);

async function main() {
  await new_client.Connect_Server();
  await new_client.get_tools();
}

main();
