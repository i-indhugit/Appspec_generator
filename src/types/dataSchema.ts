export type FieldType = 'string' | 'number' | 'boolean' | 'date' | 'relation';

export type RelationType = 'one-to-one' | 'one-to-many' | 'many-to-one' | 'many-to-many';

export interface RelationSchema {
  relatedEntity: string;
  type: RelationType;
  inverseFieldName?: string; // For bidirectional consistency
}

export interface FieldSchema {
  name: string;
  type: FieldType;
  required: boolean;
  defaultValue?: string | number | boolean;
  isPrimary?: boolean;
  relation?: RelationSchema; // Defined if type is 'relation'
}

export interface EntitySchema {
  name: string;
  fields: FieldSchema[];
}

export interface DataSchema {
  entities: EntitySchema[];
}
