// ========== 共享导航组件 ==========
// 使用方式：在 <body> 末尾引用 <script src="/shared/nav.js"></script>
// 六大板块按钮直接可见；默认置灰，hover 时呈现淡淡炫彩光效

(function () {
  const SECTIONS = [
    { id: 'story',       title: '个人故事', num: '01', path: '/story/' },
    { id: 'projects',    title: '项目经历', num: '02', path: '/projects/' },
    { id: 'inspiration', title: '灵感采集', num: '03', path: '/inspiration/' },
    { id: 'lab',         title: '实验场',   num: '04', path: '/lab/' },
    { id: 'fun',         title: '趣味互动', num: '05', path: '/fun/' },
    { id: 'thoughts',    title: '思考碎片', num: '06', path: '/thoughts/' },
  ];

  const currentPath = window.location.pathname;
  const isHome = currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === '';

  const navItemsHTML = SECTIONS.map((s) => {
    const isActive = !isHome && currentPath.startsWith(s.path);
    return `
      <a href="${s.path}" class="nav-pill ${isActive ? 'is-active' : ''}" data-id="${s.id}">
        <span class="nav-pill-num">${s.num}</span>
        <span class="nav-pill-title">${s.title}</span>
        <span class="nav-pill-shine" aria-hidden="true"></span>
      </a>`;
  }).join('');

  const homeButtonHTML = isHome ? '' : `
    <a href="/" class="nav-pill nav-pill-home" aria-label="返回首页">
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" class="nav-pill-icon">
        <path d="M3 11.5 12 4l9 7.5"/><path d="M5 10v10h14V10"/>
      </svg>
      <span class="nav-pill-shine" aria-hidden="true"></span>
    </a>`;

  const navHTML = `
    <nav class="fixed top-5 right-5 z-50 nav-bar" id="navContainer" aria-label="板块导航">
      ${homeButtonHTML}
      ${navItemsHTML}
    </nav>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);

  if (!document.getElementById('navStyles')) {
    const style = document.createElement('style');
    style.id = 'navStyles';
    style.textContent = `
      .nav-bar {
        position: fixed;
        top: 20px;
        right: 20px;
        z-index: 50;
        display: flex;
        align-items: center;
        gap: 6px;
        padding: 6px;
        background: rgba(255, 255, 255, 0.72);
        backdrop-filter: blur(14px) saturate(140%);
        -webkit-backdrop-filter: blur(14px) saturate(140%);
        border: 1px solid rgba(0, 0, 0, 0.06);
        border-radius: 999px;
        box-shadow: 0 6px 24px rgba(0, 0, 0, 0.06);
      }
      .nav-pill {
        position: relative;
        display: inline-flex;
        align-items: center;
        gap: 6px;
        padding: 8px 14px;
        border-radius: 999px;
        font-size: 13px;
        line-height: 1;
        color: #9ca3af;
        text-decoration: none;
        white-space: nowrap;
        overflow: hidden;
        isolation: isolate;
        transition: color 0.35s ease, background 0.35s ease, transform 0.25s ease;
      }
      .nav-pill-num {
        font-family: ui-monospace, SFMono-Regular, Menlo, monospace;
        font-size: 10px;
        letter-spacing: 0.5px;
        color: #c4c8d0;
        transition: color 0.35s ease;
      }
      .nav-pill-title {
        font-weight: 500;
        letter-spacing: 0.5px;
      }
      .nav-pill-icon { width: 16px; height: 16px; }
      .nav-pill-home { padding: 8px 10px; }

      /* 炫彩光效层（默认透明） */
      .nav-pill-shine {
        position: absolute;
        inset: 0;
        border-radius: inherit;
        opacity: 0;
        z-index: -1;
        background:
          radial-gradient(120% 140% at 0% 50%,  rgba(255, 107, 107, 0.55), transparent 55%),
          radial-gradient(120% 140% at 30% 50%, rgba(255, 179, 71, 0.50), transparent 60%),
          radial-gradient(120% 140% at 55% 50%, rgba(78, 205, 196, 0.50), transparent 60%),
          radial-gradient(120% 140% at 80% 50%, rgba(167, 139, 250, 0.55), transparent 60%),
          radial-gradient(120% 140% at 100% 50%, rgba(244, 114, 182, 0.55), transparent 55%);
        filter: blur(8px);
        transition: opacity 0.4s ease, transform 0.6s ease;
        transform: scale(0.92);
      }

      /* hover 状态：淡淡炫彩光效浮现 */
      .nav-pill:hover {
        color: #1f2937;
        background: rgba(255, 255, 255, 0.85);
        transform: translateY(-1px);
      }
      .nav-pill:hover .nav-pill-num { color: #6b7280; }
      .nav-pill:hover .nav-pill-shine {
        opacity: 0.35;
        transform: scale(1);
      }

      /* 当前页：轻微保留炫彩，做出"已选中"提示 */
      .nav-pill.is-active {
        color: #111827;
        background: rgba(255, 255, 255, 0.9);
      }
      .nav-pill.is-active .nav-pill-num { color: #6b7280; }
      .nav-pill.is-active .nav-pill-shine {
        opacity: 0.22;
        transform: scale(1);
      }

      /* 入场轻动画 */
      @keyframes navFadeIn {
        from { opacity: 0; transform: translateY(-6px); }
        to   { opacity: 1; transform: translateY(0); }
      }
      .nav-bar { animation: navFadeIn 0.5s cubic-bezier(0.16, 1, 0.3, 1) both; }

      /* 响应式：窄屏隐藏文字，仅保留编号 */
      @media (max-width: 720px) {
        .nav-pill { padding: 8px 10px; }
        .nav-pill-title { display: none; }
      }
      @media (max-width: 480px) {
        .nav-bar { gap: 2px; padding: 4px; top: 12px; right: 12px; }
        .nav-pill { padding: 7px 9px; font-size: 11px; }
      }
    `;
    document.head.appendChild(style);
  }
})();
