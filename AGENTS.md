# AGENTS

## 项目级 Skills

本项目所有 Agent Skill 统一存放在：

```text
.agents/skills/<skill-name>/SKILL.md
```

完整的技能清单、作用、适用场景、加载步骤和新增规范见 [`SKILLS.md`](./SKILLS.md)。

## 使用规则

1. 开始任务前，判断是否有匹配的 skill 可以提高完成质量。
2. 只加载当前任务所需的最小 skill 集合，不要一次性加载所有 skill。
3. 支持自动发现的 Agent 会从 `.agents/skills` 读取项目级 skill。
4. 需要手动加载时，使用：

   ```bash
   npx openskills read <skill-name>
   ```

   多个 skill 可以使用逗号分隔：

   ```bash
   npx openskills read frontend-design,fixing-accessibility
   ```

5. 不要重复加载当前上下文中已经加载的 skill。
6. skill 中引用的 `references/`、`scripts/`、`assets/` 等路径，均相对于对应 skill 目录解析。
7. 项目规则、用户明确要求和安全约束优先于 skill 中的通用建议。
8. 新增或修改 skill 时，只允许使用 `.agents/skills`，不要再创建 `.claude/skills` 或其他项目级 skill 目录。

## 常用选择

- 页面视觉设计：`frontend-design`
- UI 快速清理：`baseline-ui`
- 现有界面只读审计：`improve-ui`
- 无障碍：`fixing-accessibility`
- 动画性能：`fixing-motion-performance`
- SEO 与页面元信息：`fixing-metadata`
- 本地 Web 测试：`webapp-testing`
- Word：`docx`
- PDF：`pdf`
- Excel/CSV/TSV：`xlsx`
- PPT/演示文稿：`pptx`
- Claude/Anthropic API：`claude-api`
- MCP 服务：`mcp-builder`
- Skill 开发：`skill-creator`

## 代码与验证

- 修改代码前先读取相关文件和上下文。
- 优先进行最小范围、根因导向的修改。
- 修改后运行与变更最相关的诊断、Lint、测试或构建命令。
- 不要覆盖或回退用户未要求处理的现有改动。
- 不要提交 Git commit，除非用户明确要求。
