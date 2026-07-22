// ========== 共享导航（与首页 Header 完全统一） ==========
(function () {
  const SECTIONS = [
    { id: 'story',       title: '个人故事', path: '/story/' },
    { id: 'projects',    title: '项目经历', path: '/projects/' },
    { id: 'inspiration', title: '灵感采集', path: '/inspiration/' },
    { id: 'lab',         title: '实验场',   path: '/lab/' },
    { id: 'fun',         title: '趣味互动', path: '/fun/' },
    { id: 'thoughts',    title: '思考碎片', path: '/thoughts/' },
  ];

  const currentPath = window.location.pathname;
  const isHome = currentPath === '/' || currentPath.endsWith('/index.html') || currentPath === '';
  if (isHome) return;

  const homeLink = '<a href="/" title="首页" class="home-icon"><svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 9.5 12 3l9 6.5"/><path d="M5 10v11h14V10"/><path d="M9 21V13h6v8"/></svg></a>';
  const navLinks = SECTIONS.map((s) => {
    const isActive = currentPath.startsWith(s.path);
    return `<a href="${s.path}"${isActive ? ' style="color:#fff"' : ''}>${s.title}</a>`;
  }).join('');

  const navHTML = `
    <nav id="navbar">
      <a href="/" class="logo">万朗<span> · Product Manager</span></a>
      <nav>${homeLink}${navLinks}</nav>
    </nav>
  `;

  document.body.insertAdjacentHTML('afterbegin', navHTML);

  if (!document.getElementById('navStyles')) {
    const style = document.createElement('style');
    style.id = 'navStyles';
    style.textContent = `
      #navbar {
        position: fixed; top: 0; left: 0; right: 0; z-index: 50;
        display: flex; align-items: center; justify-content: space-between;
        padding: 18px 36px;
        background: linear-gradient(to bottom, rgba(0,0,0,0.55), transparent);
        pointer-events: none;
      }
      #navbar .logo {
        color: #fff; font-size: 22px; font-weight: 700; letter-spacing: 1px;
        text-shadow: 0 2px 20px rgba(0,0,0,0.6); pointer-events: auto;
        text-decoration: none;
      }
      #navbar .logo span { opacity: 0.5; font-weight: 300; }
      #navbar nav { display: flex; gap: 28px; pointer-events: auto; }
      #navbar nav a {
        color: rgba(255,255,255,0.8); text-decoration: none; font-size: 13px;
        font-weight: 500; letter-spacing: 1px; transition: color 0.2s;
        text-shadow: 0 1px 10px rgba(0,0,0,0.5);
      }
      #navbar nav a:hover { color: #fff; }
      @media (max-width: 720px) {
        #navbar { padding: 14px 20px; }
        #navbar nav { gap: 16px; }
        #navbar nav a { font-size: 12px; }
      }
      @media (max-width: 480px) {
        #navbar nav { gap: 12px; }
        #navbar nav a { font-size: 11px; }
      }
    `;
    document.head.appendChild(style);
  }
})();
