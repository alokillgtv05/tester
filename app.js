/* ============================================================ CONFIG */
/* ============================================================ CLEAR STORAGE IF ?save=false */
(function() {
    try {
        const params = new URLSearchParams(window.location.search);
        if (params.get('save') !== 'false') return;

        // Lấy scope hiện tại để log cho rõ
        const urlParam = params.get('url');
        const listcateParam = params.get('listcate');

        // Đếm số key sẽ xoá
        const before = localStorage.length;

        // Xoá sạch mọi key
        localStorage.clear();

        // Xoá luôn sessionStorage nếu có
        try {
            sessionStorage.clear();
        } catch (e) {}

        console.log('%c[Reset] 🗑️ save=false → đã xoá ' + before + ' localStorage key',
            'color:#ff6b6b;font-weight:bold;font-size:13px;');
        console.log('[Reset] url:', urlParam || '(default)',
            '| listcate:', listcateParam ? '(có)' : '(không)');

        // Báo cho user biết (nếu UIManager đã có sẵn — thường chưa, nên dùng alert fallback)
        setTimeout(() => {
            if (window.UIManager && UIManager.showToast) {
                UIManager.showToast('🗑️ Đã xoá toàn bộ dữ liệu lưu (save=false)', 3500);
            }
        }, 1000);
    } catch (e) {
        console.error('[Reset] Lỗi clear storage:', e);
    }
})();

(function() {
    'use strict';
    const now = new Date();
    window.APP_VERSION = 'v14.0.0.' +
        String(now.getMinutes()).padStart(2, '0') + '-' +
        String(now.getSeconds()).padStart(2, '0');
    console.log('[Config]', window.APP_VERSION);

    window.PROXY_BASE = 'https://tivi.alokillgtv02.workers.dev/proxy?url=';
    window.USE_PROXY = false;
    try {
        const p = new URLSearchParams(window.location.search);
        window.USE_PROXY = p.get('proxy') === 'true';
      // ?healthy=false → tắt health check hoàn toàn
        window.HEALTH_ENABLED = p.get('healthy') !== 'false';
        if (!window.HEALTH_ENABLED){
          console.log('[Config] 🚫 Health check TẮT — bỏ qua kiểm tra sống/chết');
        }

      
        if (window.USE_PROXY) console.log('[Config] 🔀 Proxy BẬT — mọi stream qua Worker');
    } catch (e) {}

    window.PLAYLIST_URL = 'https://raw.githubusercontent.com/vuminhthanh12/vuminhthanh12/refs/heads/main/vmttv';
    window.M3U_CACHE_TTL = 24 * 60 * 60 * 1000;
    window.SHOW_VERSION = false;
    window.AUTO_FALLBACK_ENABLED = false; // false = tắt tự động chuyển kênh khi lỗi
    // Bật/tắt hiển thị version chip góc phải trên
    // ============================================================
    // CACHE SCOPE — 2 scope tách biệt
    // DATA_SCOPE     : dựa vào url → channels, favorites, images, stats
    // LAYOUT_SCOPE   : dựa vào url + listcate → folder order, last opened
    // ============================================================
    (function computeScopes() {
        function hashStr(s) {
            let h = 0;
            for (let i = 0; i < s.length; i++) {
                h = ((h << 5) - h) + s.charCodeAt(i);
                h |= 0;
            }
            return Math.abs(h).toString(36);
        }
        try {
            const params = new URLSearchParams(window.location.search);
            const urlParam = params.get('url');
            const listcateParam = params.get('listcate');

            window.DATA_SCOPE = urlParam ? ('::d' + hashStr(urlParam)) : '';
            window.LAYOUT_SCOPE = (urlParam || listcateParam) ?
                ('::l' + hashStr((urlParam || '') + '||' + (listcateParam || ''))) :
                '';
            // Giữ CACHE_SCOPE cũ để tương thích với code có sẵn
            window.CACHE_SCOPE = window.DATA_SCOPE;

            if (window.DATA_SCOPE || window.LAYOUT_SCOPE) {
                console.log('[Config] Scope DATA:', window.DATA_SCOPE || '(default)',
                    '| LAYOUT:', window.LAYOUT_SCOPE || '(default)');
            }
        } catch (e) {
            window.DATA_SCOPE = '';
            window.LAYOUT_SCOPE = '';
            window.CACHE_SCOPE = '';
        }
    })();
    window.CATEGORY_ORDER = {
        '_fav': 2,
        '_all': 1,
        'VTV': [4, 6],
        'HTV': [3, 7, 10, 80],
        'SCTV': 8,
        'VTVcab': 6,
        'HTVC': 7,
        'Thể Thao': 0,
        'Địa phương|Kênh Tỉnh': 5,
        'Quốc Tế': 9,
        'Radio': 0,
        'Sự Kiện TV360': 0,
        'Sự Kiện VTVPrime': 0,
        'Sự Kiện FPT PLAY': 0,
        'LIVE EVENTS 🔴|Phim Hay': [11, 90],
        'TVB': 10,
        'Premier League': 0,
        'Asian Games Aichi-Nagoya 2026': 0,
        '🔴 ⚽ COLA TV': 0,
        '🔴 ⚽ 🏀 COLA TV SV2': 0,
        '🔴 ⚽ 🏀 COLA TV SV3': 0,
        '🔴 ⚽ GÀ VÀNG 33': 0,
        '🔴 ⚽ GÀ VÀNG 33 SV2': 0,
        "🇨🇳| Trung Quốc": 0,
        "🇬🇧 UK Radio": 0,
        "🇰🇷| Hàn Quốc": 0,
        "🇹🇭| Thái Lan": 0,
        "Giải Trí": 0,
        "Israel": 0,
        "Khác": 0,
        "THỂ THAO QUỐC TẾ": 0,
        "⚽| Thể thao quốc tế": 0,
        "🌐| Thiết yếu": 80,
        "📦| In The Box": 90,
        '🔴 ⚽ 🏐 KHÁN ĐÀI TV': 0
    };
    window.LOG_CATEGORIES = true; // Bật/tắt log danh mục M3U ra console
    // ============================================================
    // PARSE URL PARAM: ?listcate=<base64-json>
    // Giải mã base64 (hỗ trợ URL-safe) → JSON → ghi đè CATEGORY_ORDER
    // ============================================================
    (function parseListcateParam() {
        try {
            const params = new URLSearchParams(window.location.search);
            const raw = params.get('listcate');
            if (!raw) {
                // Không có param → dùng CATEGORY_ORDER mặc định bên dưới
                return;
            }
            console.log('[Config] listcate param detected, length:', raw.length);

            // ---- Base64 decode thủ công (URL-safe + padding) ----
            function b64Decode(str) {
                try {
                    let s = String(str).trim();

                    // Nếu còn %xx (chưa decode) thì decode trước
                    if (s.indexOf('%') >= 0) {
                        try {
                            s = decodeURIComponent(s);
                        } catch (e) {}
                    }

                    // ⭐ QUAN TRỌNG: URLSearchParams đã biến '+' → ' ' → phải đổi lại
                    s = s.replace(/ /g, '+');

                    // URL-safe base64 (-_) → standard base64 (+/)
                    s = s.replace(/-/g, '+').replace(/_/g, '/');

                    // Bỏ mọi khoảng trắng/tab/xuống dòng còn sót
                    s = s.replace(/\s+/g, '');

                    // Thêm padding nếu thiếu
                    while (s.length % 4) s += '=';

                    // Debug nhẹ (có thể xóa sau)
                    console.log('[Config] b64 length:', s.length,
                        '| tail:', s.slice(-8));

                    // Decode base64 → UTF-8
                    const binary = atob(s);
                    const bytes = new Uint8Array(binary.length);
                    for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
                    return new TextDecoder('utf-8').decode(bytes);
                } catch (e) {
                    console.error('[Config] b64Decode fail:', e);
                    return null;
                }
            }

            const json = b64Decode(raw);
            if (!json) {
                return;
            }

            const parsed = JSON.parse(json);
            if (typeof parsed !== 'object' || parsed === null || Array.isArray(parsed)) {
                console.warn('[Config] listcate không phải object hợp lệ');
                return;
            }

            // Chuẩn hóa tất cả key về NFC để so khớp với M3U
            const normalized = {};
            Object.keys(parsed).forEach(k => {
                const nfcKey = String(k).normalize('NFC');
                normalized[nfcKey] = parsed[k];
            });
            window.CATEGORY_ORDER = normalized;
            console.log('[Config] ✅ Đã ghi đè CATEGORY_ORDER từ URL param:',
                Object.keys(normalized).length, 'keys (đã normalize NFC)');
            console.log('[Config] CATEGORY_ORDER:', normalized);
            console.log('[Config] ✅ Đã ghi đè CATEGORY_ORDER từ URL param:',
                Object.keys(parsed).length, 'keys');
            console.log('[Config] CATEGORY_ORDER:', parsed);
        } catch (err) {
            console.error('[Config] parseListcateParam lỗi:', err);
        }
    })();

})();

/* ============================================================ SVG */
(function() {
    if (window._svg_icon_loader_loaded) return;
    window._svg_icon_loader_loaded = true;
    const SVG_BASE = 'https://vaxplugin.alokillgtv.workers.dev/youtube/svg/';
    const ICON_MAP = {
        'star': 'star.svg',
        'close': 'close.svg',
        'light': 'light.svg',
        'list': 'list.svg',
        'bookmark': 'bookmark.svg',
        'history': 'history.svg',
        'lock': 'lock.svg',
        'unlock': 'unlock.svg',
        'play': 'play.svg',
        'pause': 'pause.svg',
        'next': 'next.svg',
        'prev': 'prev.svg',
        'recycle': 'recycle.svg',
        'fullscreen': 'fullscreen.svg',
        'video': 'video.svg',
        'warning': 'warning.svg',
        'question': 'question.svg',
        'check': 'check.svg',
        'search': 'find.svg',
        'arrow-left': 'arrow-left.svg',
        'arrow-right': 'arrow-right.svg'
    };

    function createSVG(name, size) {
        size = size || '20px';
        const filename = ICON_MAP[name] || (name + '.svg');
        const img = document.createElement('img');
        img.src = SVG_BASE + filename;
        img.alt = name;
        Object.assign(img.style, {
            width: size,
            height: size,
            display: 'inline-block',
            flexShrink: '0',
            objectFit: 'contain',
            filter: 'brightness(0) invert(1)',
            opacity: '1',
            pointerEvents: 'none'
        });
        return img;
    }
    if (!window.Utils) window.Utils = {};
    window.Utils.SVGIcon = {
        create: createSVG,
        fill: createSVG,
        line: createSVG
    };
    window.Utils.Icon = window.Utils.SVGIcon;
})();

/* ============================================================ VERSION CHIP */
(function() {
    if (window._versionChip_loaded) return;
    window._versionChip_loaded = true;

    const VersionChip = {
        _el: null,
        _textEl: null,
        _btnEl: null,
        _visible: true,

        init: function() {
            if (document.getElementById('version-chip')) return;

            const wrap = document.createElement('div');
            wrap.id = 'version-chip';

            const text = document.createElement('span');
            text.id = 'version-text';
            text.textContent = window.APP_VERSION || 'v?';
            text.title = 'Double-click để copy version';
            wrap.appendChild(text);

            const btn = document.createElement('button');
            btn.id = 'version-toggle';
            btn.title = 'Ẩn/Hiện version';
            btn.textContent = '×';
            wrap.appendChild(btn);

            document.body.appendChild(wrap);
            this._el = wrap;
            this._textEl = text;
            this._btnEl = btn;

            // Trạng thái ban đầu theo SHOW_VERSION
            if (window.SHOW_VERSION === false) {
                this._visible = false;
                text.classList.add('hidden');
                btn.textContent = '👁';
            }

            const self = this;
            btn.addEventListener('click', function(e) {
                e.stopPropagation();
                self.toggle();
            });
            text.addEventListener('dblclick', function() {
                try {
                    const range = document.createRange();
                    range.selectNode(text);
                    const sel = window.getSelection();
                    sel.removeAllRanges();
                    sel.addRange(range);
                    document.execCommand('copy');
                    if (window.UIManager) UIManager.showToast('📋 Đã copy version', 1200);
                } catch (e) {}
            });

            console.log('[VersionChip] Init:', window.APP_VERSION,
                '| SHOW_VERSION =', window.SHOW_VERSION);
        },

        toggle: function() {
            this._visible = !this._visible;
            if (this._visible) {
                this._textEl.classList.remove('hidden');
                this._btnEl.textContent = '×';
                window.SHOW_VERSION = true;
            } else {
                this._textEl.classList.add('hidden');
                this._btnEl.textContent = '👁';
                window.SHOW_VERSION = false;
            }
        }
    };

    window.VersionChip = VersionChip;
})();

/* ============================================================ UTILS */
(function() {
    if (window._utils_loaded) return;
    window._utils_loaded = true;
    const DomUtils = {
        createEl: function(tag, attrs, children) {
            attrs = attrs || {};
            children = children || [];
            const el = document.createElement(tag);
            for (const k in attrs) {
                const v = attrs[k];
                if (k === 'text') el.textContent = v;
                else if (k === 'style') Object.assign(el.style, v);
                else if (k === 'dataset') Object.assign(el.dataset, v);
                else el.setAttribute(k, v);
            }
            for (const c of children) {
                if (typeof c === 'string') el.appendChild(document.createTextNode(c));
                else if (c instanceof Node) el.appendChild(c);
            }
            return el;
        },
        formatTime: function(sec) {
            if (!sec || sec < 0 || !isFinite(sec)) return '0:00';
            const d = new Date(0);
            d.setSeconds(Math.floor(sec));
            const h = d.getUTCHours();
            const m = String(d.getUTCMinutes()).padStart(2, '0');
            const s = String(d.getUTCSeconds()).padStart(2, '0');
            return h > 0 ? (h + ':' + m + ':' + s) : (d.getUTCMinutes() + ':' + s);
        }
    };
    window.Utils = window.Utils || {};
    window.Utils.DomUtils = DomUtils;
    window.Utils.safeStorage = {
        get: function(k) {
            try {
                return localStorage.getItem(k);
            } catch (e) {
                return null;
            }
        },
        set: function(k, v) {
            try {
                localStorage.setItem(k, v);
                return true;
            } catch (e) {
                return false;
            }
        },
        remove: function(k) {
            try {
                localStorage.removeItem(k);
                return true;
            } catch (e) {
                return false;
            }
        }
    };
})();

/* ============================================================ M3U PARSER */
(function() {
    if (window._m3uParser_loaded) return;
    window._m3uParser_loaded = true;
    const M3UParser = {
        parse: function(text) {
            if (!text || typeof text !== 'string') return [];
            const lines = text.split(/\r?\n/);
            const channels = [];
            let pending = null;
            let counter = 0;
            for (let i = 0; i < lines.length; i++) {
                const raw = lines[i].trim();
                if (!raw) continue;
                if (raw.startsWith('#EXTM3U')) continue;
                if (raw.startsWith('#EXT-X-')) continue;
                if (raw.startsWith('#EXTVLCOPT') && !pending) continue;
                if (raw.startsWith('#EXTINF')) {
                    pending = {
                        id: '',
                        name: '',
                        url: '',
                        logo: '',
                        group: 'Khác',
                        ua: null,
                        referrer: null,
                        drm: null,
                        attrs: {}
                    };
                    const commaIdx = raw.lastIndexOf(',');
                    const attrPart = commaIdx >= 0 ? raw.substring(0, commaIdx) : raw;
                    const namePart = commaIdx >= 0 ? raw.substring(commaIdx + 1).trim() : '';
                    const attrRegex = /([\w-]+)\s*=\s*"([^"]*)"/g;
                    let m;
                    while ((m = attrRegex.exec(attrPart)) !== null) pending.attrs[m[1]] = m[2];
                    pending.id = pending.attrs['tvg-id'] || ('c_' + (++counter));
                    pending.logo = pending.attrs['tvg-logo'] || '';
                    pending.group = pending.attrs['group-title'] || 'Khác';
                    pending.name = namePart || pending.attrs['tvg-name'] || ('Kênh ' + counter);
                    continue;
                }
                if (raw.startsWith('#EXTVLCOPT') && pending) {
                    const opt = raw.substring('#EXTVLCOPT'.length).replace(/^:/, '').trim();
                    const eq = opt.indexOf('=');
                    if (eq > 0) {
                        const key = opt.substring(0, eq).toLowerCase();
                        const val = opt.substring(eq + 1).replace(/^"|"$/g, '');
                        if (key === 'http-user-agent') pending.ua = val;
                        else if (key === 'http-referrer') pending.referrer = val;
                    }
                    continue;
                }
                if (raw.startsWith('#KODIPROP') && pending) {
                    const prop = raw.substring('#KODIPROP'.length).replace(/^:/, '').trim();
                    const eq = prop.indexOf('=');
                    if (eq > 0) {
                        const key = prop.substring(0, eq);
                        const val = prop.substring(eq + 1);
                        if (key === 'inputstream.adaptive.license_type' && val.toLowerCase() === 'clearkey') {
                            pending.drm = pending.drm || {};
                            pending.drm.type = 'clearkey';
                        } else if (key === 'inputstream.adaptive.license_key') {
                            pending.drm = pending.drm || {};
                            pending.drm.type = 'clearkey';
                            if (val.indexOf('{') === 0) {
                                try {
                                    const obj = JSON.parse(val);
                                    if (obj.keys && Array.isArray(obj.keys)) {
                                        pending.drm.keys = obj.keys.map(k => ({
                                            kid: (k.kid || '').replace(/-/g, ''),
                                            k: (k.k || '').replace(/-/g, '')
                                        }));
                                    }
                                } catch (e) {}
                            } else if (val.indexOf(':') > 0) {
                                const parts = val.split(':');
                                pending.drm.keys = [{
                                    kid: parts[0].trim(),
                                    k: parts[1].trim()
                                }];
                            }
                        }
                    }
                    continue;
                }
                if (raw.startsWith('#')) continue;
                if (pending && raw.match(/^(https?|rtmp|rtsp|\/\/)/i)) {
                    pending.url = raw;
                    pending.type = StreamPlayer ? StreamPlayer.detectType(raw) : 'auto';
                    channels.push(pending);
                    pending = null;
                }
            }
            console.log('[M3U] Parse', channels.length, 'kênh');
            return channels;
        }
    };
    window.M3UParser = M3UParser;
})();

/* ============================================================ STREAM PLAYER */
(function() {
    if (window._streamPlayer_loaded) return;
    window._streamPlayer_loaded = true;
    const StreamPlayer = {
        _video: null,
        _hls: null,
        _dash: null,
        _flv: null,
        _currentUrl: '',
        _currentType: '',
        _isLive: false,
        _retryCount: 0,
        _maxRetry: 5,
        _currentDrm: null,
        init: function() {
            this._video = document.getElementById('vax-video');
            if (!this._video) {
                console.error('[StreamPlayer] no video');
                return;
            }
            this._bindEvents();
        },
        detectType: function(url) {
            if (!url) return 'auto';
            const u = url.toLowerCase().split('#')[0].split('?')[0];
            if (u.endsWith('.m3u8') || u.includes('/hls/') || u.includes('m3u8')) return 'hls';
            if (u.endsWith('.mpd')) return 'dash';
            if (u.endsWith('.flv')) return 'flv';
            if (u.endsWith('.mp4') || u.endsWith('.m4v') || u.endsWith('.mov')) return 'mp4';
            if (u.endsWith('.webm')) return 'webm';
            if (u.endsWith('.mkv')) return 'mkv';
            if (u.endsWith('.ts')) return 'mpegts';
            if (u.includes('.php') || u.includes('/live/') || u.includes('/play/')) return 'hls';
            return 'auto';
        },
        destroy: function() {
            if (this._hls) {
                try {
                    this._hls.destroy();
                } catch (e) {}
                this._hls = null;
            }
            if (this._dash) {
                try {
                    this._dash.reset();
                } catch (e) {}
                this._dash = null;
            }
            if (this._flv) {
                try {
                    this._flv.destroy();
                } catch (e) {}
                this._flv = null;
            }
            try {
                this._video.pause();
            } catch (e) {}
            try {
                this._video.removeAttribute('src');
                this._video.load();
            } catch (e) {}
            this._currentDrm = null;
        },
        play: function(url, type, opts) {
            if (!url) {
                UIManager.showToast('⚠️ URL trống.', 1500);
                return;
            }
            opts = opts || {};
            type = type || 'auto';
            if (type === 'auto') type = this.detectType(url);
            this.destroy();

            // ===== WRAP QUA PROXY =====
            if (opts.proxy && window.PROXY_BASE && !url.startsWith(window.PROXY_BASE)) {
                const referer = opts.referrer || window.location.origin + '/';
                const ua = opts.ua || '';
                url = window.PROXY_BASE + encodeURIComponent(url) +
                    '&referer=' + encodeURIComponent(referer) +
                    (ua ? '&ua=' + encodeURIComponent(ua) : '');
                console.log('[StreamPlayer] 🔀 Proxy URL:', url);
            }

            this._currentUrl = url;
            this._currentType = type;
            this._currentDrm = opts.drm || null;
            this._retryCount = 0;
            this._isLive = !/\.mp4|\.webm|\.mkv|\.m4v/i.test(url) &&
                /m3u8|\.flv|\.ts|mpd|mpegts/i.test(url);
            switch (type) {
                case 'hls':
                    this._playHls(url);
                    break;
                case 'dash':
                    this._playDash(url, opts.drm);
                    break;
                case 'flv':
                    this._playFlv(url);
                    break;
                case 'mpegts':
                    this._playMpegts(url);
                    break;
                default:
                    this._playNative(url);
            }
        },
        _playHls: function(url) {
            const v = this._video;
            if (v.canPlayType('application/vnd.apple.mpegurl') && !window.Hls) {
                v.src = url;
                v.play().catch(() => {});
                return;
            }
            if (!window.Hls || !Hls.isSupported()) {
                UIManager.showToast('❌ Không hỗ trợ HLS.', 3000);
                return;
            }
            const self = this;
            this._hls = new Hls({
                enableWorker: true,
                lowLatencyMode: true,
                backBufferLength: 90,
                maxBufferLength: 30,
                maxMaxBufferLength: 60,
                liveSyncDurationCount: 3,
                manifestLoadingTimeOut: 15000,
                manifestLoadingMaxRetry: 3,
                levelLoadingMaxRetry: 3,
                fragLoadingMaxRetry: 3
            });
            this._hls.loadSource(url);
            this._hls.attachMedia(v);
            this._hls.on(Hls.Events.MANIFEST_PARSED, () => {
                v.play().catch(() => {});
            });
            this._hls.on(Hls.Events.ERROR, (evt, data) => {
                if (!data || !data.fatal) return;
                if (data.type === Hls.ErrorTypes.NETWORK_ERROR) {
                    self._retryCount++;
                    if (self._retryCount <= self._maxRetry) {
                        setTimeout(() => {
                            try {
                                self._hls.startLoad();
                            } catch (e) {}
                        }, 1500);
                    } else if (window.PlayerController) {
                        // Hết retry → báo fallback
                        window.PlayerController._onStreamFail();
                    }
                } else if (data.type === Hls.ErrorTypes.MEDIA_ERROR) {
                    try {
                        self._hls.recoverMediaError();
                    } catch (e) {}
                } else if (window.PlayerController) {
                    window.PlayerController._onStreamFail();
                }
            });
        },
        _playDash: function(url, drm) {
            const v = this._video;
            if (!window.dashjs) {
                UIManager.showToast('❌ Chưa tải dash.js.', 3000);
                return;
            }
            const dash = dashjs.MediaPlayer().create();
            dash.initialize(v, url, true);
            this._dash = dash;
            if (drm && drm.type === 'clearkey' && drm.keys && drm.keys.length) {
                const protData = {
                    'org.w3.clearkey': {
                        clearkey: {}
                    }
                };
                drm.keys.forEach(k => {
                    if (k.kid && k.k)
                        protData['org.w3.clearkey'].clearkey[k.kid.replace(/-/g, '').toLowerCase()] =
                        k.k.replace(/-/g, '').toLowerCase();
                });
                try {
                    dash.setProtectionData(protData);
                } catch (e) {}
            }
            dash.on('playbackPlaying', () => {
                v.play().catch(() => {});
            });
            dash.on('error', () => {
                if (window.PlayerController) window.PlayerController._onStreamFail();
            });
        },
        _playFlv: function(url) {
            const v = this._video;
            if (window.mpegts && mpegts.isSupported() && mpegts.getFeatureList().mseLiveFlvPlayback) {
                try {
                    const player = mpegts.createPlayer({
                        type: 'flv',
                        url: url,
                        isLive: true
                    }, {
                        enableWorker: true,
                        enableStashBuffer: false,
                        stashInitialSize: 128,
                        liveBufferLatencyChasing: true,
                        lazyLoad: false
                    });
                    player.attachMediaElement(v);
                    player.load();
                    v.play().catch(() => {});
                    this._flv = {
                        destroy: () => {
                            try {
                                player.destroy();
                            } catch (e) {}
                        }
                    };
                    return;
                } catch (e) {}
            }
            if (!window.flvjs || !flvjs.isSupported()) {
                UIManager.showToast('❌ Không hỗ trợ FLV.', 3000);
                return;
            }
            const player = flvjs.createPlayer({
                type: 'flv',
                url: url,
                isLive: true,
                hasAudio: true,
                hasVideo: true
            }, {
                enableWorker: true,
                enableStashBuffer: false,
                lazyLoad: false
            });
            player.attachMediaElement(v);
            player.load();
            v.play().catch(() => {});
            this._flv = {
                destroy: () => {
                    try {
                        player.destroy();
                    } catch (e) {}
                }
            };
        },
        _playMpegts: function(url) {
            if (!window.mpegts || !mpegts.isSupported()) {
                UIManager.showToast('❌ Không hỗ trợ MPEG-TS.', 3000);
                return;
            }
            const v = this._video;
            const player = mpegts.createPlayer({
                type: 'mpegts',
                url: url,
                isLive: true
            });
            player.attachMediaElement(v);
            player.load();
            v.play().catch(() => {});
            this._flv = {
                destroy: () => {
                    try {
                        player.destroy();
                    } catch (e) {}
                }
            };
        },
        _playNative: function(url) {
            const v = this._video;
            v.src = url;
            v.play().catch(() => {});
        },
        _bindEvents: function() {
            const v = this._video;
            v.addEventListener('error', () => {
                const e = v.error;
                if (e && window.UIManager) UIManager.showToast('❌ Lỗi phát video (' + e.code + ')', 2000);
                if (window.PlayerController) window.PlayerController._onStreamFail();
            }, true);
        },
        isLive: function() {
            return this._isLive;
        }
    };
    window.StreamPlayer = StreamPlayer;
})();

/* ============================================================ CHANNEL STORE */
(function() {
    if (window._channelStore_loaded) return;
    window._channelStore_loaded = true;

    const ChannelStore = {
        _channels: [],
        _orderedIds: [],
        _favCount: 0,
        _STORAGE_KEY: 'vax_store_v7' + (window.DATA_SCOPE || ''),
        _IMG_CACHE_KEY: 'vax_img_cache_v5' + (window.DATA_SCOPE || ''),
        _WATCH_STATS_KEY: 'vax_watch_stats_v4' + (window.DATA_SCOPE || ''),
        _FOLDER_ORDER_KEY: 'vax_folder_order_v1' + (window.LAYOUT_SCOPE || ''), // ← THÊM
        _imageCache: {},
        _imgSaveTimer: null,
        _watchStats: {},

        init: function(channels) {
            this._channels = channels.slice();
            // ⭐ Normalize tên group về NFC — fix Unicode NFD vs NFC
            const __nfc = s => String(s || '').normalize('NFC');
            this._channels.forEach(c => {
                if (c.group) c.group = __nfc(c.group);
            });
            // Map ID kênh → vị trí trong M3U gốc (để sort ổn định)
            this._m3uOrder = new Map();
            channels.forEach((c, i) => this._m3uOrder.set(c.id, i));
            this._loadImageCache();
            this._loadWatchStats();
            const saved = this._load();
            const currentIds = new Set(channels.map(c => c.id));
            if (saved && Array.isArray(saved.order) && saved.order.length) {
                const knownIds = new Set(saved.order);
                const newIds = channels.filter(c => !knownIds.has(c.id)).map(c => c.id);
                this._orderedIds = saved.order.filter(id => currentIds.has(id)).concat(newIds);
                this._favCount = Math.min(saved.favCount || 0, this._orderedIds.length);
            } else {
                this._orderedIds = channels.map(c => c.id);
                this._favCount = 0;
            }
            // Rebuild index theo folder order hiện tại
            const folders = this.getFolders();
            this.rebuildChannelOrderFromFolders(folders);
            console.log('[Store] Init:', this._channels.length, 'kênh,', this._favCount, 'fav');
        },

        getChannel: function(id) {
            return this._channels.find(c => c.id === id);
        },
       getOrderedChannels: function(){
  const all = this._orderedIds.map(id => this.getChannel(id)).filter(Boolean);
  
  // Nếu health bị tắt → trả nguyên thứ tự, không sort/filter
  if (window.HEALTH_ENABLED === false) return all;
  
  const health = window.ChannelHealth;
  if (!health || !health.hasCheckedAny()) return all;

  // Tách fav ra khỏi phần còn lại — fav LUÔN ở đầu, không bị health sort đè
  const favCount = this._favCount;
  const favSet = new Set(this._orderedIds.slice(0, favCount));
  const favs = [];
  const rest = [];
  all.forEach(c => {
    if (favSet.has(c.id)){
      favs.push(c);
    } else if (!health.isDead(c.id)){
      rest.push(c);
    }
  });

  rest.sort((a, b) => {
    return (health.isAlive(a.id) ? 0 : 1) - (health.isAlive(b.id) ? 0 : 1);
  });

  return favs.concat(rest);
},
        getChannelNumber: function(id) {
            const vis = this.getOrderedChannels();
            for (let i = 0; i < vis.length; i++) {
                if (vis[i].id === id) return i + 1;
            }
            return -1;
        },
        getChannelByNumber: function(num) {
            const vis = this.getOrderedChannels();
            return vis[num - 1] || null;
        },
        getTotal: function() {
            return this._orderedIds.length;
        },
        getFavorites: function() {
            // Fav luôn hiển thị, kể cả chết — user đã chọn thì tôn trọng
            return this._orderedIds.slice(0, this._favCount)
                .map(id => this.getChannel(id)).filter(Boolean).slice(0, 20);
        },
        isFavorite: function(id) {
            const pos = this._orderedIds.indexOf(id);
            return pos >= 0 && pos < this._favCount;
        },
        getFavoriteSlot: function(id) {
            const pos = this._orderedIds.indexOf(id);
            return (pos >= 0 && pos < this._favCount) ? pos + 1 : 0;
        },

        addFavorite: function(id) {
            const pos = this._orderedIds.indexOf(id);
            if (pos < 0) return {
                ok: false,
                msg: '❌ Không tìm thấy kênh'
            };
            if (pos < this._favCount) return {
                ok: false,
                msg: 'ℹ️ Đã có trong yêu thích'
            };
            const targetPos = this._favCount;
            const targetId = this._orderedIds[targetPos];
            this._orderedIds[targetPos] = id;
            this._orderedIds[pos] = targetId;
            this._favCount++;
            const folders = this.getFolders();
            this.rebuildChannelOrderFromFolders(folders);
            const ch = this.getChannel(id);
            console.log('[Store] ⭐ Added:', ch.name, '→ slot', this._favCount);
            return {
                ok: true,
                msg: '⭐ Đã thêm yêu thích (slot ' + this._favCount + ')'
            };
        },

        removeFavorite: function(id) {
            const pos = this._orderedIds.indexOf(id);
            if (pos < 0 || pos >= this._favCount)
                return {
                    ok: false,
                    msg: 'ℹ️ Không có trong yêu thích'
                };
            const ch = this.getChannel(id);
            this._orderedIds.splice(pos, 1);
            this._favCount--;
            const folders = this.getFolders();
            this.rebuildChannelOrderFromFolders(folders);
            const newIdx = this._orderedIds.indexOf(id) + 1;
            console.log('[Store] 🗑️ Removed:', ch.name, '→ index #' + newIdx);
            return {
                ok: true,
                msg: '🗑️ Đã xóa yêu thích (kênh về #' + newIdx + ')'
            };
        },

        getLastOpened: function() {
            try {
                const raw = localStorage.getItem('vax_last_opened_v1' + (window.LAYOUT_SCOPE || ''));
                return raw ? JSON.parse(raw) : {
                    folderId: null,
                    channelId: null
                };
            } catch (e) {
                return {
                    folderId: null,
                    channelId: null
                };
            }
        },
        setLastOpened: function(folderId, channelId) {
            try {
                localStorage.setItem('vax_last_opened_v1' + (window.LAYOUT_SCOPE || ''), JSON.stringify({
                    folderId: folderId || null,
                    channelId: channelId || null
                }));
            } catch (e) {}
        },

        toggleFavorite: function(id) {
            if (this.isFavorite(id)) return this.removeFavorite(id);
            return this.addFavorite(id);
        },

        moveFavorite: function(from, to) {
            if (from < 0 || to < 0 || from >= this._favCount || to >= this._favCount)
                return {
                    ok: false,
                    msg: 'Vị trí không hợp lệ'
                };
            if (from === to) return {
                ok: false,
                msg: 'Cùng vị trí'
            };
            const tmp = this._orderedIds[from];
            this._orderedIds[from] = this._orderedIds[to];
            this._orderedIds[to] = tmp;
            this._save();
            const ch = this.getChannel(this._orderedIds[to]);
            console.log('[Store] 🔄 Moved to slot', to + 1, ':', ch ? ch.name : '?');
            return {
                ok: true,
                msg: '🔄 Đã chuyển sang vị trí #' + (to + 1)
            };
        },

        clearAllFavorites: function() {
            if (this._favCount === 0) return {
                ok: false,
                msg: 'ℹ️ Không có kênh yêu thích'
            };
            const count = this._favCount;
            const favs = this._orderedIds.slice(0, count);
            const rest = this._orderedIds.slice(count);
            this._orderedIds = rest.concat(favs);
            this._favCount = 0;
            this._save();
            console.log('[Store] 🗑️ Cleared', count, 'favorites');
            return {
                ok: true,
                msg: '🗑️ Đã xóa ' + count + ' kênh yêu thích'
            };
        },

        /* ============ WATCH STATS ============ */
        _loadWatchStats: function() {
            try {
                const raw = localStorage.getItem(this._WATCH_STATS_KEY);
                this._watchStats = raw ? JSON.parse(raw) : {};
                console.log('[WatchStats] Loaded', Object.keys(this._watchStats).length, 'entries');
            } catch (e) {
                this._watchStats = {};
            }
        },
        _saveWatchStats: function() {
            try {
                localStorage.setItem(this._WATCH_STATS_KEY, JSON.stringify(this._watchStats));
            } catch (e) {
                console.warn('[WatchStats] Save failed:', e);
            }
        },
        recordWatch: function(id, seconds) {
            if (!id || !seconds || seconds < 1) return;
            if (!this._watchStats[id]) this._watchStats[id] = {
                total: 0,
                last: 0
            };
            this._watchStats[id].total += seconds;
            this._watchStats[id].last = Date.now();
            this._saveWatchStats();
            console.log('[WatchStats] +' + Math.round(seconds) + 's cho', id,
                '(total:', Math.round(this._watchStats[id].total) + 's)');
        },
        getRecentlyWatched: function(limit) {
            limit = limit || 20;
            const MIN_OTHER = 60;
            const entries = Object.keys(this._watchStats).map(id => ({
                id,
                total: this._watchStats[id].total,
                last: this._watchStats[id].last
            }));
            const result = [];

            // === 1. ƯU TIÊN: Kênh cuối cùng vừa mở (từ getLastOpened) ===
            const lastOpened = this.getLastOpened();
            if (lastOpened && lastOpened.channelId && this.getChannel(lastOpened.channelId)) {
                result.push(lastOpened.channelId);
            }
            // Fallback: nếu chưa có lastOpened, dùng kênh watch stats mới nhất
            else {
                const lastWatched = entries.slice().sort((a, b) => b.last - a.last)[0];
                if (lastWatched) result.push(lastWatched.id);
            }

            // === 2. Các kênh xem >= 60s, sort theo tổng thời gian ===
            entries
                .filter(e => e.total >= MIN_OTHER && !result.includes(e.id))
                .sort((a, b) => b.total - a.total)
                .forEach(e => {
                    if (result.length < limit) result.push(e.id);
                });

            console.log('[WatchStats] getRecentlyWatched →', result.length, 'kênh',
                '(ưu tiên #1:', result[0] || 'không có', ')');
            return result.map(id => this.getChannel(id)).filter(Boolean);
        },

        getFolders: function() {
            const orderMap = window.CATEGORY_ORDER || {};
            const groups = {};
            this.getOrderedChannels().forEach(ch => {
                const g = ch.group || 'Khác';
                if (!groups[g]) groups[g] = [];
                groups[g].push(ch);
            });
            const allGroupKeys = new Set(Object.keys(groups));

            // ⭐ Strip dấu + lowercase để match không phụ thuộc NFC/NFD
            const norm = s => String(s || '')
                .normalize('NFD')
                .replace(/[\u0300-\u036f]/g, '')
                .replace(/[đĐ]/g, 'd')
                .toLowerCase()
                .replace(/\s+/g, ' ')
                .trim();

            // Map: tên chuẩn hóa → tên gốc trong M3U
            const normToGroup = {};
            allGroupKeys.forEach(g => {
                normToGroup[norm(g)] = g;
            });

            function parseCategoryKey(rawKey) {
                const nKey = norm(rawKey);
                if (normToGroup[nKey]) {
                    const realGroup = normToGroup[nKey];
                    // Nếu rawKey khớp chính xác thì dùng rawKey làm display, không thì dùng tên M3U
                    const display = allGroupKeys.has(rawKey) ? rawKey : realGroup;
                    return {
                        matchKey: realGroup,
                        displayName: display
                    };
                }
                const pipeIdx = rawKey.indexOf('|');
                if (pipeIdx > 0) {
                    const left = rawKey.substring(0, pipeIdx).trim();
                    const right = rawKey.substring(pipeIdx + 1).trim();
                    const nLeft = norm(left);
                    if (normToGroup[nLeft]) {
                        return {
                            matchKey: normToGroup[nLeft],
                            displayName: right
                        };
                    }
                }
                return {
                    matchKey: rawKey,
                    displayName: rawKey,
                    invalid: true
                };
            }

            const valueToKey = {};
            const hiddenGroups = new Set();
            const mergeMap = {};
            const categoryPriority = {};
            const displayNameMap = {};

            Object.keys(orderMap).forEach(rawKey => {
                if (rawKey === '_fav' || rawKey === '_all') return;
                const val = orderMap[rawKey];
                const parsed = parseCategoryKey(rawKey);
                const key = parsed.matchKey;
                displayNameMap[key] = parsed.displayName;
                if (val === 0) {
                    hiddenGroups.add(key);
                    return;
                }
                if (Array.isArray(val)) {
                    const priority = val[0];
                    if (priority === 0) {
                        hiddenGroups.add(key);
                        return;
                    }
                    if (typeof priority === 'number' && priority > 0) {
                        categoryPriority[key] = priority;
                        valueToKey[priority] = key;
                    }
                    return;
                }
                if (typeof val === 'number' && val > 0) {
                    categoryPriority[key] = val;
                    valueToKey[val] = key;
                }
            });

            Object.keys(orderMap).forEach(rawKey => {
                if (rawKey === '_fav' || rawKey === '_all') return;
                const val = orderMap[rawKey];
                if (!Array.isArray(val)) return;
                const parsed = parseCategoryKey(rawKey);
                const targetKey = parsed.matchKey;
                val.slice(1).forEach(sub => {
                    if (typeof sub === 'string') {
                        if (allGroupKeys.has(sub)) mergeMap[sub] = targetKey;
                    } else if (typeof sub === 'number' && sub > 0) {
                        const src = valueToKey[sub];
                        if (src) mergeMap[src] = targetKey;
                    }
                });
            });

            function resolveTarget(g) {
                const visited = new Set();
                let cur = g;
                while (mergeMap[cur] && !visited.has(cur)) {
                    visited.add(cur);
                    cur = mergeMap[cur];
                }
                return cur;
            }

            const mergedGroups = {};
            const mergedKeys = new Set();
            Object.keys(groups).forEach(g => {
                if (hiddenGroups.has(g)) return;
                const target = resolveTarget(g);
                if (hiddenGroups.has(target)) return;
                if (!mergedGroups[target]) mergedGroups[target] = [];
                mergedGroups[target] = mergedGroups[target].concat(groups[g]);
                mergedKeys.add(target);
            });

            const sortedKeys = Array.from(mergedKeys).sort((a, b) => {
                const pa = categoryPriority[a] != null ? categoryPriority[a] : 99999;
                const pb = categoryPriority[b] != null ? categoryPriority[b] : 99999;
                if (pa !== pb) return pa - pb;
                return a.localeCompare(b);
            });

            this._hiddenGroups = hiddenGroups;

            let folders = [];

            // 0: Tất Cả Kênh — LUÔN ở đầu
            const allVisible = this.getOrderedChannels().filter(ch => {
                const g = ch.group || 'Khác';
                return !hiddenGroups.has(g);
            });
            folders.push({
                id: '_all',
                name: 'Tất Cả Kênh',
                logo: '',
                channels: allVisible,
                _groupMembers: ['_all'],
                special: true
            });

            // 1: Kênh Yêu Thích — LUÔN thứ 2
            folders.push({
                id: '_fav',
                name: 'Kênh Yêu Thích',
                logo: '',
                channels: this.getFavorites(),
                _groupMembers: ['_fav'],
                special: true
            });

            // 2+: các nhóm
            sortedKeys.forEach(key => {
                const displayName = displayNameMap[key] || key;
                const members = [key];
                Object.keys(mergeMap).forEach(src => {
                    if (mergeMap[src] === key) members.push(src);
                });
                folders.push({
                    id: 'g_' + key,
                    name: displayName,
                    logo: (mergedGroups[key][0] && mergedGroups[key][0].logo) || '',
                    channels: mergedGroups[key],
                    _groupMembers: members
                });
            });

            // Áp dụng saved order (chỉ cho groups, bỏ qua _all, _fav)
            const savedOrder = this._loadFolderOrder();
            if (savedOrder && Array.isArray(savedOrder) && savedOrder.length) {
                const movable = folders.slice(2);
                const map = {};
                movable.forEach(f => {
                    map[f.id] = f;
                });
                const reordered = [];
                savedOrder.forEach(id => {
                    if (map[id]) {
                        reordered.push(map[id]);
                        delete map[id];
                    }
                });
                movable.forEach(f => {
                    if (map[f.id]) reordered.push(f);
                });
                folders = folders.slice(0, 2).concat(reordered);
            }

            console.log('[Store] Folders:', folders.length);
            return folders;
        },

        rebuildChannelOrderFromFolders: function(folders) {
            if (!Array.isArray(folders) || !folders.length) return;
            const favIds = this._orderedIds.slice(0, this._favCount);
            const added = new Set(favIds);
            const newOrder = favIds.slice();
            const hiddenGroups = this._hiddenGroups || new Set();
            const m3uOrder = this._m3uOrder || new Map();

            // Duyệt folder thật từ index 2 (bỏ _all, _fav)
            for (let i = 2; i < folders.length; i++) {
                const f = folders[i];
                if (!f || !f._groupMembers || f._groupMembers[0] === '_all' ||
                    f._groupMembers[0] === '_fav') continue;
                const groupSet = new Set(f._groupMembers);
                const chs = this._channels.filter(c => {
                    const g = c.group || 'Khác';
                    if (hiddenGroups.has(g)) return false;
                    if (groupSet.has(g)) return true;
                    // Cũng match nếu group không có trong CATEGORY_ORDER
                    return false;
                });
                chs.sort((a, b) => {
                    const ai = m3uOrder.get(a.id);
                    const bi = m3uOrder.get(b.id);
                    return (ai == null ? 999999 : ai) - (bi == null ? 999999 : bi);
                });
                chs.forEach(c => {
                    if (!added.has(c.id)) {
                        newOrder.push(c.id);
                        added.add(c.id);
                    }
                });
            }

            // Append kênh orphan (không match group nào) — trừ hidden
            this._channels.forEach(c => {
                const g = c.group || 'Khác';
                if (hiddenGroups.has(g)) return;
                if (!added.has(c.id)) {
                    newOrder.push(c.id);
                    added.add(c.id);
                }
            });

            this._orderedIds = newOrder;

            const orderMap = new Map();
            this._orderedIds.forEach((id, i) => orderMap.set(id, i));
            folders.forEach(f => {
                if (!Array.isArray(f.channels)) return;
                f.channels.sort((a, b) => {
                    const ai = orderMap.get(a.id);
                    const bi = orderMap.get(b.id);
                    return (ai == null ? 999999 : ai) - (bi == null ? 999999 : bi);
                });
            });

            this._save();
            console.log('[Store] Rebuilt:', newOrder.length, 'kênh (visible) | fav:', this._favCount);
        },
        /* ============ FOLDER ORDER ============ */
        _loadFolderOrder: function() {
            try {
                const raw = localStorage.getItem(this._FOLDER_ORDER_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        },
        _saveFolderOrder: function(orderArray) {
            try {
                localStorage.setItem(this._FOLDER_ORDER_KEY, JSON.stringify(orderArray));
            } catch (e) {
                console.warn('[Store] Save folder order failed:', e);
            }
        },
        saveFolderOrderFromList: function(folders) {
            const movable = folders.slice(2).map(f => f.id);
            this._saveFolderOrder(movable);
            this.rebuildChannelOrderFromFolders(folders);
            console.log('[Store] Saved folder order:', movable.length, 'items');
        },

        _load: function() {
            try {
                const raw = localStorage.getItem(this._STORAGE_KEY);
                return raw ? JSON.parse(raw) : null;
            } catch (e) {
                return null;
            }
        },
        _save: function() {
            try {
                localStorage.setItem(this._STORAGE_KEY,
                    JSON.stringify({
                        order: this._orderedIds,
                        favCount: this._favCount
                    }));
            } catch (e) {}
        },

        _loadImageCache: function() {
            try {
                const raw = localStorage.getItem(this._IMG_CACHE_KEY);
                this._imageCache = raw ? JSON.parse(raw) : {};
                console.log('[ImgCache] Loaded', Object.keys(this._imageCache).length);
            } catch (e) {
                this._imageCache = {};
            }
        },
        _saveImageCache: function() {
            try {
                localStorage.setItem(this._IMG_CACHE_KEY, JSON.stringify(this._imageCache));
            } catch (e) {
                const keys = Object.keys(this._imageCache);
                if (keys.length > 50) {
                    keys.slice(0, Math.floor(keys.length / 2)).forEach(k => delete this._imageCache[k]);
                    try {
                        localStorage.setItem(this._IMG_CACHE_KEY,
                            JSON.stringify(this._imageCache));
                    } catch (e2) {}
                }
            }
        },
        _scheduleSaveCache: function() {
            clearTimeout(this._imgSaveTimer);
            this._imgSaveTimer = setTimeout(() => this._saveImageCache(), 3000);
        },
        getImageSrc: function(ch) {
            if (this._imageCache[ch.id]) return this._imageCache[ch.id];
            return ch.logo || '';
        },
        cacheImage: function(ch) {
            if (!ch.logo || this._imageCache[ch.id]) return;
            const self = this;
            const img = new Image();
            img.crossOrigin = 'anonymous';
            img.onload = function() {
                try {
                    const canvas = document.createElement('canvas');
                    const MAX = 100;
                    let w = img.naturalWidth || img.width;
                    let h = img.naturalHeight || img.height;
                    if (!w || !h) return;
                    if (w > h) {
                        if (w > MAX) {
                            h = h * MAX / w;
                            w = MAX;
                        }
                    } else {
                        if (h > MAX) {
                            w = w * MAX / h;
                            h = MAX;
                        }
                    }
                    canvas.width = w;
                    canvas.height = h;
                    const ctx = canvas.getContext('2d');
                    ctx.drawImage(img, 0, 0, w, h);
                    const dataUrl = canvas.toDataURL('image/jpeg', 0.6);
                    self._imageCache[ch.id] = dataUrl;
                    self._scheduleSaveCache();
                } catch (e) {}
            };
            img.onerror = function() {};
            try {
                img.src = ch.logo;
            } catch (e) {}
        }
    };
    window.ChannelStore = ChannelStore;
})();

/* ============================================================ CHANNEL HEALTH */
(function() {
    if (window._channelHealth_loaded) return;
    window._channelHealth_loaded = true;

    const ChannelHealth = {
        _status: {}, // { id: 'alive' | 'dead' }
        _lastCheck: 0,
        _checking: false,
        _abort: false,
        _STORAGE_KEY: 'vax_health_v1' + (window.DATA_SCOPE || ''),
        _TTL: 60 * 60 * 1000, // 1 giờ
        _BATCH_SIZE: 60,
        _TIMEOUT: 2500,
        _proxyUrl: window.CHECK_PROXY_URL || '/api/proxy',

        load: function() {
            try {
                const raw = localStorage.getItem(this._STORAGE_KEY);
                if (raw) {
                    const o = JSON.parse(raw);
                    this._status = o.status || {};
                    this._lastCheck = o.ts || 0;
                    console.log('[Health] Loaded', Object.keys(this._status).length, 'entries |',
                        'cũ', Math.round((Date.now() - this._lastCheck) / 60000), 'phút');
                }
            } catch (e) {
                this._status = {};
            }
        },

        save: function() {
            try {
                localStorage.setItem(this._STORAGE_KEY, JSON.stringify({
                    status: this._status,
                    ts: Date.now()
                }));
            } catch (e) {}
        },

        getStatus: function(id) {
            return this._status[id] || 'unknown';
        },
        isAlive: function(id) {
            return this._status[id] === 'alive';
        },
        isDead: function(id) {
            return this._status[id] === 'dead';
        },
        hasCheckedAny: function() {
            return Object.keys(this._status).length > 0;
        },
        isFresh: function() {
            return (Date.now() - this._lastCheck) < this._TTL;
        },
        isChecking: function() {
            return this._checking;
        },

        stats: function() {
            let alive = 0,
                dead = 0;
            const vals = Object.values(this._status);
            vals.forEach(s => {
                if (s === 'alive') alive++;
                else if (s === 'dead') dead++;
            });
            return {
                alive,
                dead,
                total: vals.length
            };
        },

        // ========================= Check all kênh
        checkAll: async function(channels, onProgress) {
            if (this._checking) {
                console.log('[Health] Đang check, bỏ qua lệnh mới.');
                return null;
            }
            this._checking = true;
            this._abort = false;

            const todo = (channels || []).filter(c => c && c.url);
            console.log('%c[Health] 🚀 Bắt đầu check ' + todo.length +
                ' kênh (batch=' + this._BATCH_SIZE + ')', 'color:#4dabf7;font-weight:bold');

            const t0 = Date.now();
            let done = 0,
                alive = 0,
                dead = 0;

            for (let i = 0; i < todo.length; i += this._BATCH_SIZE) {
                if (this._abort) break;
                const batch = todo.slice(i, i + this._BATCH_SIZE);

                // ⭐ Bọc từng kênh — 1 kênh lỗi không văng cả batch
                // ⭐ Bọc từng kênh + ép timeout batch cứng
                let results;
                try {
                    results = await this._race(
                        Promise.all(
                            batch.map(ch => this._checkOne(ch).catch(e => ({
                                alive: false,
                                via: 'none',
                                reason: 'catch:' + (e && e.message)
                            })))
                        ),
                        20000 // batch tối đa 20s, quá thì bỏ qua
                    );
                } catch (e) {
                    console.warn('%c[Health] Batch ' + (Math.floor(i / this._BATCH_SIZE) + 1) +
                        ' TIMEOUT 20s — bỏ qua ' + batch.length + ' kênh',
                        'color:#ff6b6b;font-weight:bold');
                    // Đánh dấu kênh "unknown" — coi như alive để không bị ẩn oan
                    batch.forEach(ch => {
                        this._status[ch.id] = 'alive';
                    });
                    results = null;
                }

                if (!results) {
                    done += batch.length;
                    this._lastCheck = Date.now();
                    this.save();
                    continue;
                }

                results.forEach((r, idx) => {
                    const ch = batch[idx];
                    this._status[ch.id] = r.alive ? 'alive' : 'dead';
                    if (r.alive) alive++;
                    else dead++;
                });

                done += batch.length;
                this._lastCheck = Date.now();
                this.save();

                // ⭐ Refresh UI mỗi batch — user thấy kênh chết rụng dần
                try {
                    const folders = ChannelStore.getFolders();
                    UIManager.renderChannelBrowser(folders, UIManager._activeFolderId);
                } catch (e) {}

                console.log('%c[Health] Batch ' + (Math.floor(i / this._BATCH_SIZE) + 1) +
                    ': ' + done + '/' + todo.length + ' (✅' + alive + ' ❌' + dead + ')',
                    'color:#888');

                if (onProgress) {
                    try {
                        onProgress({
                            done,
                            total: todo.length,
                            alive,
                            dead
                        });
                    } catch (e) {}
                }
            }

            this._checking = false;
            const dur = ((Date.now() - t0) / 1000).toFixed(1);
            console.log('%c[Health] ✅ Hoàn tất ' + dur + 's — alive=' + alive +
                ' dead=' + dead, 'color:#22c55e;font-weight:bold');
            return {
                total: todo.length,
                alive,
                dead,
                duration: dur
            };
        },

        abortCheck: function() {
            this._abort = true;
        },

        // ============================================================
        // REMOTE CACHE (D1)
        // ============================================================
        getCacheKey: function() {
            // Hash từ URL param — cùng file M3U → cùng cache
            const params = new URLSearchParams(location.search);
            const urlParam = params.get('url') || window.PLAYLIST_URL || '';
            let h = 0;
            for (let i = 0; i < urlParam.length; i++) {
                h = ((h << 5) - h) + urlParam.charCodeAt(i);
                h |= 0;
            }
            return 'k_' + Math.abs(h).toString(36) + '_' + urlParam.length;
        },

        loadRemote: async function() {
            const base = window.HEALTH_API_URL;
            if (!base) {
                console.log('[Health] Không có HEALTH_API_URL — bỏ qua remote cache');
                return null;
            }
            const key = this.getCacheKey();
            const url = base + '/api/health?key=' + encodeURIComponent(key);
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 5000);
            try {
                const res = await fetch(url, {
                    signal: ctrl.signal,
                    cache: 'no-store'
                });
                clearTimeout(tid);
                if (!res.ok) return null;
                const json = await res.json();
                if (!json.ok || !json.hit) {
                    console.log('[Health] Remote MISS — sẽ tự check');
                    return null;
                }
                console.log('%c[Health] ⚡ Remote HIT — cache còn ' +
                    Math.round(json.remain_ms / 60000) + ' phút', 'color:#22c55e;font-weight:bold');
                return json;
            } catch (e) {
                clearTimeout(tid);
                console.log('[Health] Remote fail:', e.message);
                return null;
            }
        },

        saveRemote: async function() {
            const base = window.HEALTH_API_URL;
            if (!base) {
                console.warn('[Health] Chưa set window.HEALTH_API_URL — bỏ qua saveRemote');
                return;
            }
            const key = this.getCacheKey();
            const payload = {
                key: key,
                data: this._status,
                ttl_ms: window.HEALTH_TTL_MS || 12 * 3600 * 1000
            };

            fetch(base + '/api/health', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify(payload)
            }).then(async r => {
                const text = await r.text();
                let json = null;
                try {
                    json = JSON.parse(text);
                } catch (e) {
                    throw new Error('HTTP ' + r.status + ' (không phải JSON): ' + text.slice(0, 100));
                }
                if (!json.ok) throw new Error(json.error || 'unknown');
                return json;
            }).then(j => {
                console.log('%c[Health] 💾 Đã upload lên D1 — ' +
                    Object.keys(this._status).length + ' kênh, TTL ' +
                    Math.round(j.ttl_ms / 3600000) + 'h | size ' +
                    Math.round((j.size || 0) / 1024) + 'KB',
                    'color:#4dabf7;font-weight:bold');
            }).catch(e => {
                console.warn('[Health] saveRemote fail:', e.message);
                console.warn('[Health] Kiểm tra window.HEALTH_API_URL có đúng không:', base);
            });
        },

        applyRemote: function(remoteData) {
            if (!remoteData || typeof remoteData !== 'object') return false;
            const count = Object.keys(remoteData).length;
            if (count < 10) return false; // dữ liệu quá ít → bỏ
            this._status = Object.assign({}, remoteData);
            this._lastCheck = Date.now();
            this.save();
            console.log('[Health] Applied ' + count + ' từ remote vào local');
            return true;
        },

        clear: function() {
            this._status = {};
            this._lastCheck = 0;
            this.save();
        },

        // ========================= Check 1 kênh — 3 tầng
        // ========================= Check 1 kênh — 2 tầng siêu nhanh
        _checkOne: async function(ch) {
            const url = ch.url;
            if (!url) return {
                alive: false,
                via: 'none'
            };

            // ⭐ http:// trong trang https:// → Mixed Content → WebView treo fetch
            // Bỏ qua tầng 1, chỉ dùng proxy
            const isHttps = /^https:\/\//i.test(url);

            if (isHttps) {
                try {
                    const r1 = await this._race(this._direct(url), 2500);
                    if (r1 && r1.alive) return {
                        alive: true,
                        via: 'frontend'
                    };
                } catch (e) {}
            }

            // Tầng 2: proxy worker — có timeout cứng
            try {
                const r2 = await this._race(this._viaProxy(url), 6000);
                if (r2 && r2.alive) return {
                    alive: true,
                    via: 'worker'
                };
                return {
                    alive: false,
                    via: 'none',
                    reason: r2 ? r2.reason : 'no_result'
                };
            } catch (e) {
                return {
                    alive: false,
                    via: 'none',
                    reason: 'outer_timeout'
                };
            }
        },

        // ⭐ Promise.race — không phụ thuộc AbortController của fetch
        _race: function(promise, ms) {
            return Promise.race([
                promise,
                new Promise((_, rej) => setTimeout(
                    () => rej(new Error('hard_timeout_' + ms)), ms
                ))
            ]);
        },

        _direct: async function(url) {
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 2500);
            try {
                const res = await fetch(url, {
                    method: 'GET',
                    mode: 'no-cors', // ⭐ Bypass CORS — opaque response
                    signal: ctrl.signal,
                    cache: 'no-store',
                    credentials: 'omit',
                    redirect: 'follow'
                });
                clearTimeout(tid);
                // opaque → server sống (DNS, TCP, TLS đều OK)
                if (res.type === 'opaque') return {
                    alive: true
                };
                if (!res.ok) return {
                    alive: false,
                    reason: 'HTTP ' + res.status
                };
                const text = await res.text();
                return this._validate(text);
            } catch (e) {
                clearTimeout(tid);
                return {
                    alive: false,
                    reason: e.name === 'AbortError' ? 'timeout' : e.message
                };
            }
        },

        _viaProxy: async function(url) {
            const proxyBase = window.PROXY_URL || window.STREAM_PROXY_URL ||
                'https://tivi.alokillgtv02.workers.dev/proxy';
            const target = proxyBase + '?url=' + encodeURIComponent(url) +
                '&referer=' + encodeURIComponent(location.origin + '/');
            const ctrl = new AbortController();
            const tid = setTimeout(() => ctrl.abort(), 5000);
            try {
                const res = await fetch(target, {
                    method: 'GET',
                    signal: ctrl.signal,
                    cache: 'no-store'
                });
                clearTimeout(tid);
                if (!res.ok) return {
                    alive: false,
                    reason: 'proxy HTTP ' + res.status
                };
                const text = await res.text();
                return this._validate(text);
            } catch (e) {
                clearTimeout(tid);
                return {
                    alive: false,
                    reason: e.name === 'AbortError' ? 'timeout' : e.message
                };
            }
        },

        _validate: function(text) {
            if (!text || text.length < 10) return {
                alive: false,
                reason: 'empty'
            };
            const t = text.trim();
            if (t.startsWith('#EXTM3U')) return {
                alive: true
            };
            if (text.indexOf('#EXTINF') !== -1) return {
                alive: true
            };
            if (text.indexOf('#EXT-X-') !== -1) return {
                alive: true
            };
            if (/<html|<body|404|403|Not Found|Access Denied/i.test(t.slice(0, 500))) {
                return {
                    alive: false,
                    reason: 'html/error page'
                };
            }
            return {
                alive: text.length > 100
            };
        }
    };

    window.ChannelHealth = ChannelHealth;
})();

/* ============================================================ UI MANAGER */
(function() {
    if (window._uiManager_loaded) return;
    window._uiManager_loaded = true;
    const DomUtils = window.Utils.DomUtils;

    function svg(name, size) {
        size = size || '20px';
        try {
            if (window.Utils && window.Utils.SVGIcon) return window.Utils.SVGIcon.fill(name, size);
        } catch (e) {}
        const s = document.createElement('span');
        s.textContent = '?';
        s.style.fontSize = size;
        return s;
    }
    const EMOJI_TO_ICON = {
        '▶️': 'play',
        '⏸️': 'pause',
        '⏹️': 'pause',
        '⏪': 'prev',
        '⏩': 'next',
        '✅': 'check',
        '⚠️': 'warning',
        '🔁': 'recycle',
        '🗑️': 'recycle',
        '📁': 'list',
        '📚': 'bookmark',
        '📜': 'history',
        '🔄': 'recycle',
        '⛶': 'fullscreen',
        '📝': 'list',
        '🎬': 'video',
        '🔒': 'lock',
        '🔓': 'unlock',
        '📂': 'list',
        '💡': 'light',
        '❌': 'close',
        '📥': 'recycle',
        '📭': 'list',
        '🚫': 'close',
        'ℹ️': 'question',
        '🔍': 'search',
        '📺': 'video',
        '⭐': 'bookmark'
    };

    const UIManager = {
        _container: null,
        _titleEl: null,
        _controlsContainer: null,
        _leftPanel: null,
        _rightPanel: null,
        _folderPanel: null,
        _channelPanel: null,
        _folderItems: [],
        _channelItems: [],
        _focusArea: 'folders',
        _folderFocusIdx: 0,
        _channelFocusIdx: 0,
        _closeLeft: null,
        _closeRight: null,
        _progressContainer: null,
        _progressFill: null,
        _progressTime: null,
        _toastEl: null,
        _currentFolders: [],
        _activeFolderId: '_all',
        _helperEl: null,
        _helperScrollBound: false,
        _helperTimer: null,
        _wheelBound: false,
        _favSwapState: null,
        _browseCursor: -1,
        _favBrowseCursor: -1,
        _folderMoveTarget: null,
        _lastFavFocusedId: null,
        _virtualFolderCount: 3,
        _lastRealFolderId: null,
        _folderMoveTarget: null,
        build: function() {
            ['yt-ultimate-container', 'yt-ultimate-overlay', 'yt-ultimate-toast',
                'channel-number-overlay', 'fav-quick-list', 'recent-quick-list',
                'help-modal', 'channel-helper'
            ].forEach(id => {
                const e = document.getElementById(id);
                if (e) e.remove();
            });

            const container = DomUtils.createEl('div', {
                id: 'yt-ultimate-container'
            });
            document.body.appendChild(container);
            this._container = container;

            this._titleEl = DomUtils.createEl('div', {
                id: 'yt-ultimate-title',
                text: 'Đang tải...'
            });
            container.appendChild(this._titleEl);

            const pc = DomUtils.createEl('div', {
                id: 'yt-ultimate-progress'
            });
            container.appendChild(pc);
            this._progressContainer = pc;
            this._progressFill = DomUtils.createEl('div', {
                id: 'yt-ultimate-progress-fill'
            });
            pc.appendChild(this._progressFill);
            this._progressTime = DomUtils.createEl('div', {
                id: 'yt-ultimate-progress-time',
                text: '0:00'
            });
            pc.appendChild(this._progressTime);

            const controls = DomUtils.createEl('div', {
                id: 'yt-ultimate-controls'
            });
            container.appendChild(controls);
            this._controlsContainer = controls;

            const buttons = [{
                    id: 'ctrl-list',
                    icon: 'list',
                    label: 'Danh Sách Kênh'
                },
                {
                    id: 'ctrl-fav',
                    icon: 'bookmark',
                    label: 'Yêu Thích Kênh Này'
                },
                {
                    id: 'ctrl-prev',
                    icon: 'prev',
                    label: 'Kênh Trước'
                },
                {
                    id: 'ctrl-toggle',
                    icon: 'play',
                    label: 'Phát / Tạm dừng'
                },
                {
                    id: 'ctrl-next',
                    icon: 'next',
                    label: 'Kênh Kế'
                },
                {
                    id: 'ctrl-lock',
                    icon: 'lock',
                    label: 'Tắt Màn Hình'
                },
                {
                    id: 'ctrl-help',
                    icon: 'question',
                    label: 'Hướng Dẫn'
                }
            ];
            buttons.forEach(item => {
                const btn = DomUtils.createEl('button', {
                    id: item.id,
                    dataset: {
                        label: item.label
                    }
                });
                btn.appendChild(svg(item.icon, '26px'));
                btn.addEventListener('click', function(e) {
                    e.stopPropagation();
                    // FIX: activate đúng nút được click, không dùng activateFocused
                    if (window.ControlsManager) ControlsManager.activate(item.id);
                });
                controls.appendChild(btn);
            });

            const overlay = DomUtils.createEl('div', {
                id: 'yt-ultimate-overlay'
            });
            document.body.appendChild(overlay);
            ['touch-left', 'touch-center', 'touch-right'].forEach((id, i) => {
                const z = DomUtils.createEl('div', {
                    id: id
                });
                if (i === 1) z.style.flex = '2';
                overlay.appendChild(z);
            });

            const numOv = DomUtils.createEl('div', {
                id: 'channel-number-overlay'
            });
            document.body.appendChild(numOv);

            const favList = DomUtils.createEl('div', {
                id: 'fav-quick-list',
                class: 'side-list'
            });
            document.body.appendChild(favList);
            const recList = DomUtils.createEl('div', {
                id: 'recent-quick-list',
                class: 'side-list'
            });
            document.body.appendChild(recList);

            const helper = DomUtils.createEl('div', {
                id: 'channel-helper'
            });
            document.body.appendChild(helper);
            this._helperEl = helper;

            const help = DomUtils.createEl('div', {
                id: 'help-modal'
            });
            document.body.appendChild(help);
            HelpModal.build();

            const leftPanel = this._createPanel('yt-ultimate-left-panel', 'Danh Sách Kênh', 'left');
            this._leftPanel = leftPanel;
            const pcLeft = leftPanel.querySelector('.panel-content');
            const browser = DomUtils.createEl('div', {
                id: 'channel-browser'
            });
            pcLeft.appendChild(browser);
            this._folderPanel = DomUtils.createEl('div', {
                id: 'folder-panel'
            });
            this._channelPanel = DomUtils.createEl('div', {
                id: 'channel-panel'
            });
            browser.appendChild(this._folderPanel);
            browser.appendChild(this._channelPanel);

            if (!this._helperScrollBound) {
                this._helperScrollBound = true;
                this._channelPanel.addEventListener('scroll', () => {
                    UIManager._positionHelper();
                }, {
                    passive: true
                });
            }

            // ===== WHEEL + TOUCH cho _all view =====
            if (!this._wheelBound) {
                this._wheelBound = true;
                const panel = this._channelPanel;
                const self = this;

                // Wheel: dọc → ↑↓ | ngang → ←→
                panel.addEventListener('wheel', function(e) {
                    const folder = self.getActiveFolder();
                    if (!folder || folder.id !== '_all') return;
                    if (self.getFocusArea() !== 'channels') return;
                    if (!self._channelItems.length) return;
                    e.preventDefault();
                    let key;
                    if (Math.abs(e.deltaX) > Math.abs(e.deltaY)) {
                        key = e.deltaX > 0 ? 'ArrowRight' : 'ArrowLeft';
                    } else {
                        key = e.deltaY > 0 ? 'ArrowDown' : 'ArrowUp';
                    }
                    if (window.KeyHandler && KeyHandler._handlePanelNav) {
                        KeyHandler._longPressFired = false;
                        KeyHandler._handlePanelNav(key);
                    }
                }, {
                    passive: false
                });

                // Touch: vuốt ngang → ←→, vuốt dọc → native scroll
                let _sx = 0,
                    _sy = 0,
                    _st = 0;
                panel.addEventListener('touchstart', function(e) {
                    const folder = self.getActiveFolder();
                    if (!folder || folder.id !== '_all') return;
                    const t = e.touches[0];
                    _sx = t.clientX;
                    _sy = t.clientY;
                    _st = Date.now();
                }, {
                    passive: true
                });

                panel.addEventListener('touchend', function(e) {
                    const folder = self.getActiveFolder();
                    if (!folder || folder.id !== '_all') return;
                    if (self.getFocusArea() !== 'channels') return;
                    const t = e.changedTouches[0];
                    const dx = t.clientX - _sx;
                    const dy = t.clientY - _sy;
                    const dt = Date.now() - _st;
                    if (dt > 600) return;
                    if (Math.abs(dx) > 60 && Math.abs(dx) > Math.abs(dy) * 1.5) {
                        const key = dx > 0 ? 'ArrowLeft' : 'ArrowRight';
                        if (window.KeyHandler && KeyHandler._handlePanelNav) {
                            KeyHandler._longPressFired = false;
                            KeyHandler._handlePanelNav(key);
                        }
                    }
                }, {
                    passive: true
                });
            }

            this._rightPanel = this._createPanel('yt-ultimate-right-panel', 'Yêu Thích', 'right');

            this._toastEl = DomUtils.createEl('div', {
                id: 'yt-ultimate-toast'
            });
            document.body.appendChild(this._toastEl);

            console.log('[UI] Build done');
        },

        _createPanel: function(id, title, side) {
            const panel = DomUtils.createEl('div', {
                id: id
            });
            document.body.appendChild(panel);
            const closeBtn = DomUtils.createEl('button', {
                id: 'panel-close-' + side
            });
            closeBtn.appendChild(svg('close', '18px'));
            closeBtn.addEventListener('click', function(e) {
                e.stopPropagation();
                PanelManager.closeAll();
            });
            panel.appendChild(closeBtn);
            const content = DomUtils.createEl('div', {
                class: 'panel-content'
            });
            panel.appendChild(content);
            if (side === 'left') this._closeLeft = closeBtn;
            else this._closeRight = closeBtn;
            return panel;
        },

        getTitle() {
            return this._titleEl;
        },
        getControls() {
            return this._controlsContainer;
        },
        getProgressContainer() {
            return this._progressContainer;
        },
        getProgressFill() {
            return this._progressFill;
        },
        getProgressTime() {
            return this._progressTime;
        },
        getFocusArea() {
            return this._focusArea;
        },
        getFolderFocusIdx() {
            return this._folderFocusIdx;
        },
        getChannelFocusIdx() {
            return this._channelFocusIdx;
        },
        getCurrentFolders() {
            return this._currentFolders;
        },

        setFocusArea: function(area) {
            this._focusArea = area;
            this._updateFocusVisual();
        },
        setFolderFocusIdx: function(i) {
            const N = this._currentFolders.length;
            const total = N + this._virtualFolderCount;
            if (i < 0 || i >= total) return;
            this._folderFocusIdx = i;

            if (i < N) {
                const f = this._currentFolders[i];
                if (f) {
                    this._activeFolderId = f.id;
                    ChannelStore.setLastOpened(f.id, null);
                    this._lastRealFolderId = f.id;
                    // Chọn Tất Cả Kênh → auto focus vào channel panel
                    if (f.id === '_all' && f.channels.length) {
                        this._focusArea = 'channels';
                        this._channelFocusIdx = 0;
                    }
                }
            }
            this._renderFolderPanel(this._activeFolderId);
            this._renderChannelPanel();
            this._updateFocusVisual();
        },

        getTotalFolderCount: function() {
            return this._virtualFolderCount + this._currentFolders.length;
        },

        getActiveFolder: function() {
            return this._currentFolders.find(f => f.id === this._activeFolderId) ||
                this._currentFolders[0];
        },
        setChannelFocusIdx: function(i) {
            if (i < 0 || i >= this._channelItems.length) return;
            this._channelFocusIdx = i;
            const folder = this.getActiveFolder();
            const item = this._channelItems[i];
            if (folder) {
                if (item && item.dataset.channelId) {
                    ChannelStore.setLastOpened(folder.id, item.dataset.channelId);
                } else {
                    ChannelStore.setLastOpened(folder.id, null);
                }
            }
            this._updateFocusVisual();
        },

        renderChannelBrowser: function(folders, activeFolderId) {
            this._currentFolders = folders;
            const last = ChannelStore.getLastOpened();

            let targetId = activeFolderId;
            if (!targetId) {
                if (last.folderId && folders.find(f => f.id === last.folderId)) {
                    targetId = last.folderId;
                } else {
                    targetId = folders[0] ? folders[0].id : null;
                }
            }

            let idx = folders.findIndex(f => f.id === targetId);
            if (idx < 0) idx = 0;
            this._activeFolderId = folders[idx] ? folders[idx].id : null;
            this._folderFocusIdx = idx;
            this._channelFocusIdx = 0;
            this._focusArea = 'folders';

            this._renderFolderPanel(this._activeFolderId);
            this._renderChannelPanel();

            // Restore channel focus nếu cùng folder
            if (last.channelId && targetId === last.folderId) {
                const f = folders[idx];
                const chIdx = f.channels.findIndex(c => c.id === last.channelId);
                if (chIdx >= 0) {
                    this._channelFocusIdx = chIdx;
                    this._focusArea = 'channels';
                }
            }
            this._updateFocusVisual();
        },

        _renderFolderPanel: function(activeFolderId) {
            const c = this._folderPanel;
            if (!c) return;
            while (c.firstChild) c.removeChild(c.firstChild);
            this._folderItems = [];
            const folders = this._currentFolders;

            // ===== REAL FOLDERS =====
            folders.forEach((f, idx) => {
                const item = document.createElement('div');
                item.className = 'folder-item';
                item.dataset.folderId = f.id;
                item.dataset.idx = idx;
                if (f.id === activeFolderId) item.classList.add('active');

                const logoWrap = document.createElement('div');
                logoWrap.className = 'folder-logo';
                if (f.logo) {
                    const img = document.createElement('img');
                    img.src = ChannelStore.getImageSrc({
                        id: f.id,
                        logo: f.logo
                    });
                    img.loading = 'lazy';
                    img.addEventListener('error', () => {
                        img.style.visibility = 'hidden';
                    });
                    logoWrap.appendChild(img);
                } else if (f.id === '_fav') {
                    const star = document.createElement('span');
                    star.textContent = '⭐';
                    star.style.cssText = 'font-size:32px;line-height:1;';
                    logoWrap.appendChild(star);
                } else {
                    logoWrap.appendChild(svg('list', '28px'));
                }
                item.appendChild(logoWrap);

                const info = document.createElement('div');
                info.className = 'folder-info';
                const name = document.createElement('div');
                name.className = 'folder-name';
                name.textContent = f.name;
                info.appendChild(name);
                const count = document.createElement('div');
                count.className = 'folder-count';
                count.textContent = '(' + f.channels.length + ')';
                info.appendChild(count);
                item.appendChild(info);

                // Long-press để chọn folder di chuyển
                let lpTimer = null,
                    lpFired = false;
                let psX = 0,
                    psY = 0,
                    moved = false;
                const startLP = function(e) {
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    psX = e.clientX;
                    psY = e.clientY;
                    moved = false;
                    lpFired = false;
                    clearTimeout(lpTimer);
                    lpTimer = setTimeout(function() {
                        lpFired = true;
                        UIManager._selectFolderForMove(idx);
                    }, 800);
                };
                const moveLP = function(e) {
                    if (!lpTimer) return;
                    if (Math.abs(e.clientX - psX) > 8 || Math.abs(e.clientY - psY) > 8) {
                        moved = true;
                        clearTimeout(lpTimer);
                        lpTimer = null;
                    }
                };
                const endLP = function() {
                    if (lpTimer) {
                        clearTimeout(lpTimer);
                        lpTimer = null;
                    }
                    if (!lpFired && !moved) {
                        UIManager.setFolderFocusIdx(idx);
                        UIManager.setFocusArea('folders');
                    }
                    lpFired = false;
                };
                const cancelLP = function() {
                    if (lpTimer) {
                        clearTimeout(lpTimer);
                        lpTimer = null;
                    }
                    lpFired = false;
                };

                item.addEventListener('pointerdown', startLP);
                item.addEventListener('pointermove', moveLP);
                item.addEventListener('pointerup', endLP);
                item.addEventListener('pointercancel', cancelLP);
                item.addEventListener('pointerleave', cancelLP);
                item.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                });
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });

                c.appendChild(item);
                this._folderItems.push(item);
            });

            // ===== 3 VIRTUAL ITEMS Ở CUỐI =====
            const N = folders.length;
            const labels = this._getVirtualFolderLabels();
            const vDefs = [{
                    action: 'browse-up',
                    label: labels.up,
                    disabled: labels.upDisabled,
                    idx: N
                },
                {
                    action: 'select',
                    label: labels.mid,
                    disabled: false,
                    idx: N + 1
                },
                {
                    action: 'browse-down',
                    label: labels.down,
                    disabled: labels.downDisabled,
                    idx: N + 2
                }
            ];
            vDefs.forEach(v => {
                const item = document.createElement('div');
                item.className = 'folder-item virtual-folder-item';
                if (v.disabled) item.classList.add('disabled');
                item.dataset.virtualFolder = '1';
                item.dataset.action = v.action;
                item.dataset.idx = v.idx;

                const logoWrap = document.createElement('div');
                logoWrap.className = 'folder-logo';
                const iconSpan = document.createElement('span');
                iconSpan.style.fontSize = '22px';
                iconSpan.style.lineHeight = '1';
                iconSpan.textContent = v.action === 'browse-up' ? '⬆️' :
                    v.action === 'select' ? '🔄' : '⬇️';
                logoWrap.appendChild(iconSpan);
                item.appendChild(logoWrap);

                const info = document.createElement('div');
                info.className = 'folder-info';
                const name = document.createElement('div');
                name.className = 'folder-name';
                name.textContent = v.label;
                info.appendChild(name);
                item.appendChild(info);

                item.addEventListener('click', (e) => {
                    e.stopPropagation();
                    if (v.disabled) return;
                    UIManager._handleVirtualFolderAction(v.action);
                });
                c.appendChild(item);
                this._folderItems.push(item);
            });
        },

        _getVirtualFolderLabels: function() {
            const folders = this._currentFolders;
            const N = folders.length;
            const target = this._folderMoveTarget;
            const cursor = this._browseCursor;

            let upLabel = '⬆️ Thư Mục Trước';
            let downLabel = '⬇️ Thư Mục Sau';
            let midLabel = '🔄 Chọn Thư Mục';
            let upDisabled = false;
            let downDisabled = false;

            if (target !== null && target >= 2 && target < N) {
                // ĐANG DI CHUYỂN
                const f = folders[target];
                const pos = target - 1;
                upDisabled = target <= 2;
                downDisabled = target >= N - 1;
                upLabel = upDisabled ? '⬆️ Đã ở vị trí đầu' :
                    '⬆️ Chuyển "' + f.name + '" lên';
                downLabel = downDisabled ? '⬇️ Đã ở vị trí cuối' :
                    '⬇️ Chuyển "' + f.name + '" xuống';
                midLabel = '🔄 Đang chọn: ' + f.name + ' (#' + pos + ') — Nhấn để bỏ';
            } else if (cursor >= 2 && cursor < N) {
                // ĐANG DUYỆT
                const f = folders[cursor];
                const pos = cursor - 1;
                upLabel = cursor <= 2 ? '⬆️ Đã ở đầu (duyệt)' :
                    '⬆️ Thư Mục Trước (đang: ' + f.name + ')';
                downLabel = cursor >= N - 1 ? '⬇️ Đã ở cuối (duyệt)' :
                    '⬇️ Thư Mục Sau (đang: ' + f.name + ')';
                midLabel = '🔄 Chọn: ' + f.name + ' (#' + pos + ') — Nhấn để xác nhận';
            } else {
                // CHƯA BẮT ĐẦU
                midLabel = '🔄 Chọn Thư Mục (bấm ⬆️⬇️ để bắt đầu)';
            }

            return {
                up: upLabel,
                mid: midLabel,
                down: downLabel,
                upDisabled,
                downDisabled
            };
        },

        _handleVirtualFolderAction: function(action) {
            const folders = this._currentFolders;
            const N = folders.length;
            // Giữ focus ở nút ảo đã nhấn
            const keepIdx = this._folderFocusIdx;

            // ===== NÚT GIỮA: SELECT / DESELECT =====
            if (action === 'select') {
                if (this._folderMoveTarget !== null) {
                    const wasName = folders[this._folderMoveTarget] ?
                        folders[this._folderMoveTarget].name : '';
                    this._folderMoveTarget = null;
                    this._browseCursor = -1;
                    this.showToast('Đã bỏ chọn "' + wasName + '"', 1500);
                } else if (this._browseCursor >= 2 && this._browseCursor < N) {
                    const f = folders[this._browseCursor];
                    this._folderMoveTarget = this._browseCursor;
                    const pos = this._browseCursor - 1;
                    this.showToast('✅ Đã chọn "' + f.name + '" (#' + pos +
                        ') — Dùng ⬆️⬇️ để di chuyển', 2500);
                } else {
                    this.showToast('⚠️ Dùng ⬆️⬇️ để duyệt thư mục trước', 2000);
                    return;
                }
                this._folderFocusIdx = keepIdx;
                this._renderFolderPanel(this._activeFolderId);
                this._updateFocusVisual();
                this._renderChannelPanel();
                return;
            }

            // ===== NÚT TRÊN / DƯỚI =====
            // Đã có target → MOVING
            if (this._folderMoveTarget !== null) {
                const from = this._folderMoveTarget;
                const to = action === 'browse-up' ? from - 1 : from + 1;
                if (to < 2) {
                    this.showToast('Đã ở vị trí đầu', 1200);
                    return;
                }
                if (to >= N) {
                    this.showToast('Đã ở vị trí cuối', 1200);
                    return;
                }

                const tmp = folders[from];
                folders[from] = folders[to];
                folders[to] = tmp;
                this._folderMoveTarget = to;
                ChannelStore.saveFolderOrderFromList(folders);
                this.showToast('🔄 "' + tmp.name + '" → #' + (to - 1), 1500);

                this._folderFocusIdx = keepIdx;
                this._activeFolderId = folders[to].id;
                this._renderFolderPanel(this._activeFolderId);
                this._updateFocusVisual();
                this._renderChannelPanel();
                return;
            }

            // Chưa có target → BROWSING
            let newCursor;
            if (this._browseCursor < 2 || this._browseCursor >= N) {
                newCursor = 2;
            } else {
                newCursor = action === 'browse-up' ?
                    this._browseCursor - 1 :
                    this._browseCursor + 1;
            }
            if (newCursor < 2) newCursor = 2;
            if (newCursor >= N) newCursor = N - 1;

            this._browseCursor = newCursor;
            this._activeFolderId = folders[newCursor].id;
            const f = folders[newCursor];
            const pos = newCursor - 1;
            this.showToast('🔍 ' + f.name + ' (#' + pos + ')', 1200);

            this._folderFocusIdx = keepIdx;
            this._renderFolderPanel(this._activeFolderId);
            this._updateFocusVisual();
            this._renderChannelPanel();
        },

        _selectFolderForMove: function(idx) {
            const folders = this._currentFolders;
            const N = folders.length;
            if (idx < 2 || idx >= N) {
                this.showToast('⚠️ Không thể di chuyển thư mục này', 1500);
                return;
            }
            const f = folders[idx];
            this._folderMoveTarget = idx;
            this._browseCursor = -1;
            this.showToast('✅ Đã chọn "' + f.name + '" (#' + (idx - 1) +
                ') — Dùng ⬆️⬇️ để di chuyển', 2500);
            this._folderFocusIdx = N + 1;
            this._focusArea = 'folders';
            this._renderFolderPanel(this._activeFolderId);
            this._updateFocusVisual();
            this._renderChannelPanel();
        },

        _renderChannelPanel: function() {
            const c = this._channelPanel;
            if (!c) return;
            c.classList.remove('instruction-mode');
            while (c.firstChild) c.removeChild(c.firstChild);
            this._channelItems = [];

            const N = this._currentFolders.length;
            if (this._folderFocusIdx >= N) {
                c.classList.remove('all-view');
                this._renderInstructionPanel();
                return;
            }

            const folder = this.getActiveFolder();
            if (!folder || !folder.channels.length) {
                c.classList.remove('all-view');
                const empty = document.createElement('div');
                empty.className = 'channel-panel-empty';
                empty.textContent = '📭 Không có kênh.';
                c.appendChild(empty);
                return;
            }

            const isAll = (folder.id === '_all');
            if (isAll) c.classList.add('all-view');
            else c.classList.remove('all-view');

            const curId = PlayerController.getCurrentId();

            folder.channels.forEach((ch, idx) => {
                const item = document.createElement('div');
                item.className = 'channel-item';
                item.dataset.channelId = ch.id;
                item.dataset.idx = idx;
                if (ch.id === curId) item.classList.add('current');
                if (ChannelStore.isFavorite(ch.id)) item.classList.add('is-fav');

                if (isAll) {
                    const num = document.createElement('span');
                    num.className = 'channel-num';
                    num.textContent = '#' + ChannelStore.getChannelNumber(ch.id);
                    item.appendChild(num);

                    const name = document.createElement('div');
                    name.className = 'channel-name';
                    name.textContent = ch.name;
                    item.appendChild(name);
                } else {
                    const thumb = document.createElement('div');
                    thumb.className = 'channel-thumb';
                    const img = document.createElement('img');
                    img.src = ChannelStore.getImageSrc(ch) ||
                        'data:image/svg+xml;utf8,' + encodeURIComponent(
                            '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 56"><rect fill="#1a1a1a" width="100" height="56"/><text x="50" y="32" fill="#666" font-size="9" text-anchor="middle">TV</text></svg>'
                        );
                    img.alt = ch.name;
                    img.loading = 'lazy';
                    img.addEventListener('error', () => {
                        img.style.opacity = '0.3';
                    });
                    thumb.appendChild(img);
                    const num = document.createElement('span');
                    num.className = 'channel-num';
                    num.textContent = '#' + ChannelStore.getChannelNumber(ch.id);
                    thumb.appendChild(num);
                    item.appendChild(thumb);

                    const name = document.createElement('div');
                    name.className = 'channel-name';
                    name.textContent = ch.name;
                    item.appendChild(name);

                    setTimeout(() => ChannelStore.cacheImage(ch), 100 + idx * 30);
                }

                let lpTimer = null,
                    lpFired = false;
                let psX = 0,
                    psY = 0,
                    moved = false;
                const startLP = function(e) {
                    if (e.pointerType === 'mouse' && e.button !== 0) return;
                    psX = e.clientX;
                    psY = e.clientY;
                    moved = false;
                    lpFired = false;
                    item.classList.add('pressing');
                    clearTimeout(lpTimer);
                    lpTimer = setTimeout(function() {
                        lpFired = true;
                        item.classList.remove('pressing');
                        PlayerController.toggleFavorite(ch.id);
                    }, 800);
                };
                const moveLP = function(e) {
                    if (!lpTimer) return;
                    if (Math.abs(e.clientX - psX) > 8 || Math.abs(e.clientY - psY) > 8) {
                        moved = true;
                        clearTimeout(lpTimer);
                        lpTimer = null;
                        item.classList.remove('pressing');
                    }
                };
                const endLP = function() {
                    if (lpTimer) {
                        clearTimeout(lpTimer);
                        lpTimer = null;
                    }
                    item.classList.remove('pressing');
                    if (!lpFired && !moved) PlayerController._loadChannel(ch.id);
                    lpFired = false;
                };
                const cancelLP = function() {
                    if (lpTimer) {
                        clearTimeout(lpTimer);
                        lpTimer = null;
                    }
                    item.classList.remove('pressing');
                    lpFired = false;
                };
                item.addEventListener('pointerdown', startLP);
                item.addEventListener('pointermove', moveLP);
                item.addEventListener('pointerup', endLP);
                item.addEventListener('pointercancel', cancelLP);
                item.addEventListener('pointerleave', cancelLP);
                item.addEventListener('contextmenu', function(e) {
                    e.preventDefault();
                });
                item.addEventListener('click', function(e) {
                    e.preventDefault();
                    e.stopPropagation();
                });

                item.addEventListener('mouseenter', () => {
                    if (UIManager._focusArea === 'channels') return;
                    UIManager._showHelperFor(ch, item);
                });
                item.addEventListener('mouseleave', () => {
                    if (UIManager._focusArea !== 'channels') UIManager._hideHelper();
                });

                c.appendChild(item);
                this._channelItems.push(item);
            });
            // Virtual items cho folder Yêu Thích
            if (folder.id === '_fav') {
                this._renderFavVirtualItems(folder);
            }
        },
        _renderInstructionPanel: function() {
            const c = this._channelPanel;
            if (!c) return;
            c.classList.add('instruction-mode');
            const wrap = document.createElement('div');
            wrap.className = 'instruction-panel';
            wrap.id = 'instruction-panel';
            wrap.innerHTML = `
        <h2>📖 Hướng Dẫn Setup Vị Trí</h2>

        <section>
          <h3>1️⃣ Đổi vị trí thư mục</h3>
          <ol>
            <li>Dùng nút <b>⬆️ Thư Mục Trước</b> hoặc <b>⬇️ Thư Mục Sau</b> (cuối cột trái) để <b>duyệt</b> từng thư mục</li>
            <li>Tên thư mục đang duyệt hiện ở nút giữa <b>🔄 Chọn Thư Mục</b></li>
            <li>Nhấn <b>🔄</b> để <b>xác nhận</b> chọn thư mục</li>
            <li>Nhấn <b>⬆️ / ⬇️</b> để di chuyển thư mục lên/xuống</li>
            <li>Nhấn <b>🔄</b> lần nữa để bỏ chọn · Thứ tự tự lưu</li>
          </ol>
        </section>

        <section>
          <h3>⚡ Cách nhanh: Nhấn giữ thư mục</h3>
          <ol>
            <li>Focus vào thư mục cần di chuyển (không phải 2 mục đầu)</li>
            <li><b>Giữ OK (remote)</b> 0.8s hoặc <b>giữ chuột/cảm ứng</b> trên thư mục</li>
            <li>Thư mục tự chọn làm target, focus nhảy xuống <b>🔄 Đang chọn</b></li>
            <li>Nhấn <b>⬆️ / ⬇️</b> để di chuyển — tự lưu</li>
            <li>Nhấn <b>🔄</b> để bỏ chọn</li>
          </ol>
        </section>

        <section>
          <h3>⚡ Chế độ Tất Cả Kênh</h3>
          <p style="margin: 4px 0 6px 0;">
            Folder <b>Tất Cả Kênh</b> hiển thị dạng <b>grid 3 cột</b> (desktop) hoặc <b>1 cột</b> (mobile). Kênh yêu thích được đánh dấu ⭐ vàng.
          </p>
          <table>
            <tr><td><span class="hl-key">← ↑ ↓ →</span></td><td>Di chuyển focus trong grid (có wrap tuần hoàn)</td></tr>
            <tr><td><b>Lăn chuột dọc</b></td><td>Focus lên / xuống</td></tr>
            <tr><td><b>Lăn chuột ngang</b></td><td>Focus trái / phải</td></tr>
            <tr><td><b>Vuốt dọc (mobile)</b></td><td>Scroll tự nhiên</td></tr>
            <tr><td><b>Vuốt ngang (mobile)</b></td><td>Focus trái / phải</td></tr>
            <tr><td><b>Giữ ↑ / ↓ 1s</b></td><td>Chuyển thư mục trước / sau</td></tr>
            <tr><td><span class="hl-key">Enter / OK</span></td><td>Phát kênh đang focus</td></tr>
            <tr><td><b>Giữ OK 0.8s</b></td><td>Thêm / bỏ yêu thích</td></tr>
          </table>
        </section>

        <section>
          <h3>2️⃣ Đổi vị trí kênh yêu thích</h3>
          <ol>
            <li>Mở folder <b>⭐ Kênh Yêu Thích</b></li>
            <li>Nhấn <span class="hl-key">← →</span> focus vào kênh cần di chuyển</li>
            <li>Nhấn OK vào nút <b>🔄 Chọn</b> (sau các kênh)</li>
            <li>Nhấn OK vào <b>⬅️ / ➡️</b> để di chuyển lên / xuống slot</li>
            <li>Nhấn OK vào <b>🗑️ Xóa Toàn Bộ Yêu Thích</b> để clear hết</li>
          </ol>
        </section>

        <section>
          <h3>3️⃣ Phím tắt cần nhớ</h3>
          <table>
            <tr><td><span class="hl-key">Enter / OK</span></td><td>Hiện / ẩn thanh điều khiển</td></tr>
            <tr><td><span class="hl-key">↓ (control ẩn)</span></td><td>Mở Danh Sách Kênh</td></tr>
            <tr><td><span class="hl-key">↑ (control ẩn)</span></td><td>Mở Yêu Thích</td></tr>
            <tr><td><span class="hl-key">← → </span></td><td>Di chuyển focus giữa các nút / kênh</td></tr>
            <tr><td><span class="hl-key">↑ ↓ (trong panel)</span></td><td>Chuyển thư mục</td></tr>
            <tr><td><b>Giữ ←→↑↓ 1s</b></td><td>Đóng panel</td></tr>
            <tr><td><b>Giữ OK 0.8s (trên kênh)</b></td><td>Thêm / bỏ kênh khỏi yêu thích</td></tr>
            <tr><td><span class="hl-key">0 - 9</span></td><td>Nhập số kênh để nhảy, chờ 1s</td></tr>
            <tr><td><span class="hl-key">Space</span></td><td>Phát / Tạm dừng</td></tr>
            <tr><td><span class="hl-key">PageUp / PageDown</span></td><td>Kênh trước / kế</td></tr>
            <tr><td><span class="hl-key">F</span></td><td>Bật / tắt toàn màn hình</td></tr>
            <tr><td><span class="hl-key">Esc / Backspace</span></td><td>Đóng panel / quay lại</td></tr>
          </table>
        </section>


        <section>
          <h3>5️⃣ Thao tác cảm ứng / chuột</h3>
          <table>
            <tr><td><b>1 tap trái</b></td><td>Mở Danh Sách Kênh</td></tr>
            <tr><td><b>3 tap trái</b></td><td>Kênh trước</td></tr>
            <tr><td><b>3 tap phải</b></td><td>Kênh kế</td></tr>
            <tr><td><b>1 tap giữa</b></td><td>Phát / Tạm dừng</td></tr>
            <tr><td><b>1 tap phải (control ẩn)</b></td><td>Hiện thanh điều khiển</td></tr>
          </table>
        </section>
      `;
            c.appendChild(wrap);
        },

        _computeAllViewLayout: function() {
            const items = this._channelItems;
            const total = items.length;
            if (!total) return {
                total: 0,
                cols: 1,
                rows: 1
            };
            // Đo bằng offsetTop — đếm số item ở hàng đầu
            let firstTop = 0;
            try {
                firstTop = items[0].offsetTop;
            } catch (e) {}
            let cols = total;
            for (let i = 1; i < total; i++) {
                let curTop = 0;
                try {
                    curTop = items[i].offsetTop;
                } catch (e) {}
                if (curTop > firstTop + 3) {
                    cols = i;
                    break;
                }
            }
            if (cols < 1) cols = total;
            const rows = Math.ceil(total / cols);
            return {
                total: total,
                cols: cols,
                rows: rows
            };
        },

        _renderFavVirtualItems: function(folder) {
            const c = this._channelPanel;
            const favs = folder.channels;
            const favCount = favs.length;
            const swap = this._favSwapState;
            const cursor = this._favBrowseCursor;

            // ===== NÚT TRÁI =====
            let leftLabel, leftDisabled = false;
            if (swap) {
                if (swap.fromIdx <= 0) {
                    leftLabel = '⬅️ Đã ở vị trí đầu';
                    leftDisabled = true;
                } else {
                    leftLabel = '⬅️ Chuyển "' + swap.channelName + '" lên';
                }
            } else if (cursor >= 0 && cursor < favCount) {
                if (cursor === 0) {
                    leftLabel = '⬅️ Đã ở kênh đầu';
                } else {
                    leftLabel = '⬅️ Kênh trước: ' + favs[cursor - 1].name;
                }
            } else {
                leftLabel = '⬅️ Nhấn để chọn kênh yêu thích đầu';
            }
            const leftItem = this._createVirtualItem('move-up', leftLabel, leftDisabled, '');
            c.appendChild(leftItem);
            this._channelItems.push(leftItem);

            // ===== NÚT GIỮA =====
            let midLabel;
            if (swap) {
                midLabel = '🔄 Đang chọn: ' + swap.channelName +
                    ' (#' + (swap.fromIdx + 1) + ') — Nhấn để bỏ';
            } else if (cursor >= 0 && cursor < favCount) {
                midLabel = '🔄 Chọn: ' + favs[cursor].name +
                    ' (#' + (cursor + 1) + ') — Nhấn để xác nhận';
            } else {
                midLabel = '🔄 Chọn kênh yêu thích để đổi vị trí';
            }
            const midItem = this._createVirtualItem('toggle-swap', midLabel, false, '');
            c.appendChild(midItem);
            this._channelItems.push(midItem);

            // ===== NÚT PHẢI =====
            let rightLabel, rightDisabled = false;
            if (swap) {
                if (swap.fromIdx >= favCount - 1) {
                    rightLabel = '➡️ Đã ở vị trí cuối';
                    rightDisabled = true;
                } else {
                    rightLabel = '➡️ Chuyển "' + swap.channelName + '" xuống';
                }
            } else if (cursor >= 0 && cursor < favCount) {
                if (cursor >= favCount - 1) {
                    rightLabel = '➡️ Đã ở kênh cuối';
                } else {
                    rightLabel = '➡️ Kênh sau: ' + favs[cursor + 1].name;
                }
            } else {
                rightLabel = '➡️ Nhấn để chọn kênh yêu thích đầu';
            }
            const rightItem = this._createVirtualItem('move-down', rightLabel, rightDisabled, '');
            c.appendChild(rightItem);
            this._channelItems.push(rightItem);

            // ===== NÚT XÓA TOÀN BỘ =====
            const clearItem = this._createVirtualItem('clear-all',
                '🗑️ Xóa Toàn Bộ Yêu Thích (' + favCount + ')', false, 'danger');
            c.appendChild(clearItem);
            this._channelItems.push(clearItem);
        },

        _createVirtualItem: function(action, label, disabled, extraClass) {
            const item = document.createElement('div');
            item.className = 'channel-item virtual-item';
            if (extraClass) item.classList.add(extraClass);
            if (disabled) item.classList.add('disabled');
            item.dataset.virtual = '1';
            item.dataset.action = action;
            item.dataset.disabled = disabled ? '1' : '0';
            item.textContent = label;

            const handler = (e) => {
                e.preventDefault();
                e.stopPropagation();
                if (disabled) {
                    if (action === 'move-up' || action === 'move-down') {
                        UIManager.showToast('Chọn kênh để đổi vị trí trước', 1500);
                    }
                    return;
                }
                UIManager._handleVirtualAction(action);
            };
            item.addEventListener('click', handler);
            return item;
        },

        _handleVirtualAction: function(action) {
            const folder = this.getActiveFolder();
            if (!folder || folder.id !== '_fav') return;
            const favCount = folder.channels.length;

            // ===== XÓA TOÀN BỘ =====
            if (action === 'clear-all') {
                const res = ChannelStore.clearAllFavorites();
                this.showToast(res.msg, 2000);
                this._favSwapState = null;
                this._favBrowseCursor = -1;
                this._lastFavFocusedId = null;
                this.renderChannelBrowser(ChannelStore.getFolders(), '_fav');
                if (window.SideLists) window.SideLists.refreshAll();
                return;
            }

            // ===== NÚT GIỮA: CONFIRM / CANCEL =====
            if (action === 'toggle-swap') {
                if (this._favSwapState) {
                    this._favSwapState = null;
                    this._favBrowseCursor = -1;
                    this.showToast('Đã bỏ chọn', 1500);
                } else if (this._favBrowseCursor >= 0 && this._favBrowseCursor < favCount) {
                    const ch = folder.channels[this._favBrowseCursor];
                    this._favSwapState = {
                        channelId: ch.id,
                        channelName: ch.name,
                        fromIdx: this._favBrowseCursor
                    };
                    this.showToast('✅ Đã chọn "' + ch.name +
                        '" (#' + (this._favBrowseCursor + 1) + ') — Nhấn ⬅️⬇️ để di chuyển', 2500);
                    this._favBrowseCursor = -1;
                } else {
                    this.showToast('⚠️ Nhấn ⬅️ hoặc ➡️ để chọn kênh trước', 2000);
                    return;
                }
                // Giữ nguyên focus ở nút ảo
                const keepFocus = this._channelFocusIdx;
                this._renderChannelPanel();
                this._channelFocusIdx = Math.min(keepFocus, this._channelItems.length - 1);
                this._updateFocusVisual();
                return;
            }

            // ===== NÚT TRÁI / PHẢI =====
            if (action === 'move-up' || action === 'move-down') {
                // ---- MOVING ----
                if (this._favSwapState) {
                    const from = this._favSwapState.fromIdx;
                    const to = action === 'move-up' ? from - 1 : from + 1;
                    if (to < 0 || to >= favCount) {
                        this.showToast(action === 'move-up' ?
                            'Đã ở vị trí đầu' : 'Đã ở vị trí cuối', 1200);
                        return;
                    }
                    const res = ChannelStore.moveFavorite(from, to);
                    this.showToast(res.msg, 1800);
                    this._favSwapState.fromIdx = to;
                    // Giữ nguyên focus ở nút ảo vừa click
                    const keepFocus = this._channelFocusIdx;
                    this.renderChannelBrowser(ChannelStore.getFolders(), '_fav');
                    if (window.SideLists) window.SideLists.refreshAll();
                    this._channelFocusIdx = Math.min(keepFocus, this._channelItems.length - 1);
                    this._focusArea = 'channels';
                    this._updateFocusVisual();
                    return;
                }

                // ---- IDLE hoặc BROWSING ----
                if (this._favBrowseCursor < 0) {
                    this._favBrowseCursor = 0;
                } else {
                    let newCur = this._favBrowseCursor + (action === 'move-up' ? -1 : 1);
                    if (newCur < 0) newCur = 0;
                    if (newCur >= favCount) newCur = favCount - 1;
                    this._favBrowseCursor = newCur;
                }

                // KHÔNG đổi _channelFocusIdx (vẫn ở nút ảo)
                const keepFocus = this._channelFocusIdx;
                this._renderChannelPanel();
                this._channelFocusIdx = Math.min(keepFocus, this._channelItems.length - 1);
                this._focusArea = 'channels';
                this._updateFocusVisual();

                // Toast + helper cho kênh đang browse (không scroll)
                const curCh = folder.channels[this._favBrowseCursor];
                if (curCh) this.showToast('🔍 ' + curCh.name +
                    ' (#' + (this._favBrowseCursor + 1) + ')', 1200);
                return;
            }
        },

        _updateFocusVisual: function() {
            this._folderItems.forEach((el, i) => {
                el.classList.toggle('focused',
                    this._focusArea === 'folders' && i === this._folderFocusIdx);
            });

            const folder = this.getActiveFolder();
            const isFavFolder = folder && folder.id === '_fav';
            const browseCur = (isFavFolder && !this._favSwapState) ? this._favBrowseCursor : -1;
            const swapFrom = (isFavFolder && this._favSwapState) ? this._favSwapState.fromIdx : -1;

            this._channelItems.forEach((el, i) => {
                const isFocus = this._focusArea === 'channels' && i === this._channelFocusIdx;
                el.classList.toggle('focused', isFocus);
                const isBrowsing = isFavFolder &&
                    (i === browseCur || i === swapFrom) && !isFocus;
                el.classList.toggle('browsing', isBrowsing);
            });

            if (this._focusArea === 'folders') {
                this._hideHelper();
                if (this._folderItems[this._folderFocusIdx]) {
                    this._folderItems[this._folderFocusIdx].scrollIntoView({
                        block: 'nearest'
                    });
                }
                return;
            }

            if (this._focusArea === 'channels') {
                const item = this._channelItems[this._channelFocusIdx];
                if (!item) {
                    this._hideHelper();
                    return;
                }
                // Chỉ scroll khi KHÔNG phải nút ảo
                if (item.dataset.virtual !== '1') {
                    item.scrollIntoView({
                        block: 'nearest',
                        behavior: 'smooth'
                    });
                }
                if (item.dataset.virtual === '1' || !item.dataset.channelId) {
                    this._hideHelper();
                    return;
                }
                if (!folder) {
                    this._hideHelper();
                    return;
                }
                if (folder.id === '_fav') this._lastFavFocusedId = item.dataset.channelId;
                const ch = folder.channels.find(c => c.id === item.dataset.channelId);
                if (ch) this._showHelperFor(ch, item);
                else this._hideHelper();
            }
        },

        _showHelperFor: function(ch, item) {
            if (!this._helperEl) return;
            const num = ChannelStore.getChannelNumber(ch.id);
            const isFav = ChannelStore.isFavorite(ch.id);
            const favSlot = ChannelStore.getFavoriteSlot(ch.id);
            const totalChannels = ChannelStore.getTotal();
            const currentFavCount = ChannelStore._favCount;

            const helper = this._helperEl;
            while (helper.firstChild) helper.removeChild(helper.firstChild);

            // Title với icon
            const title = document.createElement('div');
            title.className = 'helper-title';
            const icon = document.createElement('img');
            icon.src = ChannelStore.getImageSrc(ch) ||
                'data:image/svg+xml;utf8,' + encodeURIComponent(
                    '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 56"><rect fill="#1a1a1a" width="100" height="56"/><text x="50" y="32" fill="#666" font-size="9" text-anchor="middle">TV</text></svg>'
                );
            icon.style.cssText = 'width:32px;height:32px;object-fit:contain;border-radius:5px;background:#1a1a1a;flex-shrink:0;';
            icon.addEventListener('error', () => {
                icon.style.visibility = 'hidden';
            });
            title.appendChild(icon);
            const titleTxt = document.createElement('span');
            titleTxt.style.marginLeft = '8px';
            titleTxt.textContent = ch.name;
            title.appendChild(titleTxt);
            helper.appendChild(title);

            const line1 = document.createElement('div');
            line1.className = 'helper-line';
            line1.appendChild(document.createTextNode('Nhập số '));
            const s1num = document.createElement('span');
            s1num.className = 'hl-num';
            s1num.textContent = String(num);
            line1.appendChild(s1num);
            line1.appendChild(document.createTextNode(' để chuyển kênh'));
            if (isFav) {
                const s1c = document.createElement('span');
                s1c.textContent = ' (đang ở Yêu Thích #' + favSlot + ')';
                s1c.style.color = '#ffd43b';
                s1c.style.fontWeight = '600';
                line1.appendChild(s1c);
            }
            helper.appendChild(line1);

            if (!isFav) {
                const line2 = document.createElement('div');
                line2.className = 'helper-line';
                line2.textContent = 'Nhấn giữ vào kênh này để thêm vào yêu thích và set ưu tiên số kênh.';
                helper.appendChild(line2);

                const line3 = document.createElement('div');
                line3.className = 'helper-line';
                line3.appendChild(document.createTextNode('Sau khi thêm, bạn sẽ bấm số '));
                const s3num = document.createElement('span');
                s3num.className = 'hl-num';
                s3num.textContent = String(currentFavCount + 1);
                line3.appendChild(s3num);
                line3.appendChild(document.createTextNode(' để nhảy đến kênh yêu thích này.'));
                helper.appendChild(line3);
                const line4 = document.createElement('div');
                line4.className = 'helper-line';
                line4.appendChild(document.createTextNode("Nếu bạn đang ở thư mục Tất cả kênh, hãy nhấn giữ phím lên và xuống để di chuyển các thư mục."));
                helper.appendChild(line4);

            } else {
                const line2 = document.createElement('div');
                line2.className = 'helper-line';
                const s2a = document.createElement('span');
                s2a.textContent = 'Kênh đã có trong Yêu Thích #' + favSlot + '. ';
                s2a.style.color = '#ffd43b';
                s2a.style.fontWeight = '600';
                line2.appendChild(s2a);
                line2.appendChild(document.createTextNode('Nhấn giữ để xoá. Sau khi xoá, kênh sẽ nằm cuối danh sách tại index '));
                const s2num = document.createElement('span');
                s2num.className = 'hl-num';
                s2num.textContent = String(totalChannels);
                line2.appendChild(s2num);
                helper.appendChild(line2);
            }

            helper.classList.add('visible');
            helper.classList.remove('arrow-left');
            this._positionHelper(item);

            // Auto-hide sau 5s nếu không có tương tác
            clearTimeout(this._helperTimer);
            this._helperTimer = setTimeout(() => {
                this._hideHelper();
            }, 2000);
        },

        _positionHelper: function(item) {
            if (!this._helperEl || !this._helperEl.classList.contains('visible')) return;
            const helper = this._helperEl;
            if (!item && this._focusArea === 'channels' && this._channelItems[this._channelFocusIdx]) {
                item = this._channelItems[this._channelFocusIdx];
            }
            if (!item || !item.dataset.channelId) return;

            const itemRect = item.getBoundingClientRect();
            const helperRect = helper.getBoundingClientRect();
            const helperW = helperRect.width || 280;
            const helperH = helperRect.height || 120;
            const GAP = 12;
            const MARGIN = 8;

            // ===== NGANG: ưu tiên bên phải item =====
            let left = itemRect.right + GAP;
            helper.classList.remove('arrow-left');

            if (left + helperW > window.innerWidth - MARGIN) {
                // Không đủ chỗ bên phải → thử bên trái
                const leftSide = itemRect.left - helperW - GAP;
                if (leftSide >= MARGIN) {
                    left = leftSide;
                } else {
                    // Cả 2 bên đều chật → căn giữa màn hình
                    left = Math.max(MARGIN, (window.innerWidth - helperW) / 2);
                }
            }

            // ===== DỌC: ưu tiên dưới item, fallback lên trên =====
            let top = itemRect.bottom + GAP;
            if (top + helperH > window.innerHeight - MARGIN) {
                top = itemRect.top - helperH - GAP;
                if (top < MARGIN) top = MARGIN;
            }

            helper.style.left = left + 'px';
            helper.style.right = '';
            helper.style.top = top + 'px';
            helper.style.transform = 'none';
        },

        _hideHelper: function() {
            if (this._helperEl) this._helperEl.classList.remove('visible');
            clearTimeout(this._helperTimer);
            this._helperTimer = null;
        },

        updateCurrentChannelHighlight: function() {
            const curId = PlayerController.getCurrentId();
            this._channelItems.forEach(el => {
                el.classList.toggle('current', el.dataset.channelId === curId);
            });
        },

        showToast: function(message, duration) {
            duration = duration || 2000;
            const toast = this._toastEl;
            if (!toast) return;
            while (toast.firstChild) toast.removeChild(toast.firstChild);
            let iconName = null,
                cleanMsg = message;
            for (const e in EMOJI_TO_ICON) {
                if (message.indexOf(e) !== -1) {
                    iconName = EMOJI_TO_ICON[e];
                    cleanMsg = message.replace(e, '').trim();
                    break;
                }
            }
            if (iconName) toast.appendChild(svg(iconName, '16px'));
            const span = document.createElement('span');
            span.textContent = cleanMsg || message;
            toast.appendChild(span);
            toast.style.opacity = '1';
            toast.style.transform = 'translateX(-50%) translateY(0)';
            clearTimeout(toast._hideTimer);
            toast._hideTimer = setTimeout(() => {
                toast.style.opacity = '0';
                toast.style.transform = 'translateX(-50%) translateY(20px)';
            }, duration);
        },

        updateTitle: function(text) {
            if (this._titleEl) this._titleEl.textContent = text || 'VAXPLAYER TV';
        },
        updateProgress: function(current, duration) {
            const fill = this._progressFill,
                timeEl = this._progressTime;
            if (!fill) return;
            if (duration > 0 && isFinite(duration))
                fill.style.width = Math.min(100, (current / duration) * 100) + '%';
            else fill.style.width = '0%';
            if (timeEl) timeEl.textContent = StreamPlayer.isLive() ?
                'LIVE · ' + window.Utils.DomUtils.formatTime(current) :
                window.Utils.DomUtils.formatTime(current) + ' / ' + window.Utils.DomUtils.formatTime(duration);
        }
    };
    window.UIManager = UIManager;
})();

/* ============================================================ HELP MODAL */
(function() {
    if (window._helpModal_loaded) return;
    window._helpModal_loaded = true;
    const HELP_SEEN_KEY = 'vax_help_seen_v3';

    const PAGES = [
        '<h1>VAXPLAYER TV — HƯỚNG DẪN</h1>' +
        '<div class="help-sub">Trình phát IPTV đa định dạng cho kênh truyền hình & thể thao</div>' +
        '<h2>🎮 Thanh điều khiển (7 nút)</h2>' +
        '<div class="help-row"><span class="help-key">📋</span><span class="help-desc"><b>Danh Sách Kênh</b> — Mở panel duyệt kênh</span></div>' +
        '<div class="help-row"><span class="help-key">🔖</span><span class="help-desc"><b>Yêu Thích</b> — Thêm/bỏ kênh đang phát khỏi yêu thích</span></div>' +
        '<div class="help-row"><span class="help-key">⏮</span><span class="help-desc"><b>Kênh Trước</b> — Chuyển về kênh trước</span></div>' +
        '<div class="help-row"><span class="help-key">▶️ ⏸️</span><span class="help-desc"><b>Phát / Tạm dừng</b> — Đổi trạng thái video</span></div>' +
        '<div class="help-row"><span class="help-key">⏭</span><span class="help-desc"><b>Kênh Kế</b> — Chuyển sang kênh tiếp theo</span></div>' +
        '<div class="help-row"><span class="help-key">🔒</span><span class="help-desc"><b>Tắt Màn Hình</b> — Khóa màn hình (nhấn OK để mở)</span></div>' +
        '<div class="help-row"><span class="help-key">❓</span><span class="help-desc"><b>Hướng Dẫn</b> — Mở bảng hướng dẫn này</span></div>' +
        '<div class="help-note">Focus mặc định khi mở control: nút <b>Phát / Tạm dừng</b> (ở giữa).<br>Nhấn <b>←</b> <b>→</b> để lật trang · <b>↑</b> <b>↓</b> để đóng</div>',

        '<h1>🖱️ Thao tác chuột & cảm ứng</h1>' +
        '<div class="help-sub">Chia 3 vùng màn hình khi control không hiện</div>' +
        '<h2>Khi control ẨN</h2>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:8px 4px;color:#ffd43b;width:40%;"><b>1 tap trái</b></td>' +
        '<td style="padding:8px 4px;">Mở Danh Sách Kênh</td></tr>' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:8px 4px;color:#ffd43b;"><b>3 tap trái</b> (800ms)</td>' +
        '<td style="padding:8px 4px;">Chuyển kênh trước</td></tr>' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:8px 4px;color:#ffd43b;"><b>1 tap phải</b></td>' +
        '<td style="padding:8px 4px;">Hiện thanh điều khiển</td></tr>' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:8px 4px;color:#ffd43b;"><b>3 tap phải</b> (800ms)</td>' +
        '<td style="padding:8px 4px;">Chuyển kênh kế</td></tr>' +
        '<tr><td style="padding:8px 4px;color:#ffd43b;"><b>1 tap giữa</b></td>' +
        '<td style="padding:8px 4px;">Phát / Tạm dừng</td></tr>' +
        '</table>' +
        '<h2>Khi control HIỆN</h2>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:8px 4px;color:#ffd43b;"><b>3 tap trái / phải</b></td>' +
        '<td style="padding:8px 4px;">Kênh trước / kế</td></tr>' +
        '<tr><td style="padding:8px 4px;color:#ffd43b;"><b>1 tap giữa</b></td>' +
        '<td style="padding:8px 4px;">Phát / Tạm dừng</td></tr>' +
        '</table>' +
        '<div class="help-note">💡 <b>3 tap</b> phải trong vòng <b>800ms</b>. Nếu bấm chậm hơn → chỉ tính là 1 tap.</div>',

        '<h1>⌨️ Phím tắt</h1>' +
        '<div class="help-sub">Cho Remote TV & Bàn phím máy tính</div>' +
        '<h2>Khi control ẩn</h2>' +
        '<div class="help-row"><span class="help-key">Enter / OK</span><span class="help-desc">Hiện thanh điều khiển</span></div>' +
        '<div class="help-row"><span class="help-key">Space</span><span class="help-desc">Phát / Tạm dừng</span></div>' +
        '<div class="help-row"><span class="help-key">↑ / ↓</span><span class="help-desc">↑ mở Yêu Thích · ↓ mở Danh Sách Kênh</span></div>' +
        '<div class="help-row"><span class="help-key">← / →</span><span class="help-desc">Hiện control (1 lần nhấn)</span></div>' +
        '<h2>Khi control hiện</h2>' +
        '<div class="help-row"><span class="help-key">← / →</span><span class="help-desc">Di chuyển giữa 7 nút + vào list Yêu Thích / Hay Xem (vòng tuần hoàn)</span></div>' +
        '<div class="help-row"><span class="help-key">↑ / ↓</span><span class="help-desc">Ẩn control · hoặc duyệt kênh trong list</span></div>' +
        '<div class="help-row"><span class="help-key">Enter / OK</span><span class="help-desc">Kích hoạt nút đang focus</span></div>' +
        '<h2>Phím chung</h2>' +
        '<div class="help-row"><span class="help-key">PageUp</span><span class="help-desc">Kênh trước</span></div>' +
        '<div class="help-row"><span class="help-key">PageDown</span><span class="help-desc">Kênh kế</span></div>' +
        '<div class="help-row"><span class="help-key">0 - 9</span><span class="help-desc">Nhập số kênh, chờ 1s</span></div>' +
        '<div class="help-row"><span class="help-key">F</span><span class="help-desc">Bật/tắt toàn màn hình</span></div>' +
        '<div class="help-row"><span class="help-key">ESC / Back</span><span class="help-desc">Đóng panel · quay lại</span></div>',

        '<h1>📁 Panel Danh Sách Kênh</h1>' +
        '<div class="help-sub">Bố cục 2 cột: Thư mục (30%) + Kênh con (70%)</div>' +
        '<h2>Cột trái — Thư mục</h2>' +
        '<div class="help-row"><span class="help-key">↑ / ↓</span><span class="help-desc">Di chuyển giữa các thư mục</span></div>' +
        '<div class="help-row"><span class="help-key">← / →</span><span class="help-desc">Vào cột kênh con</span></div>' +
        '<h2>Cột phải — Kênh con</h2>' +
        '<div class="help-row"><span class="help-key">← / →</span><span class="help-desc">Chuyển giữa các kênh (grid 3 cột cho Tất Cả Kênh)</span></div>' +
        '<div class="help-row"><span class="help-key">↑ / ↓</span><span class="help-desc">Quay lại cột thư mục</span></div>' +
        '<div class="help-row"><span class="help-key">OK (nhanh)</span><span class="help-desc">Phát kênh đang focus</span></div>' +
        '<div class="help-row"><span class="help-key">OK (giữ 0.8s)</span><span class="help-desc">⭐ Thêm/bỏ kênh yêu thích</span></div>' +
        '<h2>Đóng panel</h2>' +
        '<div class="help-row"><span class="help-key">Giữ ←→↑↓ 1s</span><span class="help-desc">Đóng panel</span></div>' +
        '<div class="help-row"><span class="help-key">X / ESC</span><span class="help-desc">Nút X hoặc ESC</span></div>' +
        '<div class="help-note">💡 <b>Bong bóng gợi ý</b> hiện khi focus kênh và tự ẩn sau 5s.</div>',

        '<h1>⭐ Kênh Yêu Thích & 🕐 Hay Xem</h1>' +
        '<div class="help-sub">2 danh sách hiển thị khi control hiện</div>' +
        '<h2>⭐ Yêu Thích (bên trái màn hình)</h2>' +
        '<div class="help-note">Thêm yêu thích tự động gán slot #1, #2, #3... Xóa thì dồn lên và kênh bị xóa về cuối danh sách. Giới hạn 20 kênh.</div>' +
        '<h2>🕐 Hay Xem (bên phải màn hình)</h2>' +
        '<div class="help-note">• <b>Kênh cuối cùng xem</b> (≥5s) ở đầu<br>• Các kênh xem <b>≥60s</b> tự động thêm vào, sắp theo tổng thời gian<br>• Tối đa 20 kênh, không trùng</div>' +
        '<h2>Cách focus</h2>' +
        '<div class="help-row"><span class="help-key">← →</span><span class="help-desc">Di chuyển focus vào list (chỉ focus cột, không duyệt từng kênh)</span></div>' +
        '<div class="help-row"><span class="help-key">↑ ↓</span><span class="help-desc">Duyệt kênh trong list đang focus</span></div>' +
        '<div class="help-row"><span class="help-key">Enter</span><span class="help-desc">Phát kênh đang focus</span></div>' +
        '<h2>🔧 Đổi vị trí kênh yêu thích</h2>' +
        '<div class="help-note">Trong folder Yêu Thích có 4 nút ảo:<br>' +
        '• <b>⬅️</b> Chuyển kênh đang chọn lên vị trí trước<br>' +
        '• <b>🔄</b> Chọn kênh để đổi vị trí<br>' +
        '• <b>➡️</b> Chuyển kênh đang chọn xuống vị trí sau<br>' +
        '• <b>🗑️</b> Xóa toàn bộ yêu thích</div>',

        '<h1>⚡ Chế độ Tất Cả Kênh</h1>' +
        '<div class="help-sub">Hiển thị dạng grid 3 cột — dễ duyệt, tìm nhanh</div>' +
        '<div class="help-note">Kênh yêu thích được đánh dấu <b>⭐ vàng</b> và nền vàng nhạt để nhận biết.</div>' +
        '<h2>Điều hướng</h2>' +
        '<table style="width:100%;border-collapse:collapse;font-size:13px;">' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:6px 4px;color:#ffd43b;"><b>← ↑ ↓ →</b></td>' +
        '<td style="padding:6px 4px;">Di chuyển trong grid (wrap tuần hoàn)</td></tr>' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:6px 4px;color:#ffd43b;"><b>Lăn chuột dọc</b></td>' +
        '<td style="padding:6px 4px;">Focus lên / xuống</td></tr>' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:6px 4px;color:#ffd43b;"><b>Lăn chuột ngang</b></td>' +
        '<td style="padding:6px 4px;">Focus trái / phải</td></tr>' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:6px 4px;color:#ffd43b;"><b>Vuốt dọc (mobile)</b></td>' +
        '<td style="padding:6px 4px;">Scroll tự nhiên</td></tr>' +
        '<tr style="border-bottom:1px solid rgba(255,255,255,0.1);">' +
        '<td style="padding:6px 4px;color:#ffd43b;"><b>Vuốt ngang (mobile)</b></td>' +
        '<td style="padding:6px 4px;">Focus trái / phải</td></tr>' +
        '<tr><td style="padding:6px 4px;color:#ffd43b;"><b>Giữ ↑ / ↓ (1s)</b></td>' +
        '<td style="padding:6px 4px;">Chuyển thư mục trước / sau</td></tr>' +
        '</table>' +
        '<h2>Layout theo thiết bị</h2>' +
        '<div class="help-row"><span class="help-key">Desktop</span><span class="help-desc">3 cột</span></div>' +
        '<div class="help-row"><span class="help-key">Tablet</span><span class="help-desc">2 cột</span></div>' +
        '<div class="help-row"><span class="help-key">Mobile</span><span class="help-desc">1 cột, cuộn dọc</span></div>',

        '<h1>🔢 Nhập số kênh</h1>' +
        '<div class="help-sub">Điều khiển như TV truyền thống</div>' +
        '<h2>Cách dùng</h2>' +
        '<div class="help-row"><span class="help-key">0 - 9</span><span class="help-desc">Overlay hiện góc phải trên + tên kênh</span></div>' +
        '<div class="help-row"><span class="help-key">Chờ 1s</span><span class="help-desc">Tự động chuyển tới kênh đó</span></div>' +
        '<div class="help-row"><span class="help-key">Vượt số</span><span class="help-desc">Nếu số > tổng kênh → <b>từ chối</b>, toast cảnh báo, reset chữ số cuối</span></div>' +
        '<div class="help-note">Tổng kênh tính theo danh sách <b>đã sort và ẩn</b>. VD: 500 kênh nhưng chỉ 200 hiển thị → chỉ nhập được 1-200.</div>' +
        '<h2>Vòng focus khi control hiện</h2>' +
        '<div class="help-note">Nhấn <b>← →</b> liên tục:<br>' +
        'Danh Sách → Yêu Thích → Kênh Trước → Phát/Dừng → Kênh Kế → Tắt Màn Hình → Hướng Dẫn → <b>List Yêu Thích</b> → <b>List Hay Xem</b> → loop</div>' +
        '<h2>Màu focus</h2>' +
        '<div class="help-row"><span class="help-key">Viền lam</span><span class="help-desc">Nút control đang focus</span></div>' +
        '<div class="help-row"><span class="help-key">Viền đỏ</span><span class="help-desc">Kênh đang focus trong panel</span></div>' +
        '<div class="help-row"><span class="help-key">Viền vàng</span><span class="help-desc">Nút ảo đang focus</span></div>',

        '<h1>🔧 Xử lý sự cố & Mẹo</h1>' +
        '<div class="help-sub">Các tình huống thường gặp</div>' +
        '<h2>🔄 Tự động chuyển kênh khi lỗi</h2>' +
        '<div class="help-note">Khi phát 1 kênh mà không load được (sau 10s) hoặc gặp lỗi stream, hệ thống <b>tự động chuyển sang kênh kế tiếp</b>. Tối đa 15 kênh liên tiếp. Tắt bằng cách set <code>window.AUTO_FALLBACK_ENABLED = false</code>.</div>' +
        '<h2>💾 Cache & đồng bộ</h2>' +
        '<ul style="font-size:13px;line-height:1.6;color:#ddd;padding-left:22px;">' +
        '<li>Danh sách kênh cache 24 giờ — hết hạn tự fetch mới</li>' +
        '<li>Fetch lỗi → dùng cache cũ + gia hạn 1 ngày, không spam server</li>' +
        '<li>Khi URL có <code>?url=</code> → cache riêng cho từng list, không mix</li>' +
        '<li>Ảnh kênh cache base64 — tải nhanh lần sau</li>' +
        '</ul>' +
        '<h2>💡 Mẹo nhanh</h2>' +
        '<div class="help-note">' +
        '• Focus mặc định khi mở control = nút <b>Phát / Tạm dừng</b><br>' +
        '• Nút <b>Yêu Thích</b> toggle kênh đang phát<br>' +
        '• Khi mở trang, tự phát kênh đầu tiên trong list<br>' +
        '• Helper bubble tự ẩn sau 5s<br>' +
        '• Giữ OK trên kênh 0.8s → thêm/bỏ yêu thích<br>' +
        '• Long-press OK trên folder → chọn folder để di chuyển nhanh' +
        '</div>' +
        '<div class="help-note" style="text-align:center;">Cảm ơn bạn đã sử dụng VAXPLAYER TV 🎬</div>'
    ];

    const HelpModal = {
        _el: null,
        _pageEl: null,
        _indicatorEl: null,
        _btnPrev: null,
        _btnNext: null,
        _page: 0,

        build: function() {
            const el = document.getElementById('help-modal');
            if (!el) return;
            this._el = el;
            el.addEventListener('click', (e) => {
                if (e.target === el) this.hide();
            });

            const book = document.createElement('div');
            book.className = 'help-book';
            el.appendChild(book);

            const closeBtn = document.createElement('button');
            closeBtn.className = 'help-close';
            try {
                if (window.Utils && window.Utils.SVGIcon)
                    closeBtn.appendChild(window.Utils.SVGIcon.fill('close', '18px'));
            } catch (e) {
                closeBtn.textContent = '✕';
            }
            closeBtn.addEventListener('click', () => this.hide());
            book.appendChild(closeBtn);

            const wrap = document.createElement('div');
            wrap.className = 'help-page-wrap';
            book.appendChild(wrap);

            const pageEl = document.createElement('div');
            pageEl.className = 'help-page';
            wrap.appendChild(pageEl);
            this._pageEl = pageEl;

            const nav = document.createElement('div');
            nav.className = 'help-nav';
            book.appendChild(nav);

            const btnPrev = document.createElement('button');
            try {
                if (window.Utils && window.Utils.SVGIcon)
                    btnPrev.appendChild(window.Utils.SVGIcon.fill('prev', '16px'));
            } catch (e) {
                btnPrev.textContent = '◀';
            }
            const lblPrev = document.createElement('span');
            lblPrev.textContent = 'Trước';
            btnPrev.appendChild(lblPrev);
            btnPrev.addEventListener('click', () => this.prevPage());
            nav.appendChild(btnPrev);
            this._btnPrev = btnPrev;

            const indicator = document.createElement('div');
            indicator.className = 'help-page-indicator';
            indicator.textContent = '1 / ' + PAGES.length;
            nav.appendChild(indicator);
            this._indicatorEl = indicator;

            const btnNext = document.createElement('button');
            const lblNext = document.createElement('span');
            lblNext.textContent = 'Tiếp';
            btnNext.appendChild(lblNext);
            try {
                if (window.Utils && window.Utils.SVGIcon)
                    btnNext.appendChild(window.Utils.SVGIcon.fill('next', '16px'));
            } catch (e) {}
            btnNext.addEventListener('click', () => this.nextPage());
            nav.appendChild(btnNext);
            this._btnNext = btnNext;

            this._render();
        },

        _render: function() {
            if (!this._pageEl) return;
            this._pageEl.innerHTML = PAGES[this._page] || '';
            this._pageEl.scrollTop = 0;
            if (this._indicatorEl)
                this._indicatorEl.textContent = (this._page + 1) + ' / ' + PAGES.length;
            if (this._btnPrev) this._btnPrev.disabled = this._page === 0;
            if (this._btnNext) this._btnNext.disabled = this._page === PAGES.length - 1;
        },

        nextPage: function() {
            if (this._page < PAGES.length - 1) {
                this._page++;
                this._render();
            }
        },
        prevPage: function() {
            if (this._page > 0) {
                this._page--;
                this._render();
            }
        },

        show: function() {
            if (!this._el) this.build();
            if (this._el) {
                this._page = 0;
                this._render();
                this._el.classList.add('visible');
            }
            console.log('[Help] Shown');
        },
        hide: function() {
            if (this._el) this._el.classList.remove('visible');
            try {
                localStorage.setItem(HELP_SEEN_KEY, 'true');
            } catch (e) {}
            console.log('[Help] Hidden');
        },
        isVisible: function() {
            return this._el && this._el.classList.contains('visible');
        },
        shouldShowFirstTime: function() {
            try {
                return localStorage.getItem(HELP_SEEN_KEY) !== 'true';
            } catch (e) {
                return true;
            }
        }
    };

    window.HelpModal = HelpModal;
})();

/* ============================================================ PLAYER CONTROLLER */
(function() {
    if (window._playerController_loaded) return;
    window._playerController_loaded = true;
    const UIManager = window.UIManager;

    const PlayerController = {
        _video: null,
        _currentId: '',
        _isPlaying: false,
        _currentTime: 0,
        _duration: 0,
        _title: '',
        _pollIntervalId: null,
        _lastPlayIconState: null,
        _lastNextPrevTime: 0,
        _sessionStart: 0,
        _sessionTickId: null,
        _failTimer: null,
        _failAttempts: 0,
        _autoFallbackChain: 0,
        _autoFallbackChain: 0,
        _autoPlayActive: false,
        _autoPlayTick: null,
        _autoPlayStartAt: 0,
        _autoPlayRetryCount: 0,
        _autoPlayLastToast: 0,
        _autoPlayPausedSince: 0,
        _inAutoPlayWindow: false,
        _autoPlayRetryCount: 0,
        _autoPlayWindowTimer: null,
        _pauseRetryTimer: null,
       _brokenLinkTimer: null,
      _proxyRetried: false,
      
        init: function(currentId) {
            this._video = document.getElementById('vax-video');
            this._currentId = currentId || '';
            this._bindVideoEvents();
            if (this._pollIntervalId) clearInterval(this._pollIntervalId);
            this._pollIntervalId = setInterval(() => this._pollState(), 1000);
            if (this._sessionTickId) clearInterval(this._sessionTickId);
            this._sessionTickId = setInterval(() => this._commitWatchTime(), 20000);
            window.addEventListener('beforeunload', () => {
                this._commitWatchTime();
            });
            window.addEventListener('pagehide', () => {
                this._commitWatchTime();
            });
        },

        _commitWatchTime: function() {
            if (!this._currentId || !this._sessionStart) return;
            const elapsed = (Date.now() - this._sessionStart) / 1000;
            if (elapsed >= 1) ChannelStore.recordWatch(this._currentId, elapsed);
            this._sessionStart = Date.now();
        },

        _bindVideoEvents: function() {
            const v = this._video;
            if (!v || v._vaxBound) return;
            v._vaxBound = true;
            v.addEventListener('play', () => {
                this._isPlaying = true;
                this._updatePlayIcons();
            });
            v.addEventListener('pause', () => {
                this._isPlaying = false;
                this._updatePlayIcons();
                // Nếu pause trong 10s đầu → tự play lại
                if (this._inAutoPlayWindow && !v.ended && v.readyState >= 2 && this._autoPlayRetryCount < 3) {
                    const self = this;
                    clearTimeout(this._pauseRetryTimer);
                    this._pauseRetryTimer = setTimeout(function() {
                        if (self._inAutoPlayWindow && v.paused && !v.ended) {
                            self._autoPlayRetryCount++;
                            console.log('[Player] ⏸️ Pause đột ngột — auto-play lại lần', self._autoPlayRetryCount);
                            v.play().catch(() => {});
                        }
                    }, 800);
                }
            });
            v.addEventListener('playing', () => {
                this._clearFailWatchdog();
                this._failAttempts = 0;
                this._autoFallbackChain = 0;
                // Phát OK → tắt watchdog auto-play
                if (this._autoPlayActive) {
                    this._clearBrokenLinkWatchdog();
                    console.log('%c[AutoPlay] ✅ Video đã playing — dừng watchdog', 'color:#4dabf7');
                    this._stopAutoPlayWatchdog();
                }
            });
            v.addEventListener('canplay', ()=>{
                this._clearFailWatchdog();
                this._clearBrokenLinkWatchdog();
            });
            v.addEventListener('timeupdate', () => {
                this._currentTime = v.currentTime;
                this._duration = v.duration;
                UIManager.updateProgress(this._currentTime, this._duration);
                // Nếu đã có tiến độ > 0.5s → coi như OK
                if (v.currentTime > 0.5){
                    this._clearFailWatchdog();
                    this._clearBrokenLinkWatchdog();   // ⭐ thêm dòng này
                }
            });
            v.addEventListener('ended', () => {
                if (!StreamPlayer.isLive()) this.playNext();
            });
            v.addEventListener('loadedmetadata', () => {
                this._clearBrokenLinkWatchdog(); 
                this._duration = v.duration || 0;
                UIManager.updateProgress(0, this._duration);
                this._clearFailWatchdog();
            });

            // Nếu video bị muted do fallback autoplay → unmute khi user chạm
            const self = this;
            const _unmuteOnInteraction = function() {
                try {
                    if (v.muted) {
                        v.muted = false;
                        console.log('%c[Audio] 🔓 Đã unmute sau tương tác user', 'color:#4dabf7');
                    }
                } catch (e) {}
                // Chỉ cần chạy 1 lần
                document.removeEventListener('click', _unmuteOnInteraction, true);
                document.removeEventListener('touchstart', _unmuteOnInteraction, true);
                document.removeEventListener('keydown', _unmuteOnInteraction, true);
            };
            document.addEventListener('click', _unmuteOnInteraction, true);
            document.addEventListener('touchstart', _unmuteOnInteraction, true);
            document.addEventListener('keydown', _unmuteOnInteraction, true);
        },

        _onStreamFail: function() {
            this._clearBrokenLinkWatchdog();   // ⭐ thêm dòng này
            this._clearFailWatchdog();
            this._tryAutoFallback();
        },

        _startFailWatchdog: function() {
            this._clearFailWatchdog();
            const self = this;
            this._failTimer = setTimeout(function() {
                const v = self._video;
                if (!v) return;
                // Nếu chưa phát được gì (readyState < 2 hoặc currentTime < 0.5)
                if (v.readyState < 2 || v.currentTime < 0.5) {
                    console.warn('[Player] Watchdog fail — readyState:', v.readyState,
                        'currentTime:', v.currentTime);
                    self._tryAutoFallback();
                }
            }, 10000);
        },
        // ============================================================
        // Broken Link Watchdog — báo hỏng nếu 5s mà không load được
        // ============================================================
                _startBrokenLinkWatchdog: function() {
            clearTimeout(this._brokenLinkTimer);
            const self = this;
            console.log('[BrokenLink] ⏱️ Đặt watchdog 5s');
            this._brokenLinkTimer = setTimeout(function() {
                const v = self._video;
                if (!v) return;

                console.log('[BrokenLink] 🔔 Fire — readyState:', v.readyState,
                    'networkState:', v.networkState,
                    'currentTime:', v.currentTime,
                    'paused:', v.paused);

                // Đã phát OK → bỏ qua
                if (v.readyState >= 2 || v.currentTime > 0 || !v.paused) {
                    console.log('[BrokenLink] ✅ Đã phát → bỏ qua');
                    return;
                }

                // ⭐ Có metadata (readyState >= 1) → coi như OK, không báo
                // (đa số stream chậm cũng có metadata trong 5s)
                if (v.readyState >= 1) {
                    console.log('[BrokenLink] ⏳ Có metadata → chờ tiếp, không báo');
                    return;
                }

                // ⭐ Bỏ check networkState === 2 (vì CORS-blocked vẫn giữ NS=2)
                // Chỉ dựa vào readyState === 0 sau 5s → chắc chắn chưa load được gì

                const curUrl = StreamPlayer._currentUrl || '';
                const hasProxy = !!window.PROXY_BASE && curUrl.startsWith(window.PROXY_BASE);

                console.log('[BrokenLink] ⚠️ readyState=0 sau 5s | hasProxy:', hasProxy,
                    'proxyRetried:', self._proxyRetried);

                // ===== Chưa qua proxy + chưa retry → thử lại qua proxy =====
                if (!hasProxy && !self._proxyRetried) {
                    self._proxyRetried = true;
                    console.log('%c[BrokenLink] 🔄 Link lỗi, retry qua proxy worker',
                        'color:#ffd43b;font-weight:bold');
                    UIManager.showToast('🔄 Link lỗi, thử lại qua proxy...', 2000);
                    self._reloadWithProxy();
                    return;
                }

                // ===== Đã qua proxy (hoặc đã retry) → báo hỏng =====
                let reason = '';
                if (v.error) {
                    reason = 'code ' + v.error.code;
                } else if (v.networkState === 3) {
                    reason = 'không có nguồn (no source)';
                } else if (v.networkState === 0) {
                    reason = 'chưa kết nối được (DNS/network)';
                } else if (v.networkState === 1) {
                    reason = 'dừng tải, không có dữ liệu';
                } else {
                    reason = 'không load được';
                }

                console.warn('%c[BrokenLink] ❌ Link hỏng — ' + reason,
                    'color:#ff6b6b;font-weight:bold');
                UIManager.showToast('❌ Link này đã hỏng — ' + reason, 3500);
                                // ⭐ Revert lastOpened tránh reload lần sau gặp lại
                self._revertLastOpened();
            }, 5000);
        },

        // ============================================================
        // Retry qua proxy worker
        // ============================================================
        _reloadWithProxy: function() {
            const ch = ChannelStore.getChannel(this._currentId);
            if (!ch) return;
            if (!window.PROXY_BASE) {
                console.warn('[BrokenLink] Không có PROXY_BASE → bỏ qua retry');
                UIManager.showToast('❌ Link hỏng, không có proxy dự phòng', 3000);
                return;
            }

            console.log('[BrokenLink] 🔀 Retry URL qua proxy:', ch.url);

            // StreamPlayer.play với proxy:true sẽ tự wrap qua PROXY_BASE
            StreamPlayer.play(ch.url, ch.type, {
                drm: ch.drm,
                ua: ch.ua,
                referrer: ch.referrer,
                proxy: true
            });

            // Restart watchdog với timeout mới — lần này đã có proxy, sẽ báo lỗi nếu vẫn chết
            this._startBrokenLinkWatchdog();
        },
        // ============================================================
        // Revert lastOpened khi kênh mới bị hỏng
        // ============================================================
        _revertLastOpened: function() {
            const prev = this._prevLastOpened;
            const curId = this._currentId;

            // Nếu kênh cũ == kênh hiện tại → không cần revert
            if (prev && prev.channelId === curId) {
                console.log('[BrokenLink] ↩️ Prev == current → bỏ qua revert');
                return;
            }

            // Ưu tiên revert về kênh cũ
            if (prev && prev.channelId && ChannelStore.getChannel(prev.channelId)) {
                ChannelStore.setLastOpened(prev.folderId || '_all', prev.channelId);
                console.log('%c[BrokenLink] ↩️ Đã revert lastOpened về: ' +
                    prev.channelId + ' (tránh mở lại kênh hỏng)',
                    'color:#ffd43b;font-weight:bold');
            } else {
                // Không có prev → set về kênh #1
                const ordered = ChannelStore.getOrderedChannels();
                if (ordered[0]) {
                    ChannelStore.setLastOpened('_all', ordered[0].id);
                    console.log('%c[BrokenLink] ↩️ Không có prev → set về kênh #1: ' +
                        ordered[0].id, 'color:#ffd43b;font-weight:bold');
                }
            }

            // Refresh "Hay xem" để cập nhật UI
            if (window.SideLists) window.SideLists.refreshAll();
        },
        _clearBrokenLinkWatchdog: function() {
            clearTimeout(this._brokenLinkTimer);
            this._brokenLinkTimer = null;
        },
        _startAutoPlayWatchdog: function() {
            if (this._autoPlayTick) {
                clearInterval(this._autoPlayTick);
                this._autoPlayTick = null;
            }

            this._autoPlayActive = true;
            this._autoPlayStartAt = Date.now();
            this._autoPlayRetryCount = 0;
            this._autoPlayLastToast = 0;
            this._autoPlayPausedSince = 0; // thời điểm video bắt đầu paused

            const self = this;
            const v = this._video;
            if (!v) {
                this._autoPlayActive = false;
                return;
            }

            console.log('%c[AutoPlay] 🔒 Bắt đầu window 10s', 'color:#4dabf7;font-weight:bold');

            this._autoPlayTick = setInterval(function() {
                if (!self._autoPlayActive) return;
                const elapsed = Date.now() - self._autoPlayStartAt;

                // Hết 10s → tắt
                if (elapsed >= 10000) {
                    console.log('%c[AutoPlay] 🔓 Hết 10s — tắt watchdog', 'color:#888');
                    self._stopAutoPlayWatchdog();
                    return;
                }

                // === ĐANG PHÁT → reset pausedSince, không can thiệp ===
                if (!v.paused && !v.ended) {
                    self._autoPlayPausedSince = 0;
                    return;
                }

                // === Đang paused (hoặc chưa play) ===
                if (v.paused && !v.ended) {
                    // Ghi nhận lần đầu paused
                    if (!self._autoPlayPausedSince) {
                        self._autoPlayPausedSince = Date.now();
                        return; // chờ 2s xem có tự play không
                    }
                    const pausedFor = Date.now() - self._autoPlayPausedSince;

                    // Chưa paused đủ 2s → chờ tiếp
                    if (pausedFor < 2000) return;

                    // Chưa có data → chỉ toast, không retry
                    if (v.readyState < 2) {
                        if (Date.now() - self._autoPlayLastToast > 3000) {
                            self._autoPlayLastToast = Date.now();
                            const remain = Math.ceil((10000 - elapsed) / 1000);
                            UIManager.showToast('⏳ Đang tải kênh... (' + remain + 's)', 1500);
                        }
                        return;
                    }

                    // === Đã paused >= 2s + có data → retry ===
                    self._autoPlayPausedSince = 0;
                    self._autoPlayRetryCount++;
                    console.log('%c[AutoPlay] 🔄 Retry lần ' + self._autoPlayRetryCount +
                        ' (elapsed ' + Math.round(elapsed / 1000) + 's)', 'color:#ffd43b');

                    try {
                        const p = v.play();
                        if (p && p.catch) {
                            p.catch(function(err) {
                                console.warn('[AutoPlay] play() bị chặn:', err.message);
                                // Chỉ mute tạm để vượt autoplay policy
                                // Mute để vượt autoplay policy → play lại
                                v.muted = true;
                                v.play().then(function() {
                                    // Video đang phát không tiếng → TẮT WATCHDOG NGAY, không retry nữa
                                    self._stopAutoPlayWatchdog();
                                    console.log('%c[AutoPlay] 🔇 Video phát không tiếng — watchdog tắt, chỉ hiện overlay',
                                        'color:#ffd43b;font-weight:bold');
                                    self._showUnmuteOverlay(v);
                                }).catch(function(e2) {
                                    console.warn('[AutoPlay] Vẫn không play được:', e2.message);
                                });
                            });
                        }
                    } catch (e) {
                        console.warn('[AutoPlay] play lỗi:', e);
                    }
                }
            }, 1000);
        },
        _showUnmuteOverlay: function(v) {
            // Xóa overlay cũ
            const old = document.getElementById('vax-unmute-overlay');
            if (old) old.remove();

            const overlay = document.createElement('div');
            overlay.id = 'vax-unmute-overlay';
            overlay.style.cssText = `
        position: fixed;
        top: 50%; left: 50%;
        transform: translate(-50%, -50%);
        z-index: 10120;
        background: rgba(0,0,0,0.92);
        border: 2px solid #4dabf7;
        border-radius: 16px;
        padding: 22px 30px;
        text-align: center; color: #fff;
        box-shadow: 0 12px 48px rgba(0,0,0,0.9), 0 0 32px rgba(77,171,247,0.4);
        cursor: pointer; pointer-events: auto;
        animation: vax-pop 0.3s ease-out;
        max-width: 90vw;
        font-family: Arial, sans-serif;
      `;
            overlay.innerHTML = `
        <style>
          @keyframes vax-pop {
            0% { transform: translate(-50%, -50%) scale(0.8); opacity: 0; }
            100% { transform: translate(-50%, -50%) scale(1); opacity: 1; }
          }
        </style>
        <div style="font-size:44px;margin-bottom:10px;line-height:1;">🔇</div>
        <div style="font-size:17px;font-weight:700;color:#4dabf7;margin-bottom:8px;">
          Nhấn để bật tiếng
        </div>
        <div style="font-size:13px;color:#ccc;line-height:1.5;max-width:340px;">
          Trình duyệt chặn tự động phát âm thanh.<br>
          Nhấn <b style="color:#fff;">nút bất kỳ trên remote</b> hoặc click để bật tiếng.
        </div>
        <div style="margin-top:14px;padding:10px 24px;background:#1a73e8;border-radius:24px;
                    font-size:14px;font-weight:600;display:inline-block;">
          👆 Nhấn OK
        </div>
      `;
            document.body.appendChild(overlay);

            let _dismissed = false;
            const dismiss = function() {
                if (_dismissed) return;
                _dismissed = true;
                try {
                    v.muted = false;
                    if (v.paused && !v.ended) {
                        const p = v.play();
                        if (p && p.catch) p.catch(() => {});
                    }
                } catch (e) {}
                const ov = document.getElementById('vax-unmute-overlay');
                if (ov) ov.remove();
                document.removeEventListener('click', dismiss, true);
                document.removeEventListener('touchstart', dismiss, true);
                document.removeEventListener('keydown', dismiss, true);
                window.dismissUnmuteOverlay = null;
                console.log('%c[Audio] 🔓 Đã bật tiếng', 'color:#4dabf7;font-weight:bold');
            };

            // Expose global để KeyHandler có thể gọi
            window.dismissUnmuteOverlay = dismiss;

            // Click / touch trên overlay
            overlay.addEventListener('click', function(e) {
                e.stopPropagation();
                dismiss();
            });
            overlay.addEventListener('touchstart', function(e) {
                e.preventDefault();
                e.stopPropagation();
                dismiss();
            }, {
                passive: false
            });

            // Global backup
            document.addEventListener('click', dismiss, true);
            document.addEventListener('touchstart', dismiss, true);
            document.addEventListener('keydown', dismiss, true);

            console.log('%c[Audio] 🔇 Hiện overlay bật tiếng — chờ user tương tác',
                'color:#ffd43b');
        },

        _stopAutoPlayWatchdog: function() {
            this._autoPlayActive = false;
            if (this._autoPlayTick) {
                clearInterval(this._autoPlayTick);
                this._autoPlayTick = null;
            }
            console.log('[AutoPlay] Stopped');
        },

        _clearFailWatchdog: function() {
            clearTimeout(this._failTimer);
            this._failTimer = null;
        },

        _tryAutoFallback: function() {
            // Tắt tính năng → không làm gì
            if (window.AUTO_FALLBACK_ENABLED === false) {
                console.log('[Player] Auto-fallback DISABLED — kênh lỗi, đứng yên');
                return;
            }

            this._autoFallbackChain = (this._autoFallbackChain || 0) + 1;
            if (this._autoFallbackChain > 15) {
                UIManager.showToast('❌ Đã thử 15 kênh, không có kênh phát được', 3500);
                this._autoFallbackChain = 0;
                return;
            }
            console.log('[Player] Auto fallback lần', this._autoFallbackChain);
            UIManager.showToast('⚠️ Kênh lỗi, tự chuyển kênh kế (' + this._autoFallbackChain + '/15)', 1500);
            const ordered = ChannelStore.getOrderedChannels();
            if (!ordered.length) return;
            const curIdx = ordered.findIndex(c => c.id === this._currentId);
            const nextIdx = (curIdx + 1 + ordered.length) % ordered.length;
            const next = ordered[nextIdx];
            if (!next) return;
            this._loadChannel(next.id, true);
        },

        _loadChannel: function(id, isAutoFallback) {
            if (window.UIManager && UIManager._hideHelper) UIManager._hideHelper();
            // Reset muted khi đổi kênh (tránh câm vĩnh viễn từ kênh trước)
            try {
                const v = this._video;
                if (v) v.muted = false;
            } catch (e) {}
            const ch = ChannelStore.getChannel(id);
            // ... phần còn lại giữ nguyên
            if (!ch) {
                console.warn('[Player] Không thấy kênh:', id);
                return;
            }
            this._commitWatchTime();

            if (!isAutoFallback) {
                this._autoFallbackChain = 0;
                this._failAttempts = 0;
            }
             // ⭐ Lưu kênh cũ để có thể revert nếu kênh mới hỏng
            this._prevLastOpened = ChannelStore.getLastOpened();
            this._proxyRetried = false,   // ⭐ reset khi đổi kênh
            this._currentId = id;
            this._title = ch.name || id;
            const num = ChannelStore.getChannelNumber(id);
            UIManager.updateTitle('#' + num + '  ' + this._title);

            // === LƯU KÊNH CUỐI CÙNG NGAY LẬP TỨC ===
            try {
                const folders = ChannelStore.getFolders();
                let foundFolderId = null;
                for (let i = 0; i < folders.length; i++) {
                    const f = folders[i];
                    if (f.channels && f.channels.some(c => c.id === id)) {
                        foundFolderId = f.id;
                        break;
                    }
                }
                ChannelStore.setLastOpened(foundFolderId || '_all', id);
                console.log('%c[Resume] 💾 Đã lưu kênh cuối:', id,
                    '| folder:', foundFolderId, '| #' + num,
                    'color:#4dabf7');
            } catch (e) {
                console.warn('[Resume] Lỗi lưu:', e);
            }

            StreamPlayer.play(ch.url, ch.type, {
                drm: ch.drm,
                ua: ch.ua,
                referrer: ch.referrer,
                proxy: window.USE_PROXY
            });

            this._sessionStart = Date.now();
            this._startFailWatchdog();
            this._startAutoPlayWatchdog();
            this._startBrokenLinkWatchdog();
            UIManager.updateCurrentChannelHighlight();
            if (window.SideLists) window.SideLists.refreshAll();
            PanelManager.closeAll();
            UIManager.showToast('▶️ #' + num + '  ' + this._title, 2500);
                        // ⭐ Che banner quảng cáo theo nguồn
            if (window.AdOverlay){
                setTimeout(() => AdOverlay.syncForChannel(ch), 200);
            }
            console.log('[Player] ▶️ #' + num, ch.name);
        },

        playNext: function() {
            const now = Date.now();
            if (now - this._lastNextPrevTime < 400) return;
            this._lastNextPrevTime = now;
            const ordered = ChannelStore.getOrderedChannels();
            if (!ordered.length) return;
            const curIdx = ordered.findIndex(c => c.id === this._currentId);
            const next = ordered[(curIdx + 1 + ordered.length) % ordered.length];
            this._loadChannel(next.id);
        },
        playPrev: function() {
            const now = Date.now();
            if (now - this._lastNextPrevTime < 400) return;
            this._lastNextPrevTime = now;
            const ordered = ChannelStore.getOrderedChannels();
            if (!ordered.length) return;
            const curIdx = ordered.findIndex(c => c.id === this._currentId);
            const prev = ordered[(curIdx - 1 + ordered.length) % ordered.length];
            this._loadChannel(prev.id);
        },

        jumpToNumber: function(num) {
            const ch = ChannelStore.getChannelByNumber(num);
            if (ch) this._loadChannel(ch.id);
            else UIManager.showToast('❌ Không có kênh số ' + num, 1500);
        },

        toggleFavorite: function(id) {
            const ch = ChannelStore.getChannel(id);
            if (!ch) return;
            const res = ChannelStore.toggleFavorite(id);
            UIManager.showToast(res.msg, 2500);
            UIManager.renderChannelBrowser(ChannelStore.getFolders(), UIManager._activeFolderId);
            UIManager.updateCurrentChannelHighlight();
            if (window.SideLists) window.SideLists.refreshAll();
            // Refresh helper
            if (UIManager._focusArea === 'channels' && UIManager._channelItems[UIManager._channelFocusIdx]) {
                const folder = UIManager._currentFolders[UIManager._folderFocusIdx];
                const item = UIManager._channelItems[UIManager._channelFocusIdx];
                if (folder && item.dataset.channelId) {
                    const c2 = folder.channels.find(c => c.id === item.dataset.channelId);
                    if (c2) UIManager._showHelperFor(c2, item);
                }
            }
            console.log('[Favorite]', ch.name, res.msg);
        },

        toggleFavoriteCurrent: function() {
            if (!this._currentId) {
                UIManager.showToast('⚠️ Chưa có kênh đang phát', 1500);
                return;
            }
            this.toggleFavorite(this._currentId);
        },

        _pollState: function() {
            const v = this._video;
            if (!v) return;
            this._currentTime = v.currentTime || 0;
            this._duration = v.duration || 0;
            const playing = !v.paused && !v.ended && v.readyState > 2;
            if (playing !== this._isPlaying) {
                this._isPlaying = playing;
                this._updatePlayIcons();
            }
            UIManager.updateProgress(this._currentTime, this._duration);
        },

        _updatePlayIcons: function() {
            if (this._lastPlayIconState === this._isPlaying) return;
            this._lastPlayIconState = this._isPlaying;
            const btn = document.getElementById('ctrl-toggle');
            if (btn) {
                const oldImg = btn.querySelector('img');
                if (oldImg) {
                    const want = this._isPlaying ? 'pause.svg' : 'play.svg';
                    const cur = oldImg.getAttribute('src') || '';
                    if (!cur.endsWith(want)) {
                        oldImg.setAttribute('src',
                            'https://vaxplugin.alokillgtv.workers.dev/youtube/svg/' + want);
                    }
                }
            }
        },

        sendCommand: function(command) {
            const v = this._video;
            if (!v) return;
            switch (command) {
                case 'PLAY':
                    v.play().catch(() => {});
                    break;
                case 'PAUSE':
                    v.pause();
                    break;
                case 'TOGGLE_PLAY':
                    if (v.paused) v.play().catch(() => {});
                    else v.pause();
                    break;
                case 'NEXT_CHANNEL':
                    this.playNext();
                    break;
                case 'PREV_CHANNEL':
                    this.playPrev();
                    break;
                case 'FULLSCREEN':
                    if (document.fullscreenElement) document.exitFullscreen();
                    else document.documentElement.requestFullscreen().catch(() => {});
                    break;
            }
        },

        getCurrentId() {
            return this._currentId;
        },
        getTitle() {
            return this._title;
        },
        isPlaying() {
            return this._isPlaying;
        }
    };
    window.PlayerController = PlayerController;
})();

/* ============================================================ PANEL MANAGER */
(function() {
    if (window._panelManager_loaded) return;
    window._panelManager_loaded = true;
    const UIManager = window.UIManager;

    const PanelManager = {
        _isOpen: false,
        _backCount: 0,
        _backTimer: null,

        open: function(panelId, focusFolderId) {
            const panel = document.getElementById(panelId);
            if (!panel) return;
            this._isOpen = true;
            if (window.UIManager && UIManager._hideHelper) UIManager._hideHelper();
            if (window.ControlsManager) window.ControlsManager.hide();

            if (panelId === 'yt-ultimate-left-panel') {
                panel.style.transform = 'translateX(0)';
                const r = document.getElementById('yt-ultimate-right-panel');
                if (r) r.style.transform = 'translateX(100%)';
                UIManager._favSwapState = null;
                const folders = ChannelStore.getFolders();
                UIManager.renderChannelBrowser(folders, focusFolderId || '_all');
                UIManager.setFocusArea('folders');
            }
            window.__panelOpen = panelId;
            this._backCount = 0;
            clearTimeout(this._backTimer);
        },

        closeAll: function() {
            this._isOpen = false;
            const l = document.getElementById('yt-ultimate-left-panel');
            if (l) l.style.transform = 'translateX(-100%)';
            const r = document.getElementById('yt-ultimate-right-panel');
            if (r) r.style.transform = 'translateX(100%)';
            window.__panelOpen = null;
            window.__panelJustClosed = Date.now();
            UIManager._favSwapState = null;
            if (UIManager._hideHelper) UIManager._hideHelper();
            if (window.ControlsManager) window.ControlsManager.show();
            this._backCount = 0;
            clearTimeout(this._backTimer);
        },

        isOpen: function() {
            return this._isOpen;
        },

        handleBack: function() {
            if (this.isOpen()) {
                this.closeAll();
                return true;
            }
            if (window.HelpModal && window.HelpModal.isVisible()) {
                window.HelpModal.hide();
                return true;
            }
            if (window.ControlsManager && window.ControlsManager.isVisible()) {
                window.ControlsManager.hide();
                return true;
            }
            this._backCount++;
            if (this._backCount >= 3) {
                if (window.pauseFullscreenLockdown) {
                    window.pauseFullscreenLockdown(10);
                    UIManager.showToast('🔓 Cho phép thoát fullscreen trong 10s', 2500);
                } else {
                    UIManager.showToast('⏹️ Đang thoát...', 1500);
                    setTimeout(() => {
                        try {
                            window.close();
                        } catch (e) {}
                    }, 1000);
                }
                this._backCount = 0;
                clearTimeout(this._backTimer);
                return true;
            }
            UIManager.showToast('Nhấn Back ' + (3 - this._backCount) + ' lần nữa để thoát fullscreen', 1500);
            clearTimeout(this._backTimer);
            this._backTimer = setTimeout(() => {
                this._backCount = 0;
            }, 3000);
            return true;
        },
    };
    window.PanelManager = PanelManager;
})();

/* ============================================================ SIDE LISTS */
(function() {
    if (window._sideLists_loaded) return;
    window._sideLists_loaded = true;
    const PlayerController = window.PlayerController;

    function buildItem(ch, isActive) {
        const item = document.createElement('div');
        item.className = 'fav-quick-item';
        item.dataset.channelId = ch.id;
        if (isActive) item.classList.add('active');

        const num = document.createElement('span');
        num.className = 'fq-num';
        num.textContent = '#' + ChannelStore.getChannelNumber(ch.id);
        item.appendChild(num);

        const icon = document.createElement('img');
        icon.className = 'fq-icon';
        icon.src = ChannelStore.getImageSrc(ch) ||
            'data:image/svg+xml;utf8,' + encodeURIComponent(
                '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 100 56"><rect fill="#1a1a1a" width="100" height="56"/><text x="50" y="32" fill="#666" font-size="9" text-anchor="middle">TV</text></svg>'
            );
        icon.addEventListener('error', () => {
            icon.style.opacity = '0.3';
        });
        item.appendChild(icon);

        const name = document.createElement('span');
        name.className = 'fq-name';
        name.textContent = ch.name;
        item.appendChild(name);

        item.addEventListener('click', function(e) {
            e.stopPropagation();
            PlayerController._loadChannel(ch.id);
        });

        return item;
    }

    const SideLists = {
        _favEl: null,
        _recEl: null,

        init: function() {
            this._favEl = document.getElementById('fav-quick-list');
            this._recEl = document.getElementById('recent-quick-list');
        },

        show: function() {
            if (!this._favEl) this.init();
            this.refreshAll();
            if (this._favEl) this._favEl.classList.add('visible');
            if (this._recEl) this._recEl.classList.add('visible');
        },

        hide: function() {
            if (this._favEl) this._favEl.classList.remove('visible');
            if (this._recEl) this._recEl.classList.remove('visible');
        },

        refreshAll: function() {
            this._refreshFav();
            this._refreshRecent();
        },

        _refreshFav: function() {
            if (!this._favEl) this.init();
            if (!this._favEl) return;
            const favs = ChannelStore.getFavorites().slice(0, 20);
            const curId = PlayerController.getCurrentId();
            while (this._favEl.firstChild) this._favEl.removeChild(this._favEl.firstChild);

            const header = document.createElement('div');
            header.className = 'fql-header';
            header.textContent = '⭐ YÊU THÍCH (' + favs.length + ')';
            this._favEl.appendChild(header);

            if (!favs.length) {
                const empty = document.createElement('div');
                empty.className = 'fql-empty';
                empty.textContent = 'Chưa có';
                this._favEl.appendChild(empty);
                return;
            }

            favs.forEach(ch => this._favEl.appendChild(buildItem(ch, ch.id === curId)));
        },

        _refreshRecent: function() {
            if (!this._recEl) this.init();
            if (!this._recEl) return;
            const recents = ChannelStore.getRecentlyWatched(20);
            const curId = PlayerController.getCurrentId();
            while (this._recEl.firstChild) this._recEl.removeChild(this._recEl.firstChild);

            const header = document.createElement('div');
            header.className = 'fql-header';
            header.textContent = '🕐 HAY XEM (' + recents.length + ')';
            this._recEl.appendChild(header);

            if (!recents.length) {
                const empty = document.createElement('div');
                empty.className = 'fql-empty';
                empty.textContent = 'Chưa có';
                this._recEl.appendChild(empty);
                return;
            }

            recents.forEach(ch => this._recEl.appendChild(buildItem(ch, ch.id === curId)));
        }
    };
    window.SideLists = SideLists;
})();

/* ============================================================ CONTROLS MANAGER */
(function() {
    if (window._controlsManager_loaded) return;
    window._controlsManager_loaded = true;
    const UIManager = window.UIManager;

    const ControlsManager = {
        _visible: false,
        _hideTimer: null,
        _blockShow: false,
        _lastShowTime: 0,
        _buttons: ['ctrl-list', 'ctrl-fav', 'ctrl-prev', 'ctrl-toggle', 'ctrl-next', 'ctrl-lock', 'ctrl-help'],
        _zones: ['controls', 'fav', 'recent'],
        _zoneIdx: 0,
        _btnIdx: 0,
        _favIdx: 0,
        _recentIdx: 0,

        show: function() {
            if (window.PanelManager && window.PanelManager.isOpen()) return;
            if (this._blockShow) return;
            const wasVisible = this._visible;
            this._visible = true;
            this._lastShowTime = Date.now();
            const c = UIManager.getControls(),
                t = UIManager.getTitle(),
                p = UIManager.getProgressContainer();
            if (c) {
                c.style.display = 'flex';
                c.style.opacity = '1';
            }
            if (t) t.style.opacity = '1';
            if (p) p.style.opacity = '1';
            // FIX: chỉ reset focus khi control mới hiện, không reset khi đang hiện
            if (!wasVisible) {
                this._zoneIdx = 0;
                this._btnIdx = 3; // ← nút Play (ctrl-toggle)
                this._favIdx = 0;
                this._recentIdx = 0;
            }
            this._applyFocusVisual();
            this._resetTimer();
            if (window.SideLists) window.SideLists.show();
            setTimeout(() => this._applyFocusVisual(), 50);
        },

        hide: function() {
            if (window.PanelManager && window.PanelManager.isOpen()) return;
            this._visible = false;
            const c = UIManager.getControls(),
                t = UIManager.getTitle(),
                p = UIManager.getProgressContainer();
            if (c) {
                c.style.opacity = '0';
                setTimeout(() => {
                    if (!this._visible) c.style.display = 'none';
                }, 300);
            }
            if (t) t.style.opacity = '0';
            if (p) p.style.opacity = '0';
            clearTimeout(this._hideTimer);
            if (window.SideLists) window.SideLists.hide();
        },

        _resetTimer: function() {
            clearTimeout(this._hideTimer);
            this._hideTimer = setTimeout(() => this.hide(), 2000);
        },

        isVisible: function() {
            return this._visible;
        },
        setBlockShow: function(b) {
            this._blockShow = b;
        },
        resetTimer: function() {
            if (this._visible) this._resetTimer();
        },

        _applyFocusVisual: function() {
            // 1. Focus cho 5 nút control
            this._buttons.forEach((id, i) => {
                const btn = document.getElementById(id);
                if (btn) btn.classList.toggle('focused', this._zoneIdx === 0 && i === this._btnIdx);
            });

            // 2. Focus cho list Yêu Thích (bên trái)
            const favItems = document.querySelectorAll('#fav-quick-list .fav-quick-item');
            favItems.forEach((el, i) => {
                el.classList.toggle('focused', this._zoneIdx === 1 && i === this._favIdx);
            });

            // 3. Focus cho list Hay Xem (bên phải)
            const recItems = document.querySelectorAll('#recent-quick-list .fav-quick-item');
            recItems.forEach((el, i) => {
                el.classList.toggle('focused', this._zoneIdx === 2 && i === this._recentIdx);
            });

            // 4. Auto scroll để item đang focus luôn hiện trong khung nhìn
            if (this._zoneIdx === 1 && favItems[this._favIdx])
                favItems[this._favIdx].scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
            if (this._zoneIdx === 2 && recItems[this._recentIdx])
                recItems[this._recentIdx].scrollIntoView({
                    block: 'nearest',
                    behavior: 'smooth'
                });
        },

        focusNext: function() {
            const zone = this._zones[this._zoneIdx];
            if (zone === 'controls') {
                if (this._btnIdx < this._buttons.length - 1) {
                    this._btnIdx++;
                } else {
                    const favItems = document.querySelectorAll('#fav-quick-list .fav-quick-item');
                    const recItems = document.querySelectorAll('#recent-quick-list .fav-quick-item');
                    if (favItems.length) {
                        this._zoneIdx = 1;
                        this._favIdx = 0;
                    } else if (recItems.length) {
                        this._zoneIdx = 2;
                        this._recentIdx = 0;
                    } else this._btnIdx = 0;
                }
            } else if (zone === 'fav') {
                const recItems = document.querySelectorAll('#recent-quick-list .fav-quick-item');
                if (recItems.length) {
                    this._zoneIdx = 2;
                    this._recentIdx = 0;
                } else {
                    this._zoneIdx = 0;
                    this._btnIdx = 0;
                }
            } else if (zone === 'recent') {
                this._zoneIdx = 0;
                this._btnIdx = 0;
            }
            this._applyFocusVisual();
            this.resetTimer();
        },

        focusPrev: function() {
            const zone = this._zones[this._zoneIdx];
            if (zone === 'controls') {
                if (this._btnIdx > 0) {
                    this._btnIdx--;
                } else {
                    const recItems = document.querySelectorAll('#recent-quick-list .fav-quick-item');
                    const favItems = document.querySelectorAll('#fav-quick-list .fav-quick-item');
                    if (recItems.length) {
                        this._zoneIdx = 2;
                        this._recentIdx = 0;
                    } else if (favItems.length) {
                        this._zoneIdx = 1;
                        this._favIdx = 0;
                    } else this._btnIdx = this._buttons.length - 1;
                }
            } else if (zone === 'fav') {
                this._zoneIdx = 0;
                this._btnIdx = this._buttons.length - 1;
            } else if (zone === 'recent') {
                const favItems = document.querySelectorAll('#fav-quick-list .fav-quick-item');
                if (favItems.length) {
                    this._zoneIdx = 1;
                    this._favIdx = 0;
                } else {
                    this._zoneIdx = 0;
                    this._btnIdx = this._buttons.length - 1;
                }
            }
            this._applyFocusVisual();
            this.resetTimer();
        },

        navigateUp: function() {
            const zone = this._zones[this._zoneIdx];
            if (zone === 'controls') {
                this.hide();
                return;
            }
            if (zone === 'fav' && this._favIdx > 0) this._favIdx--;
            if (zone === 'recent' && this._recentIdx > 0) this._recentIdx--;
            this._applyFocusVisual();
            this.resetTimer();
        },
        navigateDown: function() {
            const zone = this._zones[this._zoneIdx];
            if (zone === 'controls') {
                this.hide();
                return;
            }
            if (zone === 'fav') {
                const items = document.querySelectorAll('#fav-quick-list .fav-quick-item');
                if (this._favIdx < items.length - 1) this._favIdx++;
            }
            if (zone === 'recent') {
                const items = document.querySelectorAll('#recent-quick-list .fav-quick-item');
                if (this._recentIdx < items.length - 1) this._recentIdx++;
            }
            this._applyFocusVisual();
            this.resetTimer();
        },

        setFocusIdx: function(i) {
            this._zoneIdx = 0;
            this._btnIdx = i;
            this._applyFocusVisual();
        },

        activateFocused: function() {
            const zone = this._zones[this._zoneIdx];
            if (zone === 'controls') {
                this.activate(this._buttons[this._btnIdx]);
            } else if (zone === 'fav') {
                const items = document.querySelectorAll('#fav-quick-list .fav-quick-item');
                const it = items[this._favIdx];
                if (it && it.dataset.channelId) PlayerController._loadChannel(it.dataset.channelId);
            } else if (zone === 'recent') {
                const items = document.querySelectorAll('#recent-quick-list .fav-quick-item');
                const it = items[this._recentIdx];
                if (it && it.dataset.channelId) PlayerController._loadChannel(it.dataset.channelId);
            }
            this.resetTimer();
        },

        activate: function(id) {
            switch (id) {
                case 'ctrl-list':
                    PanelManager.open('yt-ultimate-left-panel', '_all');
                    break;
                case 'ctrl-fav':
                    PlayerController.toggleFavoriteCurrent();
                    break;
                case 'ctrl-prev':
                    PlayerController.playPrev();
                    break;
                case 'ctrl-next':
                    PlayerController.playNext();
                    break;
                case 'ctrl-toggle':
                    PlayerController.sendCommand('TOGGLE_PLAY');
                    UIManager.showToast(PlayerController.isPlaying() ? '⏸️ Tạm dừng' : '▶️ Đang phát', 1000);
                    break;
                case 'ctrl-lock':
                    if (typeof window.lockScreen === 'function') window.lockScreen();
                    break;
                case 'ctrl-help':
                    if (window.HelpModal) window.HelpModal.show();
                    break;
            }
            this.resetTimer();
        }
    };
    window.ControlsManager = ControlsManager;
})();

/* ============================================================ NUMBER INPUT */
(function() {
    if (window._numberInput_loaded) return;
    window._numberInput_loaded = true;

    const NumberInput = {
        _buffer: '',
        _timer: null,
        _el: null,
        init: function() {
            this._el = document.getElementById('channel-number-overlay');
        },

        push: function(digit) {
            if (!this._el) this.init();
            const total = ChannelStore.getTotal();
            let newBuf = this._buffer + digit;
            const num = parseInt(newBuf, 10);
            if (num > total) {
                // Vượt số → toast + reset
                UIManager.showToast('❌ Vượt quá tổng ' + total + ' kênh', 1500);
                this._buffer = digit;
                this._updateDisplay();
                clearTimeout(this._timer);
                this._timer = setTimeout(() => this._commit(), 1000);
                return;
            }
            this._buffer = newBuf;
            this._updateDisplay();
            clearTimeout(this._timer);
            this._timer = setTimeout(() => this._commit(), 1000);
        },

        _updateDisplay: function() {
            if (!this._el) return;
            const n = parseInt(this._buffer, 10);
            const total = ChannelStore.getTotal();
            const ch = (n >= 1 && n <= total) ? ChannelStore.getChannelByNumber(n) : null;
            while (this._el.firstChild) this._el.removeChild(this._el.firstChild);
            const val = document.createElement('div');
            val.className = 'num-value';
            val.textContent = this._buffer;
            this._el.appendChild(val);
            const name = document.createElement('div');
            name.className = 'num-name';
            name.textContent = ch ? ch.name : '—';
            this._el.appendChild(name);
            this._el.classList.add('visible');
        },

        _commit: function() {
            const num = parseInt(this._buffer, 10);
            this._buffer = '';
            if (this._el) this._el.classList.remove('visible');
            if (!num || num < 1) return;
            const total = ChannelStore.getTotal();
            if (num > total) {
                UIManager.showToast('❌ Chỉ có ' + total + ' kênh', 2000);
                return;
            }
            PlayerController.jumpToNumber(num);
        },

        clear: function() {
            this._buffer = '';
            clearTimeout(this._timer);
            if (this._el) this._el.classList.remove('visible');
        }
    };
    window.NumberInput = NumberInput;
})();

/* ============================================================ KEY HANDLER */
(function() {
    if (window._keyHandlerLoaded && window.KeyHandler && window.KeyHandler._boundKD) {
        try {
            document.removeEventListener('keydown', window.KeyHandler._boundKD, true);
            document.removeEventListener('keyup', window.KeyHandler._boundKU, true);
        } catch (e) {}
    }
    window._keyHandlerLoaded = true;

    const UIManager = window.UIManager;
    const PanelManager = window.PanelManager;
    const ControlsManager = window.ControlsManager;
    const PlayerController = window.PlayerController;

    const KeyHandler = {
        _boundKD: null,
        _boundKU: null,
        _lastArrowPress: {
            key: null,
            time: 0
        },
        _longPressTimer: null,
        _longPressKey: null,
        _longPressFired: false,
        _longPressDelay: 1000,
        _navPressCount: 0,
        _lastNavKey: null,
        _lastNavTime: 0,
        _navResetTimer: null,
        _enterTimer: null,
        _enterFired: false,

        init: function() {
            this._boundKD = this._handleKeyDown.bind(this);
            this._boundKU = this._handleKeyUp.bind(this);
            document.addEventListener('keydown', this._boundKD, true);
            document.addEventListener('keyup', this._boundKU, true);
        },

        _isLocked: function() {
            return !!document.getElementById('yt-screen-lock-overlay');
        },
        _isHelpOpen: function() {
            return !!(window.HelpModal && window.HelpModal.isVisible());
        },
        _isPanelOpen: function() {
            try {
                if (PanelManager && PanelManager.isOpen()) return true;
            } catch (e) {}
            return !!window.__panelOpen;
        },
        _isControlsVisible: function() {
            return !!(window.ControlsManager && window.ControlsManager.isVisible());
        },

        _handleKeyDown: function(e) {
            // ===== CHECK OVERLAY UNMUTE — dismiss trước mọi thứ =====
            const unmuteOv = document.getElementById('vax-unmute-overlay');
            if (unmuteOv) {
                e.preventDefault();
                e.stopImmediatePropagation();
                if (window.dismissUnmuteOverlay) window.dismissUnmuteOverlay();
                return;
            }
            if (e.__ytV13) return;
            const key = e.key;
            if (this._isLocked()) return;
            if (e.target && (e.target.tagName === 'INPUT' || e.target.tagName === 'SELECT' ||
                    e.target.tagName === 'TEXTAREA')) return;
            // ===== PANEL COOLDOWN =====
            // Vừa đóng panel → chặn arrow 1s để tránh auto-repeat mở lại
            if (window.__panelJustClosed && Date.now() - window.__panelJustClosed < 1000) {
                if (key === 'ArrowUp' || key === 'ArrowDown' ||
                    key === 'ArrowLeft' || key === 'ArrowRight') {
                    e.__ytV13 = true;
                    e.preventDefault();
                    e.stopImmediatePropagation();
                    return;
                }
            }
            if (this._isHelpOpen()) {
                e.__ytV13 = true;
                e.stopImmediatePropagation();
                if (key === 'ArrowLeft') {
                    e.preventDefault();
                    window.HelpModal.prevPage();
                    return;
                }
                if (key === 'ArrowRight') {
                    e.preventDefault();
                    window.HelpModal.nextPage();
                    return;
                }
                if (key === 'ArrowUp' || key === 'ArrowDown') {
                    e.preventDefault();
                    window.HelpModal.hide();
                    return;
                }
                if (key === 'Escape' || key === 'Backspace' || key === 'Enter' ||
                    key === ' ' || key === 'Space') {
                    e.preventDefault();
                    window.HelpModal.hide();
                    return;
                }
                return;
            }

            if (/^[0-9]$/.test(key)) {
                e.__ytV13 = true;
                e.preventDefault();
                e.stopImmediatePropagation();
                if (this._isPanelOpen()) PanelManager.closeAll();
                NumberInput.push(key);
                return;
            }

            const isArrow = (key === 'ArrowUp' || key === 'ArrowDown' ||
                key === 'ArrowLeft' || key === 'ArrowRight');
            const isEnter = (key === 'Enter' || e.keyCode === 13);
            const isOther = (key === ' ' || key === 'Space' ||
                key === 'Escape' || key === 'Backspace' || key === 'PageUp' ||
                key === 'PageDown' || key === 'f' || key === 'F' || e.keyCode === 179);
            if (!isArrow && !isOther && !isEnter) return;

            e.__ytV13 = true;
            e.stopImmediatePropagation();

            if (key === 'Escape' || key === 'Backspace') {
                e.preventDefault();
                PanelManager.handleBack();
                return;
            }
            if (key === 'PageUp') {
                e.preventDefault();
                ControlsManager.setBlockShow(true);
                PlayerController.playPrev();
                return;
            }
            if (key === 'PageDown') {
                e.preventDefault();
                ControlsManager.setBlockShow(true);
                PlayerController.playNext();
                return;
            }
            if (key === 'f' || key === 'F') {
                e.preventDefault();
                PlayerController.sendCommand('FULLSCREEN');
                return;
            }

            if (this._isPanelOpen()) {
                if (isArrow) {
                    if (this._longPressKey !== key || !this._longPressTimer) {
                        this._startLongPress(key);
                    }
                    if (e.repeat) return;
                    this._handlePanelNav(key);
                    return;
                }
                if (isEnter || key === ' ' || key === 'Space') {
                    e.preventDefault();
                    // Chỉ start timer 1 lần duy nhất (chặn auto-repeat reset timer)
                    if (!this._enterTimer && !this._enterFired) {
                        this._startEnterLongPress();
                    }
                    return;
                }
                return;
            }

            if (this._isControlsVisible()) {
                if (key === 'ArrowLeft') {
                    e.preventDefault();
                    ControlsManager.focusPrev();
                    return;
                }
                if (key === 'ArrowRight') {
                    e.preventDefault();
                    ControlsManager.focusNext();
                    return;
                }
                if (key === 'ArrowUp') {
                    e.preventDefault();
                    ControlsManager.navigateUp();
                    return;
                }
                if (key === 'ArrowDown') {
                    e.preventDefault();
                    ControlsManager.navigateDown();
                    return;
                }
                if (isEnter || key === ' ' || key === 'Space') {
                    if (e.repeat) return;
                    e.preventDefault();
                    ControlsManager.activateFocused();
                    return;
                }
                return;
            }

            if (isEnter) {
                e.preventDefault();
                ControlsManager.setBlockShow(false);
                ControlsManager.setFocusIdx(0);
                ControlsManager.show();
                return;
            }
            if (key === ' ' || key === 'Space' || e.keyCode === 179) {
                e.preventDefault();
                PlayerController.sendCommand('TOGGLE_PLAY');
                UIManager.showToast(PlayerController.isPlaying() ? '⏸️ Tạm dừng' : '▶️ Đang phát', 1000);
                return;
            }
            if (key === 'ArrowDown') {
                e.preventDefault();
                PanelManager.open('yt-ultimate-left-panel', '_all');
                return;
            }
            if (key === 'ArrowUp') {
                e.preventDefault();
                PanelManager.open('yt-ultimate-left-panel', '_fav');
                return;
            }
            if (key === 'ArrowLeft' || key === 'ArrowRight') {
                e.preventDefault();
                if (this._checkDoublePress(key)) {
                    // Double press nhanh → đổi kênh luôn, không hiện control
                    ControlsManager.setBlockShow(true);
                    if (key === 'ArrowLeft') PlayerController.playPrev();
                    else PlayerController.playNext();
                } else {
                    // Single press → hiện control
                    ControlsManager.setBlockShow(false);
                    ControlsManager.setFocusIdx(0);
                    ControlsManager.show();
                    // Set block để tránh double press kế tiếp trigger đổi kênh
                    this._lastArrowPress = {
                        key: null,
                        time: 0
                    };
                }
                return;
            }
        },

        _handleKeyUp: function(e) {
            const key = e.key;
            if (key === 'ArrowUp' || key === 'ArrowDown' ||
                key === 'ArrowLeft' || key === 'ArrowRight') {
                clearTimeout(this._longPressTimer);
                this._longPressTimer = null;
                this._longPressKey = null;
                this._longPressFired = false;
            }
            if (key === 'Enter' || key === ' ' || key === 'Space') {
                if (this._isPanelOpen()) {
                    clearTimeout(this._enterTimer);
                    this._enterTimer = null;
                    if (!this._enterFired) this._handlePanelShortPress();
                    this._enterFired = false;
                }
            }
        },

        _startEnterLongPress: function() {
            clearTimeout(this._enterTimer);
            this._enterFired = false;
            const self = this;
            this._enterTimer = setTimeout(function() {
                self._enterTimer = null;
                self._enterFired = true;
                const area = UIManager.getFocusArea();
                const N = UIManager._currentFolders.length;
                const fIdx = UIManager.getFolderFocusIdx();
                console.log('[LongPress] fire. area=', area, 'fIdx=', fIdx, 'N=', N);

                // Long-press trên folder thật (không phải _all, _fav) → chọn để di chuyển
                if (area === 'folders' && fIdx >= 2 && fIdx < N) {
                    self._longPressFired = true;
                    UIManager._selectFolderForMove(fIdx);
                    return;
                }

                // Long-press trên channel → toggle favorite
                if (area === 'channels') {
                    const curItem = UIManager._channelItems[UIManager.getChannelFocusIdx()];
                    console.log('[LongPress] channel item:', curItem ? curItem.dataset.channelId : null,
                        'virtual:', curItem ? curItem.dataset.virtual : null);
                    if (!curItem || curItem.dataset.virtual === '1') return;
                    const chId = curItem.dataset.channelId;
                    if (chId) {
                        self._longPressFired = true;
                        PlayerController.toggleFavorite(chId);
                    }
                }
            }, 800);
        },

        _handlePanelShortPress: function() {
            const area = UIManager.getFocusArea();
            const N = UIManager._currentFolders.length;
            const fIdx = UIManager.getFolderFocusIdx();

            // Focus đang ở 3 nút ảo → trigger action
            // Focus đang ở 3 nút ảo → trigger action
            if (area === 'folders' && fIdx >= N) {
                const item = UIManager._folderItems[fIdx];
                if (item && item.dataset.action) {
                    if (item.classList.contains('disabled')) return;
                    UIManager._handleVirtualFolderAction(item.dataset.action);
                }
                return;
            }

            // Focus vào folder thật → chuyển sang channels
            if (area !== 'channels') {
                if (fIdx < N) {
                    const curFolder = UIManager._currentFolders[fIdx];
                    if (curFolder && curFolder.channels.length) {
                        UIManager.setFocusArea('channels');
                        UIManager.setChannelFocusIdx(0);
                    }
                }
                return;
            }

            // Focus trong channels
            const curItem = UIManager._channelItems[UIManager.getChannelFocusIdx()];
            if (!curItem) return;

            if (curItem.dataset.virtual === '1') {
                if (curItem.dataset.disabled === '1') {
                    const action = curItem.dataset.action;
                    if (action === 'move-up' || action === 'move-down') {
                        UIManager.showToast('Chọn kênh để đổi vị trí trước', 1500);
                    }
                    return;
                }
                UIManager._handleVirtualAction(curItem.dataset.action);
                return;
            }

            const chId = curItem.dataset.channelId;
            if (chId) PlayerController._loadChannel(chId);
        },

        _startLongPress: function(key) {
            if (this._longPressKey === key && this._longPressTimer) return;
            clearTimeout(this._longPressTimer);
            this._longPressKey = key;
            this._longPressFired = false;
            const self = this;
            this._longPressTimer = setTimeout(function() {
                if (self._longPressKey !== key) return;
                self._longPressFired = true;
                self._longPressTimer = null;

                // Trong _all + focus channels + ↑↓ → chuyển folder
                const curFolder = UIManager.getActiveFolder();
                const isAllView = curFolder && curFolder.id === '_all';
                const area = UIManager.getFocusArea();

                if (isAllView && area === 'channels' && (key === 'ArrowUp' || key === 'ArrowDown')) {
                    const totalFolders = UIManager.getTotalFolderCount();
                    const fIdx = UIManager.getFolderFocusIdx();
                    const dir = (key === 'ArrowUp') ? -1 : 1;
                    UIManager.setFolderFocusIdx((fIdx + dir + totalFolders) % totalFolders);
                    UIManager.setFocusArea('folders');
                    UIManager.showToast(dir < 0 ? '📁 Thư mục trước' : '📁 Thư mục sau', 800);
                    return;
                }

                // Còn lại → đóng panel
                PanelManager.closeAll();
                UIManager.showToast('📁 Đã đóng danh sách', 800);
            }, this._longPressDelay);
        },

        _handlePanelNav: function(key) {
            if (this._longPressFired) return;
            const folders = UIManager.getCurrentFolders();
            if (!folders.length) return;
            const area = UIManager.getFocusArea();
            const fIdx = UIManager.getFolderFocusIdx();
            const cIdx = UIManager.getChannelFocusIdx();
            const totalFolders = UIManager.getTotalFolderCount();
            const chCount = UIManager._channelItems.length;
            const N = folders.length;
            const curFolder = UIManager.getActiveFolder();
            const isAllView = curFolder && curFolder.id === '_all';

            // ===== GRID MODE — Tất Cả Kênh (chỉ grid nav, không 3-lần-nhấn) =====
            // ===== GRID MODE — Tất Cả Kênh (row-major) =====
            if (isAllView && area === 'channels' && chCount > 0) {
                const layout = UIManager._computeAllViewLayout();
                const total = layout.total;
                const cols = layout.cols;
                const rows = layout.rows;
                if (!total || !cols) return;

                const col = cIdx % cols;
                const row = Math.floor(cIdx / cols);
                let newIdx = cIdx;

                if (key === 'ArrowRight') {
                    if (col < cols - 1) {
                        const next = cIdx + 1;
                        newIdx = (next < total) ? next : (row * cols);
                    } else {
                        newIdx = row * cols; // cột cuối → wrap cột đầu cùng hàng
                    }
                } else if (key === 'ArrowLeft') {
                    if (col > 0) {
                        newIdx = cIdx - 1;
                    } else {
                        // cột đầu → wrap cột cuối cùng hàng
                        const lastCol = Math.min((row + 1) * cols - 1, total - 1);
                        newIdx = lastCol;
                    }
                } else if (key === 'ArrowDown') {
                    const next = cIdx + cols;
                    if (next < total) newIdx = next;
                    else newIdx = col; // hàng cuối → wrap đầu cột
                } else if (key === 'ArrowUp') {
                    const prev = cIdx - cols;
                    if (prev >= 0) {
                        newIdx = prev;
                    } else {
                        // hàng đầu → wrap hàng cuối cột tương ứng
                        const lastRowStart = (rows - 1) * cols;
                        const candidate = lastRowStart + col;
                        newIdx = (candidate < total) ? candidate : (total - 1);
                    }
                }

                newIdx = Math.max(0, Math.min(total - 1, newIdx));
                UIManager.setChannelFocusIdx(newIdx);
                return;
            }

            // ===== FOLDER MODE =====
            if (key === 'ArrowUp') {
                const newIdx = (fIdx - 1 + totalFolders) % totalFolders;
                UIManager.setFolderFocusIdx(newIdx);
                UIManager.setFocusArea('folders');
                return;
            }
            if (key === 'ArrowDown') {
                const newIdx = (fIdx + 1) % totalFolders;
                UIManager.setFolderFocusIdx(newIdx);
                UIManager.setFocusArea('folders');
                return;
            }

            if (area === 'folders' && fIdx >= N) {
                // Focus 3 nút ảo folder → ←/→ cuộn instruction panel
                if (key === 'ArrowLeft' || key === 'ArrowRight') {
                    const panel = UIManager._channelPanel;
                    if (panel) {
                        const step = 200;
                        const delta = key === 'ArrowRight' ? step : -step;
                        panel.scrollBy({
                            top: delta,
                            behavior: 'smooth'
                        });
                    }
                }
                return;
            }

            if (key === 'ArrowRight') {
                if (chCount) {
                    UIManager.setFocusArea('channels');
                    const newIdx = area === 'channels' ? (cIdx + 1) % chCount : 0;
                    UIManager.setChannelFocusIdx(newIdx);
                }
                return;
            }
            if (key === 'ArrowLeft') {
                if (chCount) {
                    UIManager.setFocusArea('channels');
                    const newIdx = area === 'channels' ?
                        (cIdx - 1 + chCount) % chCount : chCount - 1;
                    UIManager.setChannelFocusIdx(newIdx);
                }
                return;
            }
        },

        _checkDoublePress: function(key) {
            const now = Date.now();
            const window_ms = 800;
            if (this._lastArrowPress.key === key &&
                (now - this._lastArrowPress.time) < window_ms) {
                this._lastArrowPress.key = null;
                this._lastArrowPress.time = 0;
                return true;
            }
            this._lastArrowPress.key = key;
            this._lastArrowPress.time = now;
            return false;
        }
    };

    window.KeyHandler = KeyHandler;
    KeyHandler.init();
})();
/* ============================================================ AD OVERLAY */
(function(){
  if (window._adOverlay_loaded) return;
  window._adOverlay_loaded = true;

  const AdOverlay = {
    _container: null,
    _current: null,
    _map: null,
    _fetching: null,
    _disabled: false,

    // ===== CHECK DEBUG MODE =====
    _isDebugMode: function(){
      try {
        return new URLSearchParams(location.search).get('debug') === '1';
      } catch(e){ return false; }
    },

    // ===== LOAD JSON =====
    loadMap: async function(){
      if (this._map) return this._map;
      if (this._fetching) return this._fetching;

      this._fetching = (async () => {
        try {
          const url = window.AD_OVERLAY_URL || 'https://vaxplugin.alokillgtv.workers.dev/tv/banner.txt';
          const res = await fetch(url + '?v=' + Date.now(), { cache: 'no-store' });
          if (!res.ok) throw new Error('HTTP ' + res.status);
          const data = await res.json();
          delete data._meta;

          // Normalize key về NFC
          const nfc = {};
          Object.keys(data).forEach(k => {
            nfc[String(k).normalize('NFC')] = data[k];
          });
          this._map = nfc;
          console.log('%c[AdOverlay] 📦 Load map OK: ' +
            Object.keys(nfc).length + ' nguồn', 'color:#a855f7;font-weight:bold');
          return nfc;
        } catch(e) {
          console.warn('[AdOverlay] Load map fail:', e.message);
          this._map = {};
          return {};
        } finally {
          this._fetching = null;
        }
      })();
      return this._fetching;
    },

    _ensureContainer: function(){
      if (this._container && document.body.contains(this._container)) return;
      const c = document.createElement('div');
      c.id = 'vax-ad-overlay';
      c.style.cssText = `
        position: fixed; inset: 0;
        z-index: 99999;
        pointer-events: none;
        overflow: hidden;
        display: none;
      `;
      document.body.appendChild(c);
      this._container = c;
    },

    _getFolderName: function(ch){
      if (!ch) return null;
      if (ch.group) return String(ch.group).normalize('NFC');
      return null;
    },

    _resolveSize: function(pos){
      const mode = pos.mode || 'custom';
      let w = pos.width || 'auto';
      let h = pos.height || 'auto';

      if (mode === 'square'){
        if (w !== 'auto' && h === 'auto') h = w;
        if (h !== 'auto' && w === 'auto') w = h;
        if (w === 'auto' && h === 'auto'){ w = h = '100px'; }
      }
      if (mode === 'rect'){
        if (w !== 'auto' && h === 'auto'){
          const px = parseInt(w, 10);
          h = !isNaN(px) ? (Math.round(px / 2) + 'px') : '50%';
        } else if (h !== 'auto' && w === 'auto'){
          const px = parseInt(h, 10);
          w = !isNaN(px) ? ((px * 2) + 'px') : '100%';
        } else if (w === 'auto' && h === 'auto'){
          w = '240px'; h = '120px';
        }
      }
      if (mode === 'banner'){
        if (w === 'auto') w = '100%';
        if (h === 'auto') h = '60px';
      }
      return { w, h };
    },

        _buildEl: function(pos){
      const el = document.createElement('div');
      const sz = this._resolveSize(pos);
      const layout = pos.layout || (pos.icon && pos.text ? 'icon-left'
                                   : pos.icon ? 'icon-only'
                                   : pos.text ? 'text-only'
                                   : 'icon-only');

      // ===== BASE STYLES =====
      const styles = {
        position: 'absolute',
        width: sz.w,
        height: sz.h,
        background: pos.bg || '#000',
        borderRadius: (pos.radius != null ? pos.radius : 4) + 'px',
        opacity: (pos.opacity != null ? pos.opacity : 1),
        transform: 'none',
        zIndex: pos.z || 99999,
        pointerEvents: 'none',
        overflow: 'hidden',
        boxSizing: 'border-box',
        boxShadow: '0 4px 16px rgba(0,0,0,0.5)'
      };

      // Neo vị trí
      if (pos.top != null) styles.top = pos.top;
      if (pos.bottom != null) styles.bottom = pos.bottom;
      if (pos.left != null) styles.left = pos.left;
      if (pos.right != null) styles.right = pos.right;
      if (styles.top == null && styles.bottom == null) styles.top = '0';
      if (styles.left == null && styles.right == null) styles.left = '0';

      // Transform
      const trans = [];
      if (pos.rotate) trans.push('rotate(' + pos.rotate + 'deg)');
      if (styles.left === '50%' && styles.right == null) trans.push('translateX(-50%)');
      if (styles.top === '50%' && styles.bottom == null) trans.push('translateY(-50%)');
      if (trans.length) styles.transform = trans.join(' ');

      // ===== LAYOUT: FLEX =====
      const gap = pos.gap || '8px';
      const padding = pos.padding || '1px';

      switch (layout){
        case 'icon-only':
        case 'text-only':
          styles.display = 'flex';
          styles.alignItems = 'center';
          styles.justifyContent = 'center';
          styles.padding = padding;
          break;
        case 'icon-left':
          styles.display = 'flex';
          styles.alignItems = 'center';
          styles.justifyContent = 'center';
          styles.flexDirection = 'row';
          styles.gap = gap;
          styles.padding = padding;
          break;
        case 'icon-right':
          styles.display = 'flex';
          styles.alignItems = 'center';
          styles.justifyContent = 'center';
          styles.flexDirection = 'row-reverse';
          styles.gap = gap;
          styles.padding = padding;
          break;
        case 'icon-top':
          styles.display = 'flex';
          styles.alignItems = 'center';
          styles.justifyContent = 'center';
          styles.flexDirection = 'column';
          styles.gap = gap;
          styles.padding = padding;
          break;
        case 'icon-center-bg':
          styles.display = 'flex';
          styles.alignItems = 'center';
          styles.justifyContent = 'center';
          styles.position = 'absolute';
          styles.padding = padding;
          break;
        default:
          styles.display = 'flex';
          styles.alignItems = 'center';
          styles.justifyContent = 'center';
          styles.padding = padding;
      }

      Object.assign(el.style, styles);

            // ===== ICON =====
      let img = null;
      if (pos.icon){
        img = document.createElement('img');
        img.src = pos.icon;
        img.alt = 'overlay-icon';

        const filterCss = pos.iconFilter != null
          ? pos.iconFilter
          : (pos.icon && /\.svg(\?|$)/i.test(pos.icon) ? 'brightness(0) invert(1)' : 'none');

        const iconSize = pos.iconSize || '70%';

        // ⭐ Tính max-size theo 2 chiều, KHÔNG stretch
        // Nếu iconSize là % → dùng % cho CẢ 2 chiều nhưng với max
        // Nếu px → max-width + max-height cùng giá trị
        let maxW, maxH;
        if (iconSize.includes('%')){
          maxW = iconSize;
          maxH = iconSize;
        } else {
          maxW = iconSize;
          maxH = iconSize;
        }

        img.style.cssText = `
          display: block;
          object-fit: contain;
          filter: ${filterCss};
          opacity: ${pos.iconOpacity != null ? pos.iconOpacity : 1};
          pointer-events: none;
          flex-shrink: 0;
          max-width: ${maxW};
          max-height: ${maxH};
          width: auto;
          height: auto;
          aspect-ratio: 1 / 1;
        `;

        if (layout === 'icon-center-bg'){
          img.style.cssText = `
            position: absolute;
            inset: 0;
            width: 100%;
            height: 100%;
            object-fit: contain;
            filter: ${filterCss};
            opacity: ${pos.iconOpacity != null ? pos.iconOpacity : 0.3};
            pointer-events: none;
          `;
        }

        img.addEventListener('error', () => { img.style.display = 'none'; });
      }

      // ===== TEXT =====
      let txt = null;
      if (pos.text){
        txt = document.createElement('div');
        txt.className = 'txt';

        // ⭐ Support \n → <br> (an toàn, không dùng innerHTML)
        const lines = String(pos.text).split(/\r?\n/);
        lines.forEach((line, i) => {
          if (i > 0) txt.appendChild(document.createElement('br'));
          txt.appendChild(document.createTextNode(line));
        });

        const maxLines = pos.maxLines != null
          ? parseInt(pos.maxLines, 10)
          : (layout === 'icon-top' ? 3 : layout === 'banner' ? 1 : 2);

        txt.style.cssText = `
          color: ${pos.textColor || '#fff'};
          font-size: ${pos.fontSize || '14px'};
          font-weight: ${pos.fontWeight || '600'};
          font-family: ${pos.fontFamily || 'system-ui, -apple-system, sans-serif'};
          line-height: 1.25;
          text-align: ${pos.textAlign || 'center'};
          text-shadow: 0 1px 4px rgba(0,0,0,0.85);
          pointer-events: none;
          word-break: break-word;
          overflow-wrap: anywhere;
          overflow: hidden;
          text-overflow: ellipsis;
          display: -webkit-box;
          -webkit-line-clamp: ${maxLines};
          -webkit-box-orient: vertical;
          max-width: 100%;
          min-width: 0;
        `;

        if (layout === 'icon-center-bg'){
          txt.style.position = 'relative';
          txt.style.zIndex = '2';
          txt.style.maxWidth = '90%';
        }
      }

      // ===== APPEND THEO LAYOUT =====
      if (layout === 'icon-center-bg'){
        if (img) el.appendChild(img);
        if (txt) el.appendChild(txt);
      } else {
        if (img) el.appendChild(img);
        if (txt) el.appendChild(txt);
      }
      // ⭐ Đảm bảo flex item text có min-width 0 để wrap đúng
      if (txt) txt.style.minWidth = '0';
      if (el.style.display === 'flex'){
        el.style.minWidth = '0';
      }
      return el;
    },

    show: async function(folderName){
      if (this._disabled) return;
      if (!folderName) return;

      const key = String(folderName).normalize('NFC');
      const map = await this.loadMap();
      const positions = map[key];

      if (!positions || !positions.length){
        this.hide();
        return;
      }

      this._ensureContainer();
      if (this._current === key && this._container.childElementCount > 0) return;

      while (this._container.firstChild) this._container.removeChild(this._container.firstChild);

      const frag = document.createDocumentFragment();
      positions.forEach((pos, idx) => {
        try {
          const el = this._buildEl(pos);
          el.dataset.adIdx = idx;
          frag.appendChild(el);
        } catch(e){
          console.warn('[AdOverlay] Vẽ lỗi pos', idx, e);
        }
      });
      this._container.appendChild(frag);
      this._container.style.display = 'block';
      this._container.style.opacity = '0';
      requestAnimationFrame(() => {
        this._container.style.transition = 'opacity 0.25s';
        this._container.style.opacity = '1';
      });

      this._current = key;
      console.log('%c[AdOverlay] 🎭 Che ' + positions.length + ' banner: ' + key,
        'color:#a855f7;font-weight:bold');
    },

    hide: function(){
      if (!this._container) return;
      if (this._current === null && this._container.style.display === 'none') return;
      this._container.style.opacity = '0';
      const c = this._container;
      setTimeout(() => {
        if (c.style.opacity === '0'){
          while (c.firstChild) c.removeChild(c.firstChild);
          c.style.display = 'none';
        }
      }, 250);
      this._current = null;
    },

    syncForChannel: function(ch){
      if (this._disabled){ this.hide(); return; }
      if (!ch){ this.hide(); return; }
      const folderName = this._getFolderName(ch);
      if (!folderName){ this.hide(); return; }
      this.show(folderName).catch(e => {
        console.warn('[AdOverlay] sync fail:', e);
      });
    },

    // Disable khi debug mode
    disable: function(){
      this._disabled = true;
      this.hide();
      console.log('[AdOverlay] 🚫 Disabled (debug mode)');
    }
  };

  window.AdOverlay = AdOverlay;

  // ⭐ Auto-disable nếu có ?debug=1
  if (AdOverlay._isDebugMode()){
    AdOverlay.disable();
  }
})();
/* ============================================================ TOUCH/CLICK */
(function() {
    if (window._touchHandler_loaded) return;
    window._touchHandler_loaded = true;
    const UIManager = window.UIManager;
    const PlayerController = window.PlayerController;
    const PanelManager = window.PanelManager;
    const ControlsManager = window.ControlsManager;

    let lastOverlayTap = 0;
    const _lastTapByZone = {
        'touch-left': 0,
        'touch-center': 0,
        'touch-right': 0
    };

    // Đếm tap cho từng zone (dùng cho 3-tap prev/next)
    const _zoneTapCount = {
        'touch-left': 0,
        'touch-center': 0,
        'touch-right': 0
    };
    const _zoneTapTimer = {
        'touch-left': null,
        'touch-center': null,
        'touch-right': null
    };
    const TAP_WINDOW = 800;

    function handleOverlayZone(zoneId) {
        if (window.HelpModal && window.HelpModal.isVisible()) return;

        // Panel mở → đóng
        if (PanelManager.isOpen()) {
            PanelManager.closeAll();
            return;
        }

        // ===== ZONE GIỮA: toggle play ngay (không delay) =====
        if (zoneId === 'touch-center') {
            const wasPlaying = PlayerController.isPlaying();
            PlayerController.sendCommand('TOGGLE_PLAY');
            UIManager.showToast(wasPlaying ? '⏸️ Tạm dừng' : '▶️ Đang phát', 1000);
            if (!ControlsManager.isVisible()) {
                ControlsManager.setBlockShow(false);
                ControlsManager.show();
            } else {
                ControlsManager.resetTimer();
            }
            return;
        }

        // ===== ZONE TRÁI/PHẢI: đếm tap =====
        _zoneTapCount[zoneId]++;
        clearTimeout(_zoneTapTimer[zoneId]);

        // Đạt 3 tap → prev/next
        if (_zoneTapCount[zoneId] >= 3) {
            _zoneTapCount[zoneId] = 0;
            ControlsManager.setBlockShow(true);
            if (zoneId === 'touch-left') {
                PlayerController.playPrev();
                UIManager.showToast('⏪ Kênh trước', 1000);
            } else {
                PlayerController.playNext();
                UIManager.showToast('⏩ Kênh kế', 1000);
            }
            return;
        }

        // Tap lần 1 → chờ 800ms xem có tap thêm không
        if (_zoneTapCount[zoneId] === 1) {
            _zoneTapTimer[zoneId] = setTimeout(function() {
                const count = _zoneTapCount[zoneId];
                _zoneTapCount[zoneId] = 0;

                if (count === 1) {
                    // === 1 tap ===
                    if (zoneId === 'touch-left') {
                        // Trái: mở danh sách kênh
                        PanelManager.open('yt-ultimate-left-panel', '_all');
                    } else if (zoneId === 'touch-right') {
                        // Phải: hiện control
                        if (!ControlsManager.isVisible()) {
                            ControlsManager.setBlockShow(false);
                            ControlsManager.show();
                        } else {
                            ControlsManager.resetTimer();
                        }
                    }
                } else if (count === 2) {
                    // 2 tap → không làm gì, reset timer control
                    if (ControlsManager.isVisible()) ControlsManager.resetTimer();
                }
            }, TAP_WINDOW);
        }
    }

    document.addEventListener('click', function(e) {
        const id = e.target && e.target.id;
        if (id === 'touch-left' || id === 'touch-center' || id === 'touch-right') {
            e.stopPropagation();
            handleOverlayZone(id);
            return;
        }
        if (PanelManager.isOpen()) {
            // FIX: dùng composedPath() để tránh lỗi khi DOM bị re-render
            const path = (e.composedPath && e.composedPath()) || [e.target];
            const panel = document.getElementById('yt-ultimate-left-panel');
            const controls = document.getElementById('yt-ultimate-controls');
            let isInsidePanel = false;
            let isInsideControls = false;
            let isOverlay = false;
            for (let i = 0; i < path.length; i++) {
                const el = path[i];
                if (el === panel) isInsidePanel = true;
                else if (el === controls) isInsideControls = true;
                else if (el && el.id === 'yt-ultimate-overlay') isOverlay = true;
            }
            // Nếu click trong panel hoặc trong controls → không đóng
            if (isInsidePanel || isInsideControls) return;
            // Chỉ đóng khi click vào overlay (3 vùng touch)
            if (isOverlay) PanelManager.closeAll();
        }
    }, false);

    document.addEventListener('touchend', function(e) {
        const id = e.target && e.target.id;
        if (id === 'touch-left' || id === 'touch-center' || id === 'touch-right') {
            e.preventDefault();
            handleOverlayZone(id);
        }
    }, {
        passive: false
    });
})();

/* ============================================================ SCREEN LOCK */
(function() {
    if (window.__screen_lock_initialized) return;
    window.__screen_lock_initialized = true;
    const UIManager = window.UIManager;

    window.lockScreen = function() {
        if (document.getElementById('yt-screen-lock-overlay')) return;
        const overlay = document.createElement('div');
        overlay.id = 'yt-screen-lock-overlay';
        Object.assign(overlay.style, {
            position: 'fixed',
            top: 0,
            left: 0,
            width: '100%',
            height: '100%',
            background: '#000',
            zIndex: 10070,
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            pointerEvents: 'auto',
            cursor: 'default'
        });
        const txt = document.createElement('div');
        txt.textContent = 'Nhấn OK để mở khóa';
        Object.assign(txt.style, {
            color: '#fff',
            fontSize: '13px',
            opacity: '0.15',
            background: 'rgba(0,0,0,0.5)',
            padding: '12px 24px',
            borderRadius: '8px',
            border: '1px solid rgba(255,255,255,0.2)'
        });
        overlay.appendChild(txt);

        function unlock() {
            if (overlay.parentNode) overlay.remove();
            UIManager.showToast('🔓 Mở khóa', 1000);
            document.removeEventListener('keydown', kh);
        }

        function kh(e) {
            if (e.key === 'Enter' || e.key === ' ' || e.key === 'Space') {
                e.preventDefault();
                unlock();
            }
        }
        document.addEventListener('keydown', kh);
        overlay.addEventListener('click', unlock);
        overlay.addEventListener('touchstart', function(e) {
            e.preventDefault();
            unlock();
        }, {
            passive: false
        });
        document.body.appendChild(overlay);
        UIManager.showToast('🔒 Nhấn OK để mở', 2000);
    };
})();

/* ============================================================ LOADING */
(function() {
    if (window.__vax_loading_done) return;
    window.__vax_loading_done = true;
    let overlay = null,
        hidden = false,
        intervalId = null,
        timeoutId = null;
    let videoListener = null,
        playListener = null;

    function createOverlay() {
        if (overlay || !document.body) {
            if (!document.body) setTimeout(createOverlay, 50);
            return;
        }
        overlay = document.createElement('div');
        overlay.id = 'vax-loading-overlay';
        const bg = document.createElement('div');
        bg.className = 'vax-bg';
        overlay.appendChild(bg);
        const title = document.createElement('div');
        title.className = 'vax-title';
        title.textContent = 'VAXPLAYER TV';
        overlay.appendChild(title);
        const sub = document.createElement('div');
        sub.className = 'vax-sub';
        sub.textContent = 'Đang tải kênh';
        overlay.appendChild(sub);
        const sp = document.createElement('div');
        sp.className = 'vax-spinner';
        const svg1 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg1.setAttribute('viewBox', '0 0 50 50');
        const c1 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c1.setAttribute('cx', '25');
        c1.setAttribute('cy', '25');
        c1.setAttribute('r', '20');
        c1.setAttribute('fill', 'none');
        c1.setAttribute('stroke', '#e380f5');
        c1.setAttribute('stroke-width', '4');
        c1.setAttribute('stroke-dasharray', '90, 150');
        c1.setAttribute('stroke-linecap', 'round');
        svg1.appendChild(c1);
        sp.appendChild(svg1);
        const svg2 = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        svg2.setAttribute('viewBox', '0 0 50 50');
        const c2 = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
        c2.setAttribute('cx', '25');
        c2.setAttribute('cy', '25');
        c2.setAttribute('r', '16');
        c2.setAttribute('fill', 'none');
        c2.setAttribute('stroke', '#a855f7');
        c2.setAttribute('stroke-width', '3');
        c2.setAttribute('stroke-dasharray', '60, 120');
        c2.setAttribute('stroke-linecap', 'round');
        svg2.appendChild(c2);
        sp.appendChild(svg2);
        overlay.appendChild(sp);
        document.body.appendChild(overlay);
    }

    function hideOverlay() {
        if (hidden || !overlay) return;
        hidden = true;
        const v = document.querySelector('video');
        if (v && videoListener) {
            try {
                v.removeEventListener('timeupdate', videoListener);
                v.removeEventListener('play', playListener);
            } catch (e) {}
        }
        if (intervalId) {
            clearInterval(intervalId);
            intervalId = null;
        }
        if (timeoutId) {
            clearTimeout(timeoutId);
            timeoutId = null;
        }
        overlay.style.opacity = '0';
        setTimeout(() => {
            if (overlay && overlay.parentNode) overlay.parentNode.removeChild(overlay);
        }, 600);
    }

    window.hideLoadingOverlay = hideOverlay;

    function watchVideo(v) {
        if (v.currentTime >= 0.5) {
            hideOverlay();
            return;
        }

        videoListener = function() {
            if (v.currentTime >= 0.5) hideOverlay();
        };
        v.addEventListener('timeupdate', videoListener);

        playListener = function() {
            if (v.currentTime >= 0.5) hideOverlay();
        };
        v.addEventListener('play', playListener);

        // FIX: hide ngay khi có thể phát (metadata sẵn sàng)
        const onCanPlay = function() {
            v.removeEventListener('canplay', onCanPlay);
            v.removeEventListener('loadeddata', onCanPlay);
            setTimeout(hideOverlay, 200);
        };
        v.addEventListener('canplay', onCanPlay);
        v.addEventListener('loadeddata', onCanPlay);

        // FIX: rút timeout 15s → 8s
        timeoutId = setTimeout(hideOverlay, 8000);
    }

    function startWatching() {
        const v = document.querySelector('video');
        if (v) {
            watchVideo(v);
            return;
        }
        intervalId = setInterval(() => {
            const v = document.querySelector('video');
            if (v) {
                clearInterval(intervalId);
                intervalId = null;
                watchVideo(v);
            }
        }, 500);
        timeoutId = setTimeout(hideOverlay, 15000);
    }

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', () => {
            createOverlay();
            startWatching();
        });
    else {
        createOverlay();
        startWatching();
    }
})();

/* ============================================================ LOG CATEGORIES */
(function() {
    if (window._logCategories_loaded) return;
    window._logCategories_loaded = true;

    /**
     * In ra console tất cả group có trong file M3U
     * + Object gợi ý để copy vào CATEGORY_ORDER
     */
    window.logCategories = function(channels) {
        if (window.LOG_CATEGORIES === false) return;
        if (!Array.isArray(channels) || !channels.length) return;

        // Đếm group
        const groups = {};
        channels.forEach(c => {
            const g = c.group || 'Khác';
            groups[g] = (groups[g] || 0) + 1;
        });
        const sorted = Object.keys(groups).sort((a, b) => a.localeCompare(b));

        // Header
        console.log('%c════════════════════════════════════════════════',
            'color:#4dabf7;font-weight:bold;');
        console.log('%c📁 DANH MỤC M3U — ' + sorted.length + ' nhóm / ' +
            channels.length + ' kênh',
            'color:#4dabf7;font-weight:bold;font-size:14px;');
        console.log('%c════════════════════════════════════════════════',
            'color:#4dabf7;font-weight:bold;');

        // Bảng
        if (console.table) {
            const tableData = sorted.map((g, i) => ({
                '#': i + 1,
                'Group': g,
                'Số kênh': groups[g]
            }));
            console.table(tableData);
        } else {
            sorted.forEach((g, i) => {
                console.log('  ' + (i + 1) + '. ' + g + ' — ' + groups[g] + ' kênh');
            });
        }

        // Object gợi ý để copy
        console.log('%c📋 COPY OBJECT DƯỚI ĐÂY VÀO window.CATEGORY_ORDER:',
            'color:#ffd43b;font-weight:bold;font-size:13px;');
        const suggest = {
            '_fav': 2,
            '_all': 1
        };
        sorted.forEach((g, i) => {
            suggest[g] = (i + 3) * 10;
        });
        console.log(JSON.stringify(suggest, null, 2));
        // Hint cho cú pháp mới
        console.log('%c💡 MẸO CÚ PHÁP MỞ RỘNG:',
            'color:#4dabf7;font-weight:bold;font-size:13px;');
        console.log('   "TênGroup": 0            → Ẩn group đó');
        console.log('   "HTV": [3, 7]            → Gộp group có priority 7 vào HTV');
        console.log('   "HTV": [3, \'HTVC\']      → Gộp HTVC vào HTV (theo tên)');
        console.log('   "HTV": [3, 7, 15]        → Gộp nhiều group cùng lúc');
        // Raw list (để copy tên chính xác)
        console.log('%c🔤 Danh sách tên group chính xác (để copy):',
            'color:#888;font-weight:bold;');
        sorted.forEach(g => console.log('   "%s"  (%d kênh)', g, groups[g]));

        console.log('%c════════════════════════════════════════════════',
            'color:#4dabf7;font-weight:bold;');
    };
})();

/* ============================================================ INIT */
(function() {
    if (window._init_loaded) return;
    window._init_loaded = true;

    const CACHE_KEY = 'vax_m3u_cache_v3' + (window.DATA_SCOPE || '');

    async function fetchPlaylist() {
        // === URL PARAM ===
        let urlParam = null;
        try {
            const params = new URLSearchParams(window.location.search);
            urlParam = params.get('url');
        } catch (e) {}

        if (urlParam) {
            console.log('[Init] URL param detected:', urlParam);
            try {
                const res = await fetch(urlParam);
                if (!res.ok) throw new Error('HTTP ' + res.status);
                const text = await res.text();
                const channels = M3UParser.parse(text);
                if (!channels.length) throw new Error('Playlist rỗng');
                console.log('[Init] Loaded from URL param:', channels.length, 'kênh');
                UIManager.showToast('✅ Nạp từ URL param: ' + channels.length + ' kênh', 2500);
                return channels;
            } catch (err) {
                console.error('[Init] URL param fetch failed:', err);
                UIManager.showToast('❌ URL param lỗi: ' + err.message, 3000);
                // Fall through to cache/default
            }
        }

        // === ĐỌC CACHE ===
        let cachedObj = null;
        try {
            const raw = localStorage.getItem(CACHE_KEY);
            if (raw) cachedObj = JSON.parse(raw);
        } catch (e) {}

        const now = Date.now();
        const TTL = window.M3U_CACHE_TTL; // 24h

        // === CHECK CACHE CÒN HẠN? ===
        if (cachedObj && Array.isArray(cachedObj.channels) && cachedObj.channels.length) {
            const extUntil = cachedObj.extendedUntil || 0;
            const ts = cachedObj.timestamp || 0;
            const stillValid = (extUntil > now) || (ts + TTL > now);

            if (stillValid) {
                const ageMin = Math.round((now - ts) / 60000);
                const extDays = extUntil > now ? Math.ceil((extUntil - now) / 86400000) : 0;
                const fails = cachedObj.consecutiveFailures || 0;
                console.log('[Init] Cache OK | fetch cách đây', ageMin, 'phút |',
                    fails > 0 ? '⚠️ ' + fails + ' lần fetch fail liên tiếp |' : '',
                    extDays > 0 ? '⏳ gia hạn còn ' + extDays + ' ngày' : '✅ còn hạn');
                return cachedObj.channels;
            }
        }

        // === FETCH MỚI ===
        console.log('[Init] Hết hạn cache, đang fetch playlist mới...');
        try {
            const res = await fetch(window.PLAYLIST_URL);
            if (!res.ok) throw new Error('HTTP ' + res.status);
            const text = await res.text();
            const channels = M3UParser.parse(text);
            if (!channels.length) throw new Error('Playlist rỗng');

            // Lưu cache mới
            try {
                const trimmed = channels.map(c => ({
                    id: c.id,
                    name: c.name,
                    url: c.url,
                    logo: c.logo,
                    group: c.group,
                    type: c.type,
                    ua: c.ua || null,
                    referrer: c.referrer || null,
                    drm: c.drm || null
                }));
                localStorage.setItem(CACHE_KEY, JSON.stringify({
                    timestamp: now,
                    channels: trimmed,
                    extendedUntil: null,
                    consecutiveFailures: 0,
                    lastError: null
                }));
                console.log('[Init] ✅ Fetch OK — cached', channels.length, 'kênh, hết hạn sau 24h');
            } catch (e) {}
            return channels;
        } catch (err) {
            console.error('[Init] ❌ Fetch failed:', err);

            // === FALLBACK: DÙNG CACHE CŨ + GIA HẠN 1 NGÀY ===
            if (cachedObj && Array.isArray(cachedObj.channels) && cachedObj.channels.length) {
                const fails = (cachedObj.consecutiveFailures || 0) + 1;
                const newExt = now + TTL;

                try {
                    cachedObj.extendedUntil = newExt;
                    cachedObj.consecutiveFailures = fails;
                    cachedObj.lastError = String(err.message || err);
                    cachedObj.lastFailTime = now;
                    localStorage.setItem(CACHE_KEY, JSON.stringify(cachedObj));
                } catch (e) {}

                const ts = cachedObj.timestamp || 0;
                const ageDays = Math.floor((now - ts) / 86400000);

                console.warn('[Init] 🔄 Dùng cache cũ |',
                    cachedObj.channels.length, 'kênh |',
                    'đã', ageDays, 'ngày |',
                    'fetch fail', fails, 'lần liên tiếp |',
                    'gia hạn đến', new Date(newExt).toLocaleString('vi-VN'));

                // Toast theo mức độ fail
                if (fails >= 7) {
                    UIManager.showToast(
                        '🚨 M3U server có vấn đề! Fetch lỗi ' + fails + ' lần. ' +
                        'Cache đã ' + ageDays + ' ngày, cần kiểm tra server.',
                        6000);
                } else if (fails >= 3) {
                    UIManager.showToast(
                        '⚠️ Không fetch được M3U (' + fails + ' lần). ' +
                        'Dùng cache cũ ' + ageDays + ' ngày.',
                        4000);
                } else {
                    UIManager.showToast(
                        '⚠️ Fetch lỗi, dùng cache cũ (lần ' + fails + ')',
                        3000);
                }

                return cachedObj.channels;
            }

            // === KHÔNG CÓ CACHE ===
            UIManager.showToast('❌ Không tải được playlist và không có cache dự phòng', 5000);
            return [];
        }
    }

    async function initApp() {
        console.log('[App] v' + window.APP_VERSION);
        UIManager.build();
        NumberInput.init();
        if (window.SideLists) window.SideLists.init();

        if (window.VersionChip) window.VersionChip.init();

        // ===== AUTO FULLSCREEN + LOCKDOWN =====
        // ===== AUTO FULLSCREEN + LOCKDOWN =====
        /*
        (function setupFullscreen(){
          window.__allowFullscreenExit = false;

          const isFs = function(){
            try {
              return document.fullscreenElement || document.webkitFullscreenElement ||
                     document.mozFullScreenElement || document.msFullscreenElement;
            } catch(e){ return false; }
          };

          const tryEnter = function(){
            try{
              if (window.__allowFullscreenExit) return;
              if (isFs()) return;
              const el = document.documentElement;
              const req = el.requestFullscreen || el.webkitRequestFullscreen ||
                          el.mozRequestFullScreen || el.msRequestFullscreen;
              if (req){
                const p = req.call(el);
                if (p && p.catch) p.catch(()=>{});
              }
            }catch(e){ console.warn('[Fullscreen]', e); }
          };

          // Lần đầu cần user gesture
          const once = function(){
            try{ tryEnter(); }catch(e){}
            try{
              document.removeEventListener('click', once, true);
              document.removeEventListener('keydown', once, true);
              document.removeEventListener('touchstart', once, true);
            }catch(e){}
          };
          try{
            document.addEventListener('click', once, true);
            document.addEventListener('keydown', once, true);
            document.addEventListener('touchstart', once, true);
          }catch(e){}

          // Polling: đảm bảo fullscreen luôn bật
          setInterval(function(){
            if (window.__allowFullscreenExit) return;
            if (!isFs()) tryEnter();
          }, 800);

          window.forceFullscreen = tryEnter;
          window.pauseFullscreenLockdown = function(seconds){
            window.__allowFullscreenExit = true;
            clearTimeout(window.__fullscreenPauseTimer);
            window.__fullscreenPauseTimer = setTimeout(function(){
              window.__allowFullscreenExit = false;
              tryEntern();  // không tồn tại — placeholder để bạn thấy pattern
            }, (seconds || 10) * 1000);
          };
          // Fix typo phía trên
          window.pauseFullscreenLockdown = function(seconds){
            window.__allowFullscreenExit = true;
            clearTimeout(window.__fullscreenPauseTimer);
            window.__fullscreenPauseTimer = setTimeout(function(){
              window.__allowFullscreenExit = false;
              tryEnter();
            }, (seconds || 10) * 1000);
            console.log('[Fullscreen] Cho phép thoát trong ' + (seconds || 10) + 's');
          };
        })();
        */

        const channels = await fetchPlaylist();
        if (!channels.length) {
            UIManager.showToast('⚠️ Không có kênh.', 3000);
            return;
        }

        if (window.logCategories) window.logCategories(channels);

        ChannelStore.init(channels);

        // ===== HEALTH CHECK — D1 shared cache =====
        // ===== HEALTH CHECK — D1 shared cache =====
if (window.ChannelHealth && window.HEALTH_ENABLED !== false){
  ChannelHealth.load();

  (async function runHealth(){
    const localFresh = ChannelHealth.isFresh() && ChannelHealth.hasCheckedAny();

    // 1) Local cache tươi → dùng luôn + đẩy lên D1 nền (idempotent)
    if (localFresh){
      const st = ChannelHealth.stats();
      console.log('%c[Health] ✅ Local cache còn tươi — ' +
        st.alive + '✅ ' + st.dead + '❌ (sẽ sync D1 nền)',
        'color:#22c55e');
      // Fire-and-forget — không đợi, không chặn UI
      ChannelHealth.saveRemote();
      return;
    }

    // 2) Local cache cũ → thử D1
    const remote = await ChannelHealth.loadRemote();
    if (remote && ChannelHealth.applyRemote(remote.data)){
      try {
        const folders = ChannelStore.getFolders();
        UIManager.renderChannelBrowser(folders, UIManager._activeFolderId);
        console.log('%c[Health] ⚡ Áp dụng D1 remote — ' +
          Object.keys(remote.data).length + ' kênh',
          'color:#22c55e;font-weight:bold');
      } catch(e){}
      return;
    }

    // 3) Chưa có gì → tự check, xong đẩy lên D1
    setTimeout(() => {
      ChannelHealth.checkAll(channels, null).then((res) => {
        if (!res) return;
        try {
          const folders = ChannelStore.getFolders();
          UIManager.renderChannelBrowser(folders, UIManager._activeFolderId);
          console.log('%c[Health] UI refresh — ' + res.alive + '✅ ' + res.dead + '❌',
            'color:#4dabf7');
        } catch(e){}
        ChannelHealth.saveRemote();
      });
    }, 2500);
  })();
} else if (window.HEALTH_ENABLED === false){
  console.log('%c[Health] 🚫 Bị tắt qua ?healthy=false — không check',
    'color:#888;font-weight:bold');
}

        // Đảm bảo loading ẩn ngay khi danh sách đã sẵn sàng (nếu video chưa kịp load)
        if (window.hideLoadingOverlay) {
            setTimeout(() => {
                if (window.hideLoadingOverlay) window.hideLoadingOverlay();
            }, 3000);
        }
        // Ưu tiên kênh #1 theo thứ tự đã sort (favorites lên đầu)
        // Ưu tiên kênh cuối cùng đã xem, fallback kênh #1
        let currentId = '';
        const last = ChannelStore.getLastOpened();
        if (last && last.channelId && ChannelStore.getChannel(last.channelId)) {
            currentId = last.channelId;
            console.log('%c[Init] ▶️ Resume kênh cuối đã xem: #' +
                ChannelStore.getChannelNumber(currentId), 'color:#4dabf7;font-weight:bold');
        } else {
            const ordered = ChannelStore.getOrderedChannels();
            currentId = ordered[0] ? ordered[0].id : '';
            console.log('%c[Init] ▶️ Lần đầu mở — phát kênh #1 và lưu ngay',
                'color:#4dabf7;font-weight:bold');
            // Lưu luôn kênh #1 làm kênh cuối
            if (currentId) {
                ChannelStore.setLastOpened('_all', currentId);
                console.log('%c[Init] 💾 Đã lưu kênh đầu tiên:', currentId, 'color:#ffd43b');
            }
        }

        if (currentId) {
            const ch = ChannelStore.getChannel(currentId);
            if (ch) UIManager.updateTitle('#' + ChannelStore.getChannelNumber(currentId) + '  ' + ch.name);
        }

        StreamPlayer.init();

        // Cho phép autoplay có tiếng (fallback: mute)
        try {
            const v = document.getElementById('vax-video');
            if (v) {
                v.autoplay = true;
                v.playsInline = true;
                v.setAttribute('playsinline', '');
                v.setAttribute('webkit-playsinline', '');
            }
        } catch (e) {}

        PlayerController.init(currentId);
        ControlsManager.setFocusIdx(3);

        setTimeout(() => {
            if (currentId) {
                PlayerController._loadChannel(currentId);
                ControlsManager.show();
            }
            if (window.HelpModal && window.HelpModal.shouldShowFirstTime()) {
                setTimeout(() => window.HelpModal.show(), 1200);
            }
        }, 800);

        console.log('[App] Ready. Tổng:', channels.length, 'kênh.');
    }

    if (document.readyState === 'loading')
        document.addEventListener('DOMContentLoaded', initApp);
    else initApp();
})();
