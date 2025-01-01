import { NextRequest, NextResponse } from 'next/server';
import { Groq } from 'groq-sdk';
import { createPrompt, createResponse } from '@/db/queries';

const groq = new Groq({
  apiKey: process.env.GROQ_API_KEY,
});


// ! how do we split it so that it is testing 3 different LLM's
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

    // Get response from Groq
    const startTime = Date.now();
    const groqResponse = await groq.chat.completions.create({
      messages: [{ role: 'user', content: prompt }],
      model: 'mixtral-8x7b-32768',
      temperature: 0.7,
      max_tokens: 1024,
    });
    const latency = Date.now() - startTime;

    // Store response
    const response = await createResponse({
      promptId: promptRecord.id,
      modelName: 'groq-mixtral',
      content: groqResponse.choices[0]?.message?.content || '',
      latency,
    });

    return NextResponse.json({
      prompt: promptRecord,
      response: {
        ...response,
        model: 'groq-mixtral',
        content: groqResponse.choices[0]?.message?.content,
        latency,
      }
    });

  } catch (error) {
    console.error('Error processing prompt:', error);
    return NextResponse.json(
      { error: 'Failed to process prompt' },
      { status: 500 }
    );
  }
}