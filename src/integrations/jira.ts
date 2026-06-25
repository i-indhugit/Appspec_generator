import { z } from 'zod';

export const jiraIssueInput = z.object({
  projectKey: z.string().min(1, 'Jira project key is required'),
  summary: z.string().min(1, 'Issue summary is required'),
  description: z.string().optional(),
}).strict();

export const jiraIssueOutput = z.object({
  success: z.boolean(),
  issueKey: z.string(),
  issueId: z.string(),
}).strict();

export const jiraIntegration = {
  id: 'jira',
  displayName: 'Jira Software',
  authType: 'oauth2' as const,
  triggers: [
    { id: 'on_issue_created', displayName: 'On Issue Created' },
    { id: 'on_issue_updated', displayName: 'On Issue Updated' }
  ],
  actions: [
    {
      id: 'create_issue',
      displayName: 'Create Jira Issue',
      inputSchema: jiraIssueInput,
      outputSchema: jiraIssueOutput,
    }
  ]
};
export type JiraIssueInputType = z.infer<typeof jiraIssueInput>;
export type JiraIssueOutputType = z.infer<typeof jiraIssueOutput>;
