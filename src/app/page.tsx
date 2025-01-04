"use client"

import React, { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import EvaluationResults from "@/components/ui/EvaluationResults";

interface Response {
  id: string;
  model: string;
  content: string;
  latency: number;
  error?: boolean;
  evaluation?: {
    statistical: {
      meteorScore: number;
    };
    model: {
      relevancy: number;
      correctness: number;
      hallucination: number;
      toxicity: number;
    };
  };
}

interface PromptResponse {
  prompt: {
    id: string;
    text: string;
  };
  responses: Response[];
}

export default function Home() {
  const [theme, setTheme] = useState<"light" | "dark">("light");
  const [prompt, setPrompt] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<PromptResponse | null>(null);
  const [error, setError] = useState<string | null>(null);

  const toggleTheme = () => {
    const newTheme = theme === "light" ? "dark" : "light";
    setTheme(newTheme);
    document.documentElement.classList.remove(theme);
    document.documentElement.classList.add(newTheme);
  };

  const handleSubmit = async () => {
    if (!prompt.trim()) return;

    setLoading(true);
    setError(null);

    try {
      const response = await fetch("/api/prompt", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ prompt }),
      });

      if (!response.ok) {
        throw new Error("Failed to get response");
      }

      const data = await response.json();
      setResult(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const formatLatency = (latency: number) => {
    if (latency < 1000) return `${latency}ms`;
    return `${(latency / 1000).toFixed(2)}s`;
  };

  return (
    <div className="min-h-screen flex flex-col bg-background">
      {/* Header */}
      <header className="border-b border-border">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <h1 className="text-2xl font-bold">LLM Comparison Dashboard</h1>
          <button
            onClick={toggleTheme}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors"
          >
            {theme === "light" ? "Dark" : "Light"} Mode
          </button>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow container mx-auto px-4 py-8">
        {/* Prompt Input */}
        <div className="mb-8">
          <div className="flex gap-4">
            <input
              type="text"
              className="flex-grow px-4 py-2 rounded-lg border border-input bg-background"
              placeholder="Enter your prompt here..."
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              onKeyUp={(e) => {
                if (e.key === "Enter" && !loading) {
                  handleSubmit();
                }
              }}
              disabled={loading}
            />
            <button
              className="px-6 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-primary/90 transition-colors disabled:opacity-50"
              onClick={handleSubmit}
              disabled={loading || !prompt.trim()}
            >
              {loading ? "Generating..." : "Submit"}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 rounded-lg bg-destructive/10 text-destructive">
              {error}
            </div>
          )}
        </div>

        {/* Responses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {loading
            ? Array(3)
                .fill(null)
                .map((_, i) => (
                  <Card key={`loading-${i}`} className="animate-pulse">
                    <CardHeader>
                      <CardTitle className="h-6 bg-muted rounded w-32" />
                    </CardHeader>
                    <CardContent>
                      <div className="space-y-2">
                        <div className="h-4 bg-muted rounded w-full" />
                        <div className="h-4 bg-muted rounded w-3/4" />
                        <div className="h-4 bg-muted rounded w-1/2" />
                      </div>
                    </CardContent>
                  </Card>
                ))
            : result?.responses.map((response, index) => (
                <Card key={index} className="flex flex-col">
                  <CardHeader>
                    <CardTitle className="flex justify-between items-center">
                      <span>{response.model}</span>
                      <span className="text-sm font-normal text-muted-foreground">
                        {formatLatency(response.latency)}
                      </span>
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="flex-grow">
                    {response.error ? (
                      <p className="text-destructive">Error generating response</p>
                    ) : (
                      <div className="space-y-4">
                        <p className="whitespace-pre-wrap">{response.content}</p>
                        {response.evaluation && (
                          <div className="mt-4 pt-4 border-t">
                            <h4 className="text-sm font-semibold mb-2">Evaluation Metrics</h4>
                            <div className="grid grid-cols-2 gap-2 text-sm">
                              <div>
                                <span className="text-muted-foreground">Score:</span>{" "}
                                {response.evaluation.statistical.meteorScore.toFixed(2)}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Relevancy:</span>{" "}
                                {response.evaluation.model.relevancy.toFixed(2)}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Correctness:</span>{" "}
                                {response.evaluation.model.correctness.toFixed(2)}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Hallucination:</span>{" "}
                                {response.evaluation.model.hallucination.toFixed(2)}
                              </div>
                              <div>
                                <span className="text-muted-foreground">Toxicity:</span>{" "}
                                {response.evaluation.model.toxicity.toFixed(2)}
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
        </div>

        {/* Evaluation Results */}
        {result?.responses.some(r => r.evaluation) && (
          <div className="mt-8">
            <EvaluationResults 
              evaluations={result.responses
                .filter(r => r.evaluation)
                .map(r => ({
                  responseId: r.id,
                  modelName: r.model,
                  statistical: {
                    meteorScore: r.evaluation!.statistical.meteorScore,
                    otherStatisticalScores: {
                      weightedScores: {
                        relevancyWeight: 0.3,
                        correctnessWeight: 0.3,
                        hallucinationWeight: 0.2,
                        toxicityWeight: 0.2
                      }
                    }
                  },
                  model: {
                    relevancy: r.evaluation!.model.relevancy,
                    correctness: r.evaluation!.model.correctness,
                    hallucination: r.evaluation!.model.hallucination,
                    toxicity: r.evaluation!.model.toxicity,
                    otherModelScores: {
                      normalizedScore: r.evaluation!.statistical.meteorScore / 10
                    }
                  }
                }))}
            />
          </div>
        )}
      </main>
    </div>
  );
}