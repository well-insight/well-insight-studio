import type { menuListType } from '@/type'
import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getMenuList } from '@/api'
import { getItem } from '@/utils'

export const useSystemStore = defineStore('system', () => {
  const menuList = ref<menuListType[]>([]) // 菜单list

  async function fetchMenuList() {
    const res = await getMenuList()
    if (res) {
      menuList.value = res
    }
  }

  // 登录用户信息
  function loginContent() {
    return getItem('loginContent')
  }

  return {
    loginContent,
    menuList,
    fetchMenuList,
  }
})
