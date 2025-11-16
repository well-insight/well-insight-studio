import request from '@/utils/request'

export async function fetchComponentsList() {
  return await request.post('api/weiDesign/getComponentsList', {})
}

export async function addDesign(userId: string, content: string) {
  return await request.post('design/api/design/addDesign', {
    userId,
    content,
  })
}

export async function getDesignContentById(id: string) {
  return await request.get('api/design/getDesignContentById', {
    id,
  })
}

export async function updateDesignById(id: string, content: string) {
  return await request.post('design/api/design/updateDesignById', {
    id,
    content,
  })
}

export async function findDesignList(userId: string) {
  return await request.get('/api/design/findDesignList', {
    userId,
  })
}

export async function deleteDesign(id: string) {
  return await request.post('/design/api/design/deleteDesign', {
    id,
  })
}

export async function setImg(id: string, base64Data: string) {
  return await request.post('/design/api/design/setImg', {
    id,
    base64Data,
  })
}

export function getImg(id: string): string {
  return `http://localhost:8888/upload/design/${id}.jpg`
}
