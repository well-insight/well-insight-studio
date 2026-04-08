<script setup lang="ts">
import { ElMessage } from 'element-plus'
import { ref } from 'vue'

// 其余逻辑保持不变（与之前相同）...
const excelDialogVisible = ref(false)
const dbDialogVisible = ref(false)
const currentDbType = ref<string | null>(null)

const dbForm = ref({
  host: '',
  port: '',
  database: '',
  username: '',
  password: ''
})

async function submitExcelData(data: any[]) {
  console.log('提交数据', data)
  return Promise.resolve()
}

function handleCardClick(type: string) {
  if (type === 'excel') {
    excelDialogVisible.value = true
  } else {
    currentDbType.value = type
    switch (type) {
      case 'mysql':
        dbForm.value.port = '3306'
        break
      case 'postgresql':
        dbForm.value.port = '5432'
        break
      case 'oracle':
        dbForm.value.port = '1521'
        break
      case 'sqlserver':
        dbForm.value.port = '1433'
        break
      case 'mongodb':
        dbForm.value.port = '27017'
        break
    }
    dbDialogVisible.value = true
  }
}

async function connectDatabase() {
  ElMessage.info(`连接 ${currentDbType.value} 数据库功能开发中...`)
  console.log('连接参数', dbForm.value)
  dbDialogVisible.value = false
}
</script>

<template>
  <div class="data-source-selector">
    <el-form :model="dbForm" label-width="100px">
      <el-form-item label="主机地址">
        <el-input v-model="dbForm.host" placeholder="localhost" />
      </el-form-item>
      <el-form-item label="端口">
        <el-input v-model="dbForm.port" placeholder="3306" />
      </el-form-item>
      <el-form-item label="数据库名">
        <el-input v-model="dbForm.database" placeholder="database" />
      </el-form-item>
      <el-form-item label="用户名">
        <el-input v-model="dbForm.username" placeholder="root" />
      </el-form-item>
      <el-form-item label="密码">
        <el-input v-model="dbForm.password" type="password" placeholder="******" />
      </el-form-item>
    </el-form>
  </div>
</template>

<style scoped lang="scss"></style>
