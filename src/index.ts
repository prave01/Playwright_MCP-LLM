import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { SSEClientTransport } from "@modelcontextprotocol/sdk/client/sse.js";
import { constructor_types } from "./_types/index_types";

class MCP_Client {
  //? Global types for the global variables
  port: number;
  client: Client;

  //* Specify the port to connect with the server
  constructor(creds: constructor_types) {
    this.port = creds.port;
    this.client = new Client({
      name: creds.name,
      version: creds.version,
    });
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

  //* Give commads to the playwright server
}

const options: constructor_types = {
  name: "client_1",
  port: 8080,
  version: "v.1.0.0",
};

//* New Client Instance
const client = new MCP_Client(options);
client.Connect_Server();
