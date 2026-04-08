<script setup lang="ts">
import { InfoFilled } from '@element-plus/icons-vue'

// --------------------------- 类型定义 ---------------------------
/**
 * 表格列配置项
 */
export interface TemplateColumn {
  /** 字段名称，对应数据中的 key */
  prop: string
  /** 表头显示文字 */
  label: string
  /** 列宽度（支持数字/字符串，如 '150px' 或 150） */
  width?: string | number
  /** 最小宽度 */
  minWidth?: string | number
  /** 对齐方式 */
  align?: 'left' | 'center' | 'right'
}

// --------------------------- Props 定义 ---------------------------
/**
 * 组件属性
 */
interface Props {
  /** 表格列配置（若不传则使用默认示例列） */
  columns?: TemplateColumn[]
  /** 表格数据（若不传则使用默认示例数据） */
  tableData?: Record<string, any>[]
  /** 空数据时显示的提示文本 */
  emptyText?: string
  /** 是否显示底部辅助说明 */
  showFooterNote?: boolean
}

const props = withDefaults(defineProps<Props>(), {
  columns: () => [
    { prop: 'name', label: '姓名 *' },
    { prop: 'phone', label: '手机号 *' },
    { prop: 'email', label: '邮箱' },
    { prop: 'department', label: '部门' },
    { prop: 'status', label: '状态', align: 'center' }
  ],
  tableData: () => [
    {
      name: '张三',
      phone: '13812345678',
      email: 'zhangsan@example.com',
      department: '技术部',
      status: '启用'
    },
    {
      name: '李四',
      phone: '13987654321',
      email: 'lisi@example.com',
      department: '市场部',
      status: '禁用'
    },
    {
      name: '王芳',
      phone: '15233445566',
      email: 'wangfang@example.com',
      department: '人力资源部',
      status: '启用'
    },
    {
      name: '赵磊',
      phone: '18799887766',
      email: 'zhaolei@example.com',
      department: '财务部',
      status: '启用'
    },
    {
      name: '陈敏',
      phone: '13611223344',
      email: 'chenmin@example.com',
      department: '运营部',
      status: '禁用'
    },
    {
      name: '周涛',
      phone: '15966778899',
      email: 'zhoutao@example.com',
      department: '产品部',
      status: '启用'
    }
  ],
  emptyText: '暂无模板数据',
  showFooterNote: true
})
</script>

<template>
  <div class="import-template-table">
    <!-- 表格说明区域 -->
    <div class="table-info">
      <h4 class="title">📋 导入模板示例</h4>
      <p class="description">
        请按照下表格式准备导入数据，第一行为字段名称，第二行起为数据示例。<br />
        请确保数据类型与示例一致，避免导入失败。
      </p>
    </div>

    <!-- 核心表格展示区 -->
    <el-table :data="tableData" border stripe style="width: 100%" :empty-text="emptyText" v-bind="$attrs">
      <el-table-column
        v-for="column in columns"
        :key="column.prop"
        :prop="column.prop"
        :label="column.label"
        :width="column.width"
        :min-width="column.minWidth"
        :align="column.align || 'left'"
        :show-overflow-tooltip="true"
      />
    </el-table>

    <!-- 底部辅助说明 -->
    <div v-if="showFooterNote" class="table-footer">
      <el-icon><InfoFilled /></el-icon>
      <span>示例数据仅作格式参考，导入时会根据实际内容校验。带 * 的字段为必填项（如需必填标识请自行配置列）</span>
    </div>
  </div>
</template>

<style scoped lang="scss">
.import-template-table {
  background-color: #fff;
  border-radius: 8px;
  box-shadow: 0 2px 12px 0 rgba(0, 0, 0, 0.05);
  width: 100%;
  box-sizing: border-box;
}

.table-info {
  margin-bottom: 16px;

  .title {
    margin: 0 0 8px 0;
    // font-size: 18px;
    font-weight: 600;
    color: #303133;
  }

  .description {
    margin: 0;
    font-size: 13px;
    color: #909399;
    line-height: 1.5;
  }
}

.table-footer {
  margin-top: 12px;
  display: flex;
  align-items: center;
  gap: 6px;
  font-size: 12px;
  color: #e6a23c;
  background-color: #fdf6ec;
  padding: 8px 12px;
  border-radius: 4px;
  border-left: 3px solid #e6a23c;

  .el-icon {
    font-size: 14px;
  }

  span {
    line-height: 1.4;
  }
}

// 表格样式微调，使表头更清晰
:deep(.el-table) {
  font-size: 14px;

  th.el-table__cell {
    background-color: #f5f7fa;
    color: #303133;
    font-weight: 600;
  }

  .cell {
    line-height: 1.4;
  }
}
</style>
