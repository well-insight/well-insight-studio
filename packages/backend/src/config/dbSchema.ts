import { db } from "./database";

/** 旧库补列：显示名称 / 昵称；并回填空值为 username */
function migrateUsersAddDisplayNameColumn() {
  const cols = db.prepare("PRAGMA table_info(users)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "display_name")) {
    db.exec("ALTER TABLE users ADD COLUMN display_name TEXT");
    console.log("[DATABASE] 已为 users 表添加 display_name 列");
  }
  db.prepare(
    "UPDATE users SET display_name = username WHERE display_name IS NULL OR TRIM(display_name) = ''",
  ).run();
}

function migrateDatasetsAddFolderIdColumn() {
  const cols = db.prepare("PRAGMA table_info(datasets)").all() as { name: string }[];
  if (!cols.some((c) => c.name === "folder_id")) {
    db.exec(`
      ALTER TABLE datasets ADD COLUMN folder_id INTEGER REFERENCES dataset_folders(id) ON DELETE SET NULL
    `);
    console.log("[DATABASE] 已为 datasets 表添加 folder_id 列");
  }
}

export function initializeDatabaseSchema() {
  console.log("[DATABASE] 初始化数据库表结构...");

  // 用户表
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
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

  migrateUsersAddDisplayNameColumn();

  // 角色表
  db.exec(`
    CREATE TABLE IF NOT EXISTS roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT UNIQUE NOT NULL,
      description TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by INTEGER,
      FOREIGN KEY (created_by) REFERENCES users(id)
    )
  `);

  // 权限规则表
  db.exec(`
    CREATE TABLE IF NOT EXISTS permission_rules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      resource_type TEXT NOT NULL,
      resource_id TEXT,
      actions TEXT NOT NULL, -- JSON array of actions
      conditions TEXT, -- JSON object of conditions
      priority INTEGER DEFAULT 0,
      is_active BOOLEAN DEFAULT 1,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    )
  `);

  // 角色权限关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS role_permissions (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      role_id INTEGER NOT NULL,
      permission_rule_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_rule_id) REFERENCES permission_rules(id) ON DELETE CASCADE,
      UNIQUE(role_id, permission_rule_id)
    )
  `);

  // 用户角色关联表
  db.exec(`
    CREATE TABLE IF NOT EXISTS user_roles (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      role_id INTEGER NOT NULL,
      project_id INTEGER, -- 如果为空则表示全局角色
      assigned_by INTEGER NOT NULL,
      assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      expires_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (assigned_by) REFERENCES users(id),
      UNIQUE(user_id, role_id, project_id)
    )
  `);

  // 项目表
  db.exec(`
    CREATE TABLE IF NOT EXISTS projects (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // 数据集目录（文件夹，可嵌套）
  db.exec(`
    CREATE TABLE IF NOT EXISTS dataset_folders (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      parent_id INTEGER,
      project_id INTEGER,
      name TEXT NOT NULL,
      description TEXT,
      owner_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES dataset_folders(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (owner_id) REFERENCES users(id)
    )
  `);

  // 数据集表
  db.exec(`
    CREATE TABLE IF NOT EXISTS datasets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      description TEXT,
      file_path TEXT,
      file_size INTEGER,
      owner_id INTEGER NOT NULL,
      project_id INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id),
      FOREIGN KEY (project_id) REFERENCES projects(id)
    )
  `);

  migrateDatasetsAddFolderIdColumn();

  // 数据集字段（仅支持 text / number / datetime）
  db.exec(`
    CREATE TABLE IF NOT EXISTS dataset_fields (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      name TEXT NOT NULL,
      field_type TEXT NOT NULL CHECK (field_type IN ('text', 'number', 'datetime')),
      sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE,
      UNIQUE (dataset_id, name)
    )
  `);

  // 数据集行（列值 JSON，key 为字段 id 字符串）
  db.exec(`
    CREATE TABLE IF NOT EXISTS dataset_rows (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      dataset_id INTEGER NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0,
      values_json TEXT NOT NULL DEFAULT '{}',
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    )
  `);

  // 索引优化
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

  // 初始化默认角色和系统用户
  initializeDefaultRoles();

  console.log("[DATABASE] 数据库表结构初始化完成");
}

function initializeDefaultRoles() {
  // 检查是否已有默认角色
  const adminRoleExists = db.prepare("SELECT 1 FROM roles WHERE name = ?").get("admin");
  if (adminRoleExists) {
    console.log("[DATABASE] 默认角色已存在，跳过初始化");
    return;
  }

  // --- 关键修复：先创建系统用户（ID=1） ---
  const SYSTEM_USER_ID = 1;
  const systemUserExists = db.prepare("SELECT 1 FROM users WHERE id = ?").get(SYSTEM_USER_ID);

  if (!systemUserExists) {
    // 创建系统用户（ID=1），默认口令 Aa@123456（bcrypt）
    const defaultPasswordHash = "$2a$10$cSbztqHbBsIu4FDFi8zjIuG54VZVwhA0BRicTrjKTt3yD.QkDMtWy";
    const insertSystemUser = db.prepare(`
      INSERT INTO users (id, email, password_hash, username, display_name, role, is_active) 
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);
    insertSystemUser.run(
      SYSTEM_USER_ID,
      "admin@cube.com",
      defaultPasswordHash,
      "admin",
      "管理员",
      "admin",
      1
    );
    console.log(`[DATABASE] 系统默认用户已创建 (ID: ${SYSTEM_USER_ID})`);
  } else {
    console.log(`[DATABASE] 系统默认用户已存在 (ID: ${SYSTEM_USER_ID}), 跳过创建`);
  }

  // 创建默认角色（使用系统用户ID作为created_by）
  const insertRole = db.prepare(`
    INSERT INTO roles (name, description, created_by) VALUES (?, ?, ?)
  `);

  const adminRoleId = insertRole.run("admin", "系统管理员，拥有所有权限", SYSTEM_USER_ID).lastInsertRowid;
  const developerRoleId = insertRole.run(
    "developer",
    "开发者，可以创建和编辑项目",
    SYSTEM_USER_ID,
  ).lastInsertRowid;
  const analystRoleId = insertRole.run("analyst", "分析师，可以查看和分析数据", SYSTEM_USER_ID).lastInsertRowid;
  const viewerRoleId = insertRole.run("viewer", "查看者，只能查看项目", SYSTEM_USER_ID).lastInsertRowid;

  // 创建默认权限规则
  const insertPermissionRule = db.prepare(`
    INSERT INTO permission_rules (resource_type, resource_id, actions, priority, is_active) VALUES (?, ?, ?, ?, ?)
  `);

  // 管理员权限
  const adminAllPerm = insertPermissionRule.run(
    "project",
    "*",
    '["read","write","delete","execute"]',
    100,
    1,
  ).lastInsertRowid;
  const adminDatasetPerm = insertPermissionRule.run(
    "dataset",
    "*",
    '["read","write","delete","import","export"]',
    100,
    1,
  ).lastInsertRowid;
  const adminWorkflowPerm = insertPermissionRule.run(
    "workflow",
    "*",
    '["read","write","delete","execute"]',
    100,
    1,
  ).lastInsertRowid;

  // 开发者权限
  const devProjectPerm = insertPermissionRule.run(
    "project",
    "*",
    '["read","write","delete"]',
    50,
    1,
  ).lastInsertRowid;
  const devDatasetPerm = insertPermissionRule.run(
    "dataset",
    "*",
    '["read","write","import","export"]',
    50,
    1,
  ).lastInsertRowid;
  const devWorkflowPerm = insertPermissionRule.run(
    "workflow",
    "*",
    '["read","write","execute"]',
    50,
    1,
  ).lastInsertRowid;

  // 分析师权限
  const analystProjectPerm = insertPermissionRule.run(
    "project",
    "*",
    '["read"]',
    30,
    1,
  ).lastInsertRowid;
  const analystDatasetPerm = insertPermissionRule.run(
    "dataset",
    "*",
    '["read","export"]',
    30,
    1,
  ).lastInsertRowid;
  const analystWorkflowPerm = insertPermissionRule.run(
    "workflow",
    "*",
    '["read"]',
    30,
    1,
  ).lastInsertRowid;

  // 查看者权限
  const viewerProjectPerm = insertPermissionRule.run(
    "project",
    "*",
    '["read"]',
    10,
    1,
  ).lastInsertRowid;
  const viewerDatasetPerm = insertPermissionRule.run(
    "dataset",
    "*",
    '["read"]',
    10,
    1,
  ).lastInsertRowid;

  // 关联角色和权限
  const insertRolePermission = db.prepare(`
    INSERT INTO role_permissions (role_id, permission_rule_id) VALUES (?, ?)
  `);

  // 管理员角色权限
  insertRolePermission.run(adminRoleId, adminAllPerm);
  insertRolePermission.run(adminRoleId, adminDatasetPerm);
  insertRolePermission.run(adminRoleId, adminWorkflowPerm);

  // 开发者角色权限
  insertRolePermission.run(developerRoleId, devProjectPerm);
  insertRolePermission.run(developerRoleId, devDatasetPerm);
  insertRolePermission.run(developerRoleId, devWorkflowPerm);

  // 分析师角色权限
  insertRolePermission.run(analystRoleId, analystProjectPerm);
  insertRolePermission.run(analystRoleId, analystDatasetPerm);
  insertRolePermission.run(analystRoleId, analystWorkflowPerm);

  // 查看者角色权限
  insertRolePermission.run(viewerRoleId, viewerProjectPerm);
  insertRolePermission.run(viewerRoleId, viewerDatasetPerm);

  console.log("[DATABASE] 默认角色和权限已初始化");
}