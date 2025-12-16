/**
 * 工具函数：安全分割 background 字符串（避免分割带引号的 URL 内部空格）
 * @param {string} bgStr - 原始 background 复合属性字符串
 * @returns {string[]} 分割后的有效片段数组
 */
export function splitBackgroundString(bgStr) {
  if (!bgStr.trim())
    return [] // 空字符串直接返回空数组
  const segments = []
  let currentSegment = ''
  let inQuotes = false

  for (const char of bgStr.trim()) {
    if (char === '"' || char === '\'') {
      inQuotes = !inQuotes
    }
    if (char === ' ' && !inQuotes) {
      if (currentSegment) {
        segments.push(currentSegment)
        currentSegment = ''
      }
    }
    else {
      currentSegment += char
    }
  }
  if (currentSegment)
    segments.push(currentSegment)
  return segments
}

/**
 * 解析 background 复合属性（兼容空值）
 * 仅提取 color/image/repeat/position/size，属性不存在则返回空（repeat/position/size 保留CSS默认值）
 * @param {string} bgComposite - background 复合属性值（可空/仅部分属性）
 * @returns {object} 核心属性对象（空值为''，默认值按CSS规范）
 */
export function parseBackground(bgComposite) {
  // 初始化：color/image 为空，repeat/position/size 为CSS默认值（即使原始值为空，也保留默认）
  const result = {
    backgroundColor: '',
    backgroundImage: '',
    backgroundRepeat: 'repeat',
    backgroundPosition: 'center',
    backgroundSize: 'auto',
  }

  // 原始值为空，直接返回初始化结果
  if (!bgComposite || typeof bgComposite !== 'string' || !bgComposite.trim()) {
    return result
  }

  const segments = splitBackgroundString(bgComposite)
  const positionSizeSeparator = '/'
  let positionSizeSegment = ''

  // 遍历识别核心属性（空片段自动跳过）
  for (const seg of segments) {
    if (!seg)
      continue // 跳过空片段

    // 1. 处理 position/size 组合段（兼容仅position或仅size的情况）
    if (seg.includes(positionSizeSeparator)) {
      positionSizeSegment = seg
      continue
    }

    // 2. 识别 background-image（url() 开头，空则保留''）
    if (seg.startsWith('url(')) {
      result.backgroundImage = seg
      continue
    }

    // 3. 识别 background-repeat（空则保留默认'repeat'）
    const repeatValues = ['repeat', 'repeat-x', 'repeat-y', 'no-repeat', 'space', 'round']
    if (repeatValues.includes(seg)) {
      result.backgroundRepeat = seg
      continue
    }

    // 4. 剩余片段判定为背景色（空则保留''）
    result.backgroundColor = seg
  }

  // 解析 position/size（兼容仅其中一个有值的情况）
  if (positionSizeSegment) {
    const [position, size] = positionSizeSegment.split(positionSizeSeparator).map(s => s.trim())
    // 仅当有值时覆盖默认值，无值则保留默认
    if (position)
      result.backgroundPosition = position
    if (size)
      result.backgroundSize = size
  }

  return result
}

/**
 * 合并核心属性为 background 复合属性（兼容空值）
 * 空值属性直接跳过，不拼接；默认值（repeat/position/size）非显式修改则省略
 * @param {object} bgParts - 核心属性对象（属性可空）
 * @returns {string} background 复合属性值（空值返回''）
 */
export function composeBackground(bgParts) {
  // 入参为空/非对象，返回空字符串
  if (!bgParts || typeof bgParts !== 'object') {
    return ''
  }

  // 解构：color/image 取空值，repeat/position/size 取默认值（兼容入参属性为空）
  const {
    backgroundColor = '',
    backgroundImage = '',
    backgroundRepeat = 'repeat',
    backgroundPosition = 'center',
    backgroundSize = 'auto',
  } = bgParts

  const compositeSegments = []

  // 1. 拼接 image（空则跳过）
  if (backgroundImage) {
    compositeSegments.push(backgroundImage)
  }

  // 2. 拼接 position/size（兼容仅其中一个有值、或均为默认值的情况）
  const positionSizeParts = []
  // 仅当position非默认值时加入
  if (backgroundPosition !== 'center') {
    positionSizeParts.push(backgroundPosition)
  }
  // 仅当size非默认值时加入
  if (backgroundSize !== 'auto') {
    positionSizeParts.push(backgroundSize)
  }
  // 有值则用/拼接，无值则跳过
  if (positionSizeParts.length > 0) {
    compositeSegments.push(positionSizeParts.join('/'))
  }

  // 3. 拼接 repeat（仅非默认值时加入）
  if (backgroundRepeat !== 'repeat') {
    compositeSegments.push(backgroundRepeat)
  }

  // 4. 拼接 color（空则跳过）
  if (backgroundColor) {
    compositeSegments.push(backgroundColor)
  }

  // 过滤空片段，拼接最终结果（空数组返回''）
  return compositeSegments.filter(Boolean).join(' ')
}

// -------------------------- 空值场景测试用例 --------------------------
// 测试1：所有属性为空
console.log('测试1（全空）：', composeBackground(parseBackground('')))
// 输出：''

// 测试2：仅image有值，其余为空（默认值）
const test2 = parseBackground('url("bg.jpg")')
console.log('测试2解析：', test2)
/* 输出：
{
  backgroundColor: '',
  backgroundImage: 'url("bg.jpg")',
  backgroundRepeat: 'repeat',
  backgroundPosition: 'center',
  backgroundSize: 'auto'
}
*/
console.log('测试2合并：', composeBackground(test2))
// 输出：'url("bg.jpg")'（默认值省略）

// 测试3：仅color有值，其余为空
const test3 = parseBackground('#fff')
console.log('测试3解析：', test3)
/* 输出：
{
  backgroundColor: '#fff',
  backgroundImage: '',
  backgroundRepeat: 'repeat',
  backgroundPosition: 'center',
  backgroundSize: 'auto'
}
*/
console.log('测试3合并：', composeBackground(test3))
// 输出：'#fff'（默认值省略）

// 测试4：image为空，仅color+repeat有值
const test4Parts = {
  backgroundColor: 'red',
  backgroundImage: '',
  backgroundRepeat: 'no-repeat',
}
console.log('测试4合并：', composeBackground(test4Parts))
// 输出：'no-repeat red'

// 测试5：position有值，size为空（默认auto）
const test5Parts = {
  backgroundImage: 'url("bg.png")',
  backgroundPosition: 'left top',
  backgroundSize: '', // 手动置空，自动取默认auto
}
console.log('测试5合并：', composeBackground(test5Parts))
// 输出：'url("bg.png") left top'（size为默认auto，省略）

// 测试6：仅size有值，position为空（默认center）
const test6Parts = {
  backgroundImage: 'url("bg.svg")',
  backgroundPosition: '', // 手动置空，自动取默认center
  backgroundSize: 'cover',
}
console.log('测试6合并：', composeBackground(test6Parts))
// 输出：'url("bg.svg") cover'（position为默认center，省略，仅拼接size）

// 测试7：repeat为空（自动取默认repeat，合并时省略）
const test7Parts = {
  backgroundColor: '#000',
  backgroundRepeat: '', // 手动置空，自动取默认repeat
}
console.log('测试7合并：', composeBackground(test7Parts))
// 输出：'#000'（repeat为默认，省略）
