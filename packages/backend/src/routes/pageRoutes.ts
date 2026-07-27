import { Router, Request, Response } from "express";
import { z } from "zod";
import { authenticateToken } from "../middleware/authMiddleware";
import { FormRecordModel } from "../models/FormRecord";
import { PageFolderModel } from "../models/PageFolder";
import { PageModel, PAGE_STATUSES, PAGE_TYPES } from "../models/Page";

const router: Router = Router();
router.use(authenticateToken);

const IdParamSchema = z.string().min(1);
const PageFolderIdSchema = z.string().nullable().optional();

const CreatePageSchema = z.object({
  folder_id: PageFolderIdSchema,
  name: z.string().min(1).max(200),
  type: z.enum(PAGE_TYPES),
  dsl: z.any().optional(),
  dataset_bindings: z.any().optional(),
  preview_url: z.string().max(500).optional(),
  status: z.enum(PAGE_STATUSES).optional().default("draft"),
});

const UpdatePageSchema = z.object({
  folder_id: PageFolderIdSchema,
  name: z.string().min(1).max(200).optional(),
  type: z.enum(PAGE_TYPES).optional(),
  dsl: z.any().optional(),
  dataset_bindings: z.any().optional(),
  preview_url: z.string().max(500).nullable().optional(),
  status: z.enum(PAGE_STATUSES).optional(),
});

const ListQuerySchema = z.object({
  type: z.enum(PAGE_TYPES).optional(),
  status: z.enum(PAGE_STATUSES).optional(),
  folder_id: z.string().nullable().optional(),
  keyword: z.string().max(100).optional(),
  page: z.coerce.number().int().positive().optional().default(1),
  pageSize: z.coerce.number().int().positive().max(100).optional().default(20),
});

const FolderCreateSchema = z.object({
  parent_id: z.string().nullable().optional(),
  name: z.string().min(1).max(200),
  description: z.string().max(2000).nullable().optional(),
  sort_order: z.number().int().optional(),
});

const FolderUpdateSchema = FolderCreateSchema.partial();

const RecordValuesSchema = z.record(z.union([z.string(), z.number(), z.null(), z.boolean()]));
const CreateRecordSchema = z.object({
  values: RecordValuesSchema,
  sort_order: z.number().int().optional(),
});
const UpdateRecordSchema = z.object({
  values: RecordValuesSchema.optional(),
  sort_order: z.number().int().optional(),
});

function assertFormPage(pageId: string, userId: string) {
  const page = PageModel.findById(pageId);
  if (!page || page.created_by !== userId)
    return null;
  if (page.type !== "form")
    throw new Error("NOT_FORM_PAGE");
  return page;
}

function assertFolderOwner(folderId: string, userId: string) {
  const folder = PageFolderModel.findById(folderId);
  if (!folder || folder.owner_id !== userId)
    return null;
  return folder;
}

function isDescendant(folders: Array<{ id: string; parent_id: string | null }>, nodeId: string, maybeParentId: string): boolean {
  const map = new Map(folders.map(folder => [folder.id, folder.parent_id]));
  let cursor: string | null | undefined = maybeParentId;
  while (cursor) {
    if (cursor === nodeId)
      return true;
    cursor = map.get(cursor) ?? null;
  }
  return false;
}

router.get("/folders/tree", (req: Request, res: Response) => {
  try {
    const folders = PageFolderModel.listByOwner(req.userId!);
    res.json({ success: true, data: PageFolderModel.buildTree(folders, null) });
  }
  catch (error) {
    console.error("page folders tree error:", error);
    res.status(500).json({ success: false, error: "鑾峰彇鐩綍鏍戝け璐?" });
  }
});

router.post("/folders", (req: Request, res: Response) => {
  try {
    const body = FolderCreateSchema.parse(req.body);
    if (body.parent_id != null) {
      const parent = assertFolderOwner(body.parent_id, req.userId!);
      if (!parent)
        return res.status(400).json({ success: false, error: "鐖剁洰褰曚笉瀛樺湪鎴栨棤鏉冮檺" });
    }
    const folder = PageFolderModel.create({
      parent_id: body.parent_id ?? null,
      name: body.name,
      description: body.description ?? null,
      owner_id: req.userId!,
      sort_order: body.sort_order,
    });
    res.status(201).json({ success: true, data: folder, message: "鐩綍宸插垱寤?" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鍙傛暟鏍￠獙澶辫触", details: error.errors });
    console.error("page folders create error:", error);
    res.status(500).json({ success: false, error: "鍒涘缓鐩綍澶辫触" });
  }
});

router.put("/folders/:folderId", (req: Request, res: Response) => {
  try {
    const folderId = IdParamSchema.parse(req.params.folderId);
    const existing = assertFolderOwner(folderId, req.userId!);
    if (!existing)
      return res.status(404).json({ success: false, error: "鐩綍涓嶅瓨鍦?" });
    const body = FolderUpdateSchema.parse(req.body);
    if (body.parent_id != null) {
      const parent = assertFolderOwner(body.parent_id, req.userId!);
      if (!parent)
        return res.status(400).json({ success: false, error: "鐖剁洰褰曚笉瀛樺湪鎴栨棤鏉冮檺" });
      const folders = PageFolderModel.listByOwner(req.userId!);
      if (body.parent_id === folderId || isDescendant(folders, folderId, body.parent_id))
        return res.status(400).json({ success: false, error: "涓嶈兘褰㈡垚寰幆鐩綍" });
    }
    const updated = PageFolderModel.update(folderId, {
      parent_id: body.parent_id ?? existing.parent_id,
      name: body.name ?? existing.name,
      description: body.description ?? existing.description,
      sort_order: body.sort_order ?? existing.sort_order,
    });
    res.json({ success: true, data: updated, message: "鐩綍宸叉洿鏂?" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鍙傛暟鏍￠獙澶辫触", details: error.errors });
    console.error("page folders update error:", error);
    res.status(500).json({ success: false, error: "鏇存柊鐩綍澶辫触" });
  }
});

router.delete("/folders/:folderId", (req: Request, res: Response) => {
  try {
    const folderId = IdParamSchema.parse(req.params.folderId);
    const existing = assertFolderOwner(folderId, req.userId!);
    if (!existing)
      return res.status(404).json({ success: false, error: "鐩綍涓嶅瓨鍦?" });
    const folders = PageFolderModel.listByOwner(req.userId!);
    const hasChildren = folders.some(folder => folder.parent_id === folderId);
    const hasPages = PageModel.findAll({ created_by: req.userId!, folder_id: folderId, page: 1, pageSize: 1 }).total > 0;
    if (hasChildren || hasPages)
      return res.status(409).json({ success: false, error: "鐩綍闈炵┖锛岃鍏堝垹闄ゅ瓙椤甸潰鎴栧瓙鐩綍" });
    PageFolderModel.delete(folderId);
    res.json({ success: true, message: "鐩綍宸插垹闄?" });
  }
  catch (error) {
    console.error("page folders delete error:", error);
    res.status(500).json({ success: false, error: "鍒犻櫎鐩綍澶辫触" });
  }
});

router.post("/", (req: Request, res: Response) => {
  try {
    const body = CreatePageSchema.parse(req.body);
    if (body.folder_id != null) {
      const folder = assertFolderOwner(body.folder_id, req.userId!);
      if (!folder)
        return res.status(400).json({ success: false, error: "鎵€灞炵洰褰曚笉瀛樺湪鎴栨棤鏉冮檺" });
    }
    const page = PageModel.create({
      folder_id: body.folder_id ?? null,
      name: body.name,
      type: body.type,
      dsl: body.dsl,
      dataset_bindings: body.dataset_bindings,
      preview_url: body.preview_url,
      status: body.status,
      created_by: req.userId!,
    });
    res.status(201).json({ success: true, data: page, message: "椤甸潰鍒涘缓鎴愬姛" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鏁版嵁楠岃瘉澶辫触", details: error.errors });
    console.error("pages create error:", error);
    res.status(500).json({ success: false, error: "鍒涘缓椤甸潰澶辫触" });
  }
});

router.get("/", (req: Request, res: Response) => {
  try {
    const query = ListQuerySchema.parse(req.query);
    const result = PageModel.findAll({
      ...query,
      created_by: req.userId!,
    });
    res.json({ success: true, data: { items: result.items, total: result.total }, message: "鑾峰彇椤甸潰鍒楄〃鎴愬姛" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鍙傛暟楠岃瘉澶辫触", details: error.errors });
    console.error("pages list error:", error);
    res.status(500).json({ success: false, error: "鑾峰彇椤甸潰鍒楄〃澶辫触" });
  }
});

router.get("/:id", (req: Request, res: Response) => {
  try {
    const id = IdParamSchema.parse(req.params.id);
    const page = PageModel.findById(id);
    if (!page || page.created_by !== req.userId!)
      return res.status(404).json({ success: false, error: "椤甸潰涓嶅瓨鍦?" });
    res.json({ success: true, data: page, message: "鑾峰彇椤甸潰鎴愬姛" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鍙傛暟鏍￠獙澶辫触", details: error.errors });
    console.error("pages get error:", error);
    res.status(500).json({ success: false, error: "鑾峰彇椤甸潰澶辫触" });
  }
});

router.put("/:id", (req: Request, res: Response) => {
  try {
    const id = IdParamSchema.parse(req.params.id);
    const existing = PageModel.findById(id);
    if (!existing || existing.created_by !== req.userId!)
      return res.status(404).json({ success: false, error: "椤甸潰涓嶅瓨鍦?" });
    const body = UpdatePageSchema.parse(req.body);
    if (body.folder_id != null) {
      const folder = assertFolderOwner(body.folder_id, req.userId!);
      if (!folder)
        return res.status(400).json({ success: false, error: "鎵€灞炵洰褰曚笉瀛樺湪鎴栨棤鏉冮檺" });
    }
    const page = PageModel.update(id, {
      folder_id: body.folder_id ?? existing.folder_id ?? null,
      name: body.name,
      type: body.type,
      dsl: body.dsl,
      dataset_bindings: body.dataset_bindings,
      preview_url: body.preview_url,
      status: body.status,
    });
    res.json({ success: true, data: page, message: "椤甸潰鏇存柊鎴愬姛" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鏁版嵁楠岃瘉澶辫触", details: error.errors });
    console.error("pages update error:", error);
    res.status(500).json({ success: false, error: "鏇存柊椤甸潰澶辫触" });
  }
});

router.delete("/:id", (req: Request, res: Response) => {
  try {
    const id = IdParamSchema.parse(req.params.id);
    const page = PageModel.findById(id);
    if (!page || page.created_by !== req.userId!)
      return res.status(404).json({ success: false, error: "椤甸潰涓嶅瓨鍦?" });
    PageModel.delete(id);
    res.json({ success: true, data: null, message: "椤甸潰鍒犻櫎鎴愬姛" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鍙傛暟楠岃瘉澶辫触", details: error.errors });
    console.error("pages delete error:", error);
    res.status(500).json({ success: false, error: "鍒犻櫎椤甸潰澶辫触" });
  }
});

router.get("/:id/records", (req: Request, res: Response) => {
  try {
    const pageId = IdParamSchema.parse(req.params.id);
    const page = assertFormPage(pageId, req.userId!);
    if (!page)
      return res.status(404).json({ success: false, error: "椤甸潰涓嶅瓨鍦?" });
    const queryPage = z.coerce.number().int().positive().optional().default(1).parse(req.query.page);
    const pageSize = z.coerce.number().int().positive().max(100).optional().default(20).parse(req.query.pageSize);
    const result = FormRecordModel.listByPage(pageId, { page: queryPage, pageSize });
    res.json({ success: true, data: { items: result.items, total: result.total, page: queryPage, pageSize } });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鍙傛暟楠岃瘉澶辫触", details: error.errors });
    if ((error as Error).message === "NOT_FORM_PAGE")
      return res.status(400).json({ success: false, error: "鍙兘鍦ㄨ〃鍗曢〉闈㈡煡鐪嬭褰?" });
    console.error("pages record list error:", error);
    res.status(500).json({ success: false, error: "鑾峰彇琛ㄥ崟璁板綍澶辫触" });
  }
});

router.post("/:id/records", (req: Request, res: Response) => {
  try {
    const pageId = IdParamSchema.parse(req.params.id);
    const page = assertFormPage(pageId, req.userId!);
    if (!page)
      return res.status(404).json({ success: false, error: "椤甸潰涓嶅瓨鍦?" });
    const body = CreateRecordSchema.parse(req.body);
    const record = FormRecordModel.create({ page_id: pageId, values: body.values, created_by: req.userId!, sort_order: body.sort_order });
    res.status(201).json({ success: true, data: record, message: "璁板綍宸叉坊鍔?" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鍙傛暟楠岃瘉澶辫触", details: error.errors });
    if ((error as Error).message === "NOT_FORM_PAGE")
      return res.status(400).json({ success: false, error: "鍙兘鍦ㄨ〃鍗曢〉闈㈡坊鍔犺褰?" });
    console.error("pages record create error:", error);
    res.status(500).json({ success: false, error: "鏂板璁板綍澶辫触" });
  }
});

router.put("/:id/records/:recordId", (req: Request, res: Response) => {
  try {
    const pageId = IdParamSchema.parse(req.params.id);
    const recordId = IdParamSchema.parse(req.params.recordId);
    const page = assertFormPage(pageId, req.userId!);
    if (!page)
      return res.status(404).json({ success: false, error: "椤甸潰涓嶅瓨鍦?" });
    const body = UpdateRecordSchema.parse(req.body);
    const record = FormRecordModel.update(recordId, pageId, body);
    if (!record)
      return res.status(404).json({ success: false, error: "璁板綍涓嶅瓨鍦?" });
    res.json({ success: true, data: record, message: "璁板綍宸叉洿鏂?" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鍙傛暟楠岃瘉澶辫触", details: error.errors });
    if ((error as Error).message === "NOT_FORM_PAGE")
      return res.status(400).json({ success: false, error: "鍙兘鍦ㄨ〃鍗曢〉闈㈢紪杈戣褰?" });
    console.error("pages record update error:", error);
    res.status(500).json({ success: false, error: "鏇存柊璁板綍澶辫触" });
  }
});

router.delete("/:id/records/:recordId", (req: Request, res: Response) => {
  try {
    const pageId = IdParamSchema.parse(req.params.id);
    const recordId = IdParamSchema.parse(req.params.recordId);
    const page = assertFormPage(pageId, req.userId!);
    if (!page)
      return res.status(404).json({ success: false, error: "椤甸潰涓嶅瓨鍦?" });
    const deleted = FormRecordModel.delete(recordId, pageId);
    if (!deleted)
      return res.status(404).json({ success: false, error: "璁板綍涓嶅瓨鍦?" });
    res.json({ success: true, message: "璁板綍宸插垹闄?" });
  }
  catch (error) {
    if (error instanceof z.ZodError)
      return res.status(400).json({ success: false, error: "鍙傛暟楠岃瘉澶辫触", details: error.errors });
    if ((error as Error).message === "NOT_FORM_PAGE")
      return res.status(400).json({ success: false, error: "鍙兘鍦ㄨ〃鍗曢〉闈㈠垹闄よ褰?" });
    console.error("pages record delete error:", error);
    res.status(500).json({ success: false, error: "鍒犻櫎璁板綍澶辫触" });
  }
});

export default router;
