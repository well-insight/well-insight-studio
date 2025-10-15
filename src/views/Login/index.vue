<script lang="ts">
import { Avatar, Lock } from '@element-plus/icons-vue'
import { ElMessage, ElNotification } from 'element-plus'
import { defineComponent, onMounted, reactive } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { system, testApi } from '@/api/service'
import logoImg from '@/assets/logo.png'
import { closeLoading, openLoading } from '@/hooks/useLoading'
import { useStorage } from '@/hooks/useStorage'
import { setItem } from '@/utils/index'

export default defineComponent({
  name: 'Login',
  components: {},
  setup() {
    // 路由api创建
    const router = useRouter()
    const route = useRoute()
    const { set } = useStorage('session')
    // 账号密码 + 登录
    interface loginType {
      username: string
      password: string
      click: () => void
    }

    testApi().then((res) => {
      debugger
    })

    const loginForm: loginType = reactive({
      username: 'admin',
      password: '123456',
      click: async () => {
        if (loginForm.username !== '' && loginForm.password !== '') {
          const { username, password } = loginForm
          openLoading()
          const res = await system.login({ username, password })
          if (res && res.status === 'success') {
            // 登录成功
            setItem('loginContent', res.data.user) // 存用户信息
            set('design.token', res.data.token) // 存token
            closeLoading()
            router.push({ path: '/home' })
            ElNotification({
              title: '登录成功！',
              message: '欢迎登录weiDesign设计系统！',
              type: 'success',
              offset: 50,
              duration: 2000,
            })
          }
        }
        else {
          ElMessage({
            message: '账号密码不能为空！',
            type: 'warning',
          })
        }
      },
    })

    // 切换至注册
    const goRegister = () => {
      console.log('转换至注册')
    }

    onMounted(async () => {})

    return {
      loginForm,
      goRegister,
      Avatar,
      Lock,
      logoImg,
    }
  },
})
</script>

<template>
  <div class="login-container">
    <div class="login-box">
      <div class="w-full flex items-center justify-center flex-col mb-4">
        <el-image class="w-[180px] h-[180px]" :src="logoImg" />
        <el-text class="text-[24px] font-700">
          well design
        </el-text>
      </div>
      <div class="center mb-8">
        <el-input
          v-model="loginForm.username"
          :prefix-icon="Avatar"
          class="login-username"
          type="text"
        />
        <el-input
          v-model="loginForm.password"
          :prefix-icon="Lock"
          class="login-password"
          type="password"
        />
      </div>
      <el-button type="" color="#0ca296" @click="loginForm.click">
        登录
      </el-button>
      <div class="goRegister-box">
        <span class="goRegister" @click="goRegister">注册</span>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
.login-container {
  height: 100vh;
  width: 100vw;
  background-image: url('../../assets/login/bg.png');
  background-size: 100% 100%;
  background-repeat: no-repeat;
  position: relative;

  .login-box {
    width: 30vw;
    background-color: var(--el-color-white);
    color: #fff;
    border-radius: 10px;
    position: absolute;
    top: 50%;
    transform: translateY(-50%);
    right: 100px;
    padding: 20px;
    display: flex;
    flex-direction: column;

    .hello {
      font-size: 50px;
      font-weight: 900;
      margin: 10px 0;
    }
    .welcome {
      margin: 10px 0;
      font-size: 30px;
    }
    .center {
      width: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;

      .login-username,
      .login-password {
        margin: 10px;
      }
    }
    .goRegister-box {
      width: 100%;
      display: flex;
      align-items: center;
      flex-direction: row-reverse;

      .goRegister {
        margin: 15px 0;
        font-weight: 900;
        cursor: pointer;
      }
    }
  }
}
</style>
