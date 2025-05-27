import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import LLM_Client from "./llm_client.ts";
import chalk from "chalk";

class MCP_Client {
  //? Global types for the global variables
  port: number;
  client: Client;
  private server_called: boolean;

  //* Specify the port to connect with the server
  constructor(creds: ConstructorTypes) {
    this.port = creds.port;
    this.client = new Client({
      name: creds.name,
      version: creds.version,
    }); //? Creates the global client instance
    this.server_called = false;
  }

  async Connect_Server() {
    //* Transport layer for sending messages between server
    //* and client using Server-Sent Events
    const transport = new SSEClientTransport(
      new URL(`http:localhost:${this.port}/sse`)
    );

    //* Connect the server on port 8080 with client using SSE
    await this.client
      .connect(transport)
      .then(() => {
        this.server_called = true;
        console.log(
          `Hurray!! \nConnected with server using SSE transport at ${this.port} 😉`
        );
      })
      .catch((err) => {
        console.error("🤕 Fkk ended up having error :", err);
      });
  }

  async get_tools() {
    try {
      //* Get the list of tools available in the Playwright MCP Server
      const response = await this.client.listTools();

      //* Storing the tools data and feeding that as a context to the llm to generate working procedure calls
      const tools_data = response.tools.map((item) => {
        return {
          name: item?.name,
          description: item.description,
          input_Schema: item.inputSchema.properties,
        };
      });

      return tools_data;
    } catch (err) {
      console.error("Error:", err);
    }
  }
}

const options: ConstructorTypes = {
  name: "client_1",
  port: 8080,
  version: "v.1.0.0",
};

export default MCP_Client;
