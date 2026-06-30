# 万朗 - 产品经理简历网站（已更新）

## ✨ 本次更新内容

### 1️⃣ **响应式全屏布局**
✅ 信息不再全部居中，而是自适应整个 H5 页面
✅ 每个页面保留充足的留白（左右两侧）
✅ 内容流体布局，充分利用屏幕空间
✅ 桌面端和移动端都有最佳视觉效果

**具体实现：**
- 首页：左侧大标题 + 右侧头像，下方占满宽度的横向视频
- 关于页：左侧2/3 文字内容 + 右侧1/3 数据卡片
- 项目页：全宽卡片设计，充分利用空间
- 联系页：2×2 网格式彩色卡片

### 2️⃣ **横向视频 - 参考字节官方风格**
✅ 视频改为 **16:9 宽屏比例**（原为 9:16）
✅ 占满页面宽度，横屏展示
✅ 类似字节跳动官方风格的大气视觉效果
✅ 兼容本地视频、iframe 嵌入和视频平台链接

**如何集成你的视频：**
```html
<!-- 本地视频文件 -->
<video class="w-full rounded-2xl shadow-lg" controls autoplay muted loop>
    <source src="path/to/your-video.mp4" type="video/mp4">
</video>

<!-- 或使用 iframe（YouTube、Bilibili 等） -->
<iframe 
    class="w-full rounded-2xl shadow-lg" 
    style="aspect-ratio: 16 / 9;"
    src="https://www.youtube.com/embed/your-video-id"
    frameborder="0"
    allowfullscreen
></iframe>
```

### 3️⃣ **自由感配色系统**
✅ 保留极简风格的基础（黑白灰）
✅ 加入渐变色彩组合，增添活力
✅ 三套配色方案循环使用：
   - 🌸 **紫粉渐变** (#FF6B6B → #FF8E72)
   - 🌊 **青蓝渐变** (#4ECDC4 → #44A08D)
   - 🌅 **橙黄渐变** (#FFB347 → #FFA500)

**配色应用位置：**
- 顶部装饰条：三种颜色轮换
- 数据卡片背景：温和的渐变背景
- 项目卡片左边框：彩色标记
- 联系方式卡片：饱和度更高的渐变

---

## 📱 新的页面布局

### 首页（Home）
```
┌─────────────────────────────────────┐
│  万朗          [头像]               │  ← 顶部信息，左右布置
│  Product Manager                    │
│                                     │
│  ┌──────────────────────────────┐   │
│  │                              │   │
│  │    横向视频（16:9）          │  ← 占满宽度
│  │  AI 个人故事视频             │
│  │                              │
│  └──────────────────────────────┘   │
│                                     │
│  用设计思维解决真实问题             │
│  ...个人描述...                     │
│                                     │
│  [了解我] [项目] [联系]            │
└─────────────────────────────────────┘
```

### 关于我页（About）
```
┌─────────────────────────────────────┐
│  关于我                             │
│  ════════════════                   │
│                                     │
│  ┌─────────────────────┬─────────┐ │
│  │                     │ 📊 卡片 │ │
│  │ 个人简介（2/3宽）  │ 📊 卡片 │ │
│  │                     │         │ │
│  │ 对用户心理学...     │         │ │
│  │                     │ 右侧1/3 │ │
│  └─────────────────────┴─────────┘ │
│                                     │
│  核心能力                           │
│  [🎯 需求洞察] [✨ 交互体验]       │
│  [📊 增长策略] [🚀 团队协作]       │
│                                     │
│  兴趣方向                           │
│  [社交产品] [内容平台] [AI应用]    │
└─────────────────────────────────────┘
```

### 项目经历页（Projects）
```
┌─────────────────────────────────────┐
│  项目经历                           │
│  ════════════════                   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ┃ 实习项目1                 │ 待更新 │
│  │ ┃                            │   │
│  │ ┃ 项目描述...               │   │
│  │ ┃ 项目成果...               │   │
│  └─────────────────────────────┘   │
│                                     │
│  ┌─────────────────────────────┐   │
│  │ ┃ 项目2                      │ 待更新 │
│  │ ┃ ...                        │   │
│  └─────────────────────────────┘   │
└─────────────────────────────────────┘
```

### 联系页（Contact）
```
┌──────────────────────────────────────┐
│  让我们交流                          │
│  ════════════════                    │
│                                      │
│  ┌─────────────┐  ┌─────────────┐   │
│  │  📧         │  │  💼         │   │
│  │  邮箱       │  │  LinkedIn   │   │
│  │             │  │             │   │
│  └─────────────┘  └─────────────┘   │
│  ┌─────────────┐  ┌─────────────┐   │
│  │  🚀         │  │  💬         │   │
│  │  GitHub     │  │  WeChat     │   │
│  │             │  │             │   │
│  └─────────────┘  └─────────────┘   │
└──────────────────────────────────────┘
```

---

## 🚀 快速开始

### 方式1️⃣ - 直接打开文件（最快）
```bash
# Windows 资源管理器中打开
resume-website\index.html
```
双击即可在默认浏览器打开。

### 方式2️⃣ - 启动本地服务器
```bash
# 双击运行
start-resume-server.bat

# 或手动启动
cd resume-website
python -m http.server 8000

# 浏览器访问
http://localhost:8000
```

### 方式3️⃣ - 移动设备预览
1. 电脑端启动服务器
2. 手机连接同一 WiFi
3. 手机浏览器访问：`http://[电脑IP]:8000`

---

## 📝 自定义内容

### 1. 添加你的故事视频

编辑 `index.html`，找到首页视频部分：

**使用本地视频文件：**
```html
<div class="hero-video rounded-2xl shadow-lg overflow-hidden mb-12 flex items-center justify-center">
    <video 
        class="w-full h-full object-cover rounded-2xl" 
        controls 
        autoplay 
        muted 
        loop
    >
        <source src="my-story.mp4" type="video/mp4">
    </video>
</div>
```

**使用在线视频（iframe）：**
```html
<iframe 
    class="w-full rounded-2xl shadow-lg" 
    style="aspect-ratio: 16 / 9; border: none;"
    src="https://www.youtube.com/embed/dQw4w9WgXcQ"
    frameborder="0"
    allowfullscreen
></iframe>
```

### 2. 更新个人信息

```html
<!-- 首页 - 名字和职位 -->
<h1 class="text-5xl font-bold text-gray-900">万朗</h1>
<p class="text-gray-400 text-sm mt-2">产品经理 / PM</p>

<!-- 首页 - 副标题 -->
<h2 class="text-3xl font-bold text-gray-900 mb-4">用设计思维解决真实问题</h2>
<p class="text-gray-600 leading-relaxed text-lg">
    你的个人简介...
</p>
```

### 3. 添加实习项目

复制项目卡片模板：
```html
<div class="bg-white rounded-2xl p-8 shadow-sm hover:shadow-lg transition border-l-4 border-purple-400">
    <div class="flex justify-between items-start mb-4">
        <div>
            <h3 class="text-2xl font-bold text-gray-900 mb-2">项目名称</h3>
            <p class="text-gray-500">2024年 · 某公司</p>
        </div>
        <span class="text-xs text-gray-400 bg-gray-100 px-4 py-2 rounded-full">PM</span>
    </div>

    <p class="text-gray-600 leading-relaxed mb-6">
        简述项目背景和你的角色...
    </p>

    <div class="space-y-3 text-sm text-gray-700">
        <p><strong>问题发现：</strong> 用户在...发现了...</p>
        <p><strong>产品方案：</strong> 我们设计了...</p>
        <p><strong>最终成果：</strong> 数据提升了...</p>
    </div>
</div>
```

**项目卡片配色（选择其中一个）：**
- `border-l-4 border-purple-400` - 紫色（第一个项目）
- `border-l-4 border-cyan-400` - 青色（第二个项目）
- `border-l-4 border-orange-400` - 橙色（第三个项目）

### 4. 更新联系方式

```html
<!-- 邮箱 -->
<a href="mailto:your.email@example.com">your.email@example.com</a>

<!-- LinkedIn -->
<a href="https://linkedin.com/in/yourprofile" target="_blank">My Profile</a>

<!-- GitHub -->
<a href="https://github.com/yourprofile" target="_blank">My Repository</a>

<!-- 微信 -->
<p class="text-2xl font-bold">扫码联系</p>
```

---

## 🎨 深度自定义

### 修改配色方案

三个主要配色变量定义在 `<style>` 中：

```css
/* 紫粉色 - 用于强调、头条、CTA */
.accent-color-1 {
    background: linear-gradient(135deg, #FF6B6B 0%, #FF8E72 100%);
}

/* 青蓝色 - 用于平衡、冷调、技术感 */
.accent-color-2 {
    background: linear-gradient(135deg, #4ECDC4 0%, #44A08D 100%);
}

/* 橙黄色 - 用于活力、温暖、能量 */
.accent-color-3 {
    background: linear-gradient(135deg, #FFB347 0%, #FFA500 100%);
}
```

你可以修改 RGB 值来自定义颜色。

### 调整间距

主要间距变量：
- `px-8` - 左右内边距
- `py-20` - 上下内边距
- `gap-12` - 元素间距
- `mb-16` - 下边距

修改这些值可以改变页面的"通透感"。

---

## 📊 推荐的项目内容结构

为了最好地展示产品经理能力，每个项目建议包含：

```
【项目卡片】
├─ 项目名称（2字到5字）
├─ 时间和身份（2024年 · 实习）
├─ 简短描述（1-2句）
├─ 问题发现（用户怎样遇到这个问题）
├─ 产品方案（如何设计和验证）
└─ 最终成果（可量化的结果）

【推荐数据示例】
✓ 用户留存率提升 15%
✓ 转化率增加 28%
✓ 用户满意度 4.2/5
✓ 参与度提升 2 倍
✓ 日活用户增加 50%
```

---

## 🎯 下一步建议

1. ✅ 将 AI 故事视频集成到首页
2. ✅ 更新 5 个核心实习项目
3. ✅ 优化联系方式和社交媒体链接
4. ✅ 在浏览器中用手机模式预览（F12 → 设备工具栏）
5. ✅ 分享到求职平台和社交媒体

---

## 🌐 部署建议

### Vercel（推荐 - 适合产品经理）
```bash
# 1. 推送到 GitHub
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/yourname/resume.git
git push -u origin main

# 2. Vercel 连接 GitHub 仓库，自动部署
# 3. 获得 https://resume-wanlang.vercel.app
```

### GitHub Pages
```bash
# 1. 创建 username.github.io 仓库
# 2. 上传文件
# 3. 访问 https://username.github.io
```

### Netlify
直接拖拽 `resume-website` 文件夹到 Netlify，即可获得实时 URL。

---

## 💡 设计理念

✨ **极简中的自由**
- 保留黑白灰的理性与专业感
- 融入渐变色彩的热情与创意
- 留白充足但不冷漠
- 信息清晰但不沉闷

🎯 **产品经理视角**
- 每个元素都有其目的
- 用户导向的信息架构
- 流畅的交互体验
- 响应式设计体现细节品味

---

**提示：** 修改后按 `Ctrl+Shift+R` 清除缓存并刷新浏览器查看最新效果！

💬 有任何问题或想要进一步定制，随时告诉我！
