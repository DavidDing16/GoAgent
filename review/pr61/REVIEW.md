# PR #61 独立技术与语义质量审查

审查日期：2026-10-15（北京时间）。审查对象固定为 `7d2c70b463b2cc0fcf2483ec32128e15d856beec`，基线 `6debe9e431a6761c003f05c975c0a9b8d37f8fbc`。本分支只新增审查材料，没有修改产品代码或原 PR，也没有向维护者发布评论或评审。

**合并建议：建议修复后合并。当前存在两项可复现的问题，修复后还应完成小规模独立语义验收。工程检查通过不能替代这一验收。**

## 最新状态与范围

通过 GitHub 插件核对：PR 开放、非 draft、未合并、mergeable=true；头提交未变，59 文件，+5578/-194。没有讨论、行内评论或提交评审，没有指定评审人。六项该提交的 GitHub 检查均 success，包括三平台 typecheck/build、两平台 P0 readiness 和网站构建；这是历史 CI，不是本次执行结果。

已检查完整变更清单并重点追踪：teacherAgent 工具集成、currentMoveResponsePolicy、boardGroupRelations、ownDevelopment、moveConcepts、moveBoardEffects、globalPriorityEvidence、analysisReuse、ownership、知识匹配降级、toolExecutionHistory、initialBoardCapture 和评测/盲审脚本。没有重复已实现的颜色视角修正、forced 来源保护或潜在联系标记修正。

## 1. [P1] 大串的气清单会截掉当前手目的证据

位置：

- [moveConceptEvidence.ts:86–101](https://github.com/DavidDing16/GoAgent/blob/7d2c70b463b2cc0fcf2483ec32128e15d856beec/src/main/services/teacher/moveConceptEvidence.ts#L86-L101)
- [teacherAgent.ts:630–636](https://github.com/DavidDing16/GoAgent/blob/7d2c70b463b2cc0fcf2483ec32128e15d856beec/src/main/services/teacherAgent.ts#L630-L636)，预算常量在510行。

`candidateOwnDevelopment` 前置了推荐点的发展证据，但没有同样前置**当前实战点**的目的证据。返回对象先放 `moveEffects` 和所有 `candidateMoveEffects`，再放 `boardGroups`、概念 prompt 和 entries。大串的 liberties 在相邻串、结果串、libertyChanges before/after 等位置重复，可能耗尽18,000字符截断预算。

独立反例见 `combInput()` 和 `transport-probe.mjs`：19路88子摆子局面，黑棋左侧形成有很多气的梳状串，右侧黑R3/R4受到白Q3/S3/Q4接触；本手黑R7，根候选C10/E10/R7。局部模拟认定本手有效，概念层识别出R4为锚点的 own-development 和 side-extension 假设。整个工具 envelope 按生产相同的 pretty JSON 序列化后68,645字符，`boardGroups` 到第30,973字符才出现。18k前缀没有当前手“自身出头”证据。该构造是合法棋盘规则反例，不代表真实KataGo会给出上述候选排名；触发点是合法结构与允许的候选输入下的传输行为。

影响：模型仍看得到全盘坐标和一部分落子效果，却收不到本PR专门计算出的当前手竞争目的与反证，且后续候选效果也可能被截断。这证明证据丢失，**没有证明模型每次都会讲错**。现有截断测试仅验证坐标和推荐点发展投影，未覆盖本手目的。

最小修复建议：在冗长 effects/graph 前放一个有预算的当前手证据摘要，包括自身发展、区域目的、竞争解释及其 status/限制；推荐点的关键效果也应紧凑投影。保留完整坐标与全局比较。对完整串/气清单按结构压缩或省略，并明确 omitted；不要只调大总预算、裸切字符串，或丢掉反证。用真实工具 envelope 验证18k内摘要完整、可解析；大串、多个候选及区域目的都需覆盖。

## 2. [P2] 本地候选同时满足“显著差”与“接近首选”

位置：[globalPriorityEvidence.ts:120–136](https://github.com/DavidDing16/GoAgent/blob/7d2c70b463b2cc0fcf2483ec32128e15d856beec/src/main/services/teacher/globalPriorityEvidence.ts#L120-L136)，叙述选择见138–175行。

显著损失是 `scoreGap >= 3 OR 非饱和winrateGap >= 8`；而 nearBest 是 `scoreGap <= 1 OR 非饱和winrateGap <= 2`。指标不一致时，两个结论可同时为真。nearBest 随后被当作肯定证据，输出“本局部仍可处理”“与首选接近”，并阻止 global-priority。

独立数值反例，黑棋第77手F6，首选P15为90%/+10目，本地G6为89%/0目：差10目，却因胜率仅差1个百分点被标nearBest=true。反向反例：G6为55%/+9.5目，胜率差35个百分点，却因目差只差0.5仍为true。每个候选200 visits，root600 visits，confidence=high，没有饱和或弱搜索降级。这里采用合成估值测试判定逻辑，没有声称真实引擎已输出这些值。

这是与本文件既定显著性政策不一致的分类问题。原有测试明确把“一个指标接近、另一个显著较差”的情况判为nearBest；因此不是简单漏测，而是政策/测试需要一起修改。没有真实引擎分布数据，不能估计发生频率。

最小修复建议：只有两项适用指标均接近时才给 nearBest 肯定标签，例如 `scoreGap<=1 && (saturated || winrateGap<=2)`。指标冲突且无法解释时标undetermined，继续阻止“整个局部不重要”的绝对结论，不能因为去掉nearBest就自动断言局部没有好棋。添加黑白视角、饱和区间和指标冲突控制；更新原有OR预期。该建议修复分类自洽性，不宣称证明真实围棋优先级。

## 其他审查判断

- 真实正交串用邻接搜索构建；潜在联系没有合并真实串，明确为potential-not-connected。独立尖关系及连接控制未发现把潜在连接直接当实际连接的代码事实错误。
- 棋盘即时提子、合串与自杀模拟通过独立规则对照。ko探测明确不验证历史劫禁，不能据此说立即回提合法。
- 争头/分割/自身发展仍来自几何、边线、空路径和附近棋子数量。代码保留hypothesis与counterEvidence；这避免了结构层面的确定断言，却不能证明它就是棋手的主要目的。梳状等对抗局面只用于逻辑，不适合作为意图准确率样本。
- 当前手20–60字策略有竞争证据和限制，但示例“这手飞目的是封锁对方大龙”仍可能诱导模型选定主目的；没有实际模型运行，不把这项风险记为已确认的输出缺陷。
- 先知识后加深分析的更新目前主要依靠提示；工具完成门禁记录的是工具名，并非证据版本。属于后续加固项，本次未复现最终回答因此出错，不列为阻断发现。
- 没有访问未提交SGF、反馈、模型权重或凭据。`data/katago`只有README和manifest，没有可用binary/model；没有启动配置好的Electron/CDP评测实例。没有做真实KataGo/LLM、图文对照或发行包验证。

## 本次实际验证

| 检查 | 本次结果 | 能证明什么 |
|---|---|---|
| `pnpm test` | 392/392通过 | 已提交工程回归通过 |
| `pnpm typecheck` | 通过 | TypeScript类型一致 |
| `pnpm build` | 通过 | 生产构建成功，不等于打包发行成功 |
| `python -m unittest discover -s scripts/tests` | 11/11通过 | Python采集/评审服务回归通过 |
| `node --test review/pr61/audit.test.mjs` | 10通过、2失败 | 两个新增预期行为测试暴露上述问题；原PR没有被修改 |
| 100手固定种子13路合法走子 | 捕获结果全部与独立replay实现一致 | 棋盘规则层对照，不是目的准确率 |
| 六组合法合成局面及换色 | 规则控制通过 | 提子/合串/潜在关系/阻挡/自身发展字段 |

复现新增失败：`node --test review/pr61/audit.test.mjs`。只运行具体风险：`node review/pr61/transport-probe.mjs`。审查测试不在原 `tests/*.test.mjs` glob 中，避免改变原PR测试口径。`audit-results.txt`保存本次原始测试输出。

## 独立语义验收设计

`fixtures.mjs`为本次新写的合成输入，没有读取或复用开发回归样本；`independent-records.json`和`sgf/`含6组合法局面、换色后共12份fixture，附SHA256，使用已有`anonymousSgf`与`replayResearchBoard`生成/核对。另有自杀、占据两组弃权控制，不送入要求合法棋谱的pipeline。换色是变形控制，**不能把12份当12个独立统计样本**。未提交的历史开发数据不可见，无法证明与所有私有数据绝无重叠；这些也不是经过专家认证的意图金标。

三维分开评价，均保留原始模型文本：

1. **代码逻辑**：坐标/颜色/提子/真实串数量、before时点、branch和forced来源、截断后证据完整性。精确断言；占据/自杀应弃权。
2. **语言自然**：0=明显不自然或堆报告；1=可读但冗余；2=自然、适龄、主线清楚。另记字数、句数和是否遵守详略。语言分不计入围棋准确率。
3. **围棋判断**：0=事实或战术错误/无证据确定断言；1=合理假设但主要目的不清；2=主体、目的、限制与独立专家意见一致。分开标注“潜在→实际连接”“几何→必然战术”“死活/强制/先手无依据”。专家允许多个目的，不强求唯一术语；无法确定的样本记未定，不算正确。

下一轮真实验收需另收集未参与修改的棋局：提子与合串优先、弱棋出头/厚棋展开竞争、敌串几何夹在两侧却没有实际切断、劫禁/反事实循环、局部好点与远处首选竞争、胜率饱和、无主目的可确认等场景。先冻结样本与预期边界，再生成，失败不能替换样本。至少两位合格棋手独立盲评并记录分歧；模型不能看源评论与评分表。把开发和测试按整盘隔离，修复使用过的样本转回归。

图文对照必须保持相同SGF、同一KataGo证据、模型/设置/提示相同，仅改变图像输入；当前生产门禁要求图像，不能把绕过门禁的文字分支直接当正式产品。记录调用失败/重试、随机顺序和原文，禁止挑选“最好一次”。现有pipeline依赖CDP和实际provider，不把fixture导出成功写成全流程评测成功。若继续按本次发现调整代码，应另留一批未参与修复的最终验收局面。

结论：两个可重现问题值得合并前解决。独立规则控制总体正常，现有代码对“假设”和“已验证效果”的区分有实质改进；本次没有足够条件认定生成讲棋的意图准确率已经达标。
