import { NextResponse } from 'next/server';
import { JobStore } from '@/store/jobStore';
import { RepairEngine } from '@/repair/repairEngine';
import { AppSpec } from '@/types/appSpec';

export async function POST(
  request: Request,
  { params }: { params: Promise<{ jobId: string }> }
) {
  try {
    const { jobId } = await params;
    const body = await request.json();
    const { stage, errorHint } = body;

    if (!stage || !errorHint) {
      return NextResponse.json(
        { error: 'Parameters "stage" and "errorHint" are required' },
        { status: 400 }
      );
    }

    const job = JobStore.getJob(jobId);
    if (!job) {
      return NextResponse.json({ error: 'Job not found' }, { status: 404 });
    }

    // Determine current raw output depending on the stage
    // To mock or retrieve what content needs repair:
    let contentToRepair = '';
    if (stage === 'intentExtraction') {
      contentToRepair = job.finalOutput ? JSON.stringify(job.finalOutput) : JSON.stringify({ appName: '' });
    } else if (stage === 'schemaGeneration') {
      contentToRepair = job.finalOutput?.dataSchema ? JSON.stringify(job.finalOutput.dataSchema) : JSON.stringify({ entities: [] });
    } else if (stage === 'appSpecGeneration') {
      contentToRepair = job.finalOutput ? JSON.stringify(job.finalOutput) : '{}';
    }

    const repair = RepairEngine.repair(stage, contentToRepair, errorHint);

    // Save logs in JobStore
    JobStore.addRepairLog(jobId, {
      stage,
      logs: repair.logs,
      manual: true,
    });

    if (repair.success) {
      const repairedObj = JSON.parse(repair.repairedContent);
      const defaultSpec: AppSpec = {
        appName: 'AppSpecApp',
        appType: 'custom',
        dataSchema: { entities: [] },
        pages: [],
        apiEndpoints: [],
        authRules: {
          roles: ['admin', 'user'],
          authProvider: 'clerk',
          rules: [],
        },
        integrationHooks: [],
        workflowStubs: [],
      };
      const currentSpec = job.finalOutput || defaultSpec;

      // Update intermediate/final representations
      if (stage === 'intentExtraction') {
        // Just mock updating the final spec shell
        JobStore.updateJob(jobId, {
          finalOutput: {
            ...currentSpec,
            appName: repairedObj.appName,
            appType: repairedObj.appType,
          }
        });
      } else if (stage === 'schemaGeneration') {
        JobStore.updateJob(jobId, {
          finalOutput: {
            ...currentSpec,
            dataSchema: repairedObj,
          }
        });
      } else if (stage === 'appSpecGeneration') {
        JobStore.updateJob(jobId, {
          finalOutput: repairedObj as AppSpec,
          status: 'completed',
        });
      }

      return NextResponse.json({
        success: true,
        repairedContent: repair.repairedContent,
        logs: repair.logs,
      });
    }

    return NextResponse.json({
      success: false,
      repairedContent: contentToRepair,
      logs: repair.logs,
    });

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Manual repair execution failed: ${errorMessage}` },
      { status: 500 }
    );
  }
}
