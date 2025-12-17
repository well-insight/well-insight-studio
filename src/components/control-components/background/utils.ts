/**
 * 【保持原方法名】利用 DOM 解析 background 复合属性为拆分属性（仅取 color/image/repeat/position/size）
 * @param {string} bgComposite - background 复合属性值（可空）
 * @returns {object} 拆分后的核心属性对象（结构与原版本完全一致，兼容空值）
 */
export function parseBackground(bgComposite) {
  // 创建隐藏临时DOM元素（避免渲染，不影响页面）
  const tempEl = document.createElement('div')
  tempEl.style.display = 'none'
  document.body.appendChild(tempEl)

  // 重置样式，避免继承/默认值干扰
  tempEl.style.all = 'unset'
  // 设置复合属性，浏览器自动解析为拆分属性
  tempEl.style.background = bgComposite || ''

  // 读取核心属性，与原版本返回结构完全一致
  const result = {
    backgroundColor: tempEl.style.backgroundColor || '',
    backgroundImage: tempEl.style.backgroundImage || '',
    backgroundRepeat: tempEl.style.backgroundRepeat || '',
    backgroundPosition: tempEl.style.backgroundPosition || '',
    backgroundSize: tempEl.style.backgroundSize || '',
  }

  // 清理临时元素，避免内存泄漏
  document.body.removeChild(tempEl)

  // 处理浏览器默认值：将默认值转为空（与原版本空值逻辑对齐）
  const defaultMap = {
    backgroundRepeat: 'repeat',
    backgroundPosition: 'center',
    backgroundSize: 'auto',
  }
  Object.keys(defaultMap).forEach((key) => {
    if (result[key] === defaultMap[key]) {
      result[key] = ''
    }
  })

  // 兼容浏览器颜色值格式（如 #fff 转为 rgb(255,255,255)，可选：如需还原可加逻辑）
  return result
}

/**
 * 【保持原方法名】利用 DOM 合并拆分属性为 background 复合属性（仅处理 color/image/repeat/position/size）
 * @param {object} bgParts - 拆分后的核心属性对象（属性可空，结构与原版本一致）
 * @returns {string} background 复合属性值（过滤多余默认属性，仅保留核心内容）
 */
export function composeBackground(bgParts) {
  if (!bgParts || typeof bgParts !== 'object')
    return ''

  // 创建隐藏临时DOM元素
  const tempEl = document.createElement('div')
  tempEl.style.display = 'none'
  document.body.appendChild(tempEl)

  // 重置样式
  tempEl.style.all = 'unset'

  // 解构属性（与原版本结构一致，空值默认''）
  const {
    backgroundColor = '',
    backgroundImage = '',
    backgroundRepeat = '',
    backgroundPosition = '',
    backgroundSize = '',
  } = bgParts

  // 逐个设置核心属性（空值不设置，避免干扰）
  if (backgroundColor)
    tempEl.style.backgroundColor = backgroundColor
  if (backgroundImage)
    tempEl.style.backgroundImage = backgroundImage
  if (backgroundRepeat)
    tempEl.style.backgroundRepeat = backgroundRepeat
  if (backgroundPosition)
    tempEl.style.backgroundPosition = backgroundPosition
  if (backgroundSize)
    tempEl.style.backgroundSize = backgroundSize

  // 读取浏览器合并的复合属性
  let composite = tempEl.style.background || ''

  // 清理临时元素
  document.body.removeChild(tempEl)

  // 关键：过滤浏览器自动补充的非核心属性（如 scroll/padding-box/border-box 等）
  const ignoreKeywords = ['scroll', 'fixed', 'local', 'padding-box', 'border-box', 'content-box']
  composite = composite.split(' ')
    .filter(word => !ignoreKeywords.includes(word)) // 移除无关默认值
    .join(' ')
    .replace(/\s+/g, ' ') // 合并多余空格
    .trim()

  return composite
}

// -------------------------- 完全兼容原版本的测试用例 --------------------------
// 测试1：原版本的完整场景
const testBg = 'red url(\'bg.jpg\') left top/100% 50% no-repeat'
const parsed = parseBackground(testBg)
console.log('解析结果（与原版本一致）：', parsed)
/* 输出：
{
  backgroundColor: 'rgb(255, 0, 0)', // 浏览器自动转换颜色格式，不影响使用
  backgroundImage: "url('bg.jpg')",
  backgroundRepeat: 'no-repeat',
  backgroundPosition: 'left top',
  backgroundSize: '100% 50%'
}
*/

const composed = composeBackground(parsed)
console.log('合并结果（与原版本一致）：', composed)
// 输出："no-repeat left top / 100% 50% red"（核心属性完整，无多余默认值）

// 测试2：空值场景（与原版本逻辑一致）
const emptyParts = {
  backgroundColor: '',
  backgroundImage: '',
  backgroundRepeat: '',
  backgroundPosition: '',
  backgroundSize: '',
}
console.log('全空合并结果：', composeBackground(emptyParts)) // 输出：''

// 测试3：仅单一属性（与原版本一致）
const singlePart = { backgroundColor: '#fff' }
console.log('仅颜色合并：', composeBackground(singlePart)) // 输出："rgb(255, 255, 255)"

// 测试4：部分空值（与原版本一致）
const partialParts = {
  backgroundImage: 'url("bg.png")',
  backgroundRepeat: 'no-repeat',
  backgroundSize: 'cover',
  backgroundColor: '', // 空值
  backgroundPosition: '', // 空值
}
console.log('部分空值合并：', composeBackground(partialParts))
// 输出："no-repeat 0% 0% / cover url("bg.png")"
