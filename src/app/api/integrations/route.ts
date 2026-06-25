import { NextResponse } from 'next/server';
import { IntegrationRegistry } from '../../../integrations/registry';

export async function GET() {
  try {
    const integrations = IntegrationRegistry.getIntegrations();
    
    // We map integrations to return display-ready data (Zod schemas mapped to metadata format)
    const formatted = integrations.map((intg) => ({
      id: intg.id,
      displayName: intg.displayName,
      authType: intg.authType,
      triggers: intg.triggers,
      actions: intg.actions.map((act) => ({
        id: act.id,
        displayName: act.displayName,
        // Expose input/output shapes as lists of parameter metadata for simple presentation
        inputParameters: Object.keys(act.inputSchema.shape).map((key) => {
          const field = act.inputSchema.shape[key] as unknown as { _def: { typeName: string }; isOptional: () => boolean };
          return {
            name: key,
            type: field._def.typeName.replace('Zod', '').toLowerCase(),
            required: !field.isOptional(),
          };
        }),
        outputParameters: Object.keys(act.outputSchema.shape).map((key) => {
          const field = act.outputSchema.shape[key] as unknown as { _def: { typeName: string }; isOptional: () => boolean };
          return {
            name: key,
            type: field._def.typeName.replace('Zod', '').toLowerCase(),
            required: !field.isOptional(),
          };
        }),
      })),
    }));

    return NextResponse.json({ integrations: formatted });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: `Failed to fetch integration registry: ${errorMessage}` },
      { status: 500 }
    );
  }
}
