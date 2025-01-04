import React, { useState } from 'react';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from "@/components/ui/tabs";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
} from 'recharts';

type ModelMetrics = {
  relevancy: number;
  correctness: number;
  hallucination: number;
  toxicity: number;
  otherModelScores: {
    normalizedScore: number;
  };
};

type StatisticalMetrics = {
  meteorScore: number;
  otherStatisticalScores: {
    weightedScores: {
      relevancyWeight: number;
      correctnessWeight: number;
      hallucinationWeight: number;
      toxicityWeight: number;
    };
  };
};

interface EvaluationMetrics {
  responseId: string;
  modelName: string;
  statistical: StatisticalMetrics;
  model: ModelMetrics;
}

interface EvaluationResultsProps {
  evaluations: EvaluationMetrics[];
}

const EvaluationResults: React.FC<EvaluationResultsProps> = ({ evaluations }) => {
  const [selectedModel, setSelectedModel] = useState<string | null>(
    evaluations[0]?.modelName || null
  );

  // Prepare data for radar chart
  const getRadarData = (evaluation: EvaluationMetrics) => [
    { metric: 'Relevancy', value: evaluation.model.relevancy },
    { metric: 'Correctness', value: evaluation.model.correctness },
    { metric: 'Clarity', value: 10 - evaluation.model.hallucination }, // Invert hallucination
    { metric: 'Safety', value: 10 - evaluation.model.toxicity }, // Invert toxicity
  ];

  // Prepare data for bar comparison
  const getComparisonData = () => {
    return ['Relevancy', 'Correctness', 'Hallucination', 'Toxicity'].map((metric) => {
      const data: Record<string, any> = { name: metric };
      evaluations.forEach((evaluation) => {
        const metricKey = metric.toLowerCase() as keyof typeof evaluation.model;
        data[evaluation.modelName] = evaluation.model[metricKey];
      });
      return data;
    });
  };

  return (
    <div className="space-y-6">
      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        {evaluations.map((evaluation) => (
          <Card key={evaluation.responseId}>
            <CardHeader>
              <CardTitle>{evaluation.modelName}</CardTitle>
              <CardDescription>
                Overall Score: {(evaluation.statistical.meteorScore).toFixed(2)}/10
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="text-sm space-y-2">
                <div>Relevancy: {evaluation.model.relevancy.toFixed(2)}/10</div>
                <div>Correctness: {evaluation.model.correctness.toFixed(2)}/10</div>
                <div>Hallucination: {evaluation.model.hallucination.toFixed(2)}/10</div>
                <div>Toxicity: {evaluation.model.toxicity.toFixed(2)}/10</div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Detailed Analysis */}
      <Card>
        <CardHeader>
          <CardTitle>Detailed Analysis</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="metrics">
            <TabsList>
              <TabsTrigger value="metrics">Metrics Table</TabsTrigger>
              <TabsTrigger value="radar">Radar Analysis</TabsTrigger>
              <TabsTrigger value="comparison">Model Comparison</TabsTrigger>
            </TabsList>

            {/* Metrics Table */}
            <TabsContent value="metrics">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Metric</TableHead>
                    {evaluations.map((evaluation) => (
                      <TableHead key={evaluation.modelName}>{evaluation.modelName}</TableHead>
                    ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {['Overall Score', 'Relevancy', 'Correctness', 'Hallucination', 'Toxicity'].map((metric) => (
                    <TableRow key={metric}>
                      <TableCell className="font-medium">{metric}</TableCell>
                      {evaluations.map((evaluation) => (
                        <TableCell key={`${evaluation.modelName}-${metric}`}>
                          {metric === 'Overall Score'
                            ? evaluation.statistical.meteorScore.toFixed(2)
                            : Number(evaluation.model[metric.toLowerCase() as keyof ModelMetrics]).toFixed(2)}
                        </TableCell>
                      ))}
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </TabsContent>

            {/* Radar Chart */}
            <TabsContent value="radar">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={getRadarData(evaluations[0])}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis angle={30} domain={[0, 10]} />
                    {evaluations.map((evaluation, idx) => (
                      <Radar
                        key={evaluation.modelName}
                        name={evaluation.modelName}
                        dataKey="value"
                        stroke={`hsl(${idx * 100}, 70%, 50%)`}
                        fill={`hsl(${idx * 100}, 70%, 50%)`}
                        fillOpacity={0.3}
                      />
                    ))}
                    <Legend />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>

            {/* Model Comparison */}
            <TabsContent value="comparison">
              <div className="h-96">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={getComparisonData()}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis domain={[0, 10]} />
                    <Tooltip />
                    <Legend />
                    {evaluations.map((evaluation, idx) => (
                      <Bar
                        key={evaluation.modelName}
                        dataKey={evaluation.modelName}
                        fill={`hsl(${idx * 100}, 70%, 50%)`}
                      />
                    ))}
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
};

export default EvaluationResults;