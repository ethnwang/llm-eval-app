import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { createPrompt, createResponse, createMetrics, createEvaluationResult, createEvaluationRun, completeEvaluationRun } from '@/db/queries';
import { evaluateResponse } from '@/lib/evaluation';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});

// Define our LLM configurations
const models = [
  {
    name: 'mixtral-8x7b-32768',
    displayName: 'Mixtral',
    temperature: 0.7,
    maxTokens: 1024,
  },
  {
    name: 'llama-3.3-70b-versatile',
    displayName: 'Meta',
    temperature: 0.7,
    maxTokens: 1024,
  },
  {
    name: 'gemma2-9b-it',
    displayName: 'Google',
    temperature: 0.7,
    maxTokens: 1024,
  }
];

async function getModelResponse(prompt: string, model: typeof models[0]) {
  const startTime = Date.now();
  const response = await groq.chat.completions.create({
    messages: [{ role: 'user', content: prompt }],
    model: model.name,
    temperature: model.temperature,
    max_tokens: model.maxTokens,
  });
  const latency = Date.now() - startTime;

  return {
    content: response.choices[0]?.message?.content || '',
    latency,
    model: model.displayName
  };
}

export async function POST(req: NextRequest) {
  try {
    const { prompt } = await req.json();

    if (!prompt) {
      return NextResponse.json(
        { error: 'Prompt is required' },
        { status: 400 }
      );
    }

    // Create prompt record
    const promptRecord = await createPrompt(prompt);

    // Create evaluation run
    const evaluationRun = await createEvaluationRun(
      `Evaluation for prompt: ${prompt.slice(0, 50)}...`,
      'Automatic evaluation of model responses'
    );

    // Get responses from all models in parallel
    const responses = await Promise.all(
      models.map(async (model) => {
        try {
          const response = await getModelResponse(prompt, model);
          
          // Store response in database
          const dbResponse = await createResponse({
            promptId: promptRecord.id,
            modelName: model.name,
            content: response.content,
            latency: response.latency,
          });

          // Get evaluation for this response
          const evaluation = await evaluateResponse(prompt, response.content);
          
          if (evaluation) {
            // Store metrics in database
            const metrics = await createMetrics({
              responseId: dbResponse.id,
              ...evaluation.statistical,
              ...evaluation.model
            });

            // Create evaluation result
            await createEvaluationResult({
              runId: evaluationRun.id,
              responseId: dbResponse.id,
              statisticalMetricId: metrics.statistical.id,
              modelMetricId: metrics.model.id,
              metadata: {
                evaluatedAt: new Date().toISOString(),
                evaluatorModel: 'gemini-1.5-pro'
              }
            });

            return {
              id: dbResponse.id,
              model: model.displayName,
              content: response.content,
              latency: response.latency,
              evaluation
            };
          }

          return {
            id: dbResponse.id,
            model: model.displayName,
            content: response.content,
            latency: response.latency
          };
        } catch (error) {
          console.error(`Error with model ${model.name}:`, error);
          return {
            id: 'error-' + Date.now(),
            model: model.displayName,
            content: 'Error generating response',
            latency: 0,
            error: true
          };
        }
      })
    );

    // Complete the evaluation run
    await completeEvaluationRun(evaluationRun.id);

    return NextResponse.json({
      prompt: promptRecord,
      responses
    });

  } catch (error) {
    console.error('Error processing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to process prompt' },
      { status: 500 }
    );
  }
}