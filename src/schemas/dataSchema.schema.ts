import { z } from 'zod';

export const relationSchema = z.object({
  relatedEntity: z.string().min(1, 'Related entity is required'),
  type: z.enum(['one-to-one', 'one-to-many', 'many-to-one', 'many-to-many']),
  inverseFieldName: z.string().optional(),
}).strict();

export const fieldSchema = z.object({
  name: z.string().min(1, 'Field name is required'),
  type: z.enum(['string', 'number', 'boolean', 'date', 'relation']),
  required: z.boolean(),
  defaultValue: z.union([z.string(), z.number(), z.boolean()]).optional(),
  isPrimary: z.boolean().optional(),
  relation: relationSchema.optional(),
}).strict();

export const entitySchema = z.object({
  name: z.string().min(1, 'Entity name is required'),
  fields: z.array(fieldSchema),
}).strict();

export const dataSchemaSchema = z.object({
  entities: z.array(entitySchema),
}).strict();

export type DataSchemaSchemaType = z.infer<typeof dataSchemaSchema>;
export type EntitySchemaSchemaType = z.infer<typeof entitySchema>;
export type FieldSchemaSchemaType = z.infer<typeof fieldSchema>;
export type RelationSchemaSchemaType = z.infer<typeof relationSchema>;
