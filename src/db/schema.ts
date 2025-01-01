import { 
  real, 
  timestamp, 
  integer, 
  pgTable, 
  varchar, 
  text, 
  jsonb,
  uuid,
} from "drizzle-orm/pg-core";
import { relations } from 'drizzle-orm';

// Base prompt table
export const promptTable = pgTable("prompts", {
  id: uuid("id").defaultRandom().primaryKey(),
  text: text("text").notNull(),
  category: varchar("category", { length: 100 }),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// LLM responses
export const responseTable = pgTable("responses", {
  id: uuid("id").defaultRandom().primaryKey(),
  promptId: uuid("prompt_id")
    .references(() => promptTable.id)
    .notNull(),
  modelName: varchar("model_name", { length: 100 }).notNull(),
  modelVersion: varchar("model_version", { length: 100 }),
  content: text("content").notNull(),
  latency: real("latency").notNull(),
  tokenCount: integer("token_count"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Statistical metrics
export const statisticalMetricsTable = pgTable("statistical_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  responseId: uuid("response_id")
    .references(() => responseTable.id)
    .notNull(),
  meteorScore: real("meteor_score"),
  otherStatisticalScores: jsonb("other_scores"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Model-based metrics
export const modelMetricsTable = pgTable("model_metrics", {
  id: uuid("id").defaultRandom().primaryKey(),
  responseId: uuid("response_id")
    .references(() => responseTable.id)
    .notNull(),
  relevancy: real("relevancy"),
  correctness: real("correctness"),
  hallucination: real("hallucination"),
  toxicity: real("toxicity"),
  otherModelScores: jsonb("other_scores"),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Evaluation runs
export const evaluationRunsTable = pgTable("evaluation_runs", {
  id: uuid("id").defaultRandom().primaryKey(),
  name: varchar("name", { length: 255 }),
  description: text("description"),
  configuration: jsonb("configuration"),
  status: varchar("status", { length: 50 }).notNull(),
  startedAt: timestamp("started_at").notNull(),
  completedAt: timestamp("completed_at"),
  metadata: jsonb("metadata")
});

// Evaluation results
export const evaluationResultsTable = pgTable("evaluation_results", {
  id: uuid("id").defaultRandom().primaryKey(),
  runId: uuid("run_id")
    .references(() => evaluationRunsTable.id)
    .notNull(),
  responseId: uuid("response_id")
    .references(() => responseTable.id)
    .notNull(),
  statisticalMetricId: uuid("statistical_metric_id")
    .references(() => statisticalMetricsTable.id),
  modelMetricId: uuid("model_metric_id")
    .references(() => modelMetricsTable.id),
  metadata: jsonb("metadata"),
  createdAt: timestamp("created_at").defaultNow().notNull()
});

// Define all relationships
export const promptRelations = relations(promptTable, ({ many }) => ({
  responses: many(responseTable)
}));

export const responseRelations = relations(responseTable, ({ one, many }) => ({
  prompt: one(promptTable, {
    fields: [responseTable.promptId],
    references: [promptTable.id],
  }),
  statisticalMetrics: many(statisticalMetricsTable),
  modelMetrics: many(modelMetricsTable),
  evaluationResults: many(evaluationResultsTable)
}));

export const statisticalMetricsRelations = relations(statisticalMetricsTable, ({ one, many }) => ({
  response: one(responseTable, {
    fields: [statisticalMetricsTable.responseId],
    references: [responseTable.id],
  }),
  evaluationResults: many(evaluationResultsTable)
}));

export const modelMetricsRelations = relations(modelMetricsTable, ({ one, many }) => ({
  response: one(responseTable, {
    fields: [modelMetricsTable.responseId],
    references: [responseTable.id],
  }),
  evaluationResults: many(evaluationResultsTable)
}));

export const evaluationRunsRelations = relations(evaluationRunsTable, ({ many }) => ({
  results: many(evaluationResultsTable)
}));

export const evaluationResultsRelations = relations(evaluationResultsTable, ({ one }) => ({
  run: one(evaluationRunsTable, {
    fields: [evaluationResultsTable.runId],
    references: [evaluationRunsTable.id],
  }),
  response: one(responseTable, {
    fields: [evaluationResultsTable.responseId],
    references: [responseTable.id],
  }),
  statisticalMetrics: one(statisticalMetricsTable, {
    fields: [evaluationResultsTable.statisticalMetricId],
    references: [statisticalMetricsTable.id],
  }),
  modelMetrics: one(modelMetricsTable, {
    fields: [evaluationResultsTable.modelMetricId],
    references: [modelMetricsTable.id],
  })
}));