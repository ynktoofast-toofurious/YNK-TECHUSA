/* YNK-TechUSA Resume Viewer — Logic */
(function () {
    'use strict';

    const config = window.RESUME_CONFIG;
    let currentResume = null;
    let attempts = 0;
    const MAX_ATTEMPTS = 5;
    const LOCKOUT_MS = 5 * 60 * 1000;

    /* ── Helpers ── */
    async function sha256(text) {
        const enc = new TextEncoder().encode(text);
        const buf = await crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf))
            .map(b => b.toString(16).padStart(2, '0'))
            .join('');
    }

    function $(id) { return document.getElementById(id); }

    function showToast(msg) {
        const t = $('toast');
        t.textContent = msg;
        t.classList.add('show');
        setTimeout(() => t.classList.remove('show'), 3000);
    }

    /* ── Password Toggle ── */
    window.togglePw = function () {
        const inp = $('access-input');
        const openIcon = document.querySelector('.eye-open');
        const closedIcon = document.querySelector('.eye-closed');
        if (inp.type === 'password') {
            inp.type = 'text';
            openIcon.classList.add('hidden');
            closedIcon.classList.remove('hidden');
        } else {
            inp.type = 'password';
            openIcon.classList.remove('hidden');
            closedIcon.classList.add('hidden');
        }
    };

    /* ── Lockout Check ── */
    function isLockedOut() {
        const lockUntil = localStorage.getItem('ynk_resume_lock');
        if (lockUntil && Date.now() < parseInt(lockUntil, 10)) {
            const mins = Math.ceil((parseInt(lockUntil, 10) - Date.now()) / 60000);
            $('gate-error').textContent = 'Too many attempts. Try again in ' + mins + ' minute(s).';
            return true;
        }
        localStorage.removeItem('ynk_resume_lock');
        return false;
    }

    /* ── Verify Access Code ── */
    window.verifyAccess = async function () {
        if (isLockedOut()) return;

        const code = $('access-input').value.trim();
        if (!code) {
            $('gate-error').textContent = 'Please enter an access code.';
            return;
        }

        const hash = await sha256(code);
        const match = config.resumes.find(r => r.hash === hash);

        if (!match) {
            attempts++;
            if (attempts >= MAX_ATTEMPTS) {
                localStorage.setItem('ynk_resume_lock', String(Date.now() + LOCKOUT_MS));
                $('gate-error').textContent = 'Too many failed attempts. Locked for 5 minutes.';
            } else {
                $('gate-error').textContent = 'Invalid access code. (' + (MAX_ATTEMPTS - attempts) + ' attempts remaining)';
            }
            $('access-input').value = '';
            $('access-input').focus();
            return;
        }

        /* Success */
        currentResume = match;
        $('access-gate').classList.add('hidden');
        $('resume-viewer').classList.remove('hidden');
        $('industry-badge').innerHTML = match.icon + ' ' + match.industry;

        loadPDF(match.file);
    };

    /* ── Load PDF ── */
    function loadPDF(file) {
        const frame = $('pdf-frame');
        const loading = $('pdf-loading');

        frame.style.opacity = '0';
        loading.classList.remove('hidden');

        frame.onload = function () {
            loading.classList.add('hidden');
            frame.style.opacity = '1';
        };

        frame.onerror = function () {
            loading.innerHTML = '<p style="color:var(--color-error)">Failed to load resume PDF.</p>';
        };

        frame.src = file;
    }

    /* ── Download ── */
    window.downloadResume = function () {
        if (!currentResume) return;
        const a = document.createElement('a');
        a.href = currentResume.file;
        a.download = 'YNK-TechUSA_Resume_' + currentResume.industry + '.pdf';
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        showToast('Downloading ' + currentResume.industry + ' resume...');
    };

    /* ── Logout ── */
    window.logout = function () {
        currentResume = null;
        $('pdf-frame').src = '';
        $('resume-viewer').classList.add('hidden');
        $('access-gate').classList.remove('hidden');
        $('access-input').value = '';
        $('gate-error').textContent = '';
    };

    /* ── Enter Key Support ── */
    document.addEventListener('keydown', function (e) {
        if (e.key === 'Enter') {
            const gate = $('access-gate');
            if (gate && !gate.classList.contains('hidden')) {
                e.preventDefault();
                verifyAccess();
            }
        }
    });

    /* ── Init: Check lockout on load ── */
    isLockedOut();
    $('access-input').focus();

})();
