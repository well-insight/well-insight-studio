import type { reponseType } from '@/type'
import api from '../index'

export async function addDesign(userId: string, content: string): Promise<reponseType> {
  return await api.Post('design/api/design/addDesign', {
    userId,
    content,
  })
}

export async function getDesignContentById(id: string): Promise<reponseType> {
  return await api.Get('design/api/design/getDesignContentById', {
    id,
  })
}

export async function updateDesignById(id: string, content: string): Promise<reponseType> {
  return await api.Post('design/api/design/updateDesignById', {
    id,
    content,
  })
}

export async function findDesignList(userId: string): Promise<reponseType> {
  return await api.Get('/design/api/design/findDesignList', {
    userId,
  })
}

export async function deleteDesign(id: string): Promise<reponseType> {
  return await api.Post('/design/api/design/deleteDesign', {
    id,
  })
}

export async function setImg(id: string, base64Data: string): Promise<reponseType> {
  return await api.Post('/design/api/design/setImg', {
    id,
    base64Data,
  })
}

export function getImg(id: string): string {
  return `http://localhost:8888/upload/design/${id}.jpg`
}
