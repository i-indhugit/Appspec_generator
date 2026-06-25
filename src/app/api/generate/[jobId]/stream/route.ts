import { JobStore, JobEvent } from '@/store/jobStore';
import { addSseListener, removeSseListener } from '@/pipeline/pipelineRunner';

export async function GET(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const job = JobStore.getJob(jobId);
    
    if (!job) {
      return new Response(JSON.stringify({ error: 'Job not found' }), {
        status: 404,
        headers: { 'Content-Type': 'application/json' },
      });
    }

    const encoder = new TextEncoder();

    const stream = new ReadableStream({
      start(controller) {
        // 1. Replay historical events
        job.events.forEach((evt: JobEvent) => {
          const payload = `event: ${evt.type}\ndata: ${JSON.stringify(evt)}\n\n`;
          controller.enqueue(encoder.encode(payload));
        });

        // 2. Setup listener for live stream updates
        const listener = (formattedEvent: string) => {
          try {
            controller.enqueue(encoder.encode(formattedEvent));
          } catch {
            // Controller might be closed already
          }
        };

        addSseListener(jobId, listener);

        // 3. Clean up on disconnect
        request.signal.addEventListener('abort', () => {
          removeSseListener(jobId, listener);
          try {
            controller.close();
          } catch {
            // Already closed
          }
        });
      },
    });

    return new Response(stream, {
      headers: {
        'Content-Type': 'text/event-stream',
        'Cache-Control': 'no-cache, no-transform',
        'Connection': 'keep-alive',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return new Response(JSON.stringify({ error: errorMessage }), {
      status: 500,
      headers: { 'Content-Type': 'application/json' },
    });
  }
}
export const dynamic = 'force-dynamic';
