(function () {
    'use strict';

    /* ── Global error safety net ─────────────────────── */
    window.onerror = function (msg, src, line, col, err) {
        console.error('Admin error:', msg, '\n  at', src, line + ':' + col, '\n', err && err.stack ? err.stack : '');
        var t = document.getElementById('admin-toast');
        if (t) { t.textContent = 'Something went wrong — check console.'; t.classList.add('toast-visible'); setTimeout(function () { t.classList.remove('toast-visible'); }, 4000); }
    };
    window.onunhandledrejection = function (e) {
        console.error('Unhandled promise rejection:', e.reason);
    };

    /* ── Storage keys ─────────────────────────────────── */
    var SESSION_KEY     = 'ynk_admin_access';
    var STORAGE_PROS    = 'ynk_admin_prospects';
    var STORAGE_TASKS   = 'ynk_admin_tasks';
    var STORAGE_CONTENT = 'ynk_content_drafts';
    var STORAGE_CONTENT_HISTORY = 'ynk_content_drafts_history';
    var STORAGE_ACCESS_REQS    = 'ynk_access_requests';
    var STORAGE_DYNAMIC_CODES  = 'ynk_dynamic_codes';
    var STORAGE_SITE_STATS     = 'ynk_site_stats';

    /* ── Cloud API (S3 backend) ───────────────────────── */
    var API_URL = (window.ADMIN_CONFIG || {}).apiUrl || '';

    function apiGet(collection) {
        return fetch(API_URL + '/api/data/' + collection)
            .then(function (r) { return r.json(); });
    }
    function apiPost(path, data) {
        return fetch(API_URL + path, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
    }
    function apiPatch(path, data) {
        return fetch(API_URL + path, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        }).then(function (r) { return r.json(); });
    }
    function apiDelete(path) {
        return fetch(API_URL + path, {
            method: 'DELETE',
            headers: { 'Content-Type': 'application/json' }
        }).then(function (r) { return r.json(); });
    }
    function fetchFromApi() {
        if (!API_URL) return;
        Promise.all([
            apiGet('access-requests'),
            apiGet('dynamic-codes'),
            apiGet('site-stats')
        ]).then(function (results) {
            state.accessRequests = results[0] || [];
            state.dynamicCodes   = results[1] || [];
            state.siteStats      = results[2] || {};
            safeSave(STORAGE_ACCESS_REQS, state.accessRequests);
            safeSave(STORAGE_DYNAMIC_CODES, state.dynamicCodes);
            safeSave(STORAGE_SITE_STATS, state.siteStats);
            renderAll();
        }).catch(function (err) {
            console.error('API fetch error:', err);
            showToast('Cloud sync failed — showing cached data.');
        });
    }

    var gate    = document.getElementById('access-gate');
    var content = document.getElementById('admin-content');
    var input   = document.getElementById('access-input');

    /* ── State ─────────────────────────────────────────── */
    var state = {
        prospects:       [],
        tasks:           [],
        accessRequests:  [],
        dynamicCodes:    [],
        siteStats:       {},
        activeFilter:    'all',
        activeReqFilter: 'all'
    };
    var contentDrafts        = {};
    var activeContentPage    = 'home';
    var contentPreviewActive = false;

    function decodeTotpKey() {
        var arr = (window.ADMIN_CONFIG || {}).totpKey;
        if (!arr || !arr.length) return '';
        return arr.map(function (c) { return String.fromCharCode(c); }).join('');
    }

    var pendingAuth = false;

    /* ── Auth Lockout ─────────────────────────────────── */
    var AUTH_MAX_ATTEMPTS = 5;
    var AUTH_LOCKOUT_MS   = 300000; // 5 min
    var authAttempts  = parseInt(sessionStorage.getItem('ynk_auth_attempts') || '0', 10);
    var authLockUntil = parseInt(sessionStorage.getItem('ynk_auth_lockuntil') || '0', 10);

    function recordFailedAttempt(errId) {
        authAttempts++;
        sessionStorage.setItem('ynk_auth_attempts', String(authAttempts));
        if (authAttempts >= AUTH_MAX_ATTEMPTS) {
            authLockUntil = Date.now() + AUTH_LOCKOUT_MS;
            sessionStorage.setItem('ynk_auth_lockuntil', String(authLockUntil));
            showErr(errId, 'Too many failed attempts. Try again in 5 minutes.');
            return true;
        }
        return false;
    }

    function isLockedOut(errId) {
        if (authLockUntil && Date.now() < authLockUntil) {
            showErr(errId, 'Too many failed attempts. Try again in 5 minutes.');
            return true;
        }
        if (authLockUntil && Date.now() >= authLockUntil) {
            authAttempts = 0; authLockUntil = 0;
            sessionStorage.removeItem('ynk_auth_attempts');
            sessionStorage.removeItem('ynk_auth_lockuntil');
        }
        return false;
    }

    function sha256Hex(str) {
        if (!crypto || !crypto.subtle) {
            return Promise.reject(new Error('Secure context required'));
        }
        return crypto.subtle.digest('SHA-256', new TextEncoder().encode(str)).then(function (buf) {
            return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
        });
    }

    var ADMIN_REMEMBER_KEY  = 'ynk_admin_remember';
    var ADMIN_REMEMBER_DAYS = 30;

    function saveAdminRemembered() {
        try {
            localStorage.setItem(ADMIN_REMEMBER_KEY, JSON.stringify({
                expiry: Date.now() + ADMIN_REMEMBER_DAYS * 864e5
            }));
        } catch (e) {}
    }

    function loadAdminRemembered() {
        try {
            var raw = localStorage.getItem(ADMIN_REMEMBER_KEY);
            if (!raw) return false;
            var obj = JSON.parse(raw);
            if (obj && obj.expiry && Date.now() < obj.expiry) return true;
            localStorage.removeItem(ADMIN_REMEMBER_KEY);
        } catch (e) {}
        return false;
    }

    function clearAdminRemembered() {
        try { localStorage.removeItem(ADMIN_REMEMBER_KEY); } catch (e) {}
    }

    /* ── Boot ──────────────────────────────────────────── */
    (function init() {
        try {
            if (sessionStorage.getItem(SESSION_KEY) === 'ok') {
                showDashboard();
            } else if (loadAdminRemembered()) {
                sessionStorage.setItem(SESSION_KEY, 'ok');
                showDashboard();
            }
        } catch (e) {
            console.error('Admin init error:', e);
        }
    })();

    /* ══════════════════════════════════════════════════
       TWO-FACTOR AUTH
    ══════════════════════════════════════════════════ */

    /** Step 1 — validate admin code (SHA-256 hash comparison) */
    window.adminStep1 = function () {
        if (isLockedOut('gate-error-1')) return;

        var entered = (input ? input.value : '').trim();
        var cfg = window.ADMIN_CONFIG || {};

        if (!entered) {
            showErr('gate-error-1', 'Invalid admin code.');
            if (input) { input.value = ''; input.focus(); }
            return;
        }

        sha256Hex(entered).then(function (hash) {
            if (hash !== cfg.codeHash) {
                if (!recordFailedAttempt('gate-error-1')) {
                    showErr('gate-error-1', 'Invalid admin code.');
                }
                if (input) { input.value = ''; input.focus(); }
                return;
            }

            authAttempts = 0;
            sessionStorage.removeItem('ynk_auth_attempts');
            sessionStorage.removeItem('ynk_auth_lockuntil');
            clearErr('gate-error-1');
            pendingAuth = true;

            document.getElementById('gate-step1').classList.add('hidden');
            var step2 = document.getElementById('gate-step2');
            step2.classList.remove('hidden');
            var totpInput = document.getElementById('totp-input');
            if (totpInput) totpInput.focus();
        }).catch(function () {
            showErr('gate-error-1', 'Authentication error. Ensure you are using HTTPS.');
        });
    };

    /** Step 2 — validate TOTP code */
    window.adminStep2 = function () {
        if (!pendingAuth) return;
        if (isLockedOut('gate-error-2')) return;

        var token  = (document.getElementById('totp-input').value || '').trim();
        var secret = decodeTotpKey();
        var btn    = document.getElementById('totp-verify-btn');

        // If no secret is configured, skip TOTP
        if (!secret) {
            sessionStorage.setItem(SESSION_KEY, 'ok');
            var rememberEl = document.getElementById('admin-remember-check');
            if (rememberEl && rememberEl.checked) saveAdminRemembered();
            pendingAuth = false;
            showDashboard();
            return;
        }

        if (token.length !== 6 || !/^\d{6}$/.test(token)) {
            showErr('gate-error-2', 'Please enter a 6-digit code.');
            return;
        }

        if (btn) { btn.textContent = 'VERIFYING\u2026'; btn.disabled = true; }

        verifyTOTP(secret, token).then(function (valid) {
            if (btn) { btn.textContent = 'VERIFY'; btn.disabled = false; }

            if (valid) {
                authAttempts = 0;
                sessionStorage.removeItem('ynk_auth_attempts');
                sessionStorage.removeItem('ynk_auth_lockuntil');
                pendingAuth = false;
                clearErr('gate-error-2');
                sessionStorage.setItem(SESSION_KEY, 'ok');
                var rememberEl = document.getElementById('admin-remember-check');
                if (rememberEl && rememberEl.checked) saveAdminRemembered();
                showDashboard();
            } else {
                if (!recordFailedAttempt('gate-error-2')) {
                    showErr('gate-error-2', 'Invalid or expired code. Please try again.');
                }
                document.getElementById('totp-input').value = '';
                document.getElementById('totp-input').focus();
            }
        });
    };

    /** Go back to step 1 */
    window.backToStep1 = function () {
        pendingAuth = false;
        document.getElementById('gate-step2').classList.add('hidden');
        document.getElementById('gate-step1').classList.remove('hidden');
        document.getElementById('totp-input').value = '';
        clearErr('gate-error-2');
        if (input) input.focus();
    };

    /** Sign out */
    window.adminLogout = function () {
        sessionStorage.removeItem(SESSION_KEY);
        clearAdminRemembered();
        content.classList.add('hidden');
        gate.style.display = 'flex';
        document.getElementById('gate-step2').classList.add('hidden');
        document.getElementById('gate-step-reset').classList.add('hidden');
        document.getElementById('gate-step1').classList.remove('hidden');
        if (input) { input.value = ''; }
        pendingAuth = false;
    };

    /* ══════════════════════════════════════════════════
       PASSWORD RESET FLOW
    ══════════════════════════════════════════════════ */

    window.showResetStep = function () {
        document.getElementById('gate-step1').classList.add('hidden');
        document.getElementById('gate-step-reset').classList.remove('hidden');
        document.getElementById('reset-totp').classList.remove('hidden');
        document.getElementById('reset-newpass').classList.add('hidden');
        var inp = document.getElementById('reset-totp-input');
        if (inp) { inp.value = ''; inp.focus(); }
    };

    window.cancelReset = function () {
        document.getElementById('gate-step-reset').classList.add('hidden');
        document.getElementById('gate-step1').classList.remove('hidden');
        if (input) input.focus();
    };

    window.resetVerifyTOTP = function () {
        var token  = (document.getElementById('reset-totp-input').value || '').trim();
        var secret = decodeTotpKey();
        var errEl  = document.getElementById('reset-totp-error');

        if (!secret) { errEl.textContent = 'No TOTP secret configured.'; return; }
        if (token.length !== 6 || !/^\d{6}$/.test(token)) { errEl.textContent = 'Enter a 6-digit code.'; return; }

        verifyTOTP(secret, token).then(function (valid) {
            if (valid) {
                errEl.textContent = '';
                document.getElementById('reset-totp').classList.add('hidden');
                document.getElementById('reset-newpass').classList.remove('hidden');
                var newInp = document.getElementById('reset-new-password');
                if (newInp) newInp.focus();
            } else {
                errEl.textContent = 'Invalid or expired code. Try again.';
                document.getElementById('reset-totp-input').value = '';
                document.getElementById('reset-totp-input').focus();
            }
        });
    };

    window.resetSavePassword = function () {
        var newPw   = (document.getElementById('reset-new-password').value || '').trim();
        var confirm = (document.getElementById('reset-confirm-password').value || '').trim();
        var errEl   = document.getElementById('reset-save-error');
        var successEl = document.getElementById('reset-save-success');

        errEl.textContent = '';
        successEl.textContent = '';

        if (!newPw || newPw.length < 4) { errEl.textContent = 'Code must be at least 4 characters.'; return; }
        if (newPw !== confirm) { errEl.textContent = 'Codes do not match.'; return; }

        sha256Hex(newPw).then(function (hash) {
            // Update in-memory config hash (persists for session only)
            if (window.ADMIN_CONFIG) window.ADMIN_CONFIG.codeHash = hash;
            successEl.textContent = 'Admin code updated for this session. Update admin-data.js to persist.';
            setTimeout(function () { window.cancelReset(); }, 2500);
        });
    };

    /* ══════════════════════════════════════════════════
       TOTP — RFC 6238 via Web Crypto API (no libs)
    ══════════════════════════════════════════════════ */

    function base32Decode(base32) {
        var chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
        var clean = base32.toUpperCase().replace(/=+$/, '').replace(/\s/g, '');
        var bits = 0, val = 0, idx = 0;
        var out = new Uint8Array(Math.floor(clean.length * 5 / 8));
        for (var i = 0; i < clean.length; i++) {
            var c = chars.indexOf(clean[i]);
            if (c === -1) continue;
            val = (val << 5) | c;
            bits += 5;
            if (bits >= 8) {
                out[idx++] = (val >>> (bits - 8)) & 0xff;
                bits -= 8;
            }
        }
        return out.buffer;
    }

    function verifyTOTP(secret, token) {
        var keyData;
        try { keyData = base32Decode(secret); } catch (e) { return Promise.resolve(false); }

        return crypto.subtle.importKey(
            'raw', keyData,
            { name: 'HMAC', hash: { name: 'SHA-1' } },
            false, ['sign']
        ).then(function (cryptoKey) {
            var now = Math.floor(Date.now() / 1000 / 30);
            var checks = [-1, 0, 1].map(function (delta) {
                var buf  = new ArrayBuffer(8);
                var view = new DataView(buf);
                view.setUint32(4, now + delta, false);
                return crypto.subtle.sign('HMAC', cryptoKey, buf).then(function (sig) {
                    var hash   = new Uint8Array(sig);
                    var offset = hash[19] & 0xf;
                    var code   = (
                        ((hash[offset]     & 0x7f) << 24) |
                        ((hash[offset + 1] & 0xff) << 16) |
                        ((hash[offset + 2] & 0xff) <<  8) |
                         (hash[offset + 3] & 0xff)
                    ) % 1000000;
                    return code.toString().padStart(6, '0') === token;
                });
            });
            return Promise.all(checks).then(function (results) {
                return results.some(Boolean);
            });
        }).catch(function () { return false; });
    }

    /* ══════════════════════════════════════════════════
       2FA SETUP MODAL
    ══════════════════════════════════════════════════ */

    window.showSetup = function () {
        var secret  = decodeTotpKey();
        var display = document.getElementById('setup-secret-display');
        if (display) display.textContent = formatSecret(secret);
        document.getElementById('modal-2fa-setup').classList.remove('hidden');
    };

    function formatSecret(s) {
        return s.toUpperCase().replace(/(.{4})/g, '$1 ').trim();
    }

    window.copySecret = function () {
        var secret = decodeTotpKey();
        if (navigator.clipboard) {
            navigator.clipboard.writeText(secret).then(function () {
                var btn = document.getElementById('copy-secret-btn');
                if (btn) { btn.textContent = 'COPIED!'; setTimeout(function () { btn.textContent = 'COPY'; }, 2000); }
            });
        }
    };

    /* ══════════════════════════════════════════════════
       PASSWORD TOGGLE
    ══════════════════════════════════════════════════ */

    window.togglePw = function (inputId, btn) {
        var el = document.getElementById(inputId);
        if (!el) return;
        if (el.type === 'password') {
            el.type = 'text';
            if (btn) btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"/><line x1="1" y1="1" x2="23" y2="23"/></svg>';
        } else {
            el.type = 'password';
            if (btn) btn.innerHTML = '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"/><circle cx="12" cy="12" r="3"/></svg>';
        }
    };

    /* ══════════════════════════════════════════════════
       DASHBOARD
    ══════════════════════════════════════════════════ */

    function showDashboard() {
        gate.style.display = 'none';
        content.classList.remove('hidden');
        // Init EmailJS for approval emails
        var ejsCfg = (window.ADMIN_CONFIG || {}).emailjs || {};
        if (ejsCfg.publicKey && window.emailjs) {
            window.emailjs.init(ejsCfg.publicKey);
        }
        loadState();
        renderAll();
    }

    /* ── Helpers ────────────────────────────────────── */
    function showErr(id, msg)  { var el = document.getElementById(id); if (el) el.textContent = msg; }
    function clearErr(id)      { var el = document.getElementById(id); if (el) el.textContent = ''; }

    function showToast(msg) {
        var t = document.getElementById('admin-toast');
        if (!t) return;
        t.textContent = msg;
        t.classList.add('toast-visible');
        setTimeout(function () { t.classList.remove('toast-visible'); }, 3500);
    }

    function safeJSON(str) {
        try { return JSON.parse(str); } catch (e) { return null; }
    }

    function safeSave(key, data) {
        try {
            localStorage.setItem(key, JSON.stringify(data));
            return true;
        } catch (e) {
            showToast('Storage full — clear old data.');
            return false;
        }
    }

    function uid() {
        return 'id_' + Date.now().toString(36) + '_' + Math.random().toString(36).slice(2, 7);
    }

    function escapeHtml(str) {
        var div = document.createElement('div');
        div.appendChild(document.createTextNode(str || ''));
        return div.innerHTML;
    }

    /* ── State load/save ─────────────────────────────── */
    function loadState() {
        var cfg = window.ADMIN_CONFIG || {};
        var stored = safeJSON(localStorage.getItem(STORAGE_PROS));
        state.prospects = Array.isArray(stored) && stored.length ? stored : (cfg.prospects || []).slice();
        var storedT = safeJSON(localStorage.getItem(STORAGE_TASKS));
        state.tasks = Array.isArray(storedT) && storedT.length ? storedT : (cfg.websiteTasks || []).slice();
        contentDrafts = safeJSON(localStorage.getItem(STORAGE_CONTENT)) || {};
        state.accessRequests = safeJSON(localStorage.getItem(STORAGE_ACCESS_REQS)) || [];
        state.dynamicCodes   = safeJSON(localStorage.getItem(STORAGE_DYNAMIC_CODES)) || [];
        state.siteStats      = safeJSON(localStorage.getItem(STORAGE_SITE_STATS)) || {};

        // Fetch fresh data from cloud API (overwrites localStorage cache)
        fetchFromApi();
    }

    function saveProspectsToStorage() { safeSave(STORAGE_PROS, state.prospects); }
    function saveTasksToStorage()     { safeSave(STORAGE_TASKS, state.tasks); }

    /* ── Render all ──────────────────────────────────── */
    function renderAll() {
        renderStats();
        renderProspects();
        renderTasks();
        renderAccessRequests();
        renderContentEditor();
        renderPageManager();
        renderSiteStats();
    }

    /* ══════════════════════════════════════════════════
       STATS
    ══════════════════════════════════════════════════ */

    function renderStats() {
        var row = document.getElementById('stats-row');
        if (!row) return;

        var totalLeads = state.prospects.length;
        var newLeads   = state.prospects.filter(function (p) { return p.status === 'New Lead'; }).length;
        var signed     = state.prospects.filter(function (p) { return p.status === 'Signed'; }).length;
        var pendTasks  = state.tasks.filter(function (t) { return t.status !== 'Done'; }).length;
        var pendReqs   = state.accessRequests.filter(function (r) { return r.status === 'pending'; }).length;
        var totalViews = (state.siteStats.totalViews || 0);

        row.innerHTML =
            '<div class="stat-card"><div class="stat-number">' + totalLeads + '</div><div class="stat-label">TOTAL LEADS</div></div>' +
            '<div class="stat-card"><div class="stat-number">' + newLeads + '</div><div class="stat-label">NEW LEADS</div></div>' +
            '<div class="stat-card"><div class="stat-number">' + signed + '</div><div class="stat-label">SIGNED</div></div>' +
            '<div class="stat-card"><div class="stat-number">' + pendTasks + '</div><div class="stat-label">PENDING TASKS</div></div>' +
            '<div class="stat-card"><div class="stat-number">' + pendReqs + '</div><div class="stat-label">PENDING ACCESS</div></div>' +
            '<div class="stat-card"><div class="stat-number">' + totalViews + '</div><div class="stat-label">PAGE VIEWS</div></div>';
    }

    /* ══════════════════════════════════════════════════
       PROSPECT CRM
    ══════════════════════════════════════════════════ */

    window.filterProspects = function (filter, btn) {
        state.activeFilter = filter;
        document.querySelectorAll('.filter-btn').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        renderProspects();
    };

    function renderProspects() {
        var el = document.getElementById('crm-table');
        if (!el) return;

        var list = state.activeFilter === 'all'
            ? state.prospects
            : state.prospects.filter(function (p) { return p.status === state.activeFilter; });

        if (!list.length) {
            el.innerHTML = '<p style="padding:28px;color:var(--color-text-muted);font-size:13px;">No leads found.</p>';
            return;
        }

        var html = '<div class="crm-row crm-head"><span>Name</span><span>Email</span><span>Service</span><span>Budget</span><span>Status</span><span>Actions</span></div>';

        list.forEach(function (p) {
            var statusClass = (p.status || '').replace(/\s+/g, '-');
            html +=
                '<div class="crm-row">' +
                    '<span class="crm-name">' + escapeHtml(p.name) + '</span>' +
                    '<span class="crm-email">' + escapeHtml(p.email) + '</span>' +
                    '<span class="crm-service">' + escapeHtml(p.service || '') + '</span>' +
                    '<span class="crm-budget">' + escapeHtml(p.budget || '') + '</span>' +
                    '<span class="crm-status ' + statusClass + '">' + escapeHtml(p.status) + '</span>' +
                    '<span class="crm-actions">' +
                        '<button class="crm-act-btn" onclick="editProspect(\'' + p.id + '\')">EDIT</button>' +
                        '<button class="crm-act-btn del-btn" onclick="deleteProspect(\'' + p.id + '\')">DEL</button>' +
                    '</span>' +
                '</div>';
        });

        el.innerHTML = html;
    }

    var editingProspectId = null;

    window.openAddProspect = function () {
        editingProspectId = null;
        document.getElementById('prospect-modal-title').textContent = 'Add Lead';
        document.getElementById('f-name').value    = '';
        document.getElementById('f-email').value   = '';
        document.getElementById('f-phone').value   = '';
        document.getElementById('f-service').value = '';
        document.getElementById('f-budget').value  = '';
        document.getElementById('f-status').value  = 'New Lead';
        document.getElementById('f-notes').value   = '';
        document.getElementById('modal-prospect').classList.remove('hidden');
    };

    window.editProspect = function (id) {
        var p = state.prospects.find(function (x) { return x.id === id; });
        if (!p) return;
        editingProspectId = id;
        document.getElementById('prospect-modal-title').textContent = 'Edit Lead';
        document.getElementById('f-name').value    = p.name || '';
        document.getElementById('f-email').value   = p.email || '';
        document.getElementById('f-phone').value   = p.phone || '';
        document.getElementById('f-service').value = p.service || '';
        document.getElementById('f-budget').value  = p.budget || '';
        document.getElementById('f-status').value  = p.status || 'New Lead';
        document.getElementById('f-notes').value   = p.notes || '';
        document.getElementById('modal-prospect').classList.remove('hidden');
    };

    window.saveProspect = function () {
        var name    = document.getElementById('f-name').value.trim();
        var email   = document.getElementById('f-email').value.trim();
        var phone   = document.getElementById('f-phone').value.trim();
        var service = document.getElementById('f-service').value;
        var budget  = document.getElementById('f-budget').value;
        var status  = document.getElementById('f-status').value;
        var notes   = document.getElementById('f-notes').value.trim();

        if (!name) { showToast('Name is required.'); return; }

        if (editingProspectId) {
            var idx = state.prospects.findIndex(function (x) { return x.id === editingProspectId; });
            if (idx > -1) {
                state.prospects[idx].name    = name;
                state.prospects[idx].email   = email;
                state.prospects[idx].phone   = phone;
                state.prospects[idx].service = service;
                state.prospects[idx].budget  = budget;
                state.prospects[idx].status  = status;
                state.prospects[idx].notes   = notes;
            }
        } else {
            state.prospects.push({
                id: uid(), name: name, email: email, phone: phone,
                service: service, budget: budget, status: status, notes: notes,
                added: new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
            });
        }

        saveProspectsToStorage();
        closeModal('modal-prospect');
        renderAll();
        showToast(editingProspectId ? 'Lead updated.' : 'Lead added.');
        editingProspectId = null;
    };

    window.deleteProspect = function (id) {
        if (!confirm('Delete this lead?')) return;
        state.prospects = state.prospects.filter(function (p) { return p.id !== id; });
        saveProspectsToStorage();
        renderAll();
        showToast('Lead deleted.');
    };

    /* ══════════════════════════════════════════════════
       WEBSITE TASKS
    ══════════════════════════════════════════════════ */

    function renderTasks() {
        var el = document.getElementById('tasks-board');
        if (!el) return;

        if (!state.tasks.length) {
            el.innerHTML = '<p style="color:var(--color-text-muted);font-size:13px;">No tasks yet.</p>';
            return;
        }

        var html = '';
        state.tasks.forEach(function (t) {
            var done = t.status === 'Done';
            html +=
                '<div class="task-row' + (done ? ' status-Done' : '') + '">' +
                    '<div class="task-left">' +
                        '<div class="task-section-badge">' + escapeHtml(t.section) + '</div>' +
                        '<div class="task-text">' + escapeHtml(t.task) + '</div>' +
                        '<span class="task-priority ' + escapeHtml(t.priority) + '">' + escapeHtml(t.priority) + '</span>' +
                        (t.file ? '<div class="task-file">' + escapeHtml(t.file) + '</div>' : '') +
                    '</div>' +
                    '<div class="task-right">' +
                        '<button class="task-status-toggle" onclick="toggleTask(\'' + t.id + '\')">' + (done ? 'REOPEN' : 'DONE') + '</button>' +
                        '<button class="task-delete-btn" onclick="deleteTask(\'' + t.id + '\')">DEL</button>' +
                    '</div>' +
                '</div>';
        });

        el.innerHTML = html;
    }

    window.openAddTask = function () {
        document.getElementById('t-section').value  = '';
        document.getElementById('t-task').value     = '';
        document.getElementById('t-priority').value = 'Medium';
        document.getElementById('t-file').value     = '';
        document.getElementById('modal-task').classList.remove('hidden');
    };

    window.saveTask = function () {
        var section  = document.getElementById('t-section').value.trim();
        var task     = document.getElementById('t-task').value.trim();
        var priority = document.getElementById('t-priority').value;
        var file     = document.getElementById('t-file').value.trim();

        if (!section || !task) { showToast('Section and task are required.'); return; }

        state.tasks.push({
            id: uid(), section: section, task: task,
            priority: priority, status: 'Pending', file: file
        });

        saveTasksToStorage();
        closeModal('modal-task');
        renderAll();
        showToast('Task added.');
    };

    window.toggleTask = function (id) {
        var t = state.tasks.find(function (x) { return x.id === id; });
        if (!t) return;
        t.status = t.status === 'Done' ? 'Pending' : 'Done';
        saveTasksToStorage();
        renderAll();
    };

    window.deleteTask = function (id) {
        if (!confirm('Delete this task?')) return;
        state.tasks = state.tasks.filter(function (t) { return t.id !== id; });
        saveTasksToStorage();
        renderAll();
        showToast('Task deleted.');
    };

    /* ══════════════════════════════════════════════════
       CONTENT EDITOR
    ══════════════════════════════════════════════════ */

    window.switchContentTab = function (page, btn) {
        activeContentPage = page;
        document.querySelectorAll('.ctab').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        renderContentEditor();
        if (contentPreviewActive) updatePreview();
    };

    function renderContentEditor() {
        var el = document.getElementById('content-editor-fields');
        if (!el) return;

        var schema = ((window.ADMIN_CONFIG || {}).contentSchema || {})[activeContentPage] || [];
        if (!schema.length) {
            el.innerHTML = '<p style="color:var(--color-text-muted);font-size:13px;">No editable fields for this page.</p>';
            return;
        }

        var html = '';
        schema.forEach(function (field) {
            var val = contentDrafts[field.key] || '';
            var tag = field.type === 'textarea'
                ? '<textarea class="content-field-input" data-key="' + field.key + '" placeholder="' + escapeHtml(field.hint) + '">' + escapeHtml(val) + '</textarea>'
                : '<input type="text" class="content-field-input" data-key="' + field.key + '" value="' + escapeHtml(val) + '" placeholder="' + escapeHtml(field.hint) + '">';

            html +=
                '<div class="content-field-group">' +
                    '<label class="content-field-label">' + escapeHtml(field.label) + '</label>' +
                    '<div class="content-field-hint">' + escapeHtml(field.hint) + '</div>' +
                    tag +
                '</div>';
        });

        el.innerHTML = html;

        // Live save on input
        el.querySelectorAll('.content-field-input').forEach(function (inp) {
            inp.addEventListener('input', function () {
                contentDrafts[inp.getAttribute('data-key')] = inp.value;
                safeSave(STORAGE_CONTENT, contentDrafts);
            });
        });
    }

    window.toggleContentPreview = function () {
        contentPreviewActive = !contentPreviewActive;
        var pane = document.getElementById('content-preview-pane');
        var btn  = document.getElementById('preview-toggle-btn');
        if (contentPreviewActive) {
            pane.classList.remove('hidden');
            btn.classList.add('active');
            btn.innerHTML = '&#9632; CLOSE PREVIEW';
            updatePreview();
        } else {
            pane.classList.add('hidden');
            btn.classList.remove('active');
            btn.innerHTML = '&#9633; PREVIEW LIVE';
        }
    };

    function updatePreview() {
        var iframe = document.getElementById('content-preview-iframe');
        var pages  = (window.ADMIN_CONFIG || {}).pages || {};
        var url    = pages[activeContentPage] || '';
        if (iframe && url) iframe.src = url;
    }

    window.submitContentPage = function () {
        safeSave(STORAGE_CONTENT, contentDrafts);

        // Save history for undo
        var history = safeJSON(localStorage.getItem(STORAGE_CONTENT_HISTORY)) || [];
        history.push({ ts: Date.now(), drafts: JSON.parse(JSON.stringify(contentDrafts)) });
        if (history.length > 20) history = history.slice(-20);
        safeSave(STORAGE_CONTENT_HISTORY, history);

        showToast('Content changes saved for "' + activeContentPage + '".');
    };

    window.undoContentDraft = function () {
        var history = safeJSON(localStorage.getItem(STORAGE_CONTENT_HISTORY)) || [];
        if (!history.length) { showToast('No undo history available.'); return; }
        var prev = history.pop();
        contentDrafts = prev.drafts;
        safeSave(STORAGE_CONTENT, contentDrafts);
        safeSave(STORAGE_CONTENT_HISTORY, history);
        renderContentEditor();
        showToast('Undone last content change.');
    };

    window.viewContentChanges = function () {
        var el = document.getElementById('content-changes-list');
        if (!el) return;

        var keys = Object.keys(contentDrafts).filter(function (k) { return contentDrafts[k]; });
        if (!keys.length) {
            el.innerHTML = '<p style="color:var(--color-text-muted);font-size:13px;">No changes queued.</p>';
        } else {
            var html = '';
            keys.forEach(function (k) {
                html +=
                    '<div style="margin-bottom:12px;padding:12px;background:var(--color-bg-card);border:1px solid var(--color-border);border-radius:4px;">' +
                        '<div style="font-size:10px;font-weight:600;letter-spacing:2px;color:var(--color-accent);margin-bottom:4px;text-transform:uppercase;">' + escapeHtml(k) + '</div>' +
                        '<div style="font-size:13px;color:var(--color-text-primary);white-space:pre-wrap;">' + escapeHtml(contentDrafts[k]) + '</div>' +
                    '</div>';
            });
            el.innerHTML = html;
        }

        document.getElementById('modal-content-changes').classList.remove('hidden');
    };

    window.copyAllChanges = function () {
        var keys = Object.keys(contentDrafts).filter(function (k) { return contentDrafts[k]; });
        var text = keys.map(function (k) { return k + ': ' + contentDrafts[k]; }).join('\n\n');
        if (navigator.clipboard) {
            navigator.clipboard.writeText(text).then(function () { showToast('Changes copied to clipboard.'); });
        }
    };

    /* ══════════════════════════════════════════════════
       ACCESS REQUESTS Management
    ══════════════════════════════════════════════════ */

    window.filterRequests = function (filter, btn) {
        state.activeReqFilter = filter;
        document.querySelectorAll('#panel-access-requests .filter-btn').forEach(function (b) { b.classList.remove('active'); });
        if (btn) btn.classList.add('active');
        renderAccessRequests();
    };

    window.refreshRequests = function () {
        if (API_URL) {
            showToast('Syncing from cloud...');
            fetchFromApi();
        } else {
            state.accessRequests = safeJSON(localStorage.getItem(STORAGE_ACCESS_REQS)) || [];
            state.dynamicCodes   = safeJSON(localStorage.getItem(STORAGE_DYNAMIC_CODES)) || [];
            state.siteStats      = safeJSON(localStorage.getItem(STORAGE_SITE_STATS)) || {};
            renderAll();
            showToast('Data refreshed.');
        }
    };

    function isExpired(req) {
        if (!req.approvedDate) return false;
        var approved = new Date(req.approvedDate);
        var expiry = req.expiresAt ? new Date(req.expiresAt) : new Date(approved.getTime() + 7 * 24 * 60 * 60 * 1000);
        return new Date() > expiry;
    }

    function getEffectiveStatus(req) {
        if (req.status === 'disabled' || req.status === 'archived' || req.status === 'expired') return req.status;
        if (req.status === 'approved' && isExpired(req)) return 'expired';
        return req.status || 'pending';
    }

    function renderAccessRequests() {
        var el = document.getElementById('access-requests-list');
        if (!el) return;

        // Auto-expire approved requests older than 7 days
        var needsSave = false;
        state.accessRequests.forEach(function (r) {
            if (r.status === 'approved' && isExpired(r)) {
                r.status = 'expired';
                needsSave = true;
            }
        });
        if (needsSave) {
            safeSave(STORAGE_ACCESS_REQS, state.accessRequests);
        }

        var list = state.activeReqFilter === 'all'
            ? state.accessRequests
            : state.accessRequests.filter(function (r) { return getEffectiveStatus(r) === state.activeReqFilter; });

        if (!list.length) {
            el.innerHTML = '<p style="padding:28px;color:var(--color-text-muted);font-size:13px;">No access requests found.</p>';
            return;
        }

        var html = '';
        list.slice().reverse().forEach(function (r) {
            var effStatus = getEffectiveStatus(r);
            var statusClass = 'req-status-' + effStatus;
            var dateStr = r.date ? new Date(r.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '';
            var expiryStr = '';
            if (r.approvedDate) {
                var approved = new Date(r.approvedDate);
                var expiry = r.expiresAt ? new Date(r.expiresAt) : new Date(approved.getTime() + 7 * 24 * 60 * 60 * 1000);
                expiryStr = expiry.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
            }
            html +=
                '<div class="req-card ' + statusClass + '">' +
                    '<div class="req-card-header">' +
                        '<div class="req-card-name">' + escapeHtml(r.name) + '</div>' +
                        '<span class="req-badge ' + statusClass + '">' + escapeHtml(effStatus) + '</span>' +
                    '</div>' +
                    '<div class="req-card-details">' +
                        '<div class="req-detail"><span class="req-label">Email:</span> ' + escapeHtml(r.email) + '</div>' +
                        '<div class="req-detail"><span class="req-label">Company:</span> ' + escapeHtml(r.company || 'N/A') + '</div>' +
                        '<div class="req-detail"><span class="req-label">Industry:</span> ' + escapeHtml(r.industry) + '</div>' +
                        '<div class="req-detail"><span class="req-label">Reason:</span> ' + escapeHtml(r.reason) + '</div>' +
                        '<div class="req-detail"><span class="req-label">Date:</span> ' + escapeHtml(dateStr) + '</div>' +
                        (expiryStr ? '<div class="req-detail"><span class="req-label">Expires:</span> ' + escapeHtml(expiryStr) + '</div>' : '') +
                    '</div>' +
                    (r.status === 'pending' ?
                        '<div class="req-card-actions">' +
                            '<button class="req-approve-btn" onclick="openApproval(\'' + escapeHtml(r.id) + '\')">APPROVE</button>' +
                            '<button class="req-deny-btn" onclick="denyRequest(\'' + escapeHtml(r.id) + '\')">DENY</button>' +
                        '</div>' : '') +
                    (r.status === 'approved' && r.approvedCode ?
                        '<div class="req-approved-info">Code: <code>' + escapeHtml(r.approvedCode) + '</code>' +
                            '<div class="req-card-actions" style="margin-top:8px">' +
                                '<button class="req-deny-btn" onclick="disableRequest(\'' + escapeHtml(r.id) + '\')" style="background:#c59000;border-color:#c59000">DISABLE</button>' +
                                '<button class="req-deny-btn" onclick="archiveRequest(\'' + escapeHtml(r.id) + '\')" style="background:#666;border-color:#666">ARCHIVE</button>' +
                            '</div>' +
                        '</div>' : '') +
                    (effStatus === 'expired' ?
                        '<div class="req-approved-info" style="color:#f59e0b">\u26a0 Expired (7-day access period ended)' +
                            '<div class="req-card-actions" style="margin-top:8px">' +
                                '<button class="req-deny-btn" onclick="archiveRequest(\'' + escapeHtml(r.id) + '\')" style="background:#666;border-color:#666">ARCHIVE</button>' +
                            '</div>' +
                        '</div>' : '') +
                    (effStatus === 'disabled' ?
                        '<div class="req-approved-info" style="color:#f59e0b">\u26d4 Manually disabled' +
                            '<div class="req-card-actions" style="margin-top:8px">' +
                                '<button class="req-deny-btn" onclick="archiveRequest(\'' + escapeHtml(r.id) + '\')" style="background:#666;border-color:#666">ARCHIVE</button>' +
                            '</div>' +
                        '</div>' : '') +
                '</div>';
        });

        el.innerHTML = html;
    }

    /* ── Approval Flow ─────────────────────────────── */

    var pendingApprovalId = null;
    var generatedCode     = '';

    function generateAccessCode() {
        var chars = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789';
        var code = 'YNK-';
        for (var i = 0; i < 4; i++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        code += '-';
        for (var j = 0; j < 4; j++) code += chars.charAt(Math.floor(Math.random() * chars.length));
        return code;
    }

    window.openApproval = function (reqId) {
        var req = state.accessRequests.find(function (r) { return r.id === reqId; });
        if (!req) return;

        pendingApprovalId = reqId;
        generatedCode = generateAccessCode();

        // Populate modal
        var details = document.getElementById('approve-request-details');
        if (details) {
            details.innerHTML =
                '<div class="req-detail" style="margin-bottom:12px">' +
                    '<strong>' + escapeHtml(req.name) + '</strong> (' + escapeHtml(req.email) + ')' +
                    '<br><span style="color:var(--color-text-muted)">' + escapeHtml(req.company || 'N/A') + ' — ' + escapeHtml(req.industry) + '</span>' +
                '</div>';
        }

        // Populate industry dropdown
        var sel = document.getElementById('approve-industry');
        if (sel) {
            var industries = (window.ADMIN_CONFIG || {}).industries || [];
            sel.innerHTML = '';
            industries.forEach(function (ind) {
                var opt = document.createElement('option');
                opt.value = ind.name;
                opt.textContent = ind.icon + ' ' + ind.name;
                if (ind.name === req.industry) opt.selected = true;
                sel.appendChild(opt);
            });
        }

        document.getElementById('approve-code').textContent = generatedCode;
        clearErr('approve-error');
        document.getElementById('approve-success').textContent = '';
        document.getElementById('modal-approve').classList.remove('hidden');
    };

    window.regenerateCode = function () {
        generatedCode = generateAccessCode();
        document.getElementById('approve-code').textContent = generatedCode;
    };

    window.copyApprovalCode = function () {
        if (navigator.clipboard) {
            navigator.clipboard.writeText(generatedCode).then(function () {
                showToast('Code copied to clipboard.');
            });
        }
    };

    window.confirmApproval = function () {
        if (!pendingApprovalId || !generatedCode) return;

        var req = state.accessRequests.find(function (r) { return r.id === pendingApprovalId; });
        if (!req) return;

        var industry = document.getElementById('approve-industry').value;
        var cfg      = (window.ADMIN_CONFIG || {}).emailjs || {};
        var indInfo  = ((window.ADMIN_CONFIG || {}).industries || []).find(function (i) { return i.name === industry; });

        var errEl = document.getElementById('approve-error');
        var sucEl = document.getElementById('approve-success');
        errEl.textContent = '';
        sucEl.textContent = '';

        // Hash the code and store it for portal validation
        sha256Hex(generatedCode).then(function (hash) {
            // Save dynamic code to localStorage
            state.dynamicCodes.push({
                hash:     hash,
                industry: industry,
                file:     indInfo ? indInfo.file : '',
                icon:     indInfo ? indInfo.icon : '',
                name:     req.name,
                email:    req.email,
                created:  new Date().toISOString()
            });
            safeSave(STORAGE_DYNAMIC_CODES, state.dynamicCodes);

            // Mark request as approved
            req.status       = 'approved';
            req.approvedCode = generatedCode;
            req.approvedDate = new Date().toISOString();
            req.approvedIndustry = industry;
            req.expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString();
            safeSave(STORAGE_ACCESS_REQS, state.accessRequests);

            // Sync to cloud API
            if (API_URL) {
                apiPost('/api/dynamic-codes', {
                    hash: hash, industry: industry,
                    file: indInfo ? indInfo.file : '', icon: indInfo ? indInfo.icon : '',
                    name: req.name, email: req.email, created: new Date().toISOString()
                }).catch(function (e) { console.error('API sync (code):', e); });
                apiPatch('/api/access-requests/' + pendingApprovalId, {
                    status: 'approved', approvedCode: generatedCode,
                    approvedDate: req.approvedDate, approvedIndustry: industry,
                    expiresAt: req.expiresAt
                }).catch(function (e) { console.error('API sync (request):', e); });
            }

            // Try to send approval email via EmailJS
            if (window.emailjs && cfg.serviceId && cfg.templateId) {
                window.emailjs.send(cfg.serviceId, cfg.templateId, {
                    to_email:     req.email,
                    heading:      'Your Access Code Is Ready',
                    content_html: '<p>Hello ' + escapeHtml(req.name) + ',</p>' +
                        '<p>Your request to access the <strong>Consultants Portal</strong> has been approved. Use the code below to access your industry-specific resources:</p>' +
                        '<div style="background-color:#0b1120;color:#29B5E8;font-family:Courier New,monospace;font-size:22px;font-weight:700;letter-spacing:3px;text-align:center;padding:18px;border-radius:4px;margin:24px 0">' + escapeHtml(generatedCode) + '</div>' +
                        '<p><a href="https://ynk-techusa.com/consultants" style="display:inline-block;background-color:#29B5E8;color:#fff;text-decoration:none;padding:10px 24px;border-radius:4px;font-weight:600">Open Consultants Portal</a></p>' +
                        '<div style="background-color:#1a1a2e;border-left:4px solid #f59e0b;padding:12px 16px;border-radius:4px;margin:20px 0;color:#f59e0b;font-size:13px">' +
                            '<strong>\u26a0 Important:</strong> This access code is valid for <strong>7 days</strong> from the date of approval. After 7 days, the code will automatically expire and access will be revoked.' +
                        '</div>' +
                        '<p>If you did not request this access code, please ignore this email.</p>',
                    footer_note:  'You received this email because you requested access to the YNK-Tech USA Consultants Portal'
                }).then(function () {
                    sucEl.textContent = 'Approved! Email sent to ' + req.email;
                    setTimeout(function () {
                        closeModal('modal-approve');
                        renderAll();
                    }, 1500);
                }).catch(function (err) {
                    console.error('EmailJS error:', err);
                    sucEl.textContent = 'Approved & code saved. Email failed — use mailto below.';
                    // Fallback mailto
                    var subject = encodeURIComponent('Your YNK-Tech Consultant Portal Access Code');
                    var body    = encodeURIComponent('Hello ' + req.name + ',\n\nYour access code is: ' + generatedCode + '\n\nUse it at: https://ynk-techusa.com/consultants\n\nBest regards,\nYNK-Tech USA');
                    sucEl.innerHTML += '<br><a href="mailto:' + encodeURIComponent(req.email) + '?subject=' + subject + '&body=' + body + '" style="color:var(--color-accent)">Open Email Client</a>';
                    renderAll();
                });
            } else {
                // No EmailJS — fallback to mailto
                var subject = encodeURIComponent('Your YNK-Tech Consultant Portal Access Code');
                var body    = encodeURIComponent('Hello ' + req.name + ',\n\nYour access code is: ' + generatedCode + '\n\nUse it at: https://ynk-techusa.com/consultants\n\nBest regards,\nYNK-Tech USA');
                sucEl.innerHTML = 'Approved & code saved. <a href="mailto:' + encodeURIComponent(req.email) + '?subject=' + subject + '&body=' + body + '" style="color:var(--color-accent)">Send via Email Client</a>';
                renderAll();
            }

            pendingApprovalId = null;
        });
    };

    window.denyRequest = function (reqId) {
        if (!confirm('Deny this access request?')) return;
        var req = state.accessRequests.find(function (r) { return r.id === reqId; });
        if (!req) return;
        req.status = 'denied';
        req.deniedDate = new Date().toISOString();
        safeSave(STORAGE_ACCESS_REQS, state.accessRequests);

        // Sync to cloud API
        if (API_URL) {
            apiPatch('/api/access-requests/' + reqId, {
                status: 'denied', deniedDate: req.deniedDate
            }).catch(function (e) { console.error('API sync (deny):', e); });
        }

        renderAll();
        showToast('Request denied.');
    };

    window.disableRequest = function (reqId) {
        if (!confirm('Disable this access code? The consultant will no longer be able to use it.')) return;
        var req = state.accessRequests.find(function (r) { return r.id === reqId; });
        if (!req) return;

        // Remove the dynamic code by finding its hash
        if (req.approvedCode) {
            sha256Hex(req.approvedCode).then(function (hash) {
                state.dynamicCodes = state.dynamicCodes.filter(function (c) { return c.hash !== hash; });
                safeSave(STORAGE_DYNAMIC_CODES, state.dynamicCodes);
                if (API_URL) {
                    apiDelete('/api/dynamic-codes/' + encodeURIComponent(hash))
                        .catch(function (e) { console.error('API sync (delete code):', e); });
                }
            });
        }

        req.status = 'disabled';
        req.disabledDate = new Date().toISOString();
        safeSave(STORAGE_ACCESS_REQS, state.accessRequests);

        if (API_URL) {
            apiPatch('/api/access-requests/' + reqId, {
                status: 'disabled', disabledDate: req.disabledDate
            }).catch(function (e) { console.error('API sync (disable):', e); });
        }

        renderAll();
        showToast('Access code disabled.');
    };

    window.archiveRequest = function (reqId) {
        if (!confirm('Archive this request? It will be moved to the Archived filter.')) return;
        var req = state.accessRequests.find(function (r) { return r.id === reqId; });
        if (!req) return;

        // Remove dynamic code if still active
        if (req.approvedCode && (req.status === 'approved' || req.status === 'expired')) {
            sha256Hex(req.approvedCode).then(function (hash) {
                state.dynamicCodes = state.dynamicCodes.filter(function (c) { return c.hash !== hash; });
                safeSave(STORAGE_DYNAMIC_CODES, state.dynamicCodes);
                if (API_URL) {
                    apiDelete('/api/dynamic-codes/' + encodeURIComponent(hash))
                        .catch(function (e) { console.error('API sync (delete code):', e); });
                }
            });
        }

        req.status = 'archived';
        req.archivedDate = new Date().toISOString();
        safeSave(STORAGE_ACCESS_REQS, state.accessRequests);

        if (API_URL) {
            apiPatch('/api/access-requests/' + reqId, {
                status: 'archived', archivedDate: req.archivedDate
            }).catch(function (e) { console.error('API sync (archive):', e); });
        }

        renderAll();
        showToast('Request archived.');
    };

    /* ══════════════════════════════════════════════════
       SITE STATS (Admin Tools tab)
    ══════════════════════════════════════════════════ */

    function renderSiteStats() {
        var overviewEl = document.getElementById('stats-overview');
        var dailyEl    = document.getElementById('stats-daily');
        var pagesEl    = document.getElementById('stats-pages');
        if (!overviewEl) return;

        var stats = state.siteStats;
        var totalViews  = stats.totalViews || 0;
        var totalReqs   = state.accessRequests.length;
        var approvedCnt = state.accessRequests.filter(function (r) { return r.status === 'approved'; }).length;
        var pendingCnt  = state.accessRequests.filter(function (r) { return r.status === 'pending'; }).length;
        var deniedCnt   = state.accessRequests.filter(function (r) { return r.status === 'denied'; }).length;
        var lastVisit   = stats.lastVisit ? new Date(stats.lastVisit).toLocaleString() : 'N/A';

        overviewEl.innerHTML =
            '<div class="stats-metric"><div class="stats-metric-val">' + totalViews + '</div><div class="stats-metric-label">Total Page Views</div></div>' +
            '<div class="stats-metric"><div class="stats-metric-val">' + totalReqs + '</div><div class="stats-metric-label">Total Access Requests</div></div>' +
            '<div class="stats-metric"><div class="stats-metric-val">' + approvedCnt + '</div><div class="stats-metric-label">Approved</div></div>' +
            '<div class="stats-metric"><div class="stats-metric-val">' + pendingCnt + '</div><div class="stats-metric-label">Pending</div></div>' +
            '<div class="stats-metric"><div class="stats-metric-val">' + deniedCnt + '</div><div class="stats-metric-label">Denied</div></div>' +
            '<div class="stats-metric"><div class="stats-metric-val" style="font-size:14px">' + escapeHtml(lastVisit) + '</div><div class="stats-metric-label">Last Visitor</div></div>';

        // Page views breakdown
        var pageViews = stats.pageViews || {};
        var pageKeys  = Object.keys(pageViews);
        if (pagesEl && pageKeys.length) {
            var maxViews = Math.max.apply(null, pageKeys.map(function (k) { return pageViews[k]; }));
            var html = '<h4 style="font-family:var(--font-heading);font-size:12px;letter-spacing:2px;color:var(--color-text-muted);margin-bottom:16px;">PAGE VIEWS BREAKDOWN</h4>';
            pageKeys.sort(function (a, b) { return pageViews[b] - pageViews[a]; });
            pageKeys.forEach(function (page) {
                var count = pageViews[page];
                var pct   = maxViews > 0 ? Math.round((count / maxViews) * 100) : 0;
                html +=
                    '<div class="stats-bar-row">' +
                        '<span class="stats-bar-label">' + escapeHtml(page) + '</span>' +
                        '<div class="stats-bar-track"><div class="stats-bar-fill" style="width:' + pct + '%"></div></div>' +
                        '<span class="stats-bar-count">' + count + '</span>' +
                    '</div>';
            });
            pagesEl.innerHTML = html;
        }

        // Daily views (last 7 days)
        var dailyViews = stats.dailyViews || {};
        var days = Object.keys(dailyViews).sort().slice(-7);
        if (dailyEl && days.length) {
            var html2 = '<h4 style="font-family:var(--font-heading);font-size:12px;letter-spacing:2px;color:var(--color-text-muted);margin:24px 0 16px;">DAILY TRAFFIC (LAST 7 DAYS)</h4>';
            var maxDay = Math.max.apply(null, days.map(function (d) { return dailyViews[d]._total || 0; }));
            days.forEach(function (day) {
                var total = dailyViews[day]._total || 0;
                var pct   = maxDay > 0 ? Math.round((total / maxDay) * 100) : 0;
                var label = new Date(day + 'T00:00:00').toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
                html2 +=
                    '<div class="stats-bar-row">' +
                        '<span class="stats-bar-label">' + escapeHtml(label) + '</span>' +
                        '<div class="stats-bar-track"><div class="stats-bar-fill" style="width:' + pct + '%"></div></div>' +
                        '<span class="stats-bar-count">' + total + '</span>' +
                    '</div>';
            });
            dailyEl.innerHTML = html2;
        }
    }

    /* ══════════════════════════════════════════════════
       ADMIN TOOLS — TAB SWITCHING
    ══════════════════════════════════════════════════ */

    window.switchTool = function (tool, btn) {
        document.querySelectorAll('.tool-panel').forEach(function (p) { p.classList.add('hidden'); });
        var panel = document.getElementById('tool-' + tool);
        if (panel) panel.classList.remove('hidden');

        document.querySelectorAll('.tool-tab').forEach(function (t) { t.classList.remove('active'); });
        if (btn) btn.classList.add('active');
    };

    /* ══════════════════════════════════════════════════
       PAGE MANAGER
    ══════════════════════════════════════════════════ */

    function renderPageManager() {
        var el = document.getElementById('page-manager-grid');
        if (!el) return;

        var pages = (window.ADMIN_CONFIG || {}).pages || {};
        var pageNames = {
            home:        { title: 'Home',               file: 'index.html' },
            itServices:  { title: 'IT Services',         file: 'it-services.html' },
            branding:    { title: 'Branding',            file: 'branding.html' },
            consultants: { title: 'Consultants Portal',  file: 'consultants.html' }
        };

        var html = '';
        Object.keys(pages).forEach(function (key) {
            var info = pageNames[key] || { title: key, file: '' };
            var taskCount = state.tasks.filter(function (t) {
                return t.section.toLowerCase() === info.title.toLowerCase() && t.status !== 'Done';
            }).length;

            html +=
                '<div class="page-card">' +
                    '<div class="page-card-title">' + escapeHtml(info.title) + '</div>' +
                    '<div class="page-card-file">' + escapeHtml(info.file) + '</div>' +
                    (taskCount > 0 ? '<div style="font-size:11px;color:#f59e0b;margin-bottom:10px;">' + taskCount + ' pending task(s)</div>' : '<div style="font-size:11px;color:#22c55e;margin-bottom:10px;">No pending tasks</div>') +
                    '<a href="' + escapeHtml(pages[key]) + '" target="_blank" rel="noopener" class="page-card-link">VIEW LIVE</a>' +
                '</div>';
        });

        el.innerHTML = html;
    }

    /* ══════════════════════════════════════════════════
       MODAL HELPERS
    ══════════════════════════════════════════════════ */

    window.closeModal = function (id) {
        document.getElementById(id).classList.add('hidden');
    };

    // Close modals on overlay click
    document.addEventListener('click', function (e) {
        if (e.target.classList.contains('modal-overlay')) {
            e.target.classList.add('hidden');
        }
    });

    // Close modals on Escape
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Escape') {
            document.querySelectorAll('.modal-overlay:not(.hidden)').forEach(function (m) {
                m.classList.add('hidden');
            });
        }
    });

})();
