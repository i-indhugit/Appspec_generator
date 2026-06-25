import { z } from 'zod';

export const slackSendInput = z.object({
  channel: z.string().min(1, 'Slack channel is required'),
  text: z.string().min(1, 'Slack message text is required'),
}).strict();

export const slackSendOutput = z.object({
  ok: z.boolean(),
  ts: z.string(),
}).strict();

export const slackIntegration = {
  id: 'slack',
  displayName: 'Slack Alerts',
  authType: 'oauth2' as const,
  triggers: [
    { id: 'on_message', displayName: 'On New Message' },
    { id: 'on_channel_join', displayName: 'On Channel Join' }
  ],
  actions: [
    {
      id: 'send_message',
      displayName: 'Send Message',
      inputSchema: slackSendInput,
      outputSchema: slackSendOutput,
    }
  ]
};
export type SlackSendInputType = z.infer<typeof slackSendInput>;
export type SlackSendOutputType = z.infer<typeof slackSendOutput>;
