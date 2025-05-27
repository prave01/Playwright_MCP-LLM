/*
 *You can all the Google gen ai free models out there with a valid api key
 */

import {
  Chats,
  Content,
  GenerateContentConfig,
  GoogleGenAI,
  Type,
} from "@google/genai";
import { config } from "dotenv";
import { Models } from "./_types/enum.js";
import inquirer from "inquirer";
import chalk from "chalk";
import * as readline from "node:readline";
import OpenAI from "openai";

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

  async RunDeepseek() {
    const openai = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPEN_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "deepseek/deepseek-r1:free",
      response_format: { type: "json_object" },
      messages: [
        {
          role: "user",
          content: "give some books about vikings no of 10",
        },
      ],
    });
    console.log(completion.choices[0].message);
  }

  async RunLLM(context: object, response_type: string) {
    //* Checks the output is given or not
    // if (!args.outputType) {
    //   throw Error("🧱 Please provide a response type");
    // }

    //* It Checks the API is missing not
    if (!this.apikey) {
      throw Error("❌ Api Key is Missing");
    }

    //* Checks for the model is selected or not
    // if (!args.model) {
    //   throw Error("🪹 Please give name of the model you want to use");
    // }

    //* Creates the GoogleGen AI instance
    const ai = new GoogleGenAI({
      apiKey: this.apikey,
    });

    //* Configuring with the received creds
    // const config: GenerateContentConfig = args.outputType;

    //* Gives the model
    const model = "gemini-2.0-flash";

    //* Preparing the content plate to feed the model for response
    const contents: Content = {
      role: "User",
      parts: [{ text: "do you know whats my name is" }],
    };

    const Generation_Config: GenerateContentConfig = {
      temperature: 1,
      topK: 1,
      topP: 1,
      maxOutputTokens: 2500,
      responseMimeType: response_type,
    };
    //* Getting the response back

    const chat = ai.chats.create({
      model,
      config: Generation_Config,
      history: [],
    });

    // const input = readline.createInterface({
    //   input: process.stdin,
    //   output: process.stdout,
    // });

    // const get_name = async (): Promise<string> => {
    //   return new Promise((resolve) => {
    //     console.log(chalk.bgMagenta(chalk.white("You:")));
    //     input.question("\n", (answer) => {
    //       input.close();
    //       resolve(answer);
    //       console.log(
    //         chalk.magenta(
    //           "\n---------------------------------------------------\n"
    //         )
    //       );
    //     });
    //   });
    // };

    while (true) {
      // const prompt = await get_name();

      // if (prompt === "exit") {
      //   console.log(chalk.bgWhite(chalk.red("Bye Bye Bye 👋🏻..")));
      //   process.exit();
      // }

      // const final_context = {
      //   ...context,
      //   final_prompt:
      //     prompt +
      //     `\n\nGenerate a browser automation procedure using the tools above. Only include steps up to the "browser_navigate" tool call. Format the response as a JSON array of actions, following the specified schema.`,
      // };
      let response = await chat.sendMessage({
        message: JSON.stringify(context),
      });
      if (response) {
        console.log(chalk.bgBlue(chalk.white("Gemma:\n")));
        // process.stdout.write(response.text)
        return JSON.parse(response.text);
        // for await (const chunk of response) {
        //   const text = chunk.text;
        //   if (text) {
        //     fullResponse += text;
        //     process.stdout.write(text);
        //   }
      }
      console.log(
        chalk.magenta("---------------------------------------------------\n")
      );
    }
  }
}
