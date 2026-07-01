// 互动.js - 趣味互动页面的按钮交互逻辑
(function() {
  // ================= 互动状态管理 =================
  const STORAGE_KEY = 'fun-interactions-v1';
  const defaults = { like: 0, heart: 0, kick: 0, comment: 0, comments: [] };
  const state = Object.assign({}, defaults, JSON.parse(localStorage.getItem(STORAGE_KEY) || '{}'));

  // ================= 数据存储函数 =================
  function save() {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
  }

  // ================= 渲染函数 =================
  function render() {
    ['like', 'heart', 'kick', 'comment'].forEach(k => {
      const el = document.getElementById('count-' + k);
      if (el) el.textContent = state[k];
    });
    renderComments();
  }

  // ================= 特效函数 =================
  // 计数数字弹跳特效
  function popCount(key) {
    const el = document.getElementById('count-' + key);
    el.classList.remove('pop');
    void el.offsetWidth;
    el.classList.add('pop');
  }

  // 飘浮粒子特效
  function spawnParticles(originEl, emojis, count = 8) {
    const rect = originEl.getBoundingClientRect();
    const cx = rect.left + rect.width / 2;
    const cy = rect.top + rect.height / 2;
    for (let i = 0; i < count; i++) {
      const p = document.createElement('div');
      p.className = 'fx-particle float';
      p.textContent = emojis[Math.floor(i % emojis.length)];
      const dx = (Math.random() - 0.5) * 200;
      const rot = (Math.random() - 0.5) * 60;
      p.style.setProperty('--dx', dx + 'px');
      p.style.setProperty('--rot', rot + 'deg');
      p.style.left = cx + 'px';
      p.style.top = cy + 'px';
      p.style.animationDelay = (i * 60) + 'ms';
      p.style.fontSize = (22 + Math.random() * 14) + 'px';
      document.body.appendChild(p);
      setTimeout(() => p.remove(), 1600 + i * 60);
    }
  }

  // 踢/抖屏特效
  function shakeScreen() {
    document.body.classList.remove('shake');
    void document.body.offsetWidth;
    document.body.classList.add('shake');
    setTimeout(() => document.body.classList.remove('shake'), 500);
  }

  // 3D 反击小人：单人物飞踢→坐上黄色图标
  function showKickback() {
    const el = document.getElementById('kickback');
    el.classList.remove('show');
    void el.offsetWidth;
    el.classList.add('show');
    clearTimeout(window._kickHideT);
    window._kickHideT = setTimeout(() => el.classList.remove('show'), 6100);
  }

  // ================= 评论管理 =================
  const commentPanel = document.getElementById('commentPanel');
  const commentInput = document.getElementById('commentInput');
  const commentList = document.getElementById('commentList');

  function openComment() {
    commentPanel.classList.add('show');
    setTimeout(() => commentInput.focus(), 100);
  }

  function closeComment() {
    commentPanel.classList.remove('show');
  }

  function renderComments() {
    commentList.innerHTML = state.comments.length
      ? state.comments.slice().reverse().map(c =>
          `<div class="comment-item"><span class="who">访客</span>${escapeHtml(c.text)}<div class="text-[11px] text-gray-400 mt-1">${c.time}</div></div>`
        ).join('')
      : '<div class="p-6 text-center text-sm text-gray-400">还没有评论，来抢沙发～</div>';
  }

  function escapeHtml(s) {
    return s.replace(/[&<>"']/g, m => ({
      '&': '&amp;',
      '<': '&lt;',
      '>': '&gt;',
      '"': '&quot;',
      "'": '&#39;'
    }[m]));
  }

  function sendComment() {
    const text = commentInput.value.trim();
    if (!text) return;
    const now = new Date();
    const time = `${now.getMonth() + 1}/${now.getDate()} ${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    state.comments.push({ text, time });
    state.comment = state.comments.length;
    commentInput.value = '';
    save();
    render();
    popCount('comment');
    // 评论飘出小气泡
    spawnParticles(document.querySelector('.btn-comment'), ['💬', '✨', '📝'], 5);
  }

  // 评论按钮事件绑定
  document.getElementById('sendComment').addEventListener('click', sendComment);
  document.getElementById('closeComment').addEventListener('click', closeComment);
  commentInput.addEventListener('keydown', e => {
    if (e.key === 'Enter') sendComment();
  });

  // ================= 互动按钮事件绑定 =================
  document.querySelectorAll('.action-btn').forEach(btn => {
    btn.addEventListener('click', () => {
      const action = btn.dataset.action;
      if (action === 'like') {
        state.like++;
        save();
        render();
        popCount('like');
        spawnParticles(btn, ['👍', '💙', '⭐', '✨'], 8);
      } else if (action === 'heart') {
        state.heart++;
        save();
        render();
        popCount('heart');
        spawnParticles(btn, ['💗', '💖', '💕', '❤️', '🌸'], 10);
      } else if (action === 'kick') {
        state.kick++;
        save();
        render();
        popCount('kick');
        shakeScreen();
        spawnParticles(btn, ['👣', '💥', '💨'], 6);
        setTimeout(showKickback, 200);
      } else if (action === 'comment') {
        openComment();
      }
    });
  });

  // ================= 彩球 Fun Facts =================
  document.querySelectorAll('.fun-orb').forEach(orb => {
    orb.addEventListener('click', () => {
      const display = document.getElementById('funFactDisplay');
      const text = document.getElementById('funFactText');
      text.textContent = orb.dataset.fact;
      display.classList.remove('hidden');
      clearTimeout(window._funFactTimer);
      window._funFactTimer = setTimeout(() => display.classList.add('hidden'), 3000);
    });
  });

  // ================= 页面初始化 =================
  render();
})();
