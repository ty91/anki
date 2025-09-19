import 'dotenv/config';
import { serve } from '@hono/node-server';
import { Hono } from 'hono';
import { fetchEntryByExpression, saveEntry } from './database.js';
import { classifyEntry, generateEntry, type ClassificationResult, type GenerateResponse } from './openaiGenerator.js';

type GenerateRequestBody = {
  entry: string;
};

const app = new Hono();

app.get('/', (context) => {
  return context.json({ status: 'ok' });
});

app.post('/api/generate', async (context) => {
  let payload: GenerateRequestBody;

  try {
    payload = await context.req.json<GenerateRequestBody>();
  } catch (error) {
    return context.json({ error: 'Invalid JSON payload.' }, 400);
  }

  const entry = payload.entry?.trim();

  if (!entry) {
    return context.json({ error: 'Entry is required.' }, 400);
  }

  try {
    const existingEntry = await fetchEntryByExpression(entry);

    if (existingEntry) {
      return context.json(existingEntry);
    }

    const classification: ClassificationResult = await classifyEntry(entry);

    if (!classification.isValid) {
      return context.json({ error: classification.reason }, 400);
    }

    const response: GenerateResponse = await generateEntry(entry);

    await saveEntry({
      expression: entry,
      meaning: response.meaning,
      examples: response.examples,
      toneTip: response.toneTip,
      etymology: response.etymology,
    });

    const saved = await fetchEntryByExpression(entry);

    if (!saved) {
      throw new Error('Failed to persist entry.');
    }

    return context.json(saved);
  } catch (error) {
    const message =
      error instanceof Error ? error.message : 'Failed to generate content from OpenAI.';

    console.error('OpenAI generation failed:', message);

    return context.json({ error: message }, 500);
  }
});

const port = Number(process.env.PORT ?? 3000);

console.log(`Backend listening on http://localhost:${port}`);
serve({ fetch: app.fetch, port });
