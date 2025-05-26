interface llm_client_types {
  apiKey: any;
  model: string;
  config: GenerateContentConfig;
}

type LLMTypes = {
  outputType: GenerateContentConfig;
  model: string;
};
