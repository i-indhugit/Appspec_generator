import { AppIntent } from '../types/appIntent';
import { DataSchema } from '../types/dataSchema';
import { AppSpec } from '../types/appSpec';

export class SimulatorEngine {
  public static matchPrompt(prompt: string): string {
    const p = prompt.toLowerCase();
    if (p.includes('real estate') || p.includes('estate')) return 'real_estate';
    if (p.includes('slack alerts') || p.includes('task manager with slack')) return 'task_manager_slack';
    if (p.includes('inventory') && (p.includes('email') || p.includes('mail'))) return 'inventory_email';
    if (p.includes('hr tool') || p.includes('leave approval') || p.includes('leave')) return 'hr_leave';
    if (p.includes('ecommerce') || (p.includes('stripe') && p.includes('gmail'))) return 'ecommerce_stripe';
    if (p.includes('event platform') || p.includes('event')) return 'event_platform';
    if (p.includes('project tracker') && p.includes('jira')) return 'project_tracker';
    if (p.trim() === 'an app.' || p.trim() === 'an app') return 'edge_an_app';
    if (p.includes('notion') || p.includes('doctor')) return 'notion_doctors';
    if (p.includes('marketplace') || p.includes('payments') || p.includes('analytics')) return 'complex_platform';
    if (p.includes('crm') && p.includes('project manager') && p.includes('invoicing')) return 'crm_pm_invoice';
    if (p.includes('smart')) return 'smart_task_manager';
    return 'generic_todo';
  }

  public static getAppIntent(prompt: string): AppIntent {
    const category = this.matchPrompt(prompt);
    
    // Default base structure
    const intent: AppIntent = {
      appName: 'App Builder',
      appType: 'custom',
      features: ['Authentication', 'User Profile'],
      entities: ['User'],
      integrations_requested: [],
      assumptions: ['Single organization scope'],
      clarification_required: false,
      clarification_question: null,
    };

    switch (category) {
      case 'real_estate':
        intent.appName = 'EstateFlow';
        intent.appType = 'crm';
        intent.features = ['Property Listing', 'Lead Management', 'WhatsApp Alerts', 'Agent Dashboard'];
        intent.entities = ['Property', 'Lead', 'Agent', 'ViewingSchedule'];
        intent.integrations_requested = ['whatsapp'];
        intent.assumptions = ['WhatsApp API is configured with a verified template'];
        break;

      case 'task_manager_slack':
        intent.appName = 'TaskSync';
        intent.appType = 'project_management';
        intent.features = ['Task Lists', 'Subtasks', 'Slack Notifications', 'Due Dates'];
        intent.entities = ['Project', 'Task', 'User', 'SlackChannel'];
        intent.integrations_requested = ['slack'];
        intent.assumptions = ['Slack workspace has matching channel integrations'];
        break;

      case 'inventory_email':
        intent.appName = 'StockMaster';
        intent.appType = 'inventory';
        intent.features = ['Product Catalog', 'Low Stock Email Alerts', 'Supplier Directory', 'Reorder Requests'];
        intent.entities = ['Product', 'Supplier', 'StockLog', 'User'];
        intent.integrations_requested = ['gmail'];
        intent.assumptions = ['SMTP details or Gmail OAuth is pre-configured'];
        break;

      case 'hr_leave':
        intent.appName = 'HRAlign';
        intent.appType = 'hr_tool';
        intent.features = ['Employee Directory', 'Leave Approval Workflows', 'Email Alerts', 'Leave Balances'];
        intent.entities = ['Employee', 'LeaveRequest', 'Department', 'ApprovalLog'];
        intent.integrations_requested = ['gmail'];
        intent.assumptions = ['HR administrators review and approve all leave requests manually'];
        break;

      case 'ecommerce_stripe':
        intent.appName = 'SwiftShop';
        intent.appType = 'ecommerce';
        intent.features = ['Product Catalog', 'Shopping Cart', 'Stripe Payments', 'Gmail Receipts'];
        intent.entities = ['Product', 'Order', 'Customer', 'PaymentLog'];
        intent.integrations_requested = ['stripe', 'gmail'];
        intent.assumptions = ['Stripe Webhook is active and correctly configured'];
        break;

      case 'event_platform':
        intent.appName = 'GatherUp';
        intent.appType = 'custom';
        intent.features = ['Event Registration', 'Ticket Generation', 'WhatsApp Confirmations', 'Attendee List'];
        intent.entities = ['Event', 'Attendee', 'Ticket', 'Organizer'];
        intent.integrations_requested = ['whatsapp'];
        break;

      case 'project_tracker':
        intent.appName = 'JiraSync Pro';
        intent.appType = 'project_management';
        intent.features = ['Jira Ticket Mirroring', 'Sprint Boards', 'Google Sheets Export', 'Milestones'];
        intent.entities = ['Sprint', 'Ticket', 'Developer', 'SyncLog'];
        intent.integrations_requested = ['jira'];
        intent.assumptions = ['Jira API token is provided with correct read/write scopes'];
        break;

      case 'edge_an_app':
        intent.appName = 'MinimalApp';
        intent.appType = 'custom';
        intent.features = ['Basic Read Write'];
        intent.entities = ['Item'];
        intent.assumptions = ['Minimal requirements interpreted as simple lists'];
        intent.clarification_required = true;
        intent.clarification_question = 'Please provide details on what features you want in your application.';
        break;

      case 'notion_doctors':
        intent.appName = 'MedDocs';
        intent.appType = 'content_platform';
        intent.features = ['Patient Records', 'Clinical Notes', 'Templates', 'Collaborative Editor'];
        intent.entities = ['Patient', 'ClinicalNote', 'Doctor', 'Template'];
        intent.assumptions = ['HIPAA compliant hosting details are separately resolved'];
        break;

      case 'complex_platform':
        intent.appName = 'MegaHub';
        intent.appType = 'custom';
        intent.features = ['Vendor Onboarding', 'Customer Marketplace', 'Stripe Payments', 'Admin Analytics', 'Chat Rooms', 'File System'];
        intent.entities = ['Vendor', 'Product', 'Order', 'ChatMessage', 'FileAttachment', 'User'];
        intent.integrations_requested = ['stripe'];
        break;

      case 'crm_pm_invoice':
        intent.appName = 'EnterpriseHub';
        intent.appType = 'crm';
        intent.features = ['Lead Tracking', 'Sprint Task Planning', 'Stripe Invoicing', 'Client Portal'];
        intent.entities = ['Lead', 'Project', 'Task', 'Invoice', 'Client'];
        intent.integrations_requested = ['stripe'];
        break;

      case 'smart_task_manager':
        intent.appName = 'SmartTask';
        intent.appType = 'project_management';
        intent.features = ['AI Task Priority', 'Due Date Predictor', 'Slack Alerts', 'Auto Assigning'];
        intent.entities = ['Task', 'User', 'AIPrediction', 'SlackChannel'];
        intent.integrations_requested = ['slack'];
        break;

      default:
        intent.appName = 'ListMaster';
        intent.appType = 'custom';
        intent.features = ['Task Lists', 'Due Dates'];
        intent.entities = ['TodoItem'];
        break;
    }

    return intent;
  }

  public static getDataSchema(intent: AppIntent): DataSchema {
    const schema: DataSchema = {
      entities: [],
    };

    const entityNames = intent.entities;

    entityNames.forEach((name) => {
      schema.entities.push({
        name,
        fields: [
          { name: 'id', type: 'string', required: true, isPrimary: true },
          { name: 'tenantId', type: 'string', required: true },
          { name: 'createdAt', type: 'date', required: true },
          { name: 'updatedAt', type: 'date', required: true },
        ],
      });
    });

    // Let's add entity-specific fields & relations
    schema.entities.forEach((entity) => {
      const eName = entity.name.toLowerCase();
      if (eName === 'lead') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'status', type: 'string', required: true, defaultValue: 'new' },
          { name: 'agentId', type: 'relation', required: false, relation: { relatedEntity: 'Agent', type: 'many-to-one', inverseFieldName: 'leads' } }
        );
      } else if (eName === 'property') {
        entity.fields.push(
          { name: 'title', type: 'string', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'status', type: 'string', required: true, defaultValue: 'available' }
        );
      } else if (eName === 'agent') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true },
          { name: 'email', type: 'string', required: true }
        );
      } else if (eName === 'viewingschedule') {
        entity.fields.push(
          { name: 'viewingTime', type: 'date', required: true },
          { name: 'leadId', type: 'relation', required: true, relation: { relatedEntity: 'Lead', type: 'many-to-one', inverseFieldName: 'viewings' } },
          { name: 'propertyId', type: 'relation', required: true, relation: { relatedEntity: 'Property', type: 'many-to-one', inverseFieldName: 'viewings' } }
        );
      } else if (eName === 'task') {
        entity.fields.push(
          { name: 'title', type: 'string', required: true },
          { name: 'description', type: 'string', required: false },
          { name: 'dueDate', type: 'date', required: false },
          { name: 'priority', type: 'string', required: true, defaultValue: 'medium' },
          { name: 'projectId', type: 'relation', required: false, relation: { relatedEntity: 'Project', type: 'many-to-one', inverseFieldName: 'tasks' } }
        );
      } else if (eName === 'project') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true },
          { name: 'code', type: 'string', required: true }
        );
      } else if (eName === 'product') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true },
          { name: 'sku', type: 'string', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'stockCount', type: 'number', required: true, defaultValue: 0 }
        );
      } else if (eName === 'supplier') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true },
          { name: 'contactEmail', type: 'string', required: true }
        );
      } else if (eName === 'employee') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true },
          { name: 'email', type: 'string', required: true },
          { name: 'departmentId', type: 'relation', required: false, relation: { relatedEntity: 'Department', type: 'many-to-one', inverseFieldName: 'employees' } }
        );
      } else if (eName === 'leaverequest') {
        entity.fields.push(
          { name: 'leaveType', type: 'string', required: true },
          { name: 'startDate', type: 'date', required: true },
          { name: 'endDate', type: 'date', required: true },
          { name: 'status', type: 'string', required: true, defaultValue: 'pending' },
          { name: 'employeeId', type: 'relation', required: true, relation: { relatedEntity: 'Employee', type: 'many-to-one', inverseFieldName: 'leaveRequests' } }
        );
      } else if (eName === 'department') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true }
        );
      } else if (eName === 'order') {
        entity.fields.push(
          { name: 'orderNumber', type: 'string', required: true },
          { name: 'totalAmount', type: 'number', required: true },
          { name: 'customerId', type: 'relation', required: true, relation: { relatedEntity: 'Customer', type: 'many-to-one', inverseFieldName: 'orders' } }
        );
      } else if (eName === 'customer') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true },
          { name: 'email', type: 'string', required: true }
        );
      } else if (eName === 'event') {
        entity.fields.push(
          { name: 'title', type: 'string', required: true },
          { name: 'eventDate', type: 'date', required: true }
        );
      } else if (eName === 'attendee') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true },
          { name: 'email', type: 'string', required: true }
        );
      } else if (eName === 'ticket') {
        entity.fields.push(
          { name: 'ticketCode', type: 'string', required: true },
          { name: 'price', type: 'number', required: true },
          { name: 'eventId', type: 'relation', required: true, relation: { relatedEntity: 'Event', type: 'many-to-one', inverseFieldName: 'tickets' } },
          { name: 'attendeeId', type: 'relation', required: true, relation: { relatedEntity: 'Attendee', type: 'many-to-one', inverseFieldName: 'tickets' } }
        );
      } else if (eName === 'clinicalnote') {
        entity.fields.push(
          { name: 'noteContent', type: 'string', required: true },
          { name: 'patientId', type: 'relation', required: true, relation: { relatedEntity: 'Patient', type: 'many-to-one', inverseFieldName: 'clinicalNotes' } },
          { name: 'doctorId', type: 'relation', required: true, relation: { relatedEntity: 'Doctor', type: 'many-to-one', inverseFieldName: 'clinicalNotes' } }
        );
      } else if (eName === 'patient') {
        entity.fields.push(
          { name: 'fullName', type: 'string', required: true },
          { name: 'dateOfBirth', type: 'date', required: true }
        );
      } else if (eName === 'doctor') {
        entity.fields.push(
          { name: 'name', type: 'string', required: true },
          { name: 'licenseNumber', type: 'string', required: true }
        );
      } else if (eName === 'invoice') {
        entity.fields.push(
          { name: 'invoiceNumber', type: 'string', required: true },
          { name: 'amount', type: 'number', required: true },
          { name: 'clientId', type: 'relation', required: true, relation: { relatedEntity: 'Client', type: 'many-to-one', inverseFieldName: 'invoices' } }
        );
      } else if (eName === 'client') {
        entity.fields.push(
          { name: 'companyName', type: 'string', required: true },
          { name: 'email', type: 'string', required: true }
        );
      } else if (eName === 'todoitem') {
        entity.fields.push(
          { name: 'title', type: 'string', required: true },
          { name: 'completed', type: 'boolean', required: true, defaultValue: false }
        );
      }
    });

    // Enforce inverse relation mapping where necessary for consistency
    return schema;
  }

  public static getAppSpec(intent: AppIntent, dataSchema: DataSchema): AppSpec {
    const appSpec: AppSpec = {
      appName: intent.appName,
      appType: intent.appType,
      dataSchema,
      pages: [],
      apiEndpoints: [],
      authRules: {
        roles: ['admin', 'user'],
        authProvider: 'clerk',
        rules: [
          { role: 'admin', resource: '*', actions: ['create', 'read', 'update', 'delete'] },
          { role: 'user', resource: '*', actions: ['read'] },
        ],
      },
      integrationHooks: [],
      workflowStubs: [],
    };

    // Build pages, APIs, integrations, and workflow stubs based on entities
    const entities = dataSchema.entities;

    entities.forEach((entity) => {
      const name = entity.name;
      const lower = name.toLowerCase();

      // Page
      appSpec.pages.push({
        id: `${lower}_page`,
        title: `${name} Management`,
        route: `/${lower}s`,
        layout: 'list',
        components: [
          {
            type: 'table',
            entity: name,
            fields: entity.fields.map(f => f.name),
            actions: ['create', 'edit', 'delete'],
          },
          {
            type: 'form',
            entity: name,
            fields: entity.fields.filter(f => f.name !== 'id' && f.name !== 'createdAt' && f.name !== 'updatedAt').map(f => f.name),
          }
        ],
        allowedRoles: ['admin', 'user'],
      });

      // API Endpoints
      appSpec.apiEndpoints.push(
        {
          path: `/api/${lower}s`,
          method: 'GET',
          description: `Fetch list of ${name}s`,
          authRequired: true,
          roles: ['admin', 'user'],
          linkedEntity: name,
        },
        {
          path: `/api/${lower}s`,
          method: 'POST',
          description: `Create new ${name}`,
          authRequired: true,
          roles: ['admin'],
          linkedEntity: name,
        }
      );
    });

    // Handle integration hooks
    intent.integrations_requested.forEach((intg) => {
      if (intg === 'whatsapp') {
        appSpec.integrationHooks.push({
          integrationId: 'whatsapp',
          action: 'send_message',
          trigger: 'on_lead_created',
          mapping: {
            to: '{{lead.phone}}',
            message: 'Hello {{lead.name}}, thank you for reaching out to EstateFlow! An agent will contact you soon.',
          },
        });
      } else if (intg === 'slack') {
        appSpec.integrationHooks.push({
          integrationId: 'slack',
          action: 'send_message',
          trigger: 'on_task_created',
          mapping: {
            channel: '#general',
            text: 'New Task Created: {{task.title}}',
          },
        });
      } else if (intg === 'gmail') {
        appSpec.integrationHooks.push({
          integrationId: 'gmail',
          action: 'send_email',
          trigger: 'on_order_created',
          mapping: {
            to: '{{customer.email}}',
            subject: 'Order Receipt - SwiftShop',
            body: 'Thank you for your order! Your total is ${{order.totalAmount}}.',
          },
        });
      } else if (intg === 'stripe') {
        appSpec.integrationHooks.push({
          integrationId: 'stripe',
          action: 'create_payment_intent',
          trigger: 'on_order_created',
          mapping: {
            amount: '{{order.totalAmount}}',
            currency: 'usd',
          },
        });
      } else if (intg === 'jira') {
        appSpec.integrationHooks.push({
          integrationId: 'jira',
          action: 'create_issue',
          trigger: 'on_ticket_created',
          mapping: {
            projectKey: 'PROJ',
            summary: '{{ticket.title}}',
          },
        });
      }
    });

    // Add generic workflow stub if integrations requested
    if (intent.integrations_requested.length > 0) {
      const primaryIntg = intent.integrations_requested[0];
      appSpec.workflowStubs.push({
        id: 'integration_workflow',
        name: `Send Notification via ${primaryIntg}`,
        trigger: 'on_entity_created',
        steps: [
          {
            id: 'step_1',
            type: 'integration_hook',
            config: {
              integrationId: primaryIntg,
              action: primaryIntg === 'whatsapp' || primaryIntg === 'slack' ? 'send_message' : 'send_email',
            },
          },
        ],
      });
    }

    return appSpec;
  }
}
