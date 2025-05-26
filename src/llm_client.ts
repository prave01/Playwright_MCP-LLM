/*
 *You can all the Google gen ai free models out there with a valid api key
 */

import { Content, GenerateContentConfig, GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import { Models } from "./_types/enum.js";

config();

export default class LLM_Client {
  //? Global types
  apikey: string;
  model: string;
  config: GenerateContentConfig;

  constructor(spec: llm_client_types) {
    this.apikey = spec.apiKey;
    this.model = spec.model;
    this.config = spec.config;
  }

  async RunLLM(args: LLMTypes) {
    //* Checks the output is given or not
    if (!args.outputType) {
      throw Error("🧱 Please provide a response type");
    }

    //* It Checks the API is missing not
    if (!this.apikey) {
      throw Error("❌ Api Key is Missing");
    }

    //* Checks for the model is selected or not
    if (!args.model) {
      throw Error("🪹 Please give name of the model you want to use");
    }

    //* Creates the GoogleGen AI instance
    const ai = new GoogleGenAI({
      apiKey: this.apikey,
    });

    //* Configuring with the received creds
    const config: GenerateContentConfig = args.outputType;

    //* Gives the model
    const model = Models.Gemma3;

    //* Preparing the content plate to feed the model for response
    const contents: Content = {
      role: "User",
      parts: [{ text: "Hi gemma iam praveen" }],
    };

    //* Getting the response back
    const response = await ai.models.generateContentStream({
      model,
      config,
      contents,
    });

    let fullResponse = "";
    for await (const chunk of response) {
      const text = chunk.text;
      if (text) {
        fullResponse += text;
        // Log the accumulated response so far
        process.stdout.write(text);
      }
    }
    // Add a newline at the end for cleaner output
    console.log();
  }
}
