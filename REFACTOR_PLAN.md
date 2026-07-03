---

# 📘 WellCube 低代码平台架构改造文档 V2.0

> **文档版本**：V2.0
> **创建日期**：2026-07-03
> **适用范围**：WellCube 低代码可视化开发平台
> **改造目标**：从"单页编辑器"升级为"独立产出 + 集中组装"的低代码平台

---

## 一、 改造目标（对标您的需求）

| 现有能力 (V1.0) | 改造后目标 (V2.0) |
| :--- | :--- |
| 页面只能在应用内部编辑，无法独立存在。 | **独立产出**：可视化页面、表单页面（CRUD）、报表页面可单独创建、保存、预览。 |
| 应用编辑器中混合了画布和菜单配置。 | **集中组装**：新增"应用组装"模块，将独立页面通过拖拽挂载到应用菜单树上。 |
| 页面类型单一（仅通用画布）。 | **分型设计**：针对大屏/图表、表单增删改查、复杂报表提供差异化的画布模式。 |

---

## 二、 项目原始架构回顾

### 2.1 技术栈概览

| 包 | 路径 | 技术栈 |
|---|---|---|
| **frontend** (`well-cube-frontend`) | `packages/frontend/` | Vue 3 + TypeScript + Vite + Element Plus + Vant + ECharts + VTable |
| **backend** (`backend`) | `packages/backend/` | Express + TypeScript + SQLite (better-sqlite3) |

### 2.2 前端核心模块

| 模块 | 路径 | 功能 |
|---|---|---|
| 可视化编辑器 | `src/visual-editor/` | 低代码编辑器核心（画布、组件库、属性面板、历史命令） |
| 组件物料库 | `src/packages/` | PC/移动端组件（base、container、form、chart） |
| 页面视图 | `src/views/` | 应用列表、应用编辑、数据集、数据连接、登录 |

### 2.3 后端数据模型

现有表：`users`, `roles`, `permission_rules`, `role_permissions`, `applications`, `dataset_folders`, `datasets`, `dataset_fields`, `dataset_rows`, `user_roles`

---

## 三、 第一步：数据库与后端实体改造（地基）

**涉及目录**：`packages/backend/src/models/`、`packages/backend/src/migrations/`

### 3.1 新建核心表：`pages`（独立页面表）

现有的 `applications` 表保留，但我们需要将页面抽离出来。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | string (uuid) | 页面唯一ID |
| `name` | string | 页面名称（如"销售大屏"） |
| `type` | enum | **核心**：`visualization`（可视化）, `form`（表单CRUD）, `report`（报表） |
| `dsl` | json | 页面内容数据结构（原 `AppEdit` 保存的 schema） |
| `dataset_bindings` | json | 页面依赖的数据集映射关系（读/写配置） |
| `preview_url` | string | 独立预览地址 |
| `status` | enum | `draft`（草稿）, `published`（已发布） |
| `created_by` | string | 创建人ID |
| `created_at` | datetime | 创建时间 |
| `updated_at` | datetime | 更新时间 |

#### SQL 建表语句（SQLite）

```sql
CREATE TABLE pages (
  id VARCHAR(36) PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  type VARCHAR(20) NOT NULL CHECK(type IN ('visualization', 'form', 'report')),
  dsl JSON,
  dataset_bindings JSON,
  preview_url VARCHAR(500),
  status VARCHAR(20) DEFAULT 'draft' CHECK(status IN ('draft', 'published')),
  created_by VARCHAR(36),
  created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
  updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
);
```

### 3.2 新建关联表：`app_page_menus`（应用菜单挂载表）

用于实现"将页面组装成应用"。

| 字段名 | 类型 | 说明 |
| :--- | :--- | :--- |
| `id` | string | 主键 |
| `application_id` | string | 关联 `applications` 表 |
| `page_id` | string | 关联 `pages` 表 |
| `parent_id` | string | **支持多级菜单**（父菜单ID，null为一级） |
| `menu_title` | string | 在应用里显示的名称（可覆盖页面原名） |
| `menu_icon` | string | 菜单图标 |
| `sort_order` | int | 排序权重 |
| `route_path` | string | 该页面在应用中的访问路径（如 `/dashboard`） |

#### SQL 建表语句（SQLite）

```sql
CREATE TABLE app_page_menus (
  id VARCHAR(36) PRIMARY KEY,
  application_id VARCHAR(36) NOT NULL,
  page_id VARCHAR(36) NOT NULL,
  parent_id VARCHAR(36),
  menu_title VARCHAR(255) NOT NULL,
  menu_icon VARCHAR(100),
  sort_order INT DEFAULT 0,
  route_path VARCHAR(500),
  FOREIGN KEY (application_id) REFERENCES applications(id) ON DELETE CASCADE,
  FOREIGN KEY (page_id) REFERENCES pages(id) ON DELETE CASCADE
);

CREATE INDEX idx_app_page_menus_app ON app_page_menus(application_id);
CREATE INDEX idx_app_page_menus_page ON app_page_menus(page_id);
```

### 3.3 后端 API 路由规划（需新增/修改）

| 模块 | Method | Endpoint | 功能 |
| :--- | :--- | :--- | :--- |
| **页面中心** | POST | `/api/v1/pages` | 新建独立页面（选择类型） |
| | GET | `/api/v1/pages` | 获取页面列表（支持 type 筛选） |
| | GET | `/api/v1/pages/:id` | 获取页面详情（含 DSL） |
| | PUT | `/api/v1/pages/:id` | 更新页面内容（保存画布数据） |
| | DELETE | `/api/v1/pages/:id` | 删除页面 |
| **应用组装** | GET | `/api/v1/applications/:id/menus` | 获取当前应用的菜单树（含挂载的页面） |
| | POST | `/api/v1/applications/:id/menus` | 挂载页面到应用菜单（传入 page_id） |
| | PUT | `/api/v1/applications/:id/menus/:menu_id` | 更新菜单项（标题、图标、路径） |
| | PATCH | `/api/v1/applications/:id/menus/sort` | 调整菜单层级/排序（拖拽后） |
| | DELETE | `/api/v1/applications/:id/menus/:menu_id` | 从应用中移除页面（不删除原页面） |
| | POST | `/api/v1/applications/:id/publish` | 发布应用（生成路由配置） |

### 3.4 后端目录结构新增

```text
packages/backend/src/
├── models/
│   ├── Page.ts                    # [★ 新建] 页面模型
│   └── AppPageMenu.ts             # [★ 新建] 应用菜单关联模型
├── controllers/
│   ├── pageController.ts          # [★ 新建] 页面CRUD控制器
│   └── assemblyController.ts      # [★ 新建] 应用组装控制器
├── routes/
│   ├── pageRoutes.ts              # [★ 新建] 页面路由
│   └── assemblyRoutes.ts          # [★ 新建] 组装路由
└── migrations/
    └── 001_add_pages_tables.sql   # [★ 新建] 迁移脚本
```

---

## 四、 第二步：前端路由与顶层菜单重构（入口）

**涉及目录**：`packages/frontend/src/router/index.ts`、`packages/frontend/src/layout/index.vue`

### 4.1 新增/调整路由表

```typescript
// router/index.ts 核心路由配置
const routes = [
  {
    path: '/',
    component: Layout,
    redirect: '/workspace',
    children: [
      // ========== 1. 工作台 ==========
      { 
        path: 'workspace', 
        component: () => import('@/views/workspace/index.vue') 
      },
      
      // ========== 2. 独立页面生产模块（核心改动） ==========
      { 
        path: 'visual-design', 
        component: () => import('@/views/page-factory/PageList.vue'),
        props: { type: 'visualization' } // 复用列表组件，筛选类型
      },
      { 
        path: 'form-design', 
        component: () => import('@/views/page-factory/PageList.vue'),
        props: { type: 'form' }
      },
      { 
        path: 'report-design', 
        component: () => import('@/views/page-factory/PageList.vue'),
        props: { type: 'report' }
      },
      
      // ========== 3. 独立的编辑器（不再依附于应用） ==========
      { 
        path: 'page-editor/:id', 
        component: () => import('@/views/page-factory/PageEditor.vue'),
        props: true
      },
      // 新建页面（无ID）
      { 
        path: 'page-editor/new/:type', 
        component: () => import('@/views/page-factory/PageEditor.vue'),
        props: true
      },
      
      // ========== 4. 应用组装模块（独立的拼装车间） ==========
      { 
        path: 'app-assembly', 
        component: () => import('@/views/app-assembly/AppList.vue') // 应用列表
      },
      { 
        path: 'app-assembly/:id', 
        component: () => import('@/views/app-assembly/AppAssemblyEditor.vue'), // 组装画布
        props: true 
      },
      
      // ========== 5. 原数据中枢保持不变 ==========
      { path: 'dataset', component: () => import('@/views/dataset/index.vue') },
      { path: 'connector', component: () => import('@/views/connector/index.vue') },
      
      // ========== 6. 应用预览（运行时） ==========
      { 
        path: 'app-preview/:id', 
        component: () => import('@/views/application/AppPreview.vue'),
        props: true 
      },
    ]
  },
  // 独立页面公开预览（无需登录，可选）
  {
    path: '/page-preview/:id',
    component: () => import('@/views/page-factory/PagePreview.vue'),
    props: true
  }
]
```

### 4.2 左侧主导航菜单（layout 改造）

根据最终确定的菜单方案，修改 `layout/index.vue` 的侧边栏：

| 一级菜单 | 图标（Element Plus） | 对应路径 | 权限说明 |
| :--- | :--- | :--- | :--- |
| **工作台** | House | /workspace | 全局概览 |
| **可视化设计** | Monitor | /visual-design | 独立生产大屏/图表 |
| **表单设计** | EditPen | /form-design | 独立生产增删改查页 |
| **报表设计** | DataLine | /report-design | 独立生产复杂报表 |
| **━━━━━━━━━** | — | — | 分割线 |
| **应用组装** | Grid | /app-assembly | **拼装核心**：将上述页面拖入菜单树 |
| **数据中枢** | Coin | /dataset | 底层数据集管理 |
| **连接管理** | Connection | /connector | 数据源连接配置 |

### 4.3 Layout 菜单代码示例

```vue
<!-- layout/index.vue 侧边栏核心代码 -->
<template>
  <el-aside :width="isCollapse ? '64px' : '220px'">
    <el-menu :default-active="activeMenu" :collapse="isCollapse">
      <!-- 工作台 -->
      <el-menu-item index="/workspace">
        <el-icon><House /></el-icon>
        <span>工作台</span>
      </el-menu-item>
      
      <!-- 生产车间组 -->
      <el-sub-menu index="design">
        <template #title>
          <el-icon><Edit /></el-icon>
          <span>页面设计</span>
        </template>
        <el-menu-item index="/visual-design">
          <el-icon><Monitor /></el-icon>
          <span>可视化设计</span>
        </el-menu-item>
        <el-menu-item index="/form-design">
          <el-icon><EditPen /></el-icon>
          <span>表单设计</span>
        </el-menu-item>
        <el-menu-item index="/report-design">
          <el-icon><DataLine /></el-icon>
          <span>报表设计</span>
        </el-menu-item>
      </el-sub-menu>
      
      <!-- 组装车间 -->
      <el-menu-item index="/app-assembly">
        <el-icon><Grid /></el-icon>
        <span>应用组装</span>
      </el-menu-item>
      
      <!-- 数据中枢 -->
      <el-menu-item index="/dataset">
        <el-icon><Coin /></el-icon>
        <span>数据中枢</span>
      </el-menu-item>
    </el-menu>
  </el-aside>
</template>
```

---

## 五、 第三步：改造"页面生产车间"（独立编辑器改造）

**涉及目录**：`packages/frontend/src/views/page-factory/`（新建）、`packages/frontend/src/visual-editor/`（复用）

### 5.1 新建页面列表页 `PageList.vue`

这是一个带 Tab 筛选的表格页，展示所有独立页面。

#### 功能点

- **Tab 切换**：全部 / 可视化 / 表单 / 报表
- **表格列**：页面名称、类型、状态（草稿/已发布）、创建时间、操作
- **操作按钮**：编辑、预览、删除、复制ID
- **新建按钮**：弹出对话框选择页面类型

#### 核心代码结构

```vue
<template>
  <div class="page-list">
    <!-- 顶部工具栏 -->
    <div class="toolbar">
      <el-tabs v-model="activeTab" @tab-change="fetchPages">
        <el-tab-pane label="全部" value="all" />
        <el-tab-pane label="可视化" value="visualization" />
        <el-tab-pane label="表单" value="form" />
        <el-tab-pane label="报表" value="report" />
      </el-tabs>
      <el-button type="primary" @click="showCreateDialog">
        <el-icon><Plus /></el-icon> 新建页面
      </el-button>
    </div>
    
    <!-- 表格 -->
    <el-table :data="pageList" v-loading="loading">
      <el-table-column prop="name" label="页面名称" />
      <el-table-column prop="type" label="类型">
        <template #default="{ row }">
          <el-tag :type="typeTagMap[row.type]">{{ typeLabelMap[row.type] }}</el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="status" label="状态">
        <template #default="{ row }">
          <el-tag :type="row.status === 'published' ? 'success' : 'info'">
            {{ row.status === 'published' ? '已发布' : '草稿' }}
          </el-tag>
        </template>
      </el-table-column>
      <el-table-column prop="created_at" label="创建时间" />
      <el-table-column label="操作" width="280" fixed="right">
        <template #default="{ row }">
          <el-button size="small" @click="editPage(row.id)">编辑</el-button>
          <el-button size="small" type="success" @click="previewPage(row.id)">预览</el-button>
          <el-button size="small" type="danger" @click="deletePage(row.id)">删除</el-button>
        </template>
      </el-table-column>
    </el-table>
    
    <!-- 新建对话框 -->
    <el-dialog v-model="dialogVisible" title="选择页面类型">
      <div class="type-cards">
        <el-card @click="createPage('visualization')">
          <el-icon><Monitor /></el-icon>
          <h3>可视化大屏</h3>
          <p>图表展示、数据看板、监控大屏</p>
        </el-card>
        <el-card @click="createPage('form')">
          <el-icon><EditPen /></el-icon>
          <h3>表单管理</h3>
          <p>数据录入、增删改查、列表展示</p>
        </el-card>
        <el-card @click="createPage('report')">
          <el-icon><DataLine /></el-icon>
          <h3>复杂报表</h3>
          <p>分组汇总、交叉表、导出打印</p>
        </el-card>
      </div>
    </el-dialog>
  </div>
</template>
```

### 5.2 改造编辑器 `PageEditor.vue`（重点）

利用已有的 `visual-editor` 核心，但根据 `page.type` 动态调整画布行为。

#### 布局结构

```vue
<template>
  <div class="page-editor" :data-mode="pageType">
    <!-- 顶部工具栏 -->
    <EditorToolbar :mode="pageType" @save="savePage" @preview="previewPage" />
    
    <div class="editor-body">
      <!-- 左侧组件库：根据类型过滤组件 -->
      <ComponentPanel :mode="pageType" />
      
      <!-- 中间画布 (复用原 visual-editor) -->
      <Canvas ref="canvasRef" :schema="pageDSL" @select="onComponentSelect" />
      
      <!-- 右侧属性面板 -->
      <PropsPanel :selected="selectedComponent" />
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { usePageStore } from '@/stores/pageStore';
import EditorToolbar from './components/EditorToolbar.vue';
import ComponentPanel from './components/ComponentPanel.vue';
import Canvas from '@/visual-editor/ui/canvas/index.vue';
import PropsPanel from '@/visual-editor/ui/props-panel/index.vue';

const route = useRoute();
const router = useRouter();
const pageStore = usePageStore();

const pageId = route.params.id as string;
const pageType = ref<'visualization' | 'form' | 'report'>('visualization');
const pageDSL = ref({});
const selectedComponent = ref(null);

// 根据类型加载不同的初始模板
const getDefaultSchema = (type: string) => {
  switch(type) {
    case 'visualization':
      return { 
        layout: 'free', 
        components: [] 
      };
    case 'form':
      return { 
        layout: 'flow', 
        components: ['query-form', 'data-table', 'pagination'],
        crudConfig: { enableAdd: true, enableEdit: true, enableDelete: true }
      };
    case 'report':
      return { 
        layout: 'grid', 
        rows: [], 
        columns: [], 
        aggregates: [] 
      };
    default:
      return { components: [] };
  }
};

// 加载页面数据
const loadPage = async () => {
  if (pageId === 'new') {
    // 新建模式
    pageType.value = route.params.type as any;
    pageDSL.value = getDefaultSchema(pageType.value);
    return;
  }
  
  const page = await pageStore.loadPage(pageId);
  pageType.value = page.type;
  pageDSL.value = page.dsl || getDefaultSchema(page.type);
};

// 保存页面
const savePage = async () => {
  const dsl = canvasRef.value?.exportSchema();
  await pageStore.savePage({
    id: pageId === 'new' ? undefined : pageId,
    name: pageName.value,
    type: pageType.value,
    dsl,
    status: 'draft'
  });
  ElMessage.success('保存成功');
};

onMounted(loadPage);
</script>

<style scoped>
.page-editor {
  display: flex;
  flex-direction: column;
  height: 100vh;
  background: #f5f7fa;
}

.editor-body {
  display: flex;
  flex: 1;
  overflow: hidden;
}
</style>
```

### 5.3 组件库根据类型过滤

在 `ComponentPanel.vue` 中实现：

```typescript
// components/ComponentPanel.vue
const componentGroups = computed(() => {
  const allGroups = {
    visualization: ['布局组件', '图表组件', '指标卡', '文本组件'],
    form: ['布局组件', '输入组件', '选择组件', '表格组件', '操作按钮'],
    report: ['布局组件', '表格组件', '汇总组件', '导出组件']
  };
  
  return allGroups[props.mode] || allGroups.form;
});
```

### 5.4 新建公开预览页面 `PagePreview.vue`

用于独立页面预览（无需登录）：

```vue
<template>
  <div class="page-preview">
    <DynamicRenderer :schema="pageDSL" />
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue';
import { useRoute } from 'vue-router';
import { getPage } from '@/api/pages';
import DynamicRenderer from '@/visual-editor/renderer/index.vue';

const route = useRoute();
const pageDSL = ref({});

onMounted(async () => {
  const { data } = await getPage(route.params.id as string);
  pageDSL.value = data.dsl;
});
</script>
```

---

## 六、 第四步：实现"应用组装车间"（核心拼装功能）

**涉及目录**：`packages/frontend/src/views/app-assembly/`（新建）

### 6.1 界面布局设计

`AppAssemblyEditor.vue` 布局分为左、中、右三栏：

| 区域 | 宽度 | 内容 | 交互逻辑 |
| :--- | :--- | :--- | :--- |
| **左侧（页面仓库）** | 280px | 展示所有已发布的独立页面列表（可视化/表单/报表），带搜索和类型筛选。 | **可拖拽**。用户拖拽列表中的任意页面到中间区域。 |
| **中间（组装树）** | 弹性 | 当前应用的菜单树（使用 `el-tree` 或 `vuedraggable-tree`）。支持新建空目录（分组）。 | **放置区**。拖入的页面成为菜单节点。支持拖拽调整层级（一级/二级）。点击节点可重命名菜单标题。 |
| **右侧（配置面板）** | 320px | 点击菜单节点后的属性设置。 | 配置路由路径（`/path`）、权限标识（`role: admin`）、是否缓存页面等。 |

### 6.2 核心代码结构

```vue
<template>
  <div class="assembly-editor">
    <!-- 顶部工具栏 -->
    <div class="assembly-toolbar">
      <el-button @click="goBack"><el-icon><ArrowLeft /></el-icon> 返回</el-button>
      <span class="app-title">{{ appInfo.name }} - 应用组装</span>
      <el-button type="primary" @click="handlePublish">
        <el-icon><Upload /></el-icon> 发布应用
      </el-button>
    </div>
    
    <!-- 三栏布局 -->
    <div class="assembly-body">
      <!-- 左：页面仓库 -->
      <div class="page-repo">
        <div class="repo-header">
          <el-input v-model="searchKeyword" placeholder="搜索页面..." prefix-icon="Search" />
          <el-select v-model="typeFilter" placeholder="类型" size="small">
            <el-option label="全部" value="all" />
            <el-option label="可视化" value="visualization" />
            <el-option label="表单" value="form" />
            <el-option label="报表" value="report" />
          </el-select>
        </div>
        <div class="page-list">
          <div 
            v-for="page in filteredPages" 
            :key="page.id"
            class="page-item"
            draggable="true"
            @dragstart="onDragStart($event, page)"
          >
            <el-icon><component :is="typeIconMap[page.type]" /></el-icon>
            <span>{{ page.name }}</span>
            <el-tag size="small">{{ typeLabelMap[page.type] }}</el-tag>
          </div>
        </div>
      </div>
      
      <!-- 中：菜单树组装区 -->
      <div class="menu-tree-area">
        <div class="tree-header">
          <span>菜单结构</span>
          <el-button size="small" @click="addFolder">新建目录</el-button>
        </div>
        <div class="tree-container" @dragover.prevent @drop="onDrop">
          <el-tree
            ref="treeRef"
            :data="menuTree"
            :props="treeProps"
            node-key="id"
            default-expand-all
            draggable
            @node-drop="onNodeDrop"
          >
            <template #default="{ node, data }">
              <span class="tree-node">
                <el-icon v-if="data.isFolder"><Folder /></el-icon>
                <el-icon v-else><Document /></el-icon>
                <span @click="selectNode(data)">{{ data.menu_title || data.page?.name }}</span>
                <el-tag v-if="data.page?.type" size="small" :type="typeTagMap[data.page.type]">
                  {{ typeLabelMap[data.page.type] }}
                </el-tag>
              </span>
            </template>
          </el-tree>
        </div>
      </div>
      
      <!-- 右：配置面板 -->
      <div class="config-panel">
        <div v-if="selectedNode" class="panel-content">
          <h4>菜单配置</h4>
          <el-form label-width="80px">
            <el-form-item label="显示名称">
              <el-input v-model="selectedNode.menu_title" @change="updateMenu" />
            </el-form-item>
            <el-form-item label="路由路径">
              <el-input v-model="selectedNode.route_path" @change="updateMenu">
                <template #prepend>/</template>
              </el-input>
            </el-form-item>
            <el-form-item label="菜单图标">
              <el-input v-model="selectedNode.menu_icon" @change="updateMenu" />
            </el-form-item>
            <el-form-item label="权限标识">
              <el-input v-model="selectedNode.permission" placeholder="如: admin" />
            </el-form-item>
          </el-form>
          <el-button type="danger" size="small" @click="removeMenu(selectedNode.id)">
            从菜单移除
          </el-button>
        </div>
        <div v-else class="panel-empty">
          <el-empty description="点击菜单节点进行配置" />
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue';
import { useRoute, useRouter } from 'vue-router';
import { ElMessage } from 'element-plus';
import { useAssemblyStore } from '@/stores/assemblyStore';

const route = useRoute();
const router = useRouter();
const assemblyStore = useAssemblyStore();

const appId = route.params.id as string;
const appInfo = ref({ name: '' });
const searchKeyword = ref('');
const typeFilter = ref('all');
const selectedNode = ref(null);

// 获取可用页面列表（已发布的独立页面）
const availablePages = ref([]);

// 获取当前应用的菜单树
const menuTree = ref([]);

// 拖拽逻辑
const onDragStart = (e, page) => {
  e.dataTransfer.setData('pageId', page.id);
  e.dataTransfer.setData('pageName', page.name);
  e.dataTransfer.setData('pageType', page.type);
};

const onDrop = async (e) => {
  const pageId = e.dataTransfer.getData('pageId');
  const pageName = e.dataTransfer.getData('pageName');
  const pageType = e.dataTransfer.getData('pageType');
  
  if (!pageId) return;
  
  await assemblyStore.addMenu({
    application_id: appId,
    page_id: pageId,
    menu_title: pageName,
    route_path: `/${pageType}/${pageId.substring(0, 8)}`
  });
  
  await loadMenuTree();
  ElMessage.success(`已添加页面: ${pageName}`);
};

// 发布应用
const handlePublish = async () => {
  await assemblyStore.publishApp(appId);
  ElMessage.success('应用发布成功！');
};

onMounted(async () => {
  await loadAppInfo();
  await loadAvailablePages();
  await loadMenuTree();
});
</script>
```

### 6.3 运行时渲染引擎（预览/生产）

改造 `views/application/AppPreview.vue`，根据菜单树动态加载页面：

```vue
<template>
  <div class="app-preview">
    <!-- 侧边栏 -->
    <el-aside width="220px">
      <el-menu :default-active="activePath" @select="navigateTo">
        <template v-for="menu in menuTree" :key="menu.id">
          <el-menu-item v-if="!menu.children" :index="menu.route_path">
            <el-icon><component :is="menu.menu_icon || 'Document'" /></el-icon>
            <span>{{ menu.menu_title }}</span>
          </el-menu-item>
          <el-sub-menu v-else :index="menu.id">
            <template #title>
              <el-icon><Folder /></el-icon>
              <span>{{ menu.menu_title }}</span>
            </template>
            <el-menu-item v-for="child in menu.children" :key="child.id" :index="child.route_path">
              {{ child.menu_title }}
            </el-menu-item>
          </el-sub-menu>
        </template>
      </el-menu>
    </el-aside>
    
    <!-- 内容区：动态渲染选中的页面 -->
    <el-main>
      <DynamicRenderer :page-id="currentPageId" :schema="currentPageDSL" />
    </el-main>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, watch } from 'vue';
import { useRoute } from 'vue-router';
import { getAppMenus } from '@/api/assembly';
import { getPage } from '@/api/pages';
import DynamicRenderer from '@/visual-editor/renderer/index.vue';

const route = useRoute();
const appId = route.params.id as string;
const menuTree = ref([]);
const currentPageId = ref('');
const currentPageDSL = ref({});

// 根据路由路径查找对应的页面ID
const navigateTo = async (path: string) => {
  const menu = findMenuByPath(menuTree.value, path);
  if (menu?.page_id) {
    currentPageId.value = menu.page_id;
    const { data } = await getPage(menu.page_id);
    currentPageDSL.value = data.dsl;
  }
};

onMounted(async () => {
  const { data } = await getAppMenus(appId);
  menuTree.value = data;
  // 默认加载第一个页面
  if (data.length > 0) {
    const firstMenu = findFirstLeaf(data);
    if (firstMenu) {
      navigateTo(firstMenu.route_path);
    }
  }
});
</script>
```

---

## 七、 第五步：状态管理（Store）改造

**涉及目录**：`packages/frontend/src/stores/`

### 7.1 新增 `pageStore.ts`

管理当前编辑的独立页面数据。

```typescript
// stores/pageStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getPage, updatePage, createPage } from '@/api/pages';

export const usePageStore = defineStore('page', () => {
  const currentPage = ref(null);
  const pageList = ref([]);
  
  const loadPage = async (id: string) => {
    const { data } = await getPage(id);
    currentPage.value = data;
    return data;
  };
  
  const savePage = async (params: any) => {
    if (params.id) {
      const { data } = await updatePage(params.id, params);
      currentPage.value = data;
      return data;
    } else {
      const { data } = await createPage(params);
      currentPage.value = data;
      return data;
    }
  };
  
  const fetchPages = async (type?: string) => {
    const { data } = await getPages({ type });
    pageList.value = data;
    return data;
  };
  
  return { currentPage, pageList, loadPage, savePage, fetchPages };
});
```

### 7.2 新增 `assemblyStore.ts`

管理应用组装状态。

```typescript
// stores/assemblyStore.ts
import { defineStore } from 'pinia';
import { ref } from 'vue';
import { 
  getAppMenus, 
  addMenu, 
  updateMenu, 
  removeMenu, 
  sortMenus,
  publishApp 
} from '@/api/assembly';

export const useAssemblyStore = defineStore('assembly', () => {
  const menuTree = ref([]);
  const currentAppId = ref('');
  
  const loadMenus = async (appId: string) => {
    const { data } = await getAppMenus(appId);
    menuTree.value = data;
    currentAppId.value = appId;
    return data;
  };
  
  const addMenu = async (params: any) => {
    const { data } = await addMenu(params);
    return data;
  };
  
  const updateMenu = async (menuId: string, params: any) => {
    const { data } = await updateMenu(menuId, params);
    return data;
  };
  
  const removeMenu = async (menuId: string) => {
    await removeMenu(menuId);
    await loadMenus(currentAppId.value);
  };
  
  const publishApp = async (appId: string) => {
    const { data } = await publishApp(appId);
    return data;
  };
  
  return { 
    menuTree, 
    currentAppId, 
    loadMenus, 
    addMenu, 
    updateMenu, 
    removeMenu, 
    publishApp 
  };
});
```

---

## 八、 第六步：目录结构调整清单（给开发人员的具体指令）

请按照以下目录结构新建/调整文件：

```text
packages/frontend/src/
├── views/
│   ├── workspace/                    # [保留] 工作台
│   │   └── index.vue
│   ├── dataset/                      # [保留] 数据中枢
│   │   └── index.vue
│   ├── connector/                    # [保留] 连接管理
│   │   └── index.vue
│   ├── page-factory/                 # [★ 新建] 独立页面生产车间
│   │   ├── PageList.vue              # 列表页（含Tab筛选可视化/表单/报表）
│   │   ├── PageEditor.vue            # 独立编辑器（根据type切换模式）
│   │   ├── PagePreview.vue           # 独立页面公开预览
│   │   └── components/               # 编辑器子组件
│   │       ├── EditorToolbar.vue     # 顶部工具栏（根据模式切换）
│   │       ├── ComponentPanel.vue    # 左侧组件库（根据模式过滤）
│   │       └── ModeSwitch.vue        # 模式切换控件
│   ├── app-assembly/                 # [★ 新建] 应用组装车间
│   │   ├── AppList.vue               # 应用列表
│   │   └── AppAssemblyEditor.vue     # 核心：拖拽拼装页面
│   └── application/                  # [保留/改造]
│       ├── AppEdit.vue               # [可废弃/保留兼容]
│       └── AppPreview.vue            # 修改为动态路由渲染器
├── stores/
│   ├── pageStore.ts                  # [★ 新建] 独立页面状态
│   └── assemblyStore.ts              # [★ 新建] 应用组装状态
├── api/
│   ├── pages.ts                      # [★ 新建] 独立页面API
│   └── assembly.ts                   # [★ 新建] 应用组装API
└── visual-editor/
    ├── renderer/                     # [★ 新建] 无画布渲染器（用于预览）
    │   └── index.vue
    └── ... (其余保持不变)
```

---

## 九、 实施优先级（MVP渐进路线）

为了避免大规模重构带来的风险，建议按以下顺序推进：

### 第一阶段：数据库与后端（Week 1）

- [ ] 执行数据库迁移，新建 `pages` 和 `app_page_menus` 表
- [ ] 实现 `pages` 表的 CRUD API
- [ ] 实现 `app_page_menus` 表的关联操作 API
- [ ] 单元测试覆盖核心接口

### 第二阶段：页面解耦（Week 2）

- [ ] 将原有的 `AppEdit.vue` 逻辑复制提炼为 `PageEditor.vue`
- [ ] 使其保存数据到 `pages` 表而非应用下
- [ ] 实现 `PageList.vue` 列表页
- [ ] 此阶段先支持"可视化"类型

### 第三阶段：左侧菜单改造（Week 2-3）

- [ ] 修改 Layout，将"应用管理"替换为新菜单结构
- [ ] 确保菜单切换时页面不报错
- [ ] 配置路由守卫和权限

### 第四阶段：组装核心（Week 3）

- [ ] 实现 `AppAssemblyEditor.vue`
- [ ] 支持拖拽左侧独立页面到右侧菜单树
- [ ] 支持保存关联关系
- [ ] 支持菜单层级拖拽调整

### 第五阶段：运行时渲染（Week 4）

- [ ] 改造 `AppPreview.vue`
- [ ] 使其根据菜单树和 `page.dsl` 动态渲染
- [ ] 实现真正的"组装上线"
- [ ] 联调测试

---

## 十、 API 接口详细定义

### 10.1 页面中心 API

#### POST `/api/v1/pages` - 创建页面

**Request Body:**
```json
{
  "name": "销售大屏",
  "type": "visualization",
  "dsl": {},
  "dataset_bindings": {}
}
```

**Response:**
```json
{
  "code": 0,
  "data": {
    "id": "page_xxx",
    "name": "销售大屏",
    "type": "visualization",
    "status": "draft",
    "created_at": "2026-07-03T10:00:00Z"
  }
}
```

#### GET `/api/v1/pages` - 获取页面列表

**Query Params:**
| 参数 | 类型 | 必填 | 说明 |
| :--- | :--- | :--- | :--- |
| type | string | 否 | 筛选类型：visualization / form / report |
| status | string | 否 | 筛选状态：draft / published |
| keyword | string | 否 | 搜索关键词 |
| page | number | 否 | 页码，默认1 |
| pageSize | number | 否 | 每页数量，默认20 |

#### PUT `/api/v1/pages/:id` - 更新页面

**Request Body:**
```json
{
  "name": "销售大屏 V2",
  "dsl": { ... },
  "dataset_bindings": { ... },
  "status": "published"
}
```

### 10.2 应用组装 API

#### GET `/api/v1/applications/:id/menus` - 获取应用菜单树

**Response:**
```json
{
  "code": 0,
  "data": [
    {
      "id": "menu_1",
      "menu_title": "首页",
      "route_path": "/dashboard",
      "menu_icon": "Monitor",
      "sort_order": 0,
      "page": {
        "id": "page_xxx",
        "name": "销售大屏",
        "type": "visualization"
      },
      "children": []
    },
    {
      "id": "menu_2",
      "menu_title": "业务管理",
      "isFolder": true,
      "sort_order": 1,
      "children": [
        {
          "id": "menu_3",
          "menu_title": "客户列表",
          "route_path": "/customer/list",
          "page": {
            "id": "page_yyy",
            "name": "客户管理",
            "type": "form"
          }
        }
      ]
    }
  ]
}
```

#### POST `/api/v1/applications/:id/menus` - 挂载页面到应用

**Request Body:**
```json
{
  "page_id": "page_xxx",
  "parent_id": null,
  "menu_title": "销售大屏",
  "route_path": "/dashboard",
  "menu_icon": "Monitor"
}
```

#### PATCH `/api/v1/applications/:id/menus/sort` - 调整菜单排序/层级

**Request Body:**
```json
{
  "menus": [
    { "id": "menu_1", "parent_id": null, "sort_order": 0 },
    { "id": "menu_2", "parent_id": null, "sort_order": 1 },
    { "id": "menu_3", "parent_id": "menu_2", "sort_order": 0 }
  ]
}
```

#### POST `/api/v1/applications/:id/publish` - 发布应用

**Response:**
```json
{
  "code": 0,
  "data": {
    "published_at": "2026-07-03T10:00:00Z",
    "version": "v1.0.0",
    "preview_url": "/app-preview/xxx"
  }
}
```

---

## 十一、 附录：完整用户操作流程

### 场景：搭建一个"销售管理系统"

#### Step 1: 生产独立页面

1. **设计师**登录系统
2. 点击左侧菜单 **可视化设计**
3. 点击 **新建页面** → 选择 **可视化大屏**
4. 拖拽图表组件，绑定"销售数据集"
5. 点击 **保存** → 命名为"销售数据看板" → 状态：草稿
6. 点击 **发布** → 状态变为：已发布

#### Step 2: 重复生产更多页面

7. 点击 **表单设计** → 新建"客户管理"（自动生成 CRUD）
8. 绑定"客户数据集"，配置查询字段、表格列、新增/编辑弹窗
9. 保存并发布
10. 点击 **报表设计** → 新建"月度业绩汇总"
11. 配置行/列/汇总字段，保存并发布

#### Step 3: 组装成应用

12. 点击 **应用组装** → 点击 **新建应用** → 命名为"销售管理系统"
13. 进入应用组装画布
14. **左侧**页面仓库中看到三个已发布的页面
15. **拖拽**"销售数据看板"到中间菜单树 → 成为一级菜单"首页分析"
16. **拖拽**"客户管理"到菜单树 → 成为一级菜单"业务管理"下的子菜单
17. **拖拽**"月度业绩汇总"到菜单树 → 成为"业务管理"下的另一个子菜单
18. 点击"首页分析"节点，右侧配置路由路径为 `/dashboard`
19. 点击 **发布应用**

#### Step 4: 访问正式系统

20. 系统生成访问链接：`https://xxx.com/app/xxx`
21. 用户访问后看到左侧菜单：
    - 首页分析 → 销售数据看板（可视化大屏）
    - 业务管理 → 客户管理（表单CRUD）
    - 业务管理 → 月度业绩汇总（复杂报表）

---

## 十二、 总结

| 改造前 | 改造后 |
| :--- | :--- |
| 页面捆绑在应用内 | 页面独立存在，可跨应用复用 |
| 单一画布模式 | 三种画布模式（可视化/表单/报表） |
| 菜单配置在代码中硬编码 | 菜单通过拖拽可视化组装 |
| 页面只能在一个应用中使用 | 同一页面可挂载到多个应用 |
| 发布=保存 | 发布=生成路由配置+动态渲染 |

---