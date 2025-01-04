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

// Type Definitions
interface StatisticalScores {
  relevancyWeight?: number | null;
  correctnessWeight?: number | null;
  hallucinationWeight?: number | null;
  toxicityWeight?: number | null;
  meteorScore?: number | null; // Include meteorScore as part of the structure
}

interface ModelScores {
  normalizedScore?: number | null;
  relevancy?: number | null;
  correctness?: number | null;
  hallucination?: number | null;
  toxicity?: number | null;
}

interface Metadata {
  createdAt: string;
  version: string;
  [key: string]: string | number | boolean; // Allow flexible additional fields
}

interface EvaluationResult {
  responseId: string;
  statisticalMetrics: StatisticalScores | null;
  modelMetrics: ModelScores | null;
}

// Prompt Helpers
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
    responses,
  };
}

// Response Helpers
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
      latency,
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
  otherModelScores,
}: {
  responseId: string;
  meteorScore: number;
  otherStatisticalScores?: StatisticalScores;
  relevancy: number;
  correctness: number;
  hallucination: number;
  toxicity: number;
  otherModelScores?: ModelScores;
}) {
  const [statMetrics] = await db.insert(statisticalMetricsTable)
    .values({
      responseId,
      meteorScore,
      otherStatisticalScores,
      metadata: {
        createdAt: new Date().toISOString(),
        version: '1.0',
      },
    })
    .returning();

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
        version: '1.0',
      },
    })
    .returning();

  return {
    statistical: statMetrics,
    model: modelMetrics,
  };
}

// Evaluation Run Helpers
export async function createEvaluationRun(name: string, description?: string) {
  const [run] = await db.insert(evaluationRunsTable)
    .values({
      name,
      description,
      status: 'started',
      startedAt: new Date(),
    })
    .returning();
  return run;
}

export async function completeEvaluationRun(runId: string) {
  const [run] = await db.update(evaluationRunsTable)
    .set({
      status: 'completed',
      completedAt: new Date(),
    })
    .where(eq(evaluationRunsTable.id, runId))
    .returning();
  return run;
}

// Evaluation Results Helpers
export async function getEvaluationResults(responseId: string): Promise<EvaluationResult[]> {
  const results = await db.query.evaluationResultsTable.findMany({
    where: eq(evaluationResultsTable.responseId, responseId),
    with: {
      statisticalMetrics: true,
      modelMetrics: true,
    },
  });

  return results.map(result => ({
    responseId: result.responseId,
    statisticalMetrics: result.statisticalMetrics
      ? {
          relevancyWeight: result.statisticalMetrics.relevancyWeight ?? null,
          correctnessWeight: result.statisticalMetrics.correctnessWeight ?? null,
          hallucinationWeight: result.statisticalMetrics.hallucinationWeight ?? null,
          toxicityWeight: result.statisticalMetrics.toxicityWeight ?? null,
          meteorScore: result.statisticalMetrics.meteorScore ?? null,
        }
      : null,
    modelMetrics: result.modelMetrics
      ? {
          normalizedScore: result.modelMetrics.normalizedScore ?? null,
          relevancy: result.modelMetrics.relevancy ?? null,
          correctness: result.modelMetrics.correctness ?? null,
          hallucination: result.modelMetrics.hallucination ?? null,
          toxicity: result.modelMetrics.toxicity ?? null,
        }
      : null,
  }));
}

export async function createEvaluationResult({
  runId,
  responseId,
  statisticalMetricId,
  modelMetricId,
  metadata,
}: {
  runId: string;
  responseId: string;
  statisticalMetricId: string | null; // Allow null
  modelMetricId: string | null; // Allow null
  metadata?: Metadata;
}) {
  const [result] = await db.insert(evaluationResultsTable)
    .values({
      runId,
      responseId,
      statisticalMetricId,
      modelMetricId,
      metadata,
    })
    .returning();
  return result;
}
