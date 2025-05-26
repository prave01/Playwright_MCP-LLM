/*
 *You can all the Google gen ai free models out there with a valid api key
 */

import { Content, GenerateContentConfig, GoogleGenAI } from "@google/genai";
import { config } from "dotenv";
import { Models } from "./_types/enum.js";
import inquirer from "inquirer";
import chalk from "chalk";
import * as readline from "node:readline";
import terminalKit from "terminal-kit";

const { terminal } = terminalKit;

config();

export default class LLM_Client {
  //? Global types
  apikey: string;
  model: string;
  config: GenerateContentConfig;

  constructor(spec: LLMClientTypes) {
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
    // const config: GenerateContentConfig = args.outputType;

    //* Gives the model
    const model = Models.Gemma3;

    //* Preparing the content plate to feed the model for response
    const contents: Content = {
      role: "User",
      parts: [{ text: "do you know whats my name is" }],
    };
    const Generation_Config: GenerateContentConfig = {
      temperature: 0.4,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2500,
    };
    //* Getting the response back

    const chat = ai.chats.create({
      model,
      config: Generation_Config,
      history: [],
    });

    const input = readline.createInterface({
      input: process.stdin,
      output: process.stdout,
    });

    const get_name = async (): Promise<string> => {
      return new Promise((resolve) => {
        console.log(chalk.bgMagenta(chalk.white("You:")));
        input.question("\n", (answer) => {
          resolve(answer);
          console.log(
            chalk.magenta(
              "\n---------------------------------------------------\n"
            )
          );
        });
      });
    };

    while (true) {
      const prompt = await get_name();
      if (prompt === "exit") {
        console.log(chalk.bgWhite(chalk.red("Bye Bye Bye 👋🏻..")));
        process.exit();
      }
      let response = await chat.sendMessageStream({ message: prompt });
      let fullResponse = "";
      if (response) {
        console.log(chalk.bgBlue(chalk.white("Gemma:\n")));
        for await (const chunk of response) {
          const text = chunk.text;
          if (text) {
            fullResponse += text;
            process.stdout.write(text);
          }
        }
        console.log(
          chalk.magenta("---------------------------------------------------\n")
        );
      }
    }
  }
}
