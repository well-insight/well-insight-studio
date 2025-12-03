/**
 * localStorage 存入
 * @param key key值
 * @param value 存入值
 */
export function setItem(key: string, value: any) {
  if (value instanceof Object) {
    value = JSON.stringify(value)
  }
  else {
    value = String(value)
  }
  window.localStorage.setItem(key, value)
}

/**
 * localStorage 取出
 * @param key 获取存入localStorage值的key
 * @returns 存入值
 */
export function getItem(key: string) {
  if (!key) {
    return null
  }

  const value = window.localStorage.getItem(key)

  return value ? JSON.parse(value) : null
}

/**
 * localStorage 删除
 * @param key 删除localStorage值的key
 */
export function removeItem(key: string) {
  window.localStorage.removeItem(key)
}

/**
 * 随机获取颜色
 * @param type 16进制颜色 或 rgb颜色
 * @returns 颜色值
 */
export function getRandomColor(type?: string | number): string {
  type = type || ''
  if (type === 'rgb') {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    return `rgb(${r},${g},${b})`
  }
  else {
    const r = Math.floor(Math.random() * 256)
    const g = Math.floor(Math.random() * 256)
    const b = Math.floor(Math.random() * 256)
    const color = `#${r.toString(16)}${g.toString(16)}${b.toString(16)}`
    return color
  }
}

/**
 * 返回随机且不重复的 key 值
 */
export function getRandomKey() {
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, (c) => {
    const r = (Math.random() * 16) | 0
    const v = c === 'x' ? r : (r & 0x3) | 0x8
    return v.toString(16)
  })
}

/**
 * uuid
 * @param len 长度
 * @param radix 基数
 * @returns
 */
export function uuid(len?: number, radix?: number) {
  const chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz'.split('')
  const uuid = []
  let i
  radix = radix || chars.length

  if (len) {
    // Compact form
    for (i = 0; i < len; i++) uuid[i] = chars[0 | (Math.random() * radix)]
  }
  else {
    // rfc4122, version 4 form
    let r

    // rfc4122 requires these characters
    uuid[8] = uuid[13] = uuid[18] = uuid[23] = '-'
    uuid[14] = '4'

    // Fill in random data.  At i==19 set the high bits of clock sequence as
    // per rfc4122, sec. 4.1.5
    for (i = 0; i < 36; i++) {
      if (!uuid[i]) {
        r = 0 | (Math.random() * 16)
        uuid[i] = chars[i === 19 ? (r & 0x3) | 0x8 : r]
      }
    }
  }

  return uuid.join('')
}

export function setCookie(cookieName: string, cookieValue: string, cookieTime?: number) {
  cookieTime = cookieTime || 30 // 没有传入时间参数就默认设成 30
  let expires = '' // 存放过期时间
  if (cookieTime !== 0) {
    const date = new Date()
    date.setTime(date.getTime() + cookieTime * 1000)
    expires = `;expires=${date}` // 过去时间
  }
  document.cookie = `${cookieName}=${window.escape(cookieValue)}${expires};Path=/`
  // cookie进行编码
}

export function getCookie(name: string) {
  let result = ''
  const nameEQ = `${name}=`
  const strArr = document.cookie.split(';') // 把cookie分割成组
  for (let i = 0; i < strArr.length; i++) {
    let str = strArr[i] // 取得字符串
    // 去除字符串数组的前面的空格
    while (str.charAt(0) === ' ') {
      // 判断一下字符串有没有前导空格
      str = str.substring(1, str.length) // 有的话，从第二位开始取
    }
    if (str.indexOf(nameEQ) === 0) {
      // 如果含有我们要的name  indexOf -- 查找字符串
      result = window.unescape(str.substring(nameEQ.length, str.length))
      // cookie解码并截取我们要值
    }
  }
  return result
}

export function clearCookie(name: string) {
  setCookie(name, '', -1)
}

/**
 * 将base64转换为blob
 * @param base64Data base64 data 数据
 * @returns
 */
export function dataURItoBlob(base64Data: string) {
  let byteString
  let mimeString
  if (base64Data.split(',')[0].includes('base64')) {
    byteString = atob(base64Data.split(',')[1])
  }
  else {
    byteString = unescape(base64Data.split(',')[1])
    mimeString = base64Data.split(',')[0].split(':')[1].split(';')[0]
  }
  const ia = new Uint8Array(byteString.length)
  for (let i = 0; i < byteString.length; i++) {
    ia[i] = byteString.charCodeAt(i)
  }
  return new Blob([ia], { type: mimeString })
}
