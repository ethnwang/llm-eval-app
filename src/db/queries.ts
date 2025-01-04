import { db } from '.';
import { 
  promptTable, 
  responseTable, 
  statisticalMetricsTable, 
  modelMetricsTable,
  evaluationRunsTable,
  evaluationResultsTable 
} from './schema';
import { eq } from 'drizzle-orm';

// Prompt helpers
export async function createPrompt(text: string) {
  const [prompt] = await db.insert(promptTable)
    .values({ text })
    .returning();
  return prompt;
}

export async function getPromptById(id: string) {
    const prompt = await db.select()
      .from(promptTable)
      .where(eq(promptTable.id, id))
      .limit(1);
    
    if (!prompt.length) return null;
    
    const responses = await db.select()
      .from(responseTable)
      .where(eq(responseTable.promptId, id));
    
    return {
      ...prompt[0],
      responses
    };
  }

// Response helpers
export async function createResponse({
  promptId,
  modelName,
  content,
  latency,
}: {
  promptId: string;
  modelName: string;
  content: string;
  latency: number;
}) {
  const [response] = await db.insert(responseTable)
    .values({
      promptId,
      modelName,
      content,
      latency
    })
    .returning();
  return response;
}


export async function createMetrics({
  responseId,
  meteorScore,
  otherStatisticalScores,
  relevancy,
  correctness,
  hallucination,
  toxicity,
  otherModelScores
}: {
  responseId: string;
  meteorScore: number;
  otherStatisticalScores?: Record<string, any>;
  relevancy: number;
  correctness: number;
  hallucination: number;
  toxicity: number;
  otherModelScores?: Record<string, any>;
}) {
  // Create statistical metrics
  const [statMetrics] = await db.insert(statisticalMetricsTable)
    .values({
      responseId,
      meteorScore,
      otherStatisticalScores,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0'
      }
    })
    .returning();

  // Create model metrics
  const [modelMetrics] = await db.insert(modelMetricsTable)
    .values({
      responseId,
      relevancy,
      correctness,
      hallucination,
      toxicity,
      otherModelScores,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0'
      }
    })
    .returning();

  return {
    statistical: statMetrics,
    model: modelMetrics
  };
}

// Evaluation run helpers
export async function createEvaluationRun(name: string, description?: string) {
  const [run] = await db.insert(evaluationRunsTable)
    .values({
      name,
      description,
      status: 'started',
      startedAt: new Date()
    })
    .returning();
  return run;
}

export async function completeEvaluationRun(runId: string) {
  const [run] = await db.update(evaluationRunsTable)
    .set({
      status: 'completed',
      completedAt: new Date()
    })
    .where(eq(evaluationRunsTable.id, runId))
    .returning();
  return run;
}

// Get full evaluation results
export async function getEvaluationResults(responseId: string) {
  const results = await db.query.evaluationResultsTable.findMany({
    where: eq(evaluationResultsTable.responseId, responseId),
    with: {
      statisticalMetrics: true,
      modelMetrics: true
    }
  });
  return results;
}

export async function createEvaluationResult({
  runId,
  responseId,
  statisticalMetricId,
  modelMetricId,
  metadata
}: {
  runId: string;
  responseId: string;
  statisticalMetricId: string;
  modelMetricId: string;
  metadata?: Record<string, any>;
}) {
  const [result] = await db.insert(evaluationResultsTable)
    .values({
      runId,
      responseId,
      statisticalMetricId,
      modelMetricId,
      metadata
    })
    .returning();
  return result;
}