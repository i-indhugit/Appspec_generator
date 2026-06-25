import { NextResponse } from 'next/server';
import { JobStore } from '../../../../store/jobStore';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = JobStore.getJob(jobId);
    
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    return NextResponse.json({
      status: job.status,
      prompt: job.prompt,
      AppSpec: job.finalOutput,
      repairLogs: job.repairLogs,
      latency: job.latency,
      costBreakdown: job.costBreakdown,
      error: job.error,
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to retrieve job details: ${errorMessage}` },
      { status: 500 }
    );
  }
}
