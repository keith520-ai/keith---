// 地图.js - 趣味互动页面的地图和攻略逻辑
(function() {
    // ================= 攻略地图（真实分省/分国） =================

    // 已到访标记（后续从这里配置：省份名 → 攻略/emoji/时间）
    const VISITED_CN = {
        '北京市':   { emoji: '🏯', when: '', guide: '' },
        '上海市':   { emoji: '🌆', when: '', guide: '' },
        '四川省':   { emoji: '🐼', when: '', guide: '' },
        '陕西省':   { emoji: '🥟', when: '', guide: '' },
        '广东省':   { emoji: '🌇', when: '', guide: '' },
        '云南省':   { emoji: '⛰️', when: '', guide: '' },
        '黑龙江省': { emoji: '❄️', when: '', guide: '' },
        '海南省':   { emoji: '🏖️', when: '', guide: '' },
    };

    const VISITED_WORLD = {
        'Japan':             { emoji: '🗼', when: '', guide: '' },
        'Republic of Korea': { emoji: '🍜', when: '', guide: '' },
        'Thailand':          { emoji: '🍤', when: '', guide: '' },
        // 新加坡在 110m 分辨率下太小被合并了，先留着以备升级到 50m 数据源
        'Singapore':         { emoji: '🌴', when: '', guide: '' },
    };

    // 中国省份 → 中文简称（用作地图标签）
    const CN_SHORT_NAME = {
        '北京市':'京','天津市':'津','上海市':'沪','重庆市':'渝',
        '河北省':'冀','山西省':'晋','辽宁省':'辽','吉林省':'吉','黑龙江省':'黑',
        '江苏省':'苏','浙江省':'浙','安徽省':'皖','福建省':'闽','江西省':'赣',
        '山东省':'鲁','河南省':'豫','湖北省':'鄂','湖南省':'湘','广东省':'粤',
        '海南省':'琼','四川省':'川','贵州省':'黔','云南省':'滇','陕西省':'陕',
        '甘肃省':'甘','青海省':'青','台湾省':'台',
        '内蒙古自治区':'内蒙古','广西壮族自治区':'桂','西藏自治区':'藏',
        '宁夏回族自治区':'宁','新疆维吾尔自治区':'新',
        '香港特别行政区':'港','澳门特别行政区':'澳',
    };

    // ==== 投影函数 ====

    // 简易墨卡托投影（用于世界地图；中国地图直接用 GeoJSON path 数据的 projection = mercator）
    function makeMercator(width, height, scale, cx, cy) {
        // 输入经纬度返回像素坐标
        const λ0 = cx * Math.PI / 180;
        const φ0 = cy * Math.PI / 180;
        return function(lon, lat) {
            const λ = lon * Math.PI / 180;
            const φ = Math.max(Math.min(lat, 85), -85) * Math.PI / 180;
            const x = scale * (λ - λ0) + width / 2;
            const y = scale * (Math.log(Math.tan(Math.PI/4 + φ0/2)) - Math.log(Math.tan(Math.PI/4 + φ/2))) + height / 2;
            return [x, y];
        };
    }

    // 把 GeoJSON polygon / multipolygon 转成 SVG path d 属性
    function geoToPath(geometry, proj) {
        const rings = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        let d = '';
        for (const poly of rings) {
            for (const ring of poly) {
                ring.forEach((pt, i) => {
                    const [x, y] = proj(pt[0], pt[1]);
                    d += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
                });
                d += 'Z';
            }
        }
        return d;
    }

    // 计算 polygon 的近似中心（用于放标签）
    function geoCentroid(geometry) {
        const rings = geometry.type === 'Polygon' ? [geometry.coordinates] : geometry.coordinates;
        let bestArea = 0, bestCentroid = [0, 0];
        for (const poly of rings) {
            const ring = poly[0];
            let sumX = 0, sumY = 0, area = 0;
            for (let i = 0; i < ring.length - 1; i++) {
                const [x1, y1] = ring[i], [x2, y2] = ring[i+1];
                const cross = x1*y2 - x2*y1;
                area += cross;
                sumX += (x1 + x2) * cross;
                sumY += (y1 + y2) * cross;
            }
            area = area / 2;
            if (Math.abs(area) > bestArea) {
                bestArea = Math.abs(area);
                bestCentroid = [sumX / (6 * area), sumY / (6 * area)];
            }
        }
        return bestCentroid;
    }

    // ==== 加载函数 ====

    // 中国分省地图
    async function loadChinaMap() {
        const url = 'https://geo.datav.aliyun.com/areas_v3/bound/100000_full.json';
        try {
            const resp = await fetch(url);
            const data = await resp.json();
            document.getElementById('cnLoading').classList.add('hidden');
            const proj = makeMercator(1000, 720, 720, 104, 36);
            const g = document.getElementById('cnProvinces');
            let pathsHtml = '';
            let labelsHtml = '';
            data.features.forEach(f => {
                const name = f.properties.name;
                const d = geoToPath(f.geometry, proj);
                const visited = !!VISITED_CN[name];
                pathsHtml += `<path class="province ${visited ? 'visited' : ''}"
                                    d="${d}"
                                    data-name="${name}"/>`;
                // 标签放到 geometry 中心 → 转投影
                const [cLon, cLat] = geoCentroid(f.geometry);
                const [lx, ly] = proj(cLon, cLat);
                if (!isNaN(lx)) {
                    const short = CN_SHORT_NAME[name] || name.replace(/(省|市|自治区|特别行政区|回族|壮族|维吾尔|自治州)/g, '');
                    labelsHtml += `<text class="province-label ${visited ? 'visited' : ''}" x="${lx.toFixed(1)}" y="${ly.toFixed(1)}" dy="3">${short}</text>`;
                }
            });
            // 先画所有省份 path，再在最上层画所有标签，避免被相邻省份覆盖
            g.innerHTML = pathsHtml + labelsHtml;
            g.querySelectorAll('.province').forEach(p => {
                p.addEventListener('click', () => {
                    const name = p.getAttribute('data-name');
                    const info = VISITED_CN[name] || {};
                    openGuide({ name, emoji: info.emoji || '📍', when: info.when || '', guide: info.guide || '' });
                });
            });
        } catch (e) {
            console.error('加载中国地图失败', e);
            document.getElementById('cnLoading').textContent = '地图加载失败，请检查网络';
        }
    }

    // 世界地图
    let worldLoaded = false;
    async function loadWorldMap() {
        if (worldLoaded) return;
        const url = 'https://cdn.jsdelivr.net/npm/world-atlas@2/countries-50m.json';
        const namesUrl = 'https://cdn.jsdelivr.net/npm/i18n-iso-countries@7.10.0/langs/en.json';
        try {
            // countries-50m 是 topojson，需要转换 —— 改用一个 GeoJSON 源更省事
            const geoUrl = 'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/master/geojson/ne_110m_admin_0_countries.geojson';
            const resp = await fetch(geoUrl);
            const data = await resp.json();
            document.getElementById('worldLoading').classList.add('hidden');
            const proj = makeMercator(1000, 500, 155, 0, 20);
            const g = document.getElementById('worldCountries');
            let out = '';
            data.features.forEach(f => {
                const name = f.properties.NAME_LONG || f.properties.NAME || f.properties.name;
                if (!name) return;
                const d = geoToPath(f.geometry, proj);
                const visited = !!VISITED_WORLD[name];
                out += `<path class="country ${visited ? 'visited clickable' : ''}"
                              d="${d}"
                              data-name="${name}"/>`;
            });
            g.innerHTML = out;
            g.querySelectorAll('.country.clickable, .country.visited').forEach(p => {
                p.addEventListener('click', () => {
                    const name = p.getAttribute('data-name');
                    const info = VISITED_WORLD[name] || {};
                    openGuide({ name, emoji: info.emoji || '📍', when: info.when || '', guide: info.guide || '' });
                });
            });
            worldLoaded = true;
        } catch (e) {
            console.error('加载世界地图失败', e);
            document.getElementById('worldLoading').textContent = '地图加载失败，请检查网络';
        }
    }

    // ==== 攻略弹窗函数 ====

    const guideModal = document.getElementById('guideModal');

    function openGuide(city) {
        document.getElementById('guideEmoji').textContent = city.emoji;
        document.getElementById('guideLoc').textContent = city.name;
        document.getElementById('guideWhen').textContent = city.when || '';
        const content = document.getElementById('guideContent');
        const empty = document.getElementById('guideEmpty');
        if (city.guide && city.guide.trim()) {
            content.innerHTML = city.guide;
            content.classList.remove('hidden');
            empty.classList.add('hidden');
        } else {
            content.classList.add('hidden');
            empty.classList.remove('hidden');
        }
        guideModal.classList.add('show');
    }

    function closeGuide() {
        guideModal.classList.remove('show');
    }

    // ==== 初始化与事件监听 ====

    // 加载中国地图
    loadChinaMap();

    // 地球按钮：打开全球地图 modal
    const globeModal = document.getElementById('globeModal');
    document.getElementById('globeBtn').addEventListener('click', () => {
        globeModal.classList.add('show');
        loadWorldMap();
    });
    document.getElementById('globeClose').addEventListener('click', () => globeModal.classList.remove('show'));
    globeModal.addEventListener('click', e => { if (e.target === globeModal) globeModal.classList.remove('show'); });

    // 攻略 modal 的打开/关闭逻辑
    document.getElementById('guideClose').addEventListener('click', closeGuide);
    guideModal.addEventListener('click', e => { if (e.target === guideModal) closeGuide(); });
    document.addEventListener('keydown', e => {
        if (e.key === 'Escape') {
            closeGuide();
            globeModal.classList.remove('show');
        }
    });

    // 暴露公共接口（如需在其他模块中调用）
    window.mapModule = {
        VISITED_CN,
        VISITED_WORLD,
        CN_SHORT_NAME,
        makeMercator,
        geoToPath,
        geoCentroid,
        loadChinaMap,
        loadWorldMap,
        openGuide,
        closeGuide
    };
})();
