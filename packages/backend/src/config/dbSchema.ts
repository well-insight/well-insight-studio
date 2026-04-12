import { db } from "./database";
import { generateSnowflakeId } from "../utils/snowflake";

const TABLES_IN_DROP_ORDER = [
  "role_permissions",
  "user_roles",
  "dataset_rows",
  "dataset_fields",
  "datasets",
  "dataset_folders",
  "applications",
  "permission_rules",
  "roles",
  "projects",
  "users",
] as const;

function columnType(tableName: string, columnName: string): string | null {
  const columns = db.prepare(`PRAGMA table_info(${tableName})`).all() as Array<{
    name: string;
    type: string;
  }>;
  const match = columns.find((column) => column.name === columnName);
  return match?.type?.toUpperCase() ?? null;
}

function requiresSchemaReset(): boolean {
  const usersIdType = columnType("users", "id");
  const datasetsIdType = columnType("datasets", "id");
  if (!usersIdType && !datasetsIdType) return false;
  return usersIdType !== "TEXT" || datasetsIdType !== "TEXT";
}

function resetLegacySchema() {
  console.warn("[DATABASE] 检测到旧的数值 ID schema，按雪花 ID 方案重建数据库表");
  db.pragma("foreign_keys = OFF");
  try {
    for (const tableName of TABLES_IN_DROP_ORDER) {
      db.exec(`DROP TABLE IF EXISTS ${tableName}`);
    }
  } finally {
    db.pragma("foreign_keys = ON");
  }
}

function createTables() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id TEXT PRIMARY KEY,
      email TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      username TEXT NOT NULL,
      display_name TEXT,
      role TEXT DEFAULT 'user',
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login_at DATETIME
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id TEXT PRIMARY KEY,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by TEXT,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS permission_rules (
      id TEXT PRIMARY KEY,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      actions TEXT NOT NULL,
      conditions TEXT,
      priority INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id TEXT PRIMARY KEY,
      role_id TEXT NOT NULL,
      permission_rule_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_rule_id) REFERENCES permission_rules(id) ON DELETE CASCADE,
      UNIQUE(role_id, permission_rule_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id TEXT PRIMARY KEY,
      user_id TEXT NOT NULL,
      role_id TEXT NOT NULL,
      project_id TEXT,
      assigned_by TEXT NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      UNIQUE(user_id, role_id, project_id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS applications (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      status INTEGER NOT NULL DEFAULT 1,
      client_type INTEGER NOT NULL DEFAULT 1,
      schema_json TEXT NOT NULL,
      starred INTEGER NOT NULL DEFAULT 0,
      owner_id TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);
  db.exec("CREATE INDEX IF NOT EXISTS idx_applications_owner ON applications(owner_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_applications_updated ON applications(updated_at)");

  db.exec(`
    CREATE TABLE IF NOT EXISTS dataset_folders (
      id TEXT PRIMARY KEY,
      parent_id TEXT,
      project_id TEXT,
      name TEXT NOT NULL,
      description TEXT,
      owner_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES dataset_folders(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS datasets (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      description TEXT,
      file_path TEXT,
      file_size INTEGER,
      owner_id TEXT NOT NULL,
      project_id TEXT,
      folder_id TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (folder_id) REFERENCES dataset_folders(id) ON DELETE SET NULL
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dataset_fields (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      name TEXT NOT NULL,
      field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'datetime')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
      UNIQUE (dataset_id, name)
    )
  `);

  db.exec(`
    CREATE TABLE IF NOT EXISTS dataset_rows (
      id TEXT PRIMARY KEY,
      dataset_id TEXT NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      values_json TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    )
  `);

  db.exec("CREATE INDEX IF NOT EXISTS idx_users_email ON users(email)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_user_roles_user_id ON user_roles(user_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_user_roles_project_id ON user_roles(project_id)");
  db.exec(
    "CREATE INDEX IF NOT EXISTS idx_permission_rules_resource ON permission_rules(resource_type, resource_id)",
  );
  db.exec("CREATE INDEX IF NOT EXISTS idx_projects_owner ON projects(owner_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_datasets_owner ON datasets(owner_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_datasets_project ON datasets(project_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_datasets_folder ON datasets(folder_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dataset_folders_owner ON dataset_folders(owner_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dataset_folders_parent ON dataset_folders(parent_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dataset_folders_project ON dataset_folders(project_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dataset_fields_dataset ON dataset_fields(dataset_id)");
  db.exec("CREATE INDEX IF NOT EXISTS idx_dataset_rows_dataset ON dataset_rows(dataset_id)");
}

export function initializeDatabaseSchema() {
  console.log("[DATABASE] 初始化数据库表结构...");

  if (requiresSchemaReset()) {
    resetLegacySchema();
  }

  createTables();
  initializeDefaultRoles();

  console.log("[DATABASE] 数据库表结构初始化完成");
}

function initializeDefaultRoles() {
  const adminRoleExists = db.prepare("SELECT 1 FROM roles WHERE name = ?").get("admin");
  if (adminRoleExists) {
    console.log("[DATABASE] 默认角色已存在，跳过初始化");
    return;
  }

  const systemUserId = generateSnowflakeId();
  const defaultPasswordHash = "$2a$10$cSbztqHbBsIu4FDFi8zjIuG54VZVwhA0BRicTrjKTt3yD.QkDMtWy";
  db.prepare(
    `
      INSERT INTO users (id, email, password_hash, username, display_name, role, is_active)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `,
  ).run(systemUserId, "admin@cube.com", defaultPasswordHash, "admin", "管理员", "admin", 1);

  const createRole = db.prepare(`
    INSERT INTO roles (id, name, description, created_by) VALUES (?, ?, ?, ?)
  `);
  const createPermissionRule = db.prepare(`
    INSERT INTO permission_rules (id, resource_type, resource_id, actions, priority, is_active)
    VALUES (?, ?, ?, ?, ?, ?)
  `);
  const createRolePermission = db.prepare(`
    INSERT INTO role_permissions (id, role_id, permission_rule_id) VALUES (?, ?, ?)
  `);

  const adminRoleId = generateSnowflakeId();
  const developerRoleId = generateSnowflakeId();
  const analystRoleId = generateSnowflakeId();
  const viewerRoleId = generateSnowflakeId();

  createRole.run(adminRoleId, "admin", "系统管理员，拥有所有权限", systemUserId);
  createRole.run(developerRoleId, "developer", "开发者，可以创建和编辑项目", systemUserId);
  createRole.run(analystRoleId, "analyst", "分析师，可以查看和分析数据", systemUserId);
  createRole.run(viewerRoleId, "viewer", "查看者，只能查看项目", systemUserId);

  const createRule = (
    roleId: string,
    resourceType: string,
    actions: string[],
    priority: number,
  ) => {
    const permissionRuleId = generateSnowflakeId();
    createPermissionRule.run(permissionRuleId, resourceType, "*", JSON.stringify(actions), priority, 1);
    createRolePermission.run(generateSnowflakeId(), roleId, permissionRuleId);
  };

  createRule(adminRoleId, "project", ["read", "write", "delete", "execute"], 100);
  createRule(adminRoleId, "dataset", ["read", "write", "delete", "import", "export"], 100);
  createRule(adminRoleId, "workflow", ["read", "write", "delete", "execute"], 100);

  createRule(developerRoleId, "project", ["read", "write", "delete"], 50);
  createRule(developerRoleId, "dataset", ["read", "write", "import", "export"], 50);
  createRule(developerRoleId, "workflow", ["read", "write", "execute"], 50);

  createRule(analystRoleId, "project", ["read"], 30);
  createRule(analystRoleId, "dataset", ["read", "export"], 30);
  createRule(analystRoleId, "workflow", ["read"], 30);

  createRule(viewerRoleId, "project", ["read"], 10);
  createRule(viewerRoleId, "dataset", ["read"], 10);

  console.log("[DATABASE] 默认角色和权限已初始化");
}