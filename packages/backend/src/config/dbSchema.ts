import { PoolConnection } from 'mysql2/promise';
import { execute, queryOne, withTransaction } from './database';
import { generateSnowflakeId } from '../utils/snowflake';

type SqlExecutor = Pick<PoolConnection, 'execute'>;

const tableOptions = 'ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci';

async function ensureColumn(
  tableName: string,
  columnName: string,
  columnDefinition: string,
): Promise<void> {
  const column = await queryOne(
    `SELECT 1 FROM information_schema.columns WHERE table_schema = DATABASE() AND table_name = ? AND column_name = ?`,
    [tableName, columnName],
  );
  if (!column) await execute(`ALTER TABLE \`${tableName}\` ADD COLUMN ${columnDefinition}`);
}

async function ensureIndex(
  tableName: string,
  indexName: string,
  definition: string,
): Promise<void> {
  const index = await queryOne(
    `SELECT 1 FROM information_schema.statistics WHERE table_schema = DATABASE() AND table_name = ? AND index_name = ?`,
    [tableName, indexName],
  );
  if (!index) await execute(`CREATE INDEX \`${indexName}\` ON \`${tableName}\` ${definition}`);
}

async function createTables(): Promise<void> {
  const statements = [
    `CREATE TABLE IF NOT EXISTS users (
      id VARCHAR(64) PRIMARY KEY, email VARCHAR(255) NOT NULL UNIQUE, password_hash VARCHAR(255) NOT NULL,
      username VARCHAR(255) NOT NULL, display_name VARCHAR(255) NULL, role VARCHAR(64) DEFAULT 'user',
      is_active BOOLEAN DEFAULT TRUE, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, last_login_at DATETIME NULL
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS roles (
      id VARCHAR(64) PRIMARY KEY, name VARCHAR(100) NOT NULL UNIQUE, description TEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      created_by VARCHAR(64) NULL, FOREIGN KEY (created_by) REFERENCES users(id)
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS projects (
      id VARCHAR(64) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT NULL, owner_id VARCHAR(64) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id)
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS permission_rules (
      id VARCHAR(64) PRIMARY KEY, resource_type VARCHAR(64) NOT NULL, resource_id VARCHAR(64) NULL,
      actions TEXT NOT NULL, conditions TEXT NULL, priority INTEGER DEFAULT 0, is_active BOOLEAN DEFAULT TRUE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS role_permissions (
      id VARCHAR(64) PRIMARY KEY, role_id VARCHAR(64) NOT NULL, permission_rule_id VARCHAR(64) NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE,
      FOREIGN KEY (permission_rule_id) REFERENCES permission_rules(id) ON DELETE CASCADE,
      UNIQUE KEY uk_role_permission (role_id, permission_rule_id)
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS user_roles (
      id VARCHAR(64) PRIMARY KEY, user_id VARCHAR(64) NOT NULL, role_id VARCHAR(64) NOT NULL, project_id VARCHAR(64) NULL,
      assigned_by VARCHAR(64) NOT NULL, assigned_at DATETIME DEFAULT CURRENT_TIMESTAMP, expires_at DATETIME NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
      FOREIGN KEY (role_id) REFERENCES roles(id) ON DELETE CASCADE, FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (assigned_by) REFERENCES users(id), UNIQUE KEY uk_user_role_project (user_id, role_id, project_id)
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS applications (
      id VARCHAR(64) PRIMARY KEY, title VARCHAR(255) NOT NULL, status INTEGER NOT NULL DEFAULT 1,
      client_type INTEGER NOT NULL DEFAULT 1, schema_json LONGTEXT NOT NULL, starred INTEGER NOT NULL DEFAULT 0,
      owner_id VARCHAR(64) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (owner_id) REFERENCES users(id)
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS page_folders (
      id VARCHAR(64) PRIMARY KEY, parent_id VARCHAR(64) NULL, name VARCHAR(255) NOT NULL, description TEXT NULL,
      owner_id VARCHAR(64) NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES page_folders(id) ON DELETE CASCADE,
      FOREIGN KEY (owner_id) REFERENCES users(id) ON DELETE CASCADE
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS pages (
      id VARCHAR(64) PRIMARY KEY, folder_id VARCHAR(64) NULL, name VARCHAR(255) NOT NULL, type VARCHAR(32) NOT NULL,
      dsl LONGTEXT NOT NULL, dataset_bindings LONGTEXT NULL, preview_url TEXT NULL, status VARCHAR(32) NOT NULL DEFAULT 'draft',
      created_by VARCHAR(64) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (folder_id) REFERENCES page_folders(id) ON DELETE SET NULL,
      FOREIGN KEY (created_by) REFERENCES users(id)
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS app_page_menus (
      id VARCHAR(64) PRIMARY KEY, application_id VARCHAR(64) NOT NULL, page_id VARCHAR(64) NULL, parent_id VARCHAR(64) NULL,
      menu_title VARCHAR(255) NOT NULL, menu_icon VARCHAR(100) NULL, route_path VARCHAR(500) NULL, permission VARCHAR(100) NULL,
      sort_order INTEGER DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
      FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS form_records (
      id VARCHAR(64) PRIMARY KEY, page_id VARCHAR(64) NOT NULL, values_json LONGTEXT NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
      created_by VARCHAR(64) NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP, FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE,
      FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE CASCADE
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS dataset_folders (
      id VARCHAR(64) PRIMARY KEY, parent_id VARCHAR(64) NULL, project_id VARCHAR(64) NULL, name VARCHAR(255) NOT NULL,
      description TEXT NULL, owner_id VARCHAR(64) NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (parent_id) REFERENCES dataset_folders(id) ON DELETE CASCADE,
      FOREIGN KEY (project_id) REFERENCES projects(id), FOREIGN KEY (owner_id) REFERENCES users(id)
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS datasets (
      id VARCHAR(64) PRIMARY KEY, name VARCHAR(255) NOT NULL, description TEXT NULL, file_path TEXT NULL, file_size INTEGER NULL,
      owner_id VARCHAR(64) NOT NULL, project_id VARCHAR(64) NULL, folder_id VARCHAR(64) NULL, form_schema LONGTEXT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (owner_id) REFERENCES users(id), FOREIGN KEY (project_id) REFERENCES projects(id),
      FOREIGN KEY (folder_id) REFERENCES dataset_folders(id) ON DELETE SET NULL
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS dataset_fields (
      id VARCHAR(64) PRIMARY KEY, dataset_id VARCHAR(64) NOT NULL, name VARCHAR(200) NOT NULL, field_type VARCHAR(32) NOT NULL,
      sort_order INTEGER NOT NULL DEFAULT 0, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE, UNIQUE KEY uk_dataset_field_name (dataset_id, name)
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS dataset_rows (
      id VARCHAR(64) PRIMARY KEY, dataset_id VARCHAR(64) NOT NULL, sort_order INTEGER NOT NULL DEFAULT 0,
      values_json LONGTEXT NOT NULL, created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (dataset_id) REFERENCES datasets(id) ON DELETE CASCADE
    ) ${tableOptions}`,
    `CREATE TABLE IF NOT EXISTS lowcode_pages (
      id VARCHAR(64) PRIMARY KEY, name VARCHAR(100) NOT NULL, components LONGTEXT NOT NULL,
      settings LONGTEXT NULL, created_at DATETIME NOT NULL, updated_at DATETIME NOT NULL
    ) ${tableOptions}`,
  ];
  for (const statement of statements) await execute(statement);

  const indexes: Array<[string, string, string]> = [
    ['users', 'idx_users_email', '(email)'],
    ['user_roles', 'idx_user_roles_user_id', '(user_id)'],
    ['user_roles', 'idx_user_roles_project_id', '(project_id)'],
    ['permission_rules', 'idx_permission_rules_resource', '(resource_type, resource_id)'],
    ['projects', 'idx_projects_owner', '(owner_id)'],
    ['applications', 'idx_applications_owner', '(owner_id)'],
    ['applications', 'idx_applications_updated', '(updated_at)'],
    ['datasets', 'idx_datasets_owner', '(owner_id)'],
    ['datasets', 'idx_datasets_project', '(project_id)'],
    ['datasets', 'idx_datasets_folder', '(folder_id)'],
    ['dataset_folders', 'idx_dataset_folders_owner', '(owner_id)'],
    ['dataset_folders', 'idx_dataset_folders_parent', '(parent_id)'],
    ['dataset_folders', 'idx_dataset_folders_project', '(project_id)'],
    ['dataset_fields', 'idx_dataset_fields_dataset', '(dataset_id)'],
    ['dataset_rows', 'idx_dataset_rows_dataset', '(dataset_id)'],
    ['pages', 'idx_pages_created_by', '(created_by)'],
    ['pages', 'idx_pages_folder', '(folder_id)'],
    ['pages', 'idx_pages_type', '(type)'],
    ['pages', 'idx_pages_status', '(status)'],
    ['page_folders', 'idx_page_folders_owner', '(owner_id)'],
    ['page_folders', 'idx_page_folders_parent', '(parent_id)'],
    ['form_records', 'idx_form_records_page', '(page_id)'],
    ['form_records', 'idx_form_records_created_by', '(created_by)'],
    ['app_page_menus', 'idx_app_page_menus_app', '(application_id)'],
    ['app_page_menus', 'idx_app_page_menus_page', '(page_id)'],
    ['app_page_menus', 'idx_app_page_menus_parent', '(parent_id)'],
  ];
  for (const [table, name, definition] of indexes) await ensureIndex(table, name, definition);
}

async function initializeDefaultRoles(): Promise<void> {
  await withTransaction(async (connection) => {
    const [existing] = await connection.execute('SELECT 1 FROM roles WHERE name = ? LIMIT 1', [
      'admin',
    ]);
    if (Array.isArray(existing) && existing.length > 0) return;

    const systemUserId = generateSnowflakeId();
    const defaultPasswordHash = '$2a$10$cSbztqHbBsIu4FDFi8zjIuG54VZVwhA0BRicTrjKTt3yD.QkDMtWy';
    await connection.execute(
      'INSERT INTO users (id, email, password_hash, username, display_name, role, is_active) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [systemUserId, 'admin@cube.com', defaultPasswordHash, 'admin', '管理员', 'admin', 1],
    );

    const roles = [
      [generateSnowflakeId(), 'admin', '系统管理员，拥有所有权限'],
      [generateSnowflakeId(), 'developer', '开发者，可以创建和编辑项目'],
      [generateSnowflakeId(), 'analyst', '分析师，可以查看和分析数据'],
      [generateSnowflakeId(), 'viewer', '查看者，只能查看项目'],
    ];
    for (const [id, name, description] of roles) {
      await connection.execute(
        'INSERT INTO roles (id, name, description, created_by) VALUES (?, ?, ?, ?)',
        [id, name, description, systemUserId],
      );
    }
    const roleIds = Object.fromEntries(roles.map(([id, name]) => [name, id])) as Record<
      string,
      string
    >;
    const rules: Array<[string, string, string[], number]> = [
      ['admin', 'project', ['read', 'write', 'delete', 'execute'], 100],
      ['admin', 'dataset', ['read', 'write', 'delete', 'import', 'export'], 100],
      ['admin', 'workflow', ['read', 'write', 'delete', 'execute'], 100],
      ['developer', 'project', ['read', 'write', 'delete'], 50],
      ['developer', 'dataset', ['read', 'write', 'import', 'export'], 50],
      ['developer', 'workflow', ['read', 'write', 'execute'], 50],
      ['analyst', 'project', ['read'], 30],
      ['analyst', 'dataset', ['read', 'export'], 30],
      ['analyst', 'workflow', ['read'], 30],
      ['viewer', 'project', ['read'], 10],
      ['viewer', 'dataset', ['read'], 10],
    ];
    for (const [roleName, resourceType, actions, priority] of rules) {
      const permissionId = generateSnowflakeId();
      await connection.execute(
        'INSERT INTO permission_rules (id, resource_type, resource_id, actions, priority, is_active) VALUES (?, ?, ?, ?, ?, ?)',
        [permissionId, resourceType, '*', JSON.stringify(actions), priority, 1],
      );
      await connection.execute(
        'INSERT INTO role_permissions (id, role_id, permission_rule_id) VALUES (?, ?, ?)',
        [generateSnowflakeId(), roleIds[roleName], permissionId],
      );
    }
    console.log('[DATABASE] 默认管理员、角色和权限已初始化');
  });
}

export async function initializeDatabaseSchema(): Promise<void> {
  console.log('[DATABASE] 初始化 MySQL 数据库表结构...');
  await createTables();
  await ensureColumn('pages', 'folder_id', 'folder_id VARCHAR(64) NULL');
  await ensureColumn('datasets', 'form_schema', 'form_schema LONGTEXT NULL');
  await initializeDefaultRoles();
  console.log('[DATABASE] MySQL 数据库表结构初始化完成');
}
