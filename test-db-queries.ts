import 'dotenv/config';
import { 
  createPrompt, 
  createResponse, 
  createMetrics,
  createEvaluationRun,
  getPromptById,
  completeEvaluationRun,
  getEvaluationResults 
} from './src/db/queries';

async function testDatabaseOperations() {
  try {
    console.log('🚀 Starting database operations test...\n');

    // 1. Create a prompt
    console.log('📝 Creating test prompt...');
    const prompt = await createPrompt(
      "Explain how photosynthesis works in simple terms."
    );
    console.log('Created prompt:', prompt);

    // 2. Create multiple responses
    console.log('\n🤖 Creating test responses...');
    const response1 = await createResponse({
      promptId: prompt.id,
      modelName: 'groq-mixtral',
      content: "Photosynthesis is how plants make their food using sunlight.",
      latency: 145
    });
    console.log('Created first response:', response1);

    const response2 = await createResponse({
      promptId: prompt.id,
      modelName: 'groq-llama',
      content: "Plants convert sunlight into energy through photosynthesis.",
      latency: 168
    });
    console.log('Created second response:', response2);

    // 3. Create metrics for responses
    console.log('\n📊 Creating metrics for responses...');
    const metrics1 = await createMetrics({
      responseId: response1.id,
      meteorScore: 0.92,
      relevancy: 0.95,
      correctness: 0.98,
      hallucination: 0.03,
      toxicity: 0.01
    });
    console.log('Created metrics for first response:', metrics1);

    const metrics2 = await createMetrics({
      responseId: response2.id,
      meteorScore: 0.88,
      relevancy: 0.91,
      correctness: 0.94,
      hallucination: 0.05,
      toxicity: 0.02
    });
    console.log('Created metrics for second response:', metrics2);

    // 4. Create an evaluation run
    console.log('\n🔄 Creating evaluation run...');
    const evalRun = await createEvaluationRun(
      "Initial Photosynthesis Test",
      "Testing multiple model responses for photosynthesis explanation"
    );
    console.log('Created evaluation run:', evalRun);

    // 5. Complete the evaluation run
    console.log('\n✅ Completing evaluation run...');
    const completedRun = await completeEvaluationRun(evalRun.id);
    console.log('Completed evaluation run:', completedRun);

    // 6. Retrieve evaluation results
    console.log('\n📋 Retrieving evaluation results...');
    const results1 = await getEvaluationResults(response1.id);
    console.log('Results for first response:', results1);
    
    // 7. Retrieve full prompt with responses
    console.log('\n🔍 Retrieving prompt with all related data...');
    const retrievedPrompt = await getPromptById(prompt.id);
    console.log('Retrieved prompt with responses:', retrievedPrompt);

    console.log('\n✨ All tests completed successfully!');
  } catch (error) {
    console.error('❌ Error during testing:', error);
  }
}

// Run the tests
console.log('Starting tests...');
testDatabaseOperations();