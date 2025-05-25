import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

class MCP_Client {
  base_url: string;
  client_fields: { name: string; version: string };
  purpose: string;
  // Initializes the client property with a new Client instance
  constructor({ client, purpose, base_url }: client_vars) {
    // Setting the variables for the MCP Client
    this.base_url = base_url;
    this.client_fields = client;
    this.purpose = purpose;
  }

  // Starts the Playwright MCP Server
  start_server(port: number) {
    exec(
      `npx playwright-mcp-server --port ${port}`,
      (error, stdout, stderr) => {
        if (error) {
          console.error(`Error starting server: ${error.message}`);
          return;
        }
        if (stderr) {
          console.error(`Server stderr: ${stderr}`);
          return;
        }
        console.log(`Server started: ${stdout}`);
      }
    );
  }

  connect_with_server() {}
}
