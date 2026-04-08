import { request } from "@/utils";
import { axiosInstance } from "@/utils/request/alovaConfig";

export type DatasetFieldType = "text" | "number" | "datetime";

export interface ApiFolderTreeNode {
  id: number;
  parent_id: number | null;
  project_id: number | null;
  name: string;
  description: string | null;
  owner_id: number;
  sort_order: number;
  created_at: string;
  updated_at: string;
  children: ApiFolderTreeNode[];
}

export interface ApiDatasetListItem {
  id: number;
  name: string;
  description: string | null;
  owner_id: number;
  project_id: number | null;
  folder_id: number | null;
  created_at: string;
  updated_at: string;
  field_count: number;
  row_count: number;
}

export interface ApiDatasetField {
  id: number;
  dataset_id: number;
  name: string;
  field_type: DatasetFieldType;
  sort_order: number;
  created_at: string;
}

export interface ApiDatasetDetail extends Omit<ApiDatasetListItem, "field_count"> {
  fields: ApiDatasetField[];
  row_count: number;
}

export interface ApiDatasetRow {
  id: number;
  dataset_id: number;
  sort_order: number;
  values: Record<string, unknown>;
  created_at: string;
}

function listQueryParams(projectId?: number | null, folderId?: number | null) {
  const params: Record<string, string | number> = {};
  if (projectId !== undefined) {
    params.projectId = projectId === null ? "null" : projectId;
  }
  if (folderId !== undefined) {
    params.folderId = folderId === null ? "null" : folderId;
  }
  return params;
}

/** Alova 默认会缓存 GET 5 分钟，目录/列表需实时刷新时关闭缓存 */
const noGetCache = { cacheFor: 0 as const };

export function fetchDatasetFolderTree(projectId?: number | null) {
  return request.get<ApiFolderTreeNode[]>("/datasets/folders/tree", listQueryParams(projectId), noGetCache);
}

/** 当前用户全部数据集（不按目录过滤），用于与目录树合并 */
export function fetchAllDatasets(projectId?: number | null) {
  return request.get<ApiDatasetListItem[]>("/datasets", listQueryParams(projectId), noGetCache);
}

export function fetchDatasetFolderDetail(folderId: number) {
  return request.get<
    ApiFolderTreeNode & { child_folder_count: number; dataset_count: number }
  >(`/datasets/folders/${folderId}`, {}, noGetCache);
}

export function fetchDatasetDetail(datasetId: number) {
  return request.get<ApiDatasetDetail>(`/datasets/${datasetId}`, {}, noGetCache);
}

export interface DatasetRowsPage {
  rows: ApiDatasetRow[];
  total: number;
  page: number;
  pageSize: number;
}

export async function fetchDatasetRowsPage(
  datasetId: number,
  page = 1,
  pageSize = 20,
): Promise<DatasetRowsPage> {
  const res = (await axiosInstance.get(`/datasets/${datasetId}/rows`, {
    params: { page, pageSize },
  })) as {
    success: boolean;
    data: ApiDatasetRow[];
    total: number;
    page: number;
    pageSize: number;
  };
  return {
    rows: res.data,
    total: res.total,
    page: res.page,
    pageSize: res.pageSize,
  };
}

export function createDatasetRow(
  datasetId: number,
  body: { values: Record<string, string | number | null>; sort_order?: number },
) {
  return request.post<ApiDatasetRow>(`/datasets/${datasetId}/rows`, body);
}

export function updateDatasetRow(
  datasetId: number,
  rowId: number,
  body: { values: Record<string, string | number | null>; sort_order?: number },
) {
  return request.put<ApiDatasetRow>(`/datasets/${datasetId}/rows/${rowId}`, body);
}

export function deleteDatasetRow(datasetId: number, rowId: number) {
  return request.delete<undefined>(`/datasets/${datasetId}/rows/${rowId}`);
}

export function createDatasetFolder(body: {
  name: string;
  description?: string | null;
  parent_id?: number | null;
  project_id?: number | null;
  sort_order?: number;
}) {
  return request.post<ApiFolderTreeNode>("/datasets/folders", body);
}

export function updateDatasetFolder(
  folderId: number,
  body: {
    name?: string;
    description?: string | null;
    parent_id?: number | null;
    project_id?: number | null;
    sort_order?: number;
  },
) {
  return request.put<ApiFolderTreeNode>(`/datasets/folders/${folderId}`, body);
}

export function deleteDatasetFolder(folderId: number) {
  return request.delete<undefined>(`/datasets/folders/${folderId}`);
}

export function createDataset(body: {
  name: string;
  description?: string | null;
  project_id?: number | null;
  folder_id?: number | null;
  fields: { name: string; field_type: DatasetFieldType; sort_order?: number }[];
}) {
  return request.post<ApiDatasetDetail>("/datasets", body);
}

export function updateDataset(
  id: number,
  body: {
    name?: string;
    description?: string | null;
    project_id?: number | null;
    folder_id?: number | null;
  },
) {
  return request.put<ApiDatasetDetail>(`/datasets/${id}`, body);
}

export function deleteDataset(id: number) {
  return request.delete<undefined>(`/datasets/${id}`);
}
