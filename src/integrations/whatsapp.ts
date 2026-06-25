import { z } from 'zod';

export const whatsappSendInput = z.object({
  to: z.string().min(1, 'Recipient phone number is required'),
  message: z.string().min(1, 'Message body is required'),
}).strict();

export const whatsappSendOutput = z.object({
  success: z.boolean(),
  messageSid: z.string(),
}).strict();

export const whatsappIntegration = {
  id: 'whatsapp',
  displayName: 'WhatsApp Business',
  authType: 'apikey' as const,
  triggers: [
    { id: 'on_incoming_message', displayName: 'On Incoming WhatsApp Message' }
  ],
  actions: [
    {
      id: 'send_message',
      displayName: 'Send WhatsApp Message',
      inputSchema: whatsappSendInput,
      outputSchema: whatsappSendOutput,
    }
  ]
};
export type WhatsAppSendInputType = z.infer<typeof whatsappSendInput>;
export type WhatsAppSendOutputType = z.infer<typeof whatsappSendOutput>;
