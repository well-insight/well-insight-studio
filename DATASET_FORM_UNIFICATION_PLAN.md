# 数据集与表单设计统一开发文档

> 目标：将「数据集」与「表单设计」统一到一套可复用的字段、校验、转换与存储逻辑中。
> 适用范围：`packages/frontend`、`packages/backend`
> 当前状态：方案设计稿，可作为后续开发的实施基准。

---

## 1. 背景

当前项目里，数据集和表单设计已经分别具备基础能力：

- **数据集**：以“字段 + 行数据”为核心，适合结构化数据管理。
- **表单设计**：以“组件 + 布局 + 校验”为核心，适合业务录入和页面构建。

它们现在是两套相对独立的体系，但本质上都在描述同一件事：

> 如何定义一组字段，并让用户对这些字段进行录入、编辑、校验、展示和保存。

如果继续完全分离，后续会出现：

- 字段定义重复
- 类型映射重复
- 校验规则重复
- 值转换重复
- 表单提交与数据集存储逻辑割裂

因此，需要把两者统一到一套底层逻辑中。

---

## 2. 设计目标

### 2.1 总目标

建立一套统一的数据建模方式，使：

1. 数据集负责“数据结构定义”
2. 表单负责“数据录入/展示方式”
3. 绑定层负责“字段映射与提交落库”

### 2.2 具体目标

- 统一字段类型定义
- 统一字段校验机制
- 统一值格式化与转换机制
- 统一表单字段与数据集字段的绑定方式
- 统一保存、编辑、预览、列表展示逻辑
- 尽量复用现有代码，避免推倒重来

---

## 3. 核心设计原则

### 3.1 数据集定义“数据语义”

数据集只关心：

- 字段有哪些
- 字段类型是什么
- 字段是否必填
- 字段默认值是什么
- 字段的基础约束是什么

数据集不关心：

- 用什么控件展示
- 布局怎么排
- 样式怎么做
- 按钮怎么放

### 3.2 表单定义“交互表现”

表单负责：

- 使用什么组件渲染字段
- 字段如何布局
- 是否只读、隐藏、禁用
- 录入过程中的 UI 体验

表单不重复定义字段语义，只引用数据集字段。

### 3.3 绑定层连接两者

绑定层负责：

- 表单字段映射到哪个数据集字段
- 提交时如何做类型转换
- 保存时写入哪个数据表/记录表
- 回显时如何从数据集记录中恢复表单值

---

## 4. 建议的统一抽象

建议拆成三层模型。

### 4.1 字段定义层 FieldDefinition

描述字段本身的业务语义。

建议字段内容：

```ts
interface FieldDefinition {
  id: string;
  key: string;
  label: string;
  type: "text" | "number" | "datetime";
  required?: boolean;
  defaultValue?: unknown;
  rules?: FieldRule[];
}
```

### 4.2 表现配置层 FieldViewConfig

描述字段在表单中的表现方式。

建议字段内容：

```ts
interface FieldViewConfig {
  fieldId: string;
  componentKey: string;
  props: Record<string, unknown>;
  layout?: { x: number; y: number };
  hidden?: boolean;
  readonly?: boolean;
  disabled?: boolean;
}
```

### 4.3 绑定关系层 FieldBinding

描述字段如何映射到数据源。

建议字段内容：

```ts
interface FieldBinding {
  datasetId: string;
  datasetFieldId: string;
  formFieldId: string;
}
```

---

## 5. 推荐的总体架构

### 5.1 数据集作为数据源

数据集负责定义结构化数据：

- `dataset`
- `dataset_fields`
- `dataset_rows`

表单页面在设计时引用某个数据集字段，并决定使用什么表单控件展示。

### 5.2 表单作为数据入口

表单页面主要承载：

- 页面标题
- 字段布局
- 控件映射
- 表单校验
- 提交动作

表单提交后，最终写入与数据集一致的行数据结构。

### 5.3 页面作为组合容器

页面 DSL 中保存：

- 页面类型
- 布局信息
- 数据集绑定信息
- 字段映射信息
- 预览配置

这样页面不仅能渲染，也能直接驱动数据保存。

---

## 6. 现有代码应如何对齐

### 6.1 现状对应关系

#### 数据集侧

- 后端：`packages/backend/src/models/DatasetModel.ts`
- 后端路由：`packages/backend/src/routes/datasetRoutes.ts`
- 前端：`packages/frontend/src/views/dataset/Dataset.vue`
- 前端表格：`packages/frontend/src/views/dataset/DatasetTable.vue`

#### 表单侧

- 表单类型：`packages/frontend/src/form-designer/types/index.ts`
- 表单工具：`packages/frontend/src/form-designer/form-designer.utils.ts`
- 页面列表：`packages/frontend/src/views/page-factory/FormDesignList.vue`
- 页面 API：`packages/frontend/src/api/pages.ts`
- 页面路由：`packages/backend/src/routes/pageRoutes.ts`

### 6.2 当前已有的可复用点

- 表单字段已经有 `datasetBinding`
- 页面模型已经有 `dataset_bindings`
- 数据集已经有字段类型和行值结构
- 表单设计器已经有 schema / rules / props / layout

说明项目并不需要“从零发明”，而是需要把这些点串起来。

---

## 7. 数据结构设计建议

## 7.1 数据集字段结构

建议保留数据集字段为数据源定义，但补充少量元信息：

```ts
interface DatasetField {
  id: string;
  dataset_id: string;
  name: string;
  field_type: "text" | "number" | "datetime";
  sort_order: number;
  created_at: string;
  meta?: {
    required?: boolean;
    defaultValue?: unknown;
    placeholder?: string;
    componentKey?: string;
    readonly?: boolean;
  };
}
```

其中：

- `field_type` 是数据类型
- `meta.componentKey` 是建议的表单控件
- `meta.required` 是基础约束
- `meta.readonly` 控制表单是否可编辑

### 7.2 表单字段结构

建议保留现有 `FormField`，但将其理解为“表单视图字段”，并调整绑定方式：

```ts
interface FormField {
  _vid: string;
  componentKey: string;
  label: string;
  field: string;
  datasetBinding?: {
    datasetId: string;
    datasetFieldId: string;
  } | null;
  layout?: { x: number; y: number };
  rules: FormRule[];
  props: Record<string, unknown>;
  required: boolean;
  disabled: boolean;
  hidden: boolean;
  readonly: boolean;
}
```

### 7.3 页面 DSL 中的绑定信息

建议页面保存以下结构：

```ts
{
  pageType: 'form',
  datasetBindings: [
    {
      datasetId: 'xxx',
      mode: 'create' | 'edit' | 'detail' | 'list',
      fieldMap: [
        { formFieldId: 'f1', datasetFieldId: 'd1' },
        { formFieldId: 'f2', datasetFieldId: 'd2' }
      ]
    }
  ]
}
```

这样未来可以扩展到：

- 一个页面绑定多个数据集
- 同一页面不同区域绑定不同数据源
- 表单提交、列表展示、详情预览统一复用绑定信息

---

## 8. 统一逻辑的关键能力

## 8.1 字段类型映射

统一定义一套字段类型映射：

| 数据集类型 | 表单默认组件         | 存储格式   |
| ---------- | -------------------- | ---------- |
| `text`     | `input` / `textarea` | 字符串     |
| `number`   | `number`             | 数值       |
| `datetime` | `datetimePicker`     | ISO 字符串 |

### 8.2 值转换

要建立统一的转换函数：

- `normalizeValue()`：输入值标准化
- `formatValue()`：展示值格式化
- `parseValue()`：表单值转存储值
- `validateValue()`：按字段类型做校验

### 8.3 校验统一

字段校验不要分散在表单组件里，建议统一走 schema 层：

- 必填校验
- 数值校验
- 时间格式校验
- 长度校验
- 自定义规则校验

这样数据集表格编辑、表单录入、导入导出都可以复用。

---

## 9. 后端实施方案

## 9.1 推荐新增/调整的后端能力

### 1）统一字段服务

职责：

- 获取数据集字段
- 返回字段类型、默认值、元信息
- 提供给表单设计器和运行时使用

### 2）统一记录服务

职责：

- 读取/新增/更新/删除记录
- 统一处理 values 结构
- 统一做字段校验和类型转换

### 3）统一绑定服务

职责：

- 管理表单字段和数据集字段之间的映射
- 保存页面 DSL 中的绑定关系
- 运行时解析页面配置

## 9.2 建议的接口方向

### 数据集侧

- `GET /api/v1/datasets/:id/schema`
- `GET /api/v1/datasets/:id/rows`
- `POST /api/v1/datasets/:id/rows`
- `PUT /api/v1/datasets/:id/rows/:rowId`

### 表单侧

- `GET /api/v1/pages/:id`：获取表单 DSL 和绑定关系
- `PUT /api/v1/pages/:id`：保存表单 DSL
- `POST /api/v1/pages/:id/submit`：表单提交到绑定数据源

### 绑定解析

- `GET /api/v1/pages/:id/bindings`
- `PUT /api/v1/pages/:id/bindings`

---

## 10. 前端实施方案

## 10.1 建议新增的前端模块

### 1）字段选择器

功能：

- 从数据集字段中选择要绑定的字段
- 展示字段类型、是否必填、说明等信息

### 2）绑定配置面板

功能：

- 当前表单字段绑定到哪个数据集字段
- 支持修改映射关系
- 支持设置字段表现属性

### 3）统一预览/渲染层

功能：

- 从统一 schema 渲染表单
- 从统一 schema 渲染数据表
- 复用同一套字段格式化逻辑

## 10.2 建议的前端目录方向

可以新增一个共享模块，例如：

```text
packages/frontend/src/schema/
├── field-types.ts
├── field-transform.ts
├── field-validate.ts
├── dataset-binding.ts
└── runtime-resolver.ts
```

职责分工：

- `field-types.ts`：字段类型定义
- `field-transform.ts`：值转换
- `field-validate.ts`：校验
- `dataset-binding.ts`：字段映射
- `runtime-resolver.ts`：运行时解析页面配置

---

## 11. 开发顺序建议

这是最重要的执行顺序，建议严格按阶段推进。

### 阶段 1：统一类型和数据契约

目标：先把“字段语义”统一。

任务：

1. 定义统一字段类型
2. 定义统一值转换函数
3. 定义统一校验函数
4. 调整表单字段绑定结构
5. 明确数据集字段和表单字段的职责

验收：

- 数据集字段类型和表单字段类型能够互相映射
- 表单可以拿到数据集字段信息
- 同一个字段在不同页面的表现一致

---

### 阶段 2：统一后端记录处理

目标：让数据录入和数据集存储走同一套逻辑。

任务：

1. 抽出记录创建/更新的共用方法
2. 在提交前统一做类型转换
3. 在保存前统一做字段验证
4. 建立页面到数据集的绑定解析

验收：

- 表单提交后的值能正确写入数据集行
- 数据集编辑和表单提交使用同一套校验
- 时间、数字、文本等类型都能正确落库

---

### 阶段 3：统一页面 DSL

目标：页面既能描述布局，也能描述数据绑定。

任务：

1. 扩展页面 DSL 存储结构
2. 增加 datasetBindings
3. 增加 fieldMap
4. 保存表单设计时持久化绑定关系

验收：

- 页面详情中能完整恢复字段绑定
- 表单设计器刷新后绑定关系不丢失
- 预览页面能读取绑定信息并渲染

---

### 阶段 4：统一前端编辑体验

目标：让用户感知到这是一个统一平台，而不是两套互不相关的页面。

任务：

1. 表单设计器增加数据集字段选择器
2. 数据集页面增加“生成表单”入口
3. 表单页增加“绑定数据集”入口
4. 数据集列表和表单列表之间可跳转

验收：

- 能从数据集直接生成表单初稿
- 能从表单直接定位到绑定的数据集
- 用户理解成本降低

---

## 12. 建议的页面交互流程

### 12.1 创建数据集

1. 创建数据集
2. 定义字段
3. 保存字段结构
4. 进入表单设计页
5. 从数据集字段中选择需要展示的字段

### 12.2 创建表单页面

1. 新建表单页面
2. 选择一个数据集作为绑定源
3. 拉取字段列表
4. 配置字段组件与布局
5. 保存页面 DSL
6. 运行时提交到数据集记录表

### 12.3 编辑已有表单

1. 打开表单页面
2. 读取绑定信息
3. 恢复字段映射
4. 调整组件/布局/规则
5. 保存并发布

---

## 13. 风险与注意事项

### 13.1 字段名可变，字段 ID 不可变

不要用字段名作为唯一绑定依据，应该使用字段 ID。

### 13.2 数据类型转换要统一

特别注意：

- `number` 字段不要在某些地方当字符串处理
- `datetime` 字段不要有多套格式
- 空值、null、undefined 的处理要一致

### 13.3 不要把 UI 配置塞进数据模型太深

数据集应该保留轻量元信息，复杂 UI 配置应放在表单页面中。

### 13.4 兼容旧页面

如果当前已经有旧表单 DSL，要提供兼容层：

- 允许老 schema 自动归一化
- 允许无绑定字段先按默认规则运行

---

## 14. 里程碑建议

### M1：契约统一

- 字段类型统一
- 转换逻辑统一
- 校验逻辑统一

### M2：绑定打通

- 表单可绑定数据集字段
- 页面 DSL 可保存绑定关系
- 提交后能落到数据集行

### M3：运行时复用

- 表单预览和运行时都走同一套逻辑
- 数据集展示和表单字段展示共享格式化函数

### M4：体验整合

- 从数据集生成表单
- 从表单跳转到数据集
- 管理入口统一

---

## 15. 最终建议

如果要用一句话概括这套方案：

> **让数据集定义“是什么”，让表单定义“怎么用”，让绑定层定义“怎么连”。**

这是最适合当前项目现状、也最适合后续持续扩展的设计方式。

---

## 16. 下一步建议

建议下一步先做一个“最小可用闭环”，不要一上来就重构全部能力。

### 16.1 第一阶段只做这三件事

1. **统一字段类型定义**
   - 抽出共享的字段类型枚举
   - 明确 `text / number / datetime` 的存储格式和展示格式
   - 定义统一的值转换函数

2. **打通表单字段绑定**
   - 将 `FormField.datasetBinding` 从“字段名”升级为“字段 ID”绑定
   - 让表单字段能稳定引用数据集字段
   - 让绑定关系能在页面 DSL 中持久化保存

3. **统一提交和回显逻辑**
   - 表单提交时统一做校验、转换、落库
   - 表单回显时统一做数据恢复
   - 数据集表格编辑也复用同样的转换逻辑

### 16.2 一期不建议做的事

以下内容先不要急着做，否则会把范围拉大：

- 不要马上合并 `form_records` 和 `dataset_rows`
- 不要把所有 UI 配置都塞进数据集字段
- 不要一次性重构整个表单设计器
- 不要同时改太多列表页和预览页

### 16.3 建议的落地节奏

- **第 1 步**：补共享类型与转换工具
- **第 2 步**：改表单设计器绑定结构
- **第 3 步**：改页面 DSL 存储结构
- **第 4 步**：打通运行时提交与回显
- **第 5 步**：再考虑数据集与表单列表的联动体验

---

## 17. 一期开发清单（建议按此顺序执行）

### 17.1 后端任务

#### 任务 A：抽象统一字段契约

新增一个后端共享模块，至少包含：

- 字段类型枚举
- 字段值解析函数
- 字段值格式化函数
- 字段校验函数

建议位置：

```text
packages/backend/src/schema/
├── fieldTypes.ts
├── fieldTransform.ts
├── fieldValidate.ts
└── fieldBinding.ts
```

#### 任务 B：完善页面 DSL 的绑定字段

在页面 `dsl` 中补充：

- `datasetBindings`
- `fieldMap`
- `mode`
- `runtimeConfig`

#### 任务 C：统一记录保存逻辑

抽出一个通用记录服务，供以下场景调用：

- 表单提交新增记录
- 表单编辑更新记录
- 数据集表格编辑更新行
- 后续导入/导出

---

### 17.2 前端任务

#### 任务 D：抽共享 schema 工具

新增前端共享模块，建议包含：

```text
packages/frontend/src/schema/
├── field-types.ts
├── field-transform.ts
├── field-validate.ts
├── dataset-binding.ts
└── runtime-resolver.ts
```

#### 任务 E：改造表单设计器绑定 UI

在表单设计器中增加：

- 数据集选择器
- 数据集字段选择器
- 字段绑定状态展示
- 未绑定字段提示

#### 任务 F：统一预览渲染

让表单预览和运行时渲染都走同一套解析逻辑，避免：

- 设计器里能看见，运行时看不见
- 预览值和提交值不一致
- 数据集表格和表单显示格式不一致

---

## 18. 数据库与兼容策略

### 18.1 当前建议

现阶段**不要立即删除旧表**，也不要强制把已有页面迁移成新结构。

建议采取：

- 先新增字段
- 再写兼容解析
- 最后再考虑逐步迁移旧数据

### 18.2 建议新增的存储内容

#### 在 `pages.dsl` 中增加：

```ts
{
  datasetBindings: [
    {
      datasetId: string,
      mode: "create" | "edit" | "detail" | "list",
      fieldMap: Array<{
        formFieldId: string;
        datasetFieldId: string;
      }>,
    },
  ];
}
```

#### 在 `dataset_fields` 中可选补充：

- `required`
- `default_value`
- `placeholder`
- `component_key`
- `readonly`

这些字段先作为轻量元信息，不要马上扩成复杂配置表。

### 18.3 兼容老数据的方式

- 老页面没有 `datasetBindings` 时，仍然按旧 schema 运行
- 老 `FormField.datasetBinding` 如果还是字段名绑定，运行时可做一次兼容映射
- 迁移脚本不必一次执行完，可按模块分批处理

---

## 19. 接口草案

下面是建议的接口方向，便于后续前后端一起开发。

### 19.1 数据集侧接口

#### 获取数据集字段定义

`GET /api/v1/datasets/:id/schema`

返回示例：

```json
{
  "success": true,
  "data": {
    "datasetId": "123",
    "name": "客户信息",
    "fields": [
      {
        "id": "f1",
        "name": "客户姓名",
        "field_type": "text",
        "required": true,
        "componentKey": "input"
      }
    ]
  }
}
```

#### 创建数据记录

`POST /api/v1/datasets/:id/rows`

请求示例：

```json
{
  "values": {
    "field_1": "张三",
    "field_2": 18,
    "field_3": "2026-07-27T10:00:00.000Z"
  }
}
```

#### 更新数据记录

`PUT /api/v1/datasets/:id/rows/:rowId`

---

### 19.2 表单侧接口

#### 获取表单页面详情

`GET /api/v1/pages/:id`

返回内容建议包含：

- 页面基础信息
- DSL
- 数据集绑定信息
- 字段映射信息

#### 保存表单页面

`PUT /api/v1/pages/:id`

请求里建议保留：

- 页面名
- 页面类型
- DSL
- datasetBindings

#### 表单提交

`POST /api/v1/pages/:id/submit`

服务端职责：

1. 读取页面绑定关系
2. 解析字段映射
3. 校验提交数据
4. 转换成数据集行结构
5. 写入目标数据源

---

## 20. 统一字段规则

这部分是后续开发最容易走偏的地方，建议直接定死。

### 20.1 字段类型规则

| 类型       | 输入                | 存储       | 展示           |
| ---------- | ------------------- | ---------- | -------------- |
| `text`     | 字符串              | 字符串     | 原样显示       |
| `number`   | 字符串/数字         | 数字       | 按数字显示     |
| `datetime` | 日期字符串/日期对象 | ISO 字符串 | 按本地格式显示 |

### 20.2 空值规则

统一约定：

- `undefined`：表示“未传入”
- `null`：表示“明确为空”
- 空字符串 `""`：仅在文本字段中作为输入态存在，保存前要按规则归一化

### 20.3 校验规则优先级

建议优先级如下：

1. 字段类型校验
2. 必填校验
3. 长度/范围校验
4. 自定义规则校验
5. 业务级联动校验

---

## 21. 建议的目录调整

如果后续要继续开发，建议补一层共享代码目录。

### 21.1 前端

```text
packages/frontend/src/schema/
packages/frontend/src/services/binding/
packages/frontend/src/services/runtime/
```

### 21.2 后端

```text
packages/backend/src/schema/
packages/backend/src/services/binding/
packages/backend/src/services/record/
```

### 21.3 原则

- UI 代码只管展示
- schema 代码只管结构
- service 代码只管业务逻辑

---

## 22. 验收标准

当第一阶段完成时，至少满足以下条件：

### 22.1 功能验收

- 数据集字段和表单字段能建立稳定绑定
- 表单提交能写入正确数据
- 数据集编辑能复用同一套值转换逻辑
- 页面刷新后绑定信息不丢失

### 22.2 结构验收

- 字段类型定义集中管理
- 值转换逻辑集中管理
- 校验逻辑集中管理
- 表单和数据集不再各写一套重复逻辑

### 22.3 体验验收

- 用户能理解“先定义数据集，再用表单引用它”的流程
- 数据集与表单之间可以互相跳转
- 新增字段后，表单能快速感知并绑定

---

## 23. 最后建议

如果你要按这份文档持续推进，最稳妥的顺序是：

1. 先统一 schema
2. 再统一绑定
3. 再统一提交与回显
4. 最后整合页面体验

只要这四步走通，后续无论是：

- 自动生成表单
- 自动生成列表
- 表单转数据集
- 数据集转预览页

都会比较顺。

> 核心结论仍然是：**数据集定义“是什么”，表单定义“怎么用”，绑定层定义“怎么连”。**
