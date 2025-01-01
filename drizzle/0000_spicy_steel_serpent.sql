CREATE TABLE "evaluation_results" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"run_id" uuid NOT NULL,
	"response_id" uuid NOT NULL,
	"statistical_metric_id" uuid,
	"model_metric_id" uuid,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "evaluation_runs" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"name" varchar(255),
	"description" text,
	"configuration" jsonb,
	"status" varchar(50) NOT NULL,
	"started_at" timestamp NOT NULL,
	"completed_at" timestamp,
	"metadata" jsonb
);
--> statement-breakpoint
CREATE TABLE "model_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"relevancy" real,
	"correctness" real,
	"hallucination" real,
	"toxicity" real,
	"other_scores" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "prompts" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"text" text NOT NULL,
	"category" varchar(100),
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "responses" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"prompt_id" uuid NOT NULL,
	"model_name" varchar(100) NOT NULL,
	"model_version" varchar(100),
	"content" text NOT NULL,
	"latency" real NOT NULL,
	"token_count" integer,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "statistical_metrics" (
	"id" uuid PRIMARY KEY DEFAULT gen_random_uuid() NOT NULL,
	"response_id" uuid NOT NULL,
	"meteor_score" real,
	"other_scores" jsonb,
	"metadata" jsonb,
	"created_at" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_run_id_evaluation_runs_id_fk" FOREIGN KEY ("run_id") REFERENCES "public"."evaluation_runs"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_statistical_metric_id_statistical_metrics_id_fk" FOREIGN KEY ("statistical_metric_id") REFERENCES "public"."statistical_metrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "evaluation_results" ADD CONSTRAINT "evaluation_results_model_metric_id_model_metrics_id_fk" FOREIGN KEY ("model_metric_id") REFERENCES "public"."model_metrics"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "model_metrics" ADD CONSTRAINT "model_metrics_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "responses" ADD CONSTRAINT "responses_prompt_id_prompts_id_fk" FOREIGN KEY ("prompt_id") REFERENCES "public"."prompts"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "statistical_metrics" ADD CONSTRAINT "statistical_metrics_response_id_responses_id_fk" FOREIGN KEY ("response_id") REFERENCES "public"."responses"("id") ON DELETE no action ON UPDATE no action;