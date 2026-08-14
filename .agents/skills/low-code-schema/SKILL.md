---
name: low-code-schema
description: 低代码 Schema 设计规范。涵盖组件树结构、属性配置、事件绑定、样式配置、数据绑定和版本控制。适用于任何低代码/无代码平台的 Schema 设计与序列化。
---

# Low-Code Schema

This skill defines standards for designing JSON schemas that describe low-code pages and components.

## Core Concepts

### Component Node

A component node describes a single component instance in the tree.

```typescript
export interface ComponentNode {
  /** Unique identifier within the page */
  id: string
  /** Component type name (must match registry) */
  type: string
  /** Component props */
  props: Record<string, any>
  /** Child components rendered in default slot */
  children?: ComponentNode[]
  /** Named slots: slotName -> child nodes */
  slots?: Record<string, ComponentNode[]>
  /** Event bindings: eventName -> binding config */
  events?: Record<string, EventBinding>
  /** Inline styles */
  styles?: Record<string, any>
  /** Conditional visibility expression */
  visible?: string | boolean
  /** Custom CSS class names */
  className?: string
}
```

### Event Binding

```typescript
export type EventActionType = 'navigate' | 'api' | 'state' | 'custom' | 'message'

export interface EventBinding {
  type: EventActionType
  /** Target for the action (URL, API endpoint, state key, message name) */
  target: string
  /** Optional payload */
  payload?: Record<string, any>
  /** Whether to prevent default behavior */
  preventDefault?: boolean
  /** Whether to stop propagation */
  stopPropagation?: boolean
}
```

### Page Schema

```typescript
export interface PageSchema {
  /** Page unique ID */
  id: string
  /** Human-readable name */
  name: string
  /** Route path */
  route: string
  /** Schema version for migration */
  version: string
  /** Root component node */
  root: ComponentNode
  /** Page-level data bindings */
  dataSources?: DataSourceBinding[]
  /** Page-level state */
  state?: Record<string, any>
  /** Meta configuration */
  meta?: {
    title?: string
    description?: string
    layout?: string
  }
}
```

### Data Source Binding

```typescript
export interface DataSourceBinding {
  id: string
  /** Data source type */
  type: 'rest' | 'graphql' | 'database' | 'static'
  /** Data source name */
  name: string
  /** Endpoint or query */
  source: string
  /** Method for REST */
  method?: 'GET' | 'POST' | 'PUT' | 'DELETE'
  /** Request body mapping */
  requestBody?: Record<string, any>
  /** Response field mapping to component state */
  responseMap?: Record<string, string>
  /** Whether to auto-fetch on mount */
  autoFetch?: boolean
  /** Polling interval in ms */
  pollInterval?: number
}
```

## Schema Design Rules

### ID Generation

```typescript
import { nanoid } from 'nanoid'

function createNode(type: string, props: Record<string, any> = {}): ComponentNode {
  return {
    id: nanoid(12),
    type,
    props,
    children: [],
    events: {},
  }
}
```

- MUST generate stable IDs for every node
- MUST NOT use array index as ID
- SHOULD use short, URL-safe IDs (`nanoid`)
- MUST preserve IDs across saves and loads

### Component References

```typescript
interface ComponentRef {
  /** Reference name used in expressions */
  name: string
  /** Target node ID */
  nodeId: string
}
```

- MUST NOT use IDs in user-facing expressions; use named references
- MUST validate references against current tree
- SHOULD auto-complete reference names in property panel

### Expressions

```typescript
export interface ExpressionBinding {
  /** Expression language (e.g., 'js', 'mustache') */
  language: 'js' | 'mustache'
  /** Expression source */
  expression: string
  /** Cached evaluation result */
  cachedValue?: any
}
```

```json
{
  "props": {
    "text": {
      "type": "expression",
      "language": "js",
      "expression": "state.user.name"
    }
  }
}
```

- MUST support expressions for dynamic values
- MUST sandbox expression evaluation in production
- MUST NOT allow arbitrary code execution from untrusted schemas
- SHOULD provide expression autocomplete in property panel

### Versioning

```json
{
  "version": "1.2.0",
  "migrations": {
    "1.0.0": "initial",
    "1.1.0": "added slots support",
    "1.2.0": "added event payloads"
  }
}
```

- MUST include schema version in every saved schema
- MUST provide migration path when schema changes
- SHOULD use semantic versioning for schema
- MUST NOT break backward compatibility in minor versions

## Serialization

### JSON Representation

```typescript
function serialize(schema: PageSchema): string {
  return JSON.stringify(schema, null, 2)
}

function deserialize(json: string): PageSchema {
  const parsed = JSON.parse(json)
  return validateSchema(parsed)
}
```

### Validation

```typescript
import { z } from 'zod'

const ComponentNodeSchema: z.ZodType<ComponentNode> = z.object({
  id: z.string().min(1),
  type: z.string().min(1),
  props: z.record(z.any()),
  children: z.array(ComponentNodeSchema).optional(),
  slots: z.record(z.array(ComponentNodeSchema)).optional(),
  events: z.record(EventBindingSchema).optional(),
  styles: z.record(z.any()).optional(),
  visible: z.union([z.boolean(), z.string()]).optional(),
  className: z.string().optional(),
})

const PageSchemaSchema: z.ZodType<PageSchema> = z.object({
  id: z.string().uuid(),
  name: z.string().min(1).max(255),
  route: z.string().min(1),
  version: z.string(),
  root: ComponentNodeSchema,
})

function validateSchema(input: unknown): PageSchema {
  return PageSchemaSchema.parse(input)
}
```

## Import and Export

### Portable Schema Format

```typescript
export interface PortableComponent {
  type: string
  name: string
  category: string
  icon?: string
  defaultProps: Record<string, any>
  propsSchema: PropertySchema[]
}

export interface PortableSchema {
  format: 'low-code-schema'
  version: string
  exportedAt: string
  components: PortableComponent[]
  page: PageSchema
}
```

## Checklist

When designing a schema:
- [ ] Every node has a stable, non-index ID
- [ ] Component types are validated against registry
- [ ] Expressions are sandboxed from execution
- [ ] Schema version is stored with every page
- [ ] Migration path exists for schema changes
- [ ] Validation fails fast with clear error messages
- [ ] Serializable to JSON without custom replacers
- [ ] Supports named slots and event bindings
- [ ] Data source bindings are explicit
- [ ] Portable export includes component definitions
