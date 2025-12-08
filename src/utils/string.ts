import { isNumber } from 'lodash-es'

/**
 * 拆分数字+单位的字符串（数字在前，单位在后）
 * @param s 输入字符串（如"123kg"、"-45.67℃"、"89"、" 100.5 L "）
 * @returns [数字部分, 单位部分]，数字无法解析时返回 [null, 原字符串]
 */
export function splitNumberUnit(s: string | number): [number | null, null | string] {
  if (isNumber(s)) {
    return [s, null]
  }
  // 去除首尾空格，避免空格干扰匹配
  const trimmedStr = s.trim()
  if (!trimmedStr)
    return [null, s] // 空字符串兜底

  // 正则匹配规则：匹配开头的数字（含正负、整数、小数），剩余为单位
  // eslint-disable-next-line regexp/no-super-linear-backtracking
  const pattern = /^([-+]?\d+(?:\.\d*)?)(.*)$/
  const match = trimmedStr.match(pattern)

  if (!match)
    return [null, s] // 无有效数字匹配

  const [, numStr, unit] = match
  const cleanUnit = unit?.trim() // 去除单位部分的空格

  // 无数字部分（纯单位）
  if (!numStr)
    return [null, s]

  // 转换数字并处理类型（整数转int，小数保留float）
  const num = Number.parseFloat(numStr)
  if (Number.isNaN(num))
    return [null, s] // 数字解析失败（兜底）

  // 整数则转为整数类型（和Python行为一致，如123.0 → 123）
  const finalNum = Number.isInteger(num) ? Math.trunc(num) : num

  return [finalNum, cleanUnit!]
}
