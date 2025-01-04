import React, { useState, useEffect } from 'react';
import EvaluationResults from '@/components/ui/EvaluationResults';
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { AlertCircle, Loader2 } from "lucide-react";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

interface EvaluationPageProps {
  promptId?: string;
}

const EvaluationPage: React.FC<EvaluationPageProps> = ({ promptId }) => {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [evaluations, setEvaluations] = useState(null);

  const runEvaluation = async () => {
    if (!promptId) return;
    
    setLoading(true);
    setError(null);

    try {
      const response = await fetch('/api/evaluate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ promptId }),
      });

      if (!response.ok) {
        throw new Error('Failed to run evaluation');
      }

      const data = await response.json();
      setEvaluations(data.results);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Something went wrong');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6 p-6">
      <Card>
        <CardHeader>
          <CardTitle className="flex justify-between items-center">
            <span>LLM Response Evaluation</span>
            <Button
              onClick={runEvaluation}
              disabled={loading || !promptId}
            >
              {loading ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Running Evaluation...
                </>
              ) : (
                'Run Evaluation'
              )}
            </Button>
          </CardTitle>
        </CardHeader>
        <CardContent>
          {error ? (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertTitle>Error</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : loading ? (
            <div className="flex justify-center items-center h-48">
              <Loader2 className="h-8 w-8 animate-spin" />
            </div>
          ) : evaluations ? (
            <EvaluationResults evaluations={evaluations} />
          ) : (
            <div className="text-center text-muted-foreground py-12">
              Click "Run Evaluation" to analyze LLM responses
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationPage;