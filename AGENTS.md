# AGENTS

<skills_system priority="1">

## Available Skills

<!-- SKILLS_TABLE_START -->
<usage>
When users ask you to perform tasks, check if any of the available skills below can help complete the task more effectively. Skills provide specialized capabilities and domain knowledge.

How to use skills:
- Invoke: `npx openskills read <skill-name>` (run in your shell)
  - For multiple: `npx openskills read skill-one,skill-two`
- The skill content will load with detailed instructions on how to complete the task
- Base directory provided in output for resolving bundled resources (references/, scripts/, assets/)

Usage notes:
- Only use skills listed in <available_skills> below
- Do not invoke a skill that is already loaded in your context
- Each skill invocation is stateless
</usage>

<available_skills>

<skill>
<name>algorithmic-art</name>
<description>当用户要求用代码创作艺术、生成艺术、算法艺术、flow fields、粒子系统、p5.js 视觉效果时使用。适合生成原创的程序化视觉作品与可调参数的艺术实验。Use this skill when the user asks for code-based art, generative art, algorithmic art, flow fields, particle systems, or p5.js visual experiments. Create original artwork rather than copying living artists or copyrighted styles.</description>
<location>project</location>
</skill>

<skill>
<name>brand-guidelines</name>
<description>当任务涉及品牌视觉、品牌色、字体规范、公司风格、界面或文档需要统一品牌调性时使用。Use this skill when brand colors, typography, visual consistency, or company design standards should be applied to an artifact.</description>
<location>project</location>
</skill>

<skill>
<name>canvas-design</name>
<description>当用户要制作海报、封面、静态视觉、PNG、PDF 设计稿或其他非交互式视觉作品时使用。Use this skill to create polished static visual design pieces such as posters, covers, and art in PNG or PDF formats. Always create original visuals.</description>
<location>project</location>
</skill>

<skill>
<name>claude-api</name>
<description>当任务涉及 Claude API、接口调用、消息格式、模型参数、流式输出、SDK 接入或相关示例时使用。Use this skill when working with the Claude API, SDK integration, request formats, streaming, parameters, or implementation examples.</description>
<location>project</location>
</skill>

<skill>
<name>doc-coauthoring</name>
<description>当用户要撰写文档、方案、技术设计、决策记录、提案、说明文档，或希望协作打磨文档结构与内容时使用。Use this skill for co-authoring structured documentation such as specs, proposals, decision docs, and technical documents.</description>
<location>project</location>
</skill>

<skill>
<name>docx</name>
<description>当用户提到 Word、word 文档、.docx，或要创建、读取、编辑、整理、替换内容、插入图片、输出正式报告/信函/模板时使用。Use this skill whenever a Word document (.docx) needs to be created, read, edited, reorganized, or polished. Do not use for PDFs, spreadsheets, or unrelated coding tasks.</description>
<location>project</location>
</skill>

<skill>
<name>frontend-design</name>
<description>当用户要优化页面视觉、重做 UI、提升界面设计感、调整排版、配色、层次、组件观感时使用。Use this skill when reshaping an existing UI or creating a more intentional and distinctive frontend visual design.</description>
<location>project</location>
</skill>

<skill>
<name>internal-comms</name>
<description>当用户要写内部沟通材料，如周报、项目进展、状态更新、FAQ、事故复盘、领导汇报、团队公告等时使用。Use this skill for internal communications such as status reports, leadership updates, incident reports, newsletters, and project updates.</description>
<location>project</location>
</skill>

<skill>
<name>mcp-builder</name>
<description>当任务是开发 MCP 服务、设计 MCP 工具、封装外部 API、用 FastMCP 或 Node/TypeScript MCP SDK 构建集成时使用。Use this skill when building MCP servers or designing high-quality MCP tools for external services.</description>
<location>project</location>
</skill>

<skill>
<name>pdf</name>
<description>当用户提到 PDF、pdf、读取 PDF、总结 PDF、提取文字/表格、合并 PDF、拆分 PDF、旋转页面、加水印、OCR、生成 PDF、填写表单时使用。Use this skill whenever a PDF is the input or output, including reading, summarizing, extracting, merging, splitting, OCR, watermarking, or generating PDF files.</description>
<location>project</location>
</skill>

<skill>
<name>pptx</name>
<description>当用户提到 PPT、幻灯片、演示文稿、deck、slides、.pptx，或要创建、读取、编辑、合并、拆分、整理演示内容时使用。Use this skill any time a PowerPoint file (.pptx) is involved as input or output, including creating, parsing, updating, or reorganizing presentations.</description>
<location>project</location>
</skill>

<skill>
<name>skill-creator</name>
<description>当用户要新建 skill、修改 skill、优化 skill 描述、提高触发率、做 skill 评测或性能对比时使用。Use this skill when creating, editing, evaluating, or optimizing skills and their trigger descriptions.</description>
<location>project</location>
</skill>

<skill>
<name>slack-gif-creator</name>
<description>当用户要制作 Slack 用的 GIF、动图、短动画，并希望符合 Slack 常见尺寸与播放约束时使用。Use this skill to create animated GIFs optimized for Slack, including concepting, constraints, and export guidance.</description>
<location>project</location>
</skill>

<skill>
<name>template</name>
<description>用于占位或示例。若你准备新增 skill，请把这里替换成清晰的中英双语触发描述。Placeholder skill entry. Replace this description with a real bilingual trigger description before relying on it.</description>
<location>project</location>
</skill>

<skill>
<name>theme-factory</name>
<description>当用户要给网页、文档、幻灯片、报告、落地页等应用统一主题、配色、字体与视觉风格时使用。Use this skill when applying or generating themes for artifacts such as slides, docs, reports, or landing pages.</description>
<location>project</location>
</skill>

<skill>
<name>web-artifacts-builder</name>
<description>当用户要构建较复杂的 Web artifact、React 页面、Tailwind/shadcn 界面、多组件交互、带状态管理或路由的网页作品时使用。Use this skill for complex HTML/React web artifacts that need multiple components, state, routing, or shadcn/ui. Do not use for simple single-file pages.</description>
<location>project</location>
</skill>

<skill>
<name>webapp-testing</name>
<description>当用户要测试本地网页、验证前端功能、复现界面问题、看浏览器日志、截图、检查交互是否正常时使用。Use this skill for testing local web apps with browser automation, frontend verification, screenshots, and debugging browser behavior.</description>
<location>project</location>
</skill>

<skill>
<name>xlsx</name>
<description>当用户提到 Excel、表格、.xlsx、.xlsm、.csv、.tsv，或要读取、整理、清洗、修复、增加列、算公式、排序、图表、导入导出表格时使用。Use this skill whenever a spreadsheet file is the main input or output, including cleaning, editing, formatting, calculating, charting, or converting tabular files.</description>
<location>project</location>
</skill>

</available_skills>
<!-- SKILLS_TABLE_END -->

</skills_system>
