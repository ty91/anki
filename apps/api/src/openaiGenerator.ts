import OpenAI from "openai";
import { appConfig } from "./config.js";

export type ClassificationResult = {
  isValid: boolean;
  reason: string;
};

export type GenerateResponse = {
  meaning: string;
  examples: string[];
  toneTip: string;
  etymology: string;
};

const CLASSIFICATION_FORMAT = {
  name: "EntryClassification",
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["isValid", "reason"],
    properties: {
      isValid: {
        type: "boolean",
        description:
          "True when the expression is a meaningful English word, idiom, or collocation.",
      },
      reason: {
        type: "string",
        description:
          "Brief explanation describing the classification decision for the learner.",
      },
    },
  },
} as const;

const GENERATED_ENTRY_FORMAT = {
  name: "GeneratedEntry",
  type: "json_schema",
  schema: {
    type: "object",
    additionalProperties: false,
    required: ["meaning", "examples", "toneTip", "etymology"],
    properties: {
      meaning: {
        type: "string",
        description: "Definition suited for an English learner.",
      },
      examples: {
        type: "array",
        minItems: 3,
        items: {
          type: "string",
          description: "An example sentence showcasing usage in context.",
        },
      },
      toneTip: {
        type: "string",
        description:
          "Guidance about how to express the phrase with the right tone.",
      },
      etymology: {
        type: "string",
        description: "Background on the origin or story of the expression.",
      },
    },
  },
} as const;

let cachedClient: OpenAI | null = null;

export const classifyEntry = async (
  entry: string
): Promise<ClassificationResult> => {
  const client = getClient();

  const response = await client.responses.parse({
    model: appConfig.OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are an English usage gatekeeper. Decide if the given expression is a valid word, idiom, or collocation for English learners. Be conservative with nonsense strings.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Expression: "${entry}"`,
          },
        ],
      },
    ],
    text: {
      format: CLASSIFICATION_FORMAT,
    },
  });

  const parsed = response.output_parsed as ClassificationResult | null;

  if (!parsed) {
    throw new Error(
      "OpenAI classification response did not include structured content."
    );
  }

  return parsed;
};

const getClient = (): OpenAI => {
  if (cachedClient) {
    return cachedClient;
  }

  const apiKey = appConfig.OPENAI_API_KEY;

  if (!apiKey) {
    throw new Error(
      "OpenAI API key is not configured. Set the OPENAI_API_KEY environment variable."
    );
  }

  cachedClient = new OpenAI({ apiKey });

  return cachedClient;
};

export const generateEntry = async (
  entry: string
): Promise<GenerateResponse> => {
  const client = getClient();

  const response = await client.responses.parse({
    model: appConfig.OPENAI_MODEL,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text: "You are an English learning assistant. Return structured JSON matching the provided schema. DO NOT include the actual expressions in the meaning.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: `Expression: "${entry}"`,
          },
        ],
      },
    ],
    text: {
      format: GENERATED_ENTRY_FORMAT,
    },
  });

  const parsed = response.output_parsed as GenerateResponse | null;

  if (!parsed) {
    throw new Error("OpenAI response did not include structured content.");
  }

  return parsed;
};
