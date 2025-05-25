import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";

class MCP_Client {
  port: number;

  //* Specify the port to connect with the server
  constructor(server_port: number) {
    this.port = server_port;
  }

  async Connect_Server() {
    //* Transport layer for sending messages between server
    //* and client using Server-Sent Events
    const transport = new SSEClientTransport(
      new URL(`http:localhost:${this.port}/sse`)
    );

    //? Creates new client instance using MCP sdk
    const new_client = new Client({
      name: "sse-client",
      version: "1.0.0",
    });

    //* Connect the server on port 8080 with client using SSE
    await new_client
      .connect(transport)
      .then(() => {
        console.log(
          `Hurray!! \nConnected with server using SSE transport at ${this.port} 😉`
        );
      })
      .catch((err) => {
        console.error("🤕 Fkk ended up having error :", err);
      });
  }
}

//* New Client Instance
const client = new MCP_Client(8080);
client.Connect_Server();
