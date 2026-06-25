import { z } from 'zod';

export const gmailSendInput = z.object({
  to: z.string().email('Must be a valid email address'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Email body is required'),
}).strict();

export const gmailSendOutput = z.object({
  success: z.boolean(),
  messageId: z.string(),
}).strict();

export const gmailIntegration = {
  id: 'gmail',
  displayName: 'Gmail Notifications',
  authType: 'oauth2' as const,
  triggers: [
    { id: 'on_email_received', displayName: 'On Email Received' }
  ],
  actions: [
    {
      id: 'send_email',
      displayName: 'Send Email',
      inputSchema: gmailSendInput,
      outputSchema: gmailSendOutput,
    }
  ]
};
export type GmailSendInputType = z.infer<typeof gmailSendInput>;
export type GmailSendOutputType = z.infer<typeof gmailSendOutput>;
