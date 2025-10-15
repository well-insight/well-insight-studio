export function useMouseXY(elem?: any, event?: any) {
  //
  elem = elem || window.document
  event = event || window.event
  const x = event.clientX
  const y = event.clientY
  return { elem, event, x, y } // 方法返回宽高值
}
