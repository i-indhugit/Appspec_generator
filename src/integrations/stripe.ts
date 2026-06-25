import { z } from 'zod';

export const stripePaymentInput = z.object({
  amount: z.union([z.number(), z.string()]),
  currency: z.string().min(3).max(3),
}).strict();

export const stripePaymentOutput = z.object({
  success: z.boolean(),
  clientSecret: z.string(),
  chargeId: z.string(),
}).strict();

export const stripeIntegration = {
  id: 'stripe',
  displayName: 'Stripe Payments',
  authType: 'apikey' as const,
  triggers: [
    { id: 'on_charge_succeeded', displayName: 'On Charge Succeeded' },
    { id: 'on_charge_failed', displayName: 'On Charge Failed' }
  ],
  actions: [
    {
      id: 'create_payment_intent',
      displayName: 'Create Payment Intent',
      inputSchema: stripePaymentInput,
      outputSchema: stripePaymentOutput,
    }
  ]
};
export type StripePaymentInputType = z.infer<typeof stripePaymentInput>;
export type StripePaymentOutputType = z.infer<typeof stripePaymentOutput>;
