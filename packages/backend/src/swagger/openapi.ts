/**
 * OpenAPI 3.0 文档：与当前路由实现保持一致，供 Swagger UI 展示与调试。
 */
export function getOpenApiSpec(port: number) {
  const base = `http://localhost:${port}`;
  return {
    openapi: '3.0.3',
    info: {
      title: 'Low Code Platform API',
      description:
        '后端 REST API。认证相关接口返回 JWT，可在本页 Authorize 中填入 `Bearer <token>` 以便后续扩展受保护接口时使用。',
      version: '1.0.0',
    },
    servers: [{ url: base, description: '当前服务' }],
    tags: [
      { name: 'Health', description: '健康检查' },
      { name: 'API', description: 'API 根信息' },
      { name: 'Auth', description: '注册与登录' },
      { name: 'Users', description: '用户管理（管理员）' },
      { name: 'Lowcode', description: '低代码页面（内存存储）' },
      { name: 'Pages', description: '独立页面 CRUD（可视化/表单/报表）' },
      { name: 'Assembly', description: '应用组装：菜单树、页面挂载、发布' },
      {
        name: 'Datasets',
        description:
          '数据分析数据集：目录（文件夹）树、数据集 CRUD、字段类型仅 text / number / datetime，以及数据行分页查询',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
      schemas: {
        ErrorBody: {
          type: 'object',
          properties: {
            error: { type: 'string', description: '错误信息' },
          },
        },
        LoginRequest: {
          type: 'object',
          required: ['password'],
          description:
            '须同时提供 `password` 与账号标识：`account`（推荐）或 `email`（兼容），值为邮箱或用户名。',
          properties: {
            account: {
              type: 'string',
              description: '邮箱或用户名',
              example: 'admin',
            },
            email: {
              type: 'string',
              description: '与 account 二选一（兼容旧客户端），可为邮箱或用户名',
              example: 'admin@cube.com',
            },
            password: { type: 'string', format: 'password', example: 'Aa@123456' },
          },
        },
        RegisterRequest: {
          type: 'object',
          required: ['email', 'username', 'password'],
          properties: {
            email: { type: 'string', format: 'email' },
            username: { type: 'string', minLength: 1, example: 'alice' },
            display_name: {
              type: 'string',
              description: '显示名称 / 昵称；省略时默认与用户名相同',
              example: 'Alice',
            },
            password: { type: 'string', format: 'password' },
          },
        },
        UserPublic: {
          type: 'object',
          description: '不含 password_hash',
          properties: {
            id: { type: 'string' },
            email: { type: 'string' },
            username: { type: 'string' },
            display_name: { type: 'string', nullable: true, description: '显示名称 / 昵称' },
            role: { type: 'string', nullable: true },
            is_active: { type: 'boolean' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
            last_login_at: { type: 'string', nullable: true },
          },
        },
        LoginSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string', example: '登录成功' },
            token: { type: 'string', description: 'JWT' },
            user: { $ref: '#/components/schemas/UserPublic' },
          },
        },
        LoginFailure: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            message: { type: 'string', example: '密码错误' },
          },
        },
        UserListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: { type: 'array', items: { $ref: '#/components/schemas/UserPublic' } },
          },
        },
        ResetPasswordRequest: {
          type: 'object',
          required: ['password'],
          properties: {
            password: {
              type: 'string',
              format: 'password',
              minLength: 6,
              description: '新密码（至少 6 位）',
            },
          },
        },
        ResetPasswordSuccess: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            message: { type: 'string' },
            data: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                email: { type: 'string' },
                username: { type: 'string' },
                display_name: { type: 'string', nullable: true },
              },
            },
          },
        },
        ApiErrorSuccessFalse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string' },
          },
        },
        Page: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            components: { type: 'array', items: {} },
            settings: { type: 'object', additionalProperties: true },
            createdAt: { type: 'string', format: 'date-time' },
            updatedAt: { type: 'string', format: 'date-time' },
          },
        },
        PageInput: {
          type: 'object',
          required: ['name', 'components'],
          properties: {
            name: { type: 'string', minLength: 1, maxLength: 100 },
            components: { type: 'array', items: {} },
            settings: { type: 'object', additionalProperties: true },
          },
        },
        PageListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: true },
            data: { type: 'array', items: { $ref: '#/components/schemas/Page' } },
            total: { type: 'integer' },
            message: { type: 'string' },
          },
        },
        PageSingleResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { $ref: '#/components/schemas/Page' },
            message: { type: 'string' },
          },
        },
        ZodErrorDetail: {
          type: 'object',
          properties: {
            success: { type: 'boolean', example: false },
            error: { type: 'string', example: '数据验证失败' },
            details: { type: 'array', items: { type: 'object' } },
          },
        },
        NewPage: {
          type: 'object',
          properties: {
            id: { type: 'string', description: '页面 ID' },
            name: { type: 'string', description: '页面名称' },
            type: {
              type: 'string',
              enum: ['visualization', 'form', 'report'],
              description: '页面类型：可视化/表单/报表',
            },
            dsl: { type: 'object', description: '页面 DSL 内容' },
            dataset_bindings: {
              type: 'object',
              nullable: true,
              description: '数据集绑定配置',
            },
            preview_url: { type: 'string', nullable: true },
            status: {
              type: 'string',
              enum: ['draft', 'published'],
              description: '页面状态',
            },
            created_by: { type: 'string' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
        PageListItem: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            type: { type: 'string', enum: ['visualization', 'form', 'report'] },
            status: { type: 'string', enum: ['draft', 'published'] },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
        CreatePageRequest: {
          type: 'object',
          required: ['name', 'type'],
          properties: {
            name: { type: 'string', example: '销售大屏' },
            type: {
              type: 'string',
              enum: ['visualization', 'form', 'report'],
              example: 'visualization',
            },
            dsl: { type: 'object', description: '页面 DSL' },
            dataset_bindings: { type: 'object' },
            preview_url: { type: 'string' },
            status: {
              type: 'string',
              enum: ['draft', 'published'],
              default: 'draft',
            },
          },
        },
        UpdatePageRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            type: { type: 'string', enum: ['visualization', 'form', 'report'] },
            dsl: { type: 'object' },
            dataset_bindings: { type: 'object' },
            preview_url: { type: 'string', nullable: true },
            status: { type: 'string', enum: ['draft', 'published'] },
          },
        },
        NewPageListResponse: {
          type: 'object',
          properties: {
            success: { type: 'boolean' },
            data: { type: 'array', items: { $ref: '#/components/schemas/NewPage' } },
            total: { type: 'integer' },
            message: { type: 'string' },
          },
        },
        MenuTreeNode: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            application_id: { type: 'string' },
            page_id: { type: 'string', nullable: true },
            parent_id: { type: 'string', nullable: true },
            menu_title: { type: 'string' },
            menu_icon: { type: 'string', nullable: true },
            route_path: { type: 'string', nullable: true },
            sort_order: { type: 'integer' },
            isFolder: { type: 'boolean' },
            page: {
              type: 'object',
              nullable: true,
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
                type: { type: 'string' },
                status: { type: 'string' },
              },
            },
            children: {
              type: 'array',
              items: { $ref: '#/components/schemas/MenuTreeNode' },
            },
          },
        },
        CreateMenuRequest: {
          type: 'object',
          required: ['page_id', 'menu_title'],
          properties: {
            page_id: { type: 'string' },
            parent_id: { type: 'string', nullable: true },
            menu_title: { type: 'string', example: '销售大屏' },
            menu_icon: { type: 'string' },
            route_path: { type: 'string', example: '/dashboard' },
            permission: { type: 'string' },
            sort_order: { type: 'integer' },
          },
        },
        DatasetFieldType: {
          type: 'string',
          enum: ['text', 'number', 'datetime'],
          description: '字段类型：文本、数值、时间',
        },
        DatasetFieldInput: {
          type: 'object',
          required: ['name', 'field_type'],
          properties: {
            name: { type: 'string', maxLength: 200 },
            field_type: { $ref: '#/components/schemas/DatasetFieldType' },
            sort_order: { type: 'integer' },
          },
        },
        DatasetField: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            dataset_id: { type: 'string' },
            name: { type: 'string' },
            field_type: { $ref: '#/components/schemas/DatasetFieldType' },
            sort_order: { type: 'integer' },
            created_at: { type: 'string' },
          },
        },
        DatasetFolder: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            parent_id: { type: 'string', nullable: true },
            project_id: { type: 'string', nullable: true },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            owner_id: { type: 'string' },
            sort_order: { type: 'integer' },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
        DatasetFolderDetail: {
          allOf: [
            { $ref: '#/components/schemas/DatasetFolder' },
            {
              type: 'object',
              properties: {
                child_folder_count: { type: 'integer' },
                dataset_count: { type: 'integer' },
              },
            },
          ],
        },
        DatasetFolderTreeNode: {
          allOf: [
            { $ref: '#/components/schemas/DatasetFolder' },
            {
              type: 'object',
              properties: {
                children: {
                  type: 'array',
                  items: { $ref: '#/components/schemas/DatasetFolderTreeNode' },
                },
              },
            },
          ],
        },
        DatasetCore: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            file_path: { type: 'string', nullable: true },
            file_size: { type: 'integer', nullable: true },
            owner_id: { type: 'string' },
            project_id: { type: 'string', nullable: true },
            folder_id: { type: 'string', nullable: true },
            created_at: { type: 'string' },
            updated_at: { type: 'string' },
          },
        },
        DatasetDetail: {
          allOf: [
            { $ref: '#/components/schemas/DatasetCore' },
            {
              type: 'object',
              properties: {
                fields: { type: 'array', items: { $ref: '#/components/schemas/DatasetField' } },
                row_count: { type: 'integer' },
              },
            },
          ],
        },
        DatasetListItem: {
          allOf: [
            { $ref: '#/components/schemas/DatasetCore' },
            {
              type: 'object',
              properties: {
                field_count: { type: 'integer' },
                row_count: { type: 'integer' },
              },
            },
          ],
        },
        DatasetRow: {
          type: 'object',
          properties: {
            id: { type: 'string' },
            dataset_id: { type: 'string' },
            sort_order: { type: 'integer' },
            values: {
              type: 'object',
              additionalProperties: { nullable: true },
              description: 'key 为字段 id（字符串），值为 text/number/null；datetime 为 ISO 字符串',
            },
            created_at: { type: 'string' },
          },
        },
        CreateDatasetRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            project_id: { type: 'string', nullable: true },
            folder_id: { type: 'string', nullable: true },
            fields: { type: 'array', items: { $ref: '#/components/schemas/DatasetFieldInput' } },
          },
        },
        CreateFolderRequest: {
          type: 'object',
          required: ['name'],
          properties: {
            name: { type: 'string' },
            description: { type: 'string', nullable: true },
            parent_id: { type: 'string', nullable: true },
            project_id: { type: 'string', nullable: true },
            sort_order: { type: 'integer' },
          },
        },
        RowCreateRequest: {
          type: 'object',
          required: ['values'],
          properties: {
            values: {
              type: 'object',
              additionalProperties: { nullable: true },
              description: 'key 为字段 id 字符串',
            },
            sort_order: { type: 'integer' },
          },
        },
      },
    },
    paths: {
      '/health': {
        get: {
          tags: ['Health'],
          summary: '健康检查',
          responses: {
            '200': {
              description: '服务正常',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      status: { type: 'string', example: 'OK' },
                      timestamp: { type: 'string' },
                      uptime: { type: 'number' },
                      version: { type: 'string' },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1': {
        get: {
          tags: ['API'],
          summary: 'API 根信息',
          responses: {
            '200': {
              description: '版本与端点列表',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: { type: 'string' },
                      version: { type: 'string' },
                      timestamp: { type: 'string' },
                      endpoints: { type: 'array', items: { type: 'string' } },
                    },
                  },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/login': {
        post: {
          tags: ['Auth'],
          summary: '登录',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/LoginRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: '登录成功',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/LoginSuccess' } },
              },
            },
            '400': {
              description: '参数缺失（未提供 account/email 或 password）',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
            '401': {
              description: '认证失败',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/LoginFailure' } },
              },
            },
            '500': {
              description: '服务器错误',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/users': {
        get: {
          tags: ['Users'],
          summary: '用户列表',
          description: '需管理员 JWT。',
          security: [{ bearerAuth: [] }],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/UserListResponse' } },
              },
            },
            '401': {
              description: '未登录或 token 无效',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
            '403': {
              description: '非管理员',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
            '500': {
              description: '服务器错误',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorSuccessFalse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/users/{id}/reset-password': {
        post: {
          tags: ['Users'],
          summary: '重置用户密码',
          description: '需管理员 JWT。',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
              description: '用户 ID',
            },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/ResetPasswordRequest' },
              },
            },
          },
          responses: {
            '200': {
              description: '重置成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ResetPasswordSuccess' },
                },
              },
            },
            '400': {
              description: 'ID 无效或密码不符合要求',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorSuccessFalse' },
                },
              },
            },
            '401': {
              description: '未登录或 token 无效',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
            '403': {
              description: '非管理员',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
            '404': {
              description: '用户不存在',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorSuccessFalse' },
                },
              },
            },
            '500': {
              description: '服务器错误',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/ApiErrorSuccessFalse' },
                },
              },
            },
          },
        },
      },
      '/api/v1/auth/register': {
        post: {
          tags: ['Auth'],
          summary: '注册并返回登录态',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: { $ref: '#/components/schemas/RegisterRequest' },
              },
            },
          },
          responses: {
            '201': {
              description: '注册成功（含 token）',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/LoginSuccess' } },
              },
            },
            '400': {
              description: '参数缺失',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
            '409': {
              description: '邮箱已注册',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
            '500': {
              description: '服务器错误',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/lowcode/pages': {
        get: {
          tags: ['Lowcode'],
          summary: '获取全部页面',
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/PageListResponse' } },
              },
            },
          },
        },
        post: {
          tags: ['Lowcode'],
          summary: '创建页面',
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/PageInput' } },
            },
          },
          responses: {
            '201': {
              description: '创建成功',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/PageSingleResponse' } },
              },
            },
            '400': {
              description: '校验失败',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ZodErrorDetail' } },
              },
            },
            '500': {
              description: '服务器错误',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/lowcode/pages/{id}': {
        put: {
          tags: ['Lowcode'],
          summary: '更新页面（部分字段）',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    components: { type: 'array', items: {} },
                    settings: { type: 'object', additionalProperties: true },
                  },
                },
              },
            },
          },
          responses: {
            '200': {
              description: '更新成功',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/PageSingleResponse' } },
              },
            },
            '400': {
              description: '校验失败',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ZodErrorDetail' } },
              },
            },
            '404': {
              description: '页面不存在',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
            '500': {
              description: '服务器错误',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        delete: {
          tags: ['Lowcode'],
          summary: '删除页面',
          parameters: [
            {
              name: 'id',
              in: 'path',
              required: true,
              schema: { type: 'string' },
            },
          ],
          responses: {
            '200': {
              description: '删除成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '404': {
              description: '页面不存在',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/datasets/folders/tree': {
        get: {
          tags: ['Datasets'],
          summary: '数据集目录树',
          description: '按文件夹嵌套返回整棵树。可选 `projectId` 筛选项目。',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'projectId',
              in: 'query',
              schema: { type: 'string' },
              description: '可选，按项目筛选；不传则包含所有归属当前用户的目录',
            },
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/DatasetFolderTreeNode' },
                      },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/datasets/folders': {
        get: {
          tags: ['Datasets'],
          summary: '子目录列表或扁平列表',
          description:
            '默认返回根下子目录（`parentId` 省略或 `null`）。`all=true` 时返回扁平列表。可选 `projectId`。',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'projectId', in: 'query', schema: { type: 'string' } },
            { name: 'parentId', in: 'query', schema: { type: 'string', nullable: true } },
            { name: 'all', in: 'query', schema: { type: 'string', enum: ['1', 'true'] } },
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/DatasetFolder' },
                      },
                      total: { type: 'integer' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        post: {
          tags: ['Datasets'],
          summary: '创建目录',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateFolderRequest' } },
            },
          },
          responses: {
            '201': { description: '已创建' },
            '400': {
              description: '校验失败',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ZodErrorDetail' } },
              },
            },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/datasets/folders/{folderId}': {
        get: {
          tags: ['Datasets'],
          summary: '目录详情',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'folderId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/DatasetFolderDetail' },
                    },
                  },
                },
              },
            },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        put: {
          tags: ['Datasets'],
          summary: '更新目录',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'folderId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateFolderRequest' } },
            },
          },
          responses: {
            '200': { description: '成功' },
            '400': { description: '校验失败' },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        delete: {
          tags: ['Datasets'],
          summary: '删除目录（须为空）',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'folderId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: '已删除' },
            '409': { description: '目录非空' },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/datasets': {
        get: {
          tags: ['Datasets'],
          summary: '数据集列表',
          description: '可选 `projectId`、`folderId`（`folderId=null` 表示未归类）。',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'projectId', in: 'query', schema: { type: 'string' } },
            { name: 'folderId', in: 'query', schema: { type: 'string', nullable: true } },
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: {
                        type: 'array',
                        items: { $ref: '#/components/schemas/DatasetListItem' },
                      },
                      total: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        post: {
          tags: ['Datasets'],
          summary: '创建数据集（含字段定义）',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateDatasetRequest' } },
            },
          },
          responses: {
            '201': {
              description: '已创建',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/DatasetDetail' },
                    },
                  },
                },
              },
            },
            '400': { description: '校验失败' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/datasets/{id}': {
        get: {
          tags: ['Datasets'],
          summary: '数据集详情',
          description: '含字段列表与行数。',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/DatasetDetail' },
                    },
                  },
                },
              },
            },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        put: {
          tags: ['Datasets'],
          summary: '更新数据集',
          description: '若传 `fields` 且已有数据行则返回 409。',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    name: { type: 'string' },
                    description: { type: 'string', nullable: true },
                    project_id: { type: 'string', nullable: true },
                    folder_id: { type: 'string', nullable: true },
                    fields: {
                      type: 'array',
                      items: { $ref: '#/components/schemas/DatasetFieldInput' },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: '成功' },
            '409': { description: '有数据时不可改字段' },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        delete: {
          tags: ['Datasets'],
          summary: '删除数据集',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: '已删除' },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/datasets/{datasetId}/rows': {
        get: {
          tags: ['Datasets'],
          summary: '分页查询数据行',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'datasetId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/DatasetRow' } },
                      total: { type: 'integer' },
                      page: { type: 'integer' },
                      pageSize: { type: 'integer' },
                    },
                  },
                },
              },
            },
            '404': { description: '数据集不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        post: {
          tags: ['Datasets'],
          summary: '新增一行',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'datasetId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/RowCreateRequest' } },
            },
          },
          responses: {
            '201': { description: '已添加' },
            '400': { description: '值与字段类型不符' },
            '404': { description: '数据集不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/datasets/{datasetId}/rows/{rowId}': {
        delete: {
          tags: ['Datasets'],
          summary: '删除一行',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'datasetId', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'rowId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: '已删除' },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      // ==================== Pages API ====================
      '/api/v1/pages': {
        get: {
          tags: ['Pages'],
          summary: '页面列表',
          description: '支持按类型、状态、关键词筛选。',
          security: [{ bearerAuth: [] }],
          parameters: [
            {
              name: 'type',
              in: 'query',
              schema: { type: 'string', enum: ['visualization', 'form', 'report'] },
            },
            {
              name: 'status',
              in: 'query',
              schema: { type: 'string', enum: ['draft', 'published'] },
            },
            { name: 'keyword', in: 'query', schema: { type: 'string' } },
            { name: 'page', in: 'query', schema: { type: 'integer', default: 1 } },
            { name: 'pageSize', in: 'query', schema: { type: 'integer', default: 20 } },
          ],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: { $ref: '#/components/schemas/NewPageListResponse' },
                },
              },
            },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        post: {
          tags: ['Pages'],
          summary: '创建页面',
          security: [{ bearerAuth: [] }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreatePageRequest' } },
            },
          },
          responses: {
            '201': {
              description: '已创建',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/NewPage' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '400': {
              description: '校验失败',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ZodErrorDetail' } },
              },
            },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/pages/{id}': {
        get: {
          tags: ['Pages'],
          summary: '页面详情',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: '成功',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { $ref: '#/components/schemas/NewPage' },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        put: {
          tags: ['Pages'],
          summary: '更新页面',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/UpdatePageRequest' } },
            },
          },
          responses: {
            '200': { description: '成功' },
            '400': { description: '校验失败' },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        delete: {
          tags: ['Pages'],
          summary: '删除页面',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: '已删除' },
            '404': { description: '不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      // ==================== Assembly API ====================
      '/api/v1/applications/{id}/menus': {
        get: {
          tags: ['Assembly'],
          summary: '获取应用菜单树',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': {
              description: '菜单树',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      success: { type: 'boolean' },
                      data: { type: 'array', items: { $ref: '#/components/schemas/MenuTreeNode' } },
                      message: { type: 'string' },
                    },
                  },
                },
              },
            },
            '404': { description: '应用不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        post: {
          tags: ['Assembly'],
          summary: '挂载页面到应用菜单',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': { schema: { $ref: '#/components/schemas/CreateMenuRequest' } },
            },
          },
          responses: {
            '201': { description: '已挂载' },
            '400': { description: '校验失败' },
            '404': { description: '应用或页面不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/applications/{id}/menus/{menuId}': {
        put: {
          tags: ['Assembly'],
          summary: '更新菜单项',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'menuId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: '更新成功' },
            '400': { description: '校验失败' },
            '404': { description: '菜单项不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
        delete: {
          tags: ['Assembly'],
          summary: '移除菜单项',
          security: [{ bearerAuth: [] }],
          parameters: [
            { name: 'id', in: 'path', required: true, schema: { type: 'string' } },
            { name: 'menuId', in: 'path', required: true, schema: { type: 'string' } },
          ],
          responses: {
            '200': { description: '已移除' },
            '404': { description: '菜单项不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/applications/{id}/menus/sort': {
        patch: {
          tags: ['Assembly'],
          summary: '批量排序菜单',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                  properties: {
                    menus: {
                      type: 'array',
                      items: {
                        type: 'object',
                        properties: {
                          id: { type: 'string' },
                          parent_id: { type: 'string', nullable: true },
                          sort_order: { type: 'integer' },
                        },
                      },
                    },
                  },
                },
              },
            },
          },
          responses: {
            '200': { description: '排序成功' },
            '400': { description: '校验失败' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
      '/api/v1/applications/{id}/publish': {
        post: {
          tags: ['Assembly'],
          summary: '发布应用',
          description: '生成路由配置和访问链接。',
          security: [{ bearerAuth: [] }],
          parameters: [{ name: 'id', in: 'path', required: true, schema: { type: 'string' } }],
          responses: {
            '200': { description: '发布成功' },
            '404': { description: '应用不存在' },
            '401': {
              description: '未登录',
              content: {
                'application/json': { schema: { $ref: '#/components/schemas/ErrorBody' } },
              },
            },
          },
        },
      },
    },
  };
}
