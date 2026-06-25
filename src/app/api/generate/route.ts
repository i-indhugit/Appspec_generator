import { NextResponse } from 'next/server';
import { JobStore } from '../../../store/jobStore';
import { runGenerationPipeline } from '../../../pipeline/pipelineRunner';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { prompt } = body;
    if (!prompt || typeof prompt !== 'string') {
      return NextResponse.json({ error: 'Prompt string is required' }, { status: 400 });
    }

    const jobId = `job_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
    
    // Create status record in jobStore
    JobStore.createJob(jobId, prompt);

    // Kick off async background execution (non-blocking)
    runGenerationPipeline(jobId, prompt);

    return NextResponse.json({ jobId });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to initialize generation: ${errorMessage}` },
      { status: 500 }
    );
  }
}
