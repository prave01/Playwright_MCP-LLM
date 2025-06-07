interface LLMClientTypes {
  apiKey: any;
  model: string;
  config: GenerateContentConfig;
}

type LLMTypes = {
  outputType: GenerateContentConfig;
  model: string;
};
