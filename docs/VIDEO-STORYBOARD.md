# V-MAX — Demo video 导演脚本

版本：2026-09-08 · 目标成片 04:20 · 英文旁白 / 中文制作说明

这是可以逐镜头执行的制作稿，不是已导出的视频。31 个镜头覆盖整条时间线；每个镜头写清「看到什么、听到什么、怎样动、在哪里录」。这里的“每一帧”按制作上可用的分镜和关键帧拆解，不需要人工设计 7,800 张图片。

## 1. 先定下这条片的主张

**The person who plans the escape should get to enjoy it, too.**

目标观众：评委。目标用户：朋友或家庭小团体中，持续负责规划、回答问题与临时协调的默认组织者。

不要做成 App 功能巡礼。只讲两个有前因后果的故事：

1. **出发前：** 发现原定博物馆时间冲突 → 看依据和替代安排 → 各自确认 → 同一份行程更新。
2. **旅途中：** 朋友有会议 → 在群聊询问他的个人 Agent → 检查共享边界和转场时间 → 确认重聚。

分账用作一个短而具体的补充；机票比较与 Wallet 只给一个短镜头。不要把语音、机场导航、Discover、收藏、Profile 每个页面都塞进去。

对参考片借鉴的是：留白、清楚的文字、平滑地放大产品、温暖的旁白。不是复制声音、音乐或照搬画面。

## 2. 用什么做

| 工具 | 这条片中负责什么 | 需要做到的程度 |
| --- | --- | --- |
| OBS Studio | 录制真实 App 操作、Orb 动画、确认前后结果 | 先做 10 秒试录并回放；浏览器画面和声音来源分别确认 |
| CapCut Desktop | 主剪辑、文字、裁切、放大、透明度与位置动画、配乐、字幕、导出 | 整条基础版本用它完成，不依赖复杂模板 |
| Figma，或沿用你熟悉的 Canva | 开场问题卡、章节标题、简短技术说明、片尾 | 只需 5 类平面素材；不重新画整套 App |
| 录音工具 / 有合适使用许可的 TTS | 温暖自然的英文旁白 | 一段一段录；不用模仿或克隆参考片的具体人物声音 |
| After Effects（可选） | 如果有人熟悉，可精修 Orb 与开场卡片的运动 | 不是本片交付前提；不必为此现在学习一整套软件 |

上述是建议的制作组合，不是对两条参考视频实际制作软件的判断。CapCut 的关键帧与曲线、OBS 的窗口录制、After Effects 的动态图形能力可参见：[CapCut 官方](https://www.capcut.com/tools/desktop-video-editor)、[OBS 官方指南](https://obsproject.com/kb/quick-start-guide)、[After Effects 官方](https://www.adobe.com/products/aftereffects.html)。功能和素材是否收费，以你账户内实际显示为准；这份脚本不依赖付费模板。

## 3. 统一的视觉和声音

### 画面规格

- 1920 × 1080，16:9，30 fps。目标总长 260 秒，即 F0000–F7799。
- 下文时间区间采用「含起点、不含终点」。例如 00:00–00:07 是 F0000–F0209；下一镜从 F0210 开始。
- 安全边距左右至少 100 px；底部约 100 px 留给字幕。关键按钮不要压在字幕后面。
- **影片外层是珍珠白，App 内层保留现在的深色玻璃。** 两者像白色展台上的一件产品，不把 App 染白，也不每个镜头换主题。
- 外层背景 #F6F5F2；文字 #1C1D22；唯一主强调色 #8B7CFF。错误和成功保留 App 本来的提示样式。
- 影片标题使用 Inter 或可合法使用的近似无衬线字体；不要为了“Apple 感”在 Windows 上强行找来源不明的 SF Pro 字体。
- 大标题 72–88 px，辅助句 32–40 px，字幕约 38–42 px。披露标签建议至少 26 px、足够对比，不能藏成看不见的小字。
- 真实 App 全景放右侧，约 400–430 px 宽、850–900 px 高；左侧一句重点。阅读细节时改成 850–1100 px 宽的局部特写，不同时摆满四部手机。
- 使用圆角的 App 画面即可，不必加假 iPhone 状态栏、3D 手机模型或复杂硬件外框。

### 只使用四种运动

1. **标题进场：** 0.45 秒，透明度 0 → 100%，向上移动 20 px；缓入缓出。
2. **产品出现：** 0.6 秒，从基准尺寸的 96% → 100%，透明度 0 → 100%；随后停稳。
3. **阅读特写：** 0.6 秒放大到关键区域，停留至少 2.5 秒；不要一直漂浮或缩放。
4. **同位切换：** 两段录屏对齐同一按钮或卡片，用直接剪切 / 0.15 秒淡化；不使用旋转、闪白和夸张弹跳。

CapCut 中用位置、缩放、透明度的关键帧实现。百分比以该素材在画面中设定好的基准大小为准，不代表未经缩放的原始视频尺寸。不要为了做“卡片变成球”硬做复杂变形；卡片淡出、同位置 Orb 淡入就足够。

### 声音

- 一个主旁白即可：自然、亲切、略带笑意，不要广告式亢奋，也不要每个词都气声。
- 每句有效说话速度约 120–135 英文词/分钟；句末留 0.5–1 秒。时间格包含点击、阅读和停顿，不是旁白必须连续说满。
- 现阶段不用给所有 Agent 配不同声音。真实交互录屏与旁白分开，避免让人以为原型已接通实时语音。
- BGM：有使用许可的轻 ambient / 轻电子，无歌词；人声出现时明显降低。点击音、一个轻柔提醒音、确认音就够，不要每个字都配 whoosh。
- 不直接抽取参考视频的声音或音乐。字幕逐句出现，不使用每个词弹跳的短视频字幕。
- 下方字幕只转写旁白；画面大字只保留重点，不把整段旁白再铺一次。

### 真实性标识

从第 6 镜开始，实际演示区域旁常驻清楚的 **Interactive prototype · simulated Agent/data**。这是影片的说明层，不是伪造的 App 状态。

局部特别标识：其他成员同意保留 **DEMO**；收据保留 **Sample receipt**；机票保留 **Illustrative fares / Unbooked**。不能裁掉这些原有说明来营造真实上线的错觉。现有代码的本地更新是真实操作；多成员通信、Agent 推理和在线数据不是已接通服务。

## 4. 完整逐镜头脚本

旁白中的英文可以直接录音。旁白也单独整理在 [VIDEO-VOICEOVER.md](VIDEO-VOICEOVER.md)。每镜的“关键帧”均从该镜开始计时，所有未列出的时间让画面停稳供阅读。

### 01 · 00:00–00:07｜旅行里总有那个人

**英文旁白：** Every group trip has that one person.

- 画面：珍珠白背景，四个小头像 / 姓名圆片横排。中间一个旁边出现小字 `The organiser`。不是人物采访，也不用买旅游素材。
- 屏幕大字：`Every trip has that one person.`
- 关键帧：0–0.5 秒留白和轻音乐；0.5–1.1 秒四个头像依次淡入；1.2–1.7 秒大字浮现；3 秒时组织者旁亮起一小点；停留至 7 秒。
- 制作：Figma/Canva 做一张底稿，头像和标题分层；CapCut 做淡入。头像可用姓名首字母，不虚构真实采访者。

### 02 · 00:07–00:14｜不是只负责订一次行程

**英文旁白：** The one who plans it. Answers every question. And fixes things when plans change.

- 画面：围绕同一个组织者，先后出现三条简短问题卡：`Where are we going next?`、`What time is Joshua free?`、`Wait — is it closed?`
- 关键帧：0.2、1.6、3.0 秒各出现一张；卡片从下方 16 px 移入，0.35 秒完成。第 3 张出现后停止，不继续制造杂乱。
- 制作：三张浅灰圆角卡 + CapCut 位置/透明度。小标签 `Illustrative questions` 表明这不是用户访谈截图。
- 声音：第一张卡一个很轻的通知音，后两张不必重复。

### 03 · 00:14–00:22｜让痛点有来源

**英文旁白：** This began with our own trips, where sharing the itinerary still meant answering the same questions.

- 画面：左边一张简化的行程表；右边仍有两条追问。底部短句 `A shared plan. The same follow-ups.`
- 关键帧：0–0.5 秒从上一镜平移到左侧行程；1 秒出现追问；3 秒短句淡入；其余停留。
- 制作：原创平面示意，不放伪造的 WhatsApp 聊天或未授权家人照片。底部可写 `Based on our team's travel experience`。
- 重点：不使用「所有人都这样」或未经测量的压力/时间统计。

### 04 · 00:22–00:30｜定义真正要解决的事

**英文旁白：** For the default organiser, the work doesn't end when the plan is made.

- 画面：前面的卡片退去，剩一句 `A plan is not the end of the work.` 下方小字 `For the person coordinating a group escape.`
- 关键帧：0–0.4 秒其他素材淡出；0.5–1.1 秒标题出现；5 秒时文字渐淡，为产品留空间。
- 制作：纯 CapCut 文字。不要加复杂竞品 Logo 墙；视频不声称其他产品完全没有这些功能。

### 05 · 00:30–00:39｜第一次认识 V-MAX

**英文旁白：** Meet V-MAX. A travel companion designed to share that responsibility.

- 画面：沿用 App 的紫色 Orb，居中、约 220 px。下方 `V-MAX`，再下一行 `More of the trip. Less of the chasing.`
- 关键帧：0–0.6 秒 Orb 从 96% 淡入；1.0 秒品牌名；2.0 秒小句；6–7 秒 Orb 向右侧产品区平移，为下一镜匹配转场。
- 制作：录真实 Orb 循环并保留其深色小圆角承载区，或导出已有品牌素材；不要从参考片盗取动态球。背景仍珍珠白。
- 声音：这里给旁白留一个完整句末停顿，是第一次产品记忆点。

### 06 · 00:39–00:48｜直接展示行动，不从输入框开始

**英文旁白：** This prototype turns requests into work you can review, approve, and see in your journey.

- 实机：打开底部 `Ask V-MAX`，若出现介绍，先录 `Continue` 再进入行动工作区。展示 `Compare flights` 和 `Coordinate us`。
- 画面大字：`A request. A proposal. A change you approve.` 三行依次点亮，不画新功能。
- 关键帧：0–0.6 秒全景出现；2 秒放大行动入口；5 秒镜头停在 `Coordinate us` 与说明，而不是一直展示空白输入栏。
- 制作：OBS + CapCut；从此镜起保留原型披露标签。

### 07 · 00:48–00:55｜建立同一条旅行故事

**英文旁白：** Let's follow four friends travelling to Tokyo, then Fuji.

- 实机：Home 的 `Fuji is calling.`，日期 14–20 Sept，4 travellers。
- 屏幕辅助字：`Tokyo → Fuji · Four travellers`。不要把富士山画面标成东京市区。
- 关键帧：0–0.6 秒切回 Home 全景；1.5 秒缓慢移到封面日期和人数；4 秒停稳。
- 制作：真实录屏，不添加全屏旅游 stock montage。

### 08 · 00:55–01:03｜出发前，问题先出现

**英文旁白：** The day before departure, there's a problem with their museum visit.

- 实机：Home 滚动到 Trip updates 的闭馆卡片。
- 画面章节标签：`13 SEPT · BEFORE DEPARTURE`；原界面 `Closed Monday. We caught it early.` 保留。
- 关键帧：0–0.5 秒章节标签；1–3 秒滚到卡片；3–3.6 秒放大卡片；停留。
- 制作：OBS 录完整滚动；剪掉无关等待，但不把原型模拟提示剪掉。

### 09 · 01:03–01:12｜不是让 AI 凭空断言

**英文旁白：** Their Monday plan conflicts with the museum's reference opening information.

- 实机：点击审阅入口，显示原计划与引用资料；展开有来源的说明，必要时切到预先录好的官方页面相关部分。
- 屏幕大字：`Check the source.`
- 关键帧：0.5 秒点击；1.2–1.8 秒靠近来源/日期；2–7 秒停留阅读。
- 制作：使用真实来源画面，不重画成假新闻截图；明确是此演示情境的参考资料，不宣称系统正在实时抓取，也不把所有星期一都说成绝对闭馆。

### 10 · 01:12–01:21｜把建议说具体

**英文旁白：** V-MAX proposes another day, with the source and the change visible for review.

- 实机：方案 `Keep the museum. Change the day.`；默认未改动样例显示 17 Sept，11:30，4 travellers。
- 屏幕辅助字：`Keep the visit. Change the day.`
- 关键帧：0–0.6 秒平移到方案；1–4 秒看时间；4 秒轻淡框突出确认入口；不立刻点。
- 制作：CapCut 细线框只提示观看区域，不改写 App 数值。如果录制状态改变导致方案日期不同，先核对并同步字幕，不强行贴 17 Sept。

### 11 · 01:21–01:29｜你的同意不等于全员同意

**英文旁白：** Your approval is only your approval. The group plan stays unchanged while others decide.

- 实机：点 `Confirm my part`，停在 `Your approval is saved` / 等待其他成员的真实状态。
- 屏幕重点：`Nothing changes yet.`
- 关键帧：0.6 秒点击；1.5–2 秒放大等待说明；至少停留 3 秒。
- 制作：保留按钮和等待状态同框。这是产品控制权的证据，不要用动画直接跳到成功。

### 12 · 01:29–01:38｜清楚演示其他成员同意

**英文旁白：** Here, we simulate the other members agreeing. Only then does the visit move.

- 实机：明确点击 `Preview member approvals · DEMO`；看到已应用方案。
- 关键帧：0–2 秒让 DEMO 按钮可读；2.2 秒点击；4 秒出现结果；停留。
- 制作：不覆盖 DEMO 字样，不加入手机消息送达特效来假装联系到真人。旁白主动说明这是模拟。

### 13 · 01:38–01:45｜结果写进计划，不停在聊天里

**英文旁白：** The updated plan keeps one museum visit, on the new day. Nothing gets duplicated.

- 实机：`See the updated plan`，看到新日期的博物馆条目。另录原日期已移除该项，用小型前后切换说明。
- 关键帧：0.3 秒点击；1.5 秒停在新条目；4.5 秒可切原日期检查 1.5 秒；最后回新日期。
- 制作：两个真实状态剪接，不手绘假的成功计划。字幕以可见的操作结果为准。

### 14 · 01:45–01:53｜章节转换，别让时间线混乱

**英文旁白：** Now it's day two. Three friends are exploring. Joshua has a meeting.

- 实机：Journey 右上 `Demo · Before departure` → `Day 2 in Tokyo`；真实固定时钟为 15 Sept 17:00。
- 画面大字：`15 SEPT · DAY 2 IN TOKYO`；下方 `Different afternoons. One group.`
- 关键帧：0–2 秒显示章节选择并点击；2–3 秒标题淡入；4 秒切 Group。
- 制作：这是另一时刻的固定示例，不是闭馆事件紧接着发生。保留短暂的章节 UI 足以解释跳时。

### 15 · 01:53–02:02｜@ 的对象是朋友的个人 Agent

**英文旁白：** Instead of chasing him for an update, ask his Agent in the group chat.

- 实机：Group 输入 `@`；列表停留 2 秒，选 `Joshua’s Agent`；发送 `when are you free?`。
- 屏幕辅助字：`Ask his Agent. Not the organiser.`
- 关键帧：0.5 秒打开列表；0.5–2.5 秒停留；2.6 秒选择；3–6 秒完成简短输入与发送；最后等回复。
- 制作：录真实 @ 选择，不把四个装饰球画成已运行的 Agent 网络。输入太慢可剪去停顿，不把回复改成新内容。

### 16 · 02:02–02:11｜Agent 知道的是获准分享的信息

**英文旁白：** It can answer from the availability he chose to share.

- 实机：放大真实回复中的 `free from 18:15 on Day 2`，保留“不代表预订确认”的说明。
- 左侧大字：`Shared availability.` 下方 `Not unrestricted access.`
- 关键帧：0–0.6 秒进入局部特写；1–6 秒停稳；6 秒退一点，为下个问题留空间。
- 制作：不要额外展示他的私人日历、公司名字或房间号。

### 17 · 02:11–02:20｜隐私边界是一个看得见的动作

**英文旁白：** But ask for a private address, and it refuses. Being useful doesn't mean sharing everything.

- 实机：再 @ Joshua’s Agent，发送 `what is your exact work address?`；显示真实拒答：`An exact address is not shared with this group…`
- 屏幕重点：`Not shared. Not disclosed.`
- 关键帧：0–3 秒呈现已录好的输入与发送；3.5 秒框选拒答；至少停留 3 秒。
- 制作：剪掉重复打开输入框的等待可以，但不能改写拒答、造一个并不存在的权限弹窗。

### 18 · 02:20–02:29｜Split & Sync 的出场

**英文旁白：** Your Agent brings those shared constraints into a proposal: different afternoons, dinner together.

- 实机：发送 `@Joshua’s Agent when can we meet for dinner?`，看自己的 Agent 接续协调，打开消息方案入口 / `Find a time to reunite`。
- 画面标题：`Split & Sync`；小句 `Room for your plans. A way back together.`
- 关键帧：0–3 秒显示问答；3.5 秒打开方案；4.5–8 秒停在 `Different afternoons. Dinner together?`
- 制作：保持这是共享信息上的示例协调，不称为真实跨设备 A2A 通信。

### 19 · 02:29–02:38｜不要只展示“永远成功的 AI”

**英文旁白：** Six thirty is too early. Joshua needs time to get across town.

- 实机：选择 `18:30`，显示阻塞原因；确认按钮不可用。
- 屏幕辅助字：`18:30 · Too early`。
- 关键帧：0.5 秒点击 18:30；1–1.6 秒放大“cannot arrive before 18:50”的原因和禁用按钮；停留至末尾。
- 制作：不加红色全屏警报。一次淡框就够。这个镜头的价值是“方案会被检查”，不是给界面加戏。

### 20 · 02:38–02:47｜解释为什么 19:00 可以

**英文旁白：** Seven works within the sample availability and transfer allowance. You can inspect why.

- 实机：选择 `19:00`；展开 `Why this works · permissions & timing`，看共享空闲时间和授权状态。
- 屏幕重点：`19:00 · Check the reasoning`。
- 关键帧：0.5 秒切时间；1.5 秒展开；2–7 秒停在理由。不要一直来回切选项。
- 制作：不称这段转场时间为实时路况；是样例 allowance。

### 21 · 02:47–02:56｜授权和确认要完整

**英文旁白：** Members either approve, or delegate within their chosen limits. You still confirm your part.

- 实机：展示成员列表里的 `Agent authorised within shared limits` / `Member confirmation needed`。点当前实际出现的 `Confirm this plan` 或 `Confirm my part`。
- 关键帧：0–3 秒留给授权列表；3.5 秒点击；若仍有待同意成员，4–6 秒明确展示 DEMO 成员确认再执行；最后停在已应用结果。
- 制作：以录制会话的真实权限为准。不能为了镜头顺畅偷偷开启用户的分享权限。样例默认可演示有限授权；若没有，就走等待路径，并同步剪辑。

### 22 · 02:56–03:04｜“Agent 控制 App”的具体证明

**英文旁白：** Then the dinner appears in Plan and Route. One decision, reflected across the journey.

- 实机：点 `See the updated plan`，看到 19:00 晚餐；再点 Route，看到对应行程结果。
- 关键帧：0–3.8 秒 Plan；3.8 秒同位切到 Route；4.5–8 秒停稳。
- 画面重点：`Approved → Applied`，是影片说明，不伪装成系统通知。
- 制作：当前网页内相同状态更新，不说“所有人的手机已经同步”。无需打开外部打车软件，避免分散主线。

### 23 · 03:04–03:11｜一个轻巧的第二记忆点

**英文旁白：** Small details matter, too. Like splitting dinner by what everyone actually had.

- 实机：Journey → Budget → `Split a receipt`，打开 `Who had what?`。
- 屏幕大字：`Fair isn't always equal.`
- 关键帧：0–2 秒 Budget；2 秒点击；3–7 秒停在收据表单。
- 制作：不安排摄像头拍照镜头，因为原型没有 OCR；保留 sample 标签。

### 24 · 03:11–03:20｜份额是真正的可视化结果

**英文旁白：** This editable sample uses portions, not an equal split. Joshua had none, so he owes nothing.

- 实机：样例 Pizza MYR 64 的份额 `1 : 2 : 1 : 0`；Water MYR 4 的份额 `1 : 0 : 1 : 0`。保持原有未改样例以对上结果。
- 画面：先看 portion 输入，再看结果 `You 18 · Louise 32 · Simyee 18 · Joshua 0`。
- 关键帧：0–4 秒特写 Pizza 的不同份额；4–4.6 秒下移到成员金额；停留。
- 制作：不说从照片自动检测谁吃了多少。份额来自人可编辑的输入；不要只展示 Pizza 却把含 Water 的 68 元说成 Pizza 总价。

### 25 · 03:20–03:27｜分账同样要落地

**英文旁白：** Check the amounts, then save the split to the budget.

- 实机：看总计 MYR 68 → 点 `Save MYR 68 split` → Budget 出现该记录。
- 关键帧：0–2 秒金额停留；2.2 秒保存；3–7 秒预算记录。
- 制作：保留付款人信息；不制作“钱已转给朋友”的动画，没有真实付款。

### 26 · 03:27–03:35｜点到为止的其他能力

**英文旁白：** The same workspace also demonstrates flight comparisons and a wallet shortlist, clearly marked as unbooked.

- 实机：前 4 秒显示 Compare flights 的样例费用/行李/四人总价；后 4 秒显示保存到 Wallet 的 **Unbooked** shortlist。
- 制作：先另外完整录好比较 → 确认 shortlist → Wallet 的流程，成片只取两个结果特写。必须保留 `Illustrative fares` 与 `Unbooked`；不要把样例机票换成真实已付款登机牌。
- 关键帧：0–0.4 秒前图进入；3.8–4.2 秒同位切后图；其他时间不再运动。
- 取舍：如果主故事需要更多阅读时间，可删本镜，把 8 秒分给来源与确认；不要挤掉可行性说明。

### 27 · 03:35–03:46｜现在已经做到哪里

**英文旁白：** Today, this is a React and TypeScript web prototype. The local approvals, itinerary updates, and expense calculations work.

- 画面：左上 `Working today`；右侧真实 Plan 缩小。左下只列三行：`Approval & constraint checks`、`Shared local Journey state`、`Editable expense calculation`。
- 底部技术行：`React · TypeScript · Vite / Vercel`。
- 关键帧：0–0.5 秒产品右移；1、2.5、4 秒三行依次出现；余下停稳。
- 制作：Figma/Canva 或 CapCut 文字均可。这里的 shared local 指同一浏览器页面共同使用的状态，不是已完成云端多人同步。
- 可选：只有临交片重新运行并核实后，才在小字放最新测试数量；本片不依赖测试数字。

### 28 · 03:46–03:57｜透明说明，而不是片尾藏免责

**英文旁白：** Agent replies, other members' responses, voice, and travel data are simulated. Live AI and external services are not connected yet.

- 画面：同一白底版式，标题 `Simulated in this prototype`；三行 `Agent & member responses`、`Voice & travel data`、`No live bookings or payments`。
- 关键帧：0–0.4 秒替换左侧内容；此后不要动态闪烁，让评委读完。
- 制作：不要写“production-ready”。可以在右侧保留具体刚演示过的 Agent 卡片，帮助他们理解模拟的是哪一层。

### 29 · 03:57–04:08｜有可信的下一步，也有验证方法

**英文旁白：** Next, we'd add authenticated members, permission-checked shared storage, and source-backed proposals, then test whether organisers face fewer follow-ups and less coordination work.

- 画面：标题 `Next: a small-group pilot`。分两块简短文字，不放难读的架构全图。
- 第一块 `Build`：`Supabase Auth + permission-checked data` / `Source-backed Agent proposals`，注明 `Proposed · not connected`。
- 第二块 `Measure`：`Follow-up questions` / `Coordination time` / `Task completion`。
- 关键帧：0.5 秒 Build 出现；4 秒 Measure 出现；停稳。
- 制作：这些是下一阶段计划和验证指标，不宣称已测得改善。来源检查、共享权限与确认先于任何外部预订。费用数字、全部 API Logo、长路线图留给 README。

### 30 · 04:08–04:16｜回到那个人

**英文旁白：** Because the person who plans the escape should get to enjoy it, too.

- 画面：回到第 1 镜四个头像，现在等距并排，没有所有问题都围着组织者；下方大字 `An escape for everyone.`
- 关键帧：0–0.6 秒四个头像进入；2 秒大字；5 秒文字轻淡出，Orb 留到下一镜。
- 制作：复用开场素材，形成前后呼应。这个是愿景收束，不是伪造已验证的用户效果。无需再加泛泛“powered by AI”。

### 31 · 04:16–04:20｜干净结束

**英文旁白：** 无。

- 画面：V-MAX Logo + `More of the trip. Less of the chasing.`；下面清楚列 `Try the prototype: vmax-one.vercel.app` 与 `Team V-MAX`。仓库链接放 YouTube 描述与提交表，避免片尾塞满长 URL。
- 关键帧：0–0.4 秒 Logo 进入；停稳 3 秒；最后 0.6 秒音乐自然收尾。
- 制作：可选放指向线上 App 的 QR，但生成后必须手机测试；片中不能只给扫码而不提供文字网址。
- 不接 20 秒成员名单，不额外添加长黑屏或软件片尾。成片终点 04:20。

## 5. 先设计这 5 类素材，不要一次画 31 个页面

| 素材组 | 需要做出的东西 | 使用镜头 |
| --- | --- | --- |
| A · 人与问题 | 4 个首字母头像、组织者标签、3 张原创问题卡、简化行程卡 | 01–04、30 |
| B · 品牌 | 现有 Logo、现有 Orb、品牌名和一句短标语 | 05、31 |
| C · 影片容器 | 珍珠白底、产品圆角容器、一句标题、字幕与原型说明位置 | 大多数镜头 |
| D · 章节与重点 | Before departure / Day 2 标题；单个细线高亮框 | 08–22 |
| E · 可行性 | Working today / Simulated / Next pilot 三张同版式信息卡 | 27–29 |

App 的界面全部用真实录屏，不在 Figma 重新画。不需要新增 AI 旅游照片、复杂 3D 飞机或电影片头。

## 6. 实际录制清单：按任务录，不按 31 镜逐段重开

先在一个专门用于演示的浏览器会话预演。**不清理日常浏览器的存储，不重置已经改过的用户行程或权限。** 如果当前状态与默认样例不同，使用独立演示会话；或用 App 提供的、安全可用的 Undo，不能强制覆盖后续改动。

| 录屏文件建议名 | 一次完整录什么 | 取用镜头 |
| --- | --- | --- |
| R01-home-orb.mp4 | Home 封面、Orb、Ask V-MAX 介绍与工作区；滚到 Trip updates | 05–08 |
| R02-museum.mp4 | 来源 → 改期方案 → 自己同意 → 等待 → DEMO 成员同意 → 新旧日期检查 | 09–13 |
| R03-chapter-group.mp4 | Before departure → Day 2 → Group → @ 列表 → availability 问答 | 14–16 |
| R04-privacy-reunion.mp4 | exact address 拒答 → dinner 请求 → 自己 Agent 接续 → 方案 | 17–18 |
| R05-reunion-approval.mp4 | 18:30 阻塞 → 19:00 → 理由和权限 → 确认 → Plan → Route | 19–22 |
| R06-budget.mp4 | 样例收据 → 份额与金额 → 保存 → Budget 记录 | 23–25 |
| R07-flights-wallet.mp4 | 样例航班比较 → 未预订 shortlist → Wallet | 26 |

每个重要动作前后各留 2–3 秒，便于剪辑；先录一条完整逻辑，再补特写。尽量以足够清晰的原始分辨率录制，能用 2K/4K 就用；不要把 400 px 宽的小截图粗暴拉成全屏。如果设备录屏卡顿，优先稳定的 1080p，再单独补可读特写。

真实页面：https://vmax-one.vercel.app/ 。页面或按钮名若在最终版本变动，先改分镜再录；不要为配合脚本伪造 UI。这里核对了本地组件与审阅指南，但这次写脚本没有重新完整操作线上所有流程，正式录制前仍需从头预演。

## 7. 剪辑轨道和制作顺序

建议轨道从下至上：

- V1：珍珠白底。
- V2：真实 App 录屏 / 开场和片尾素材。
- V3：放大特写或辅助高亮；一个镜头最多一个重点。
- V4：标题、章节、原型说明。
- V5：英文字幕。
- A1：英文旁白。
- A2：轻 BGM。
- A3：少量通知 / 点击 / 确认声音。

执行顺序：

1. 先读完英文稿，粗录旁白；如个别句子超时，缩短文案或挪用停顿，不把声音加速成赶稿。
2. 完整预演两条故事，检查状态与权限，录 R01–R07。
3. 先把声音和录屏剪成能从头看懂的 04:20 粗剪，暂时不加高级动画。
4. 加 5 组平面素材，再做统一的四种运动。
5. 补字幕、BGM、少量音效；确认手机上也能读到重点。
6. 导出后从导出文件重新看一遍，不只在编辑器预览。

输出建议：MP4 / H.264，1920 × 1080，30 fps；高质量档，具体码率随画面复杂度调整。不要把帧率变来变去；所有片尾、静帧和尾部黑屏都计入时长。

## 8. 最后验收

- [ ] 前 30 秒明确：谁受困、什么持续问题、这不是只有目的地推荐的 App。
- [ ] 闭馆与 Day 2 分为不同章节，日期、人数和画面一致。
- [ ] 能看清“自己同意但尚未改变”以及 DEMO 成员同意。
- [ ] 能看清 @ 对象、隐私拒答、18:30 阻塞、19:00 的理由与结果。
- [ ] 至少一个完整的“提议 → 审查 → 确认 → 行程更新”，没有只靠宣传动画。
- [ ] 没有把本地状态更新说成跨设备同步；没有把样例费用说成实时航班价格。
- [ ] 没有把可编辑收据说成自动 OCR；没有假称预订或支付完成。
- [ ] 技术现状与下一步清楚分开；用户研究指标是计划，不是虚构成绩。
- [ ] 不在视频重讲所有 ideation；该部分的评分证据仍完整放在 README。
- [ ] 声音可听清、音乐不压人声、字幕与画面不重叠；无私人资料。
- [ ] 使用的 Logo、字体、照片、音乐、TTS 有适当公开使用权限。
- [ ] 导出总长目标 04:20、严格小于 05:00；上传后再检查声音与清晰度。

### 必须保留与可以删减

**必须保留：** 具体痛点、来源、权限与确认、18:30 阻塞、真实结果、现状/计划边界。

**优先删减：** 第 26 镜额外机票能力、过长 Orb 镜头、重复的页面全景。不是删掉说明后让 demo 看起来更强，而是把时间留给关键证据。

这条视频的“wow”不是光效最多，而是评委能复述：**它知道什么时候不能答、什么时候不能安排，以及批准之后究竟改变了什么。**
