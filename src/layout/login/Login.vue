<script lang="ts">
import { Avatar, Lock } from '@element-plus/icons-vue'
import { ElLoading, ElMessage, ElNotification } from 'element-plus'

import { defineComponent, h, onMounted, reactive } from 'vue'
import { useRouter } from 'vue-router'
import { login } from '@/api'
import logoImg from '@/assets/logo.png'
import { useStorage } from '@/hooks/useStorage'
import { setItem } from '@/utils/index'

export default defineComponent({
  name: 'Login',
  components: {

  },
  setup() {
    // 路由api创建
    const router = useRouter()
    const { set } = useStorage('session')
    // 账号密码 + 登录
    interface loginType {
      username: string
      password: string
      click: () => void
    }
    const loginForm: loginType = reactive({
      username: 'admin',
      password: '123456',
      click: async () => {
        if (loginForm.username !== '' && loginForm.password !== '') {
          const { username, password } = loginForm
          const instance = ElLoading.service({ text: '登录中，请稍等...' })
          login({ username, password }).then((res) => {
            if (res) {
              // 登录成功
              setItem('loginContent', res?.user) // 存用户信息
              set('design.token', res?.token) // 存token
              instance.close()
              ElNotification({
                title: '登录成功！',
                message: h('i', { style: 'color: teal' }, '欢迎登录well-design设计系统！'),
                appendTo: 'body',
              })
              router.push({ path: '/home' })
            }
          })
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
      // console.log('转换至注册')
    }

    onMounted(async () => { })

    return {
      loginForm,
      goRegister,
      Avatar,
      Lock,
      logoImg,
      ElLoading,
      ElMessage,
      ElNotification,
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
        <el-input v-model="loginForm.username" :prefix-icon="Avatar" class="login-username" type="text" />
        <el-input v-model="loginForm.password" :prefix-icon="Lock" class="login-password" type="password" />
      </div>
      <el-button type="primary" @click="loginForm.click">
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
  display: flex;
  align-items: center;
  justify-content: center;

  .login-box {
    width: 480px;
    /* 半透明底色（白色80%透明，可按需修改） */
    background-color: rgba(255, 255, 255, 0.8);
    /* 磨砂模糊效果（8px 为常用值，可调整） */
    backdrop-filter: blur(8px);
    -webkit-backdrop-filter: blur(8px);
    /* 适配 Safari */

    /* 可选：增加边框/阴影增强质感 */
    border: 1px solid rgba(255, 255, 255, 0.2);
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.05);
    border-radius: 10px;
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
