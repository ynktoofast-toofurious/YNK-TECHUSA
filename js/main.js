/* ==========================================================================
   YNK-Tech USA — Main JavaScript (Redesign)
   - Navbar scroll behavior
   - Mobile menu toggle
   - Thumbnail click → scroll to section
   - Portfolio access gate
   - Industry tab switching
   - Scroll-reveal animations
   - Smooth scroll
   ========================================================================== */

(function () {
    'use strict';

    // --- Navbar Scroll ---
    var navbar = document.getElementById('navbar');

    function handleNavScroll() {
        if (window.scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // --- Mobile Menu Toggle ---
    var navToggle = document.getElementById('navToggle');
    var navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        navMenu.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // --- Thumbnail Click → Scroll to Detail Section ---
    // Thumbnails are now <a> links to separate pages — no JS needed

    // --- Portfolio Access Gate (SHA-256 hashed, per-industry resume PDFs) ---
    var accessBtn = document.getElementById('accessBtn');
    var accessCode = document.getElementById('accessCode');
    var gateError = document.getElementById('gateError');
    var portfolioGate = document.getElementById('portfolioGate');
    var portfolioContent = document.getElementById('portfolioContent');

    // Industry resume map: hash → { industry, file, icon }
    var RESUME_MAP = [
        { hash: '855ce6489207eff8d2c830bb74012fe5beece4980aa5ddffe8e4e1e55a0c3e4d', industry: 'Healthcare', file: 'Admin/resumes/healthcare.pdf', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>' },
        { hash: 'f125a06e61497cd5ccbadd5e3c1418a270af4c42f62c7f88783a157e77981427', industry: 'Finance', file: 'Admin/resumes/finance.pdf', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' },
        { hash: 'e57fcf9130a8154f4dddb103cdb9abb4db0aac94f81f879c209f6c530339bc34', industry: 'Education', file: 'Admin/resumes/education.pdf', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>' },
        { hash: '71ad716e562ce56963afd1db2d3934d68205a2dde6624fada37b18cde3cd6e1b', industry: 'Technology', file: 'Admin/resumes/technology.pdf', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
        { hash: '0abcfb49a64bea10e061da7ab94c7f4294f1e7e100083d40d9b2de9b313414d8', industry: 'Government', file: 'Admin/resumes/government.pdf', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/><path d="M3 8h18"/></svg>' },
        { hash: 'bcbc9804c46b36ee3a6f8801821a4256eca3175f0a913f12f506ecc1edc07d07', industry: 'Retail', file: 'Admin/resumes/retail.pdf', icon: '<svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round" style="vertical-align:middle"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' }
    ];

    async function sha256(text) {
        var enc = new TextEncoder().encode(text);
        var buf = await crypto.subtle.digest('SHA-256', enc);
        return Array.from(new Uint8Array(buf)).map(function (b) { return b.toString(16).padStart(2, '0'); }).join('');
    }

    var currentResumeFile = null;

    if (accessBtn) {
        accessBtn.addEventListener('click', async function () {
            var code = accessCode.value.trim();
            if (!code) {
                gateError.textContent = 'Please enter an access code.';
                return;
            }
            var hash = await sha256(code);
            var match = RESUME_MAP.find(function (r) { return r.hash === hash; });

            if (match) {
                currentResumeFile = match.file;
                portfolioGate.style.display = 'none';
                portfolioContent.style.display = 'block';

                // Show industry badge
                var badge = document.getElementById('industryBadge');
                if (badge) badge.innerHTML = match.icon + ' ' + match.industry + ' Resume';

                // Load PDF
                var frame = document.getElementById('resumePdfFrame');
                var loading = document.getElementById('pdfLoading');
                if (frame) {
                    frame.style.opacity = '0';
                    if (loading) loading.style.display = 'flex';
                    frame.onload = function () {
                        if (loading) loading.style.display = 'none';
                        frame.style.opacity = '1';
                    };
                    frame.src = match.file;
                }

                // Hide back-to-home while viewing
                var backLink = document.getElementById('backHomeLink');
                if (backLink) backLink.style.display = 'none';
            } else {
                gateError.textContent = 'Invalid code. Request one via the link below.';
                accessCode.value = '';
                accessCode.focus();
            }
        });

        // Enter key support
        accessCode.addEventListener('keydown', function (e) {
            if (e.key === 'Enter') {
                accessBtn.click();
            }
        });
    }

    // Download button
    var downloadBtn = document.getElementById('downloadResumeBtn');
    if (downloadBtn) {
        downloadBtn.addEventListener('click', function () {
            if (!currentResumeFile) return;
            var a = document.createElement('a');
            a.href = currentResumeFile;
            a.download = '';
            document.body.appendChild(a);
            a.click();
            document.body.removeChild(a);
        });
    }

    // Exit button
    var exitBtn = document.getElementById('exitResumeBtn');
    if (exitBtn) {
        exitBtn.addEventListener('click', function () {
            currentResumeFile = null;
            var frame = document.getElementById('resumePdfFrame');
            if (frame) frame.src = '';
            portfolioContent.style.display = 'none';
            portfolioGate.style.display = '';
            accessCode.value = '';
            gateError.textContent = '';
            var backLink = document.getElementById('backHomeLink');
            if (backLink) backLink.style.display = '';
        });
    }

    // --- Scroll Reveal (Intersection Observer) ---
    function initScrollReveal() {
        var elements = document.querySelectorAll('[data-aos]');
        if (!elements.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        elements.forEach(function (el, index) {
            el.style.transitionDelay = (index % 4) * 0.1 + 's';
            observer.observe(el);
        });
    }

    // --- Smooth Scroll for anchor links ---
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var targetId = this.getAttribute('href');
                if (targetId === '#') return;
                var target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    var offset = navbar.offsetHeight + 20;
                    var pos = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({ top: pos, behavior: 'smooth' });
                }
            });
        });
    }

    // --- Initialize ---
    document.addEventListener('DOMContentLoaded', function () {
        initScrollReveal();
        initSmoothScroll();
        handleNavScroll();
    });

})();
/* ==========================================================================
   YNK-Tech USA — Main JavaScript
   - Navbar scroll behavior
   - Mobile menu toggle
   - Scroll-reveal animations
   - Smooth scroll
   - Interactive card glow effect
   ========================================================================== */

(function () {
    'use strict';

    // --- Navbar Scroll ---
    const navbar = document.getElementById('navbar');
    let lastScroll = 0;

    function handleNavScroll() {
        const scrollY = window.scrollY;
        if (scrollY > 50) {
            navbar.classList.add('scrolled');
        } else {
            navbar.classList.remove('scrolled');
        }
        lastScroll = scrollY;
    }

    window.addEventListener('scroll', handleNavScroll, { passive: true });

    // --- Mobile Menu Toggle ---
    const navToggle = document.getElementById('navToggle');
    const navMenu = document.getElementById('navMenu');

    if (navToggle && navMenu) {
        navToggle.addEventListener('click', function () {
            navToggle.classList.toggle('active');
            navMenu.classList.toggle('active');
        });

        // Close menu when clicking a link
        navMenu.querySelectorAll('.nav-link').forEach(function (link) {
            link.addEventListener('click', function () {
                navToggle.classList.remove('active');
                navMenu.classList.remove('active');
            });
        });
    }

    // --- Scroll Reveal (Intersection Observer) ---
    function initScrollReveal() {
        var elements = document.querySelectorAll('[data-aos]');
        if (!elements.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, {
            threshold: 0.15,
            rootMargin: '0px 0px -40px 0px'
        });

        elements.forEach(function (el, index) {
            el.style.transitionDelay = (index % 4) * 0.1 + 's';
            observer.observe(el);
        });
    }

    // --- Interactive Card Glow (follows mouse) ---
    function initCardGlow() {
        var cards = document.querySelectorAll('.service-card');
        cards.forEach(function (card) {
            card.addEventListener('mousemove', function (e) {
                var rect = card.getBoundingClientRect();
                var x = e.clientX - rect.left;
                var y = e.clientY - rect.top;
                var glow = card.querySelector('.service-card-glow');
                if (glow) {
                    glow.style.background =
                        'radial-gradient(circle at ' + x + 'px ' + y + 'px, rgba(41,181,232,0.12) 0%, transparent 60%)';
                    glow.style.opacity = '1';
                }
            });
            card.addEventListener('mouseleave', function () {
                var glow = card.querySelector('.service-card-glow');
                if (glow) {
                    glow.style.opacity = '0';
                }
            });
        });
    }

    // --- Smooth Scroll for anchor links ---
    function initSmoothScroll() {
        document.querySelectorAll('a[href^="#"]').forEach(function (anchor) {
            anchor.addEventListener('click', function (e) {
                var targetId = this.getAttribute('href');
                if (targetId === '#') return;
                var target = document.querySelector(targetId);
                if (target) {
                    e.preventDefault();
                    var offset = navbar.offsetHeight + 20;
                    var targetPosition = target.getBoundingClientRect().top + window.scrollY - offset;
                    window.scrollTo({
                        top: targetPosition,
                        behavior: 'smooth'
                    });
                }
            });
        });
    }

    // --- Animated counter for step numbers (subtle pulse on scroll) ---
    function initStepAnimation() {
        var steps = document.querySelectorAll('.process-step');
        if (!steps.length) return;

        var observer = new IntersectionObserver(function (entries) {
            entries.forEach(function (entry) {
                if (entry.isIntersecting) {
                    entry.target.classList.add('aos-visible');
                    observer.unobserve(entry.target);
                }
            });
        }, { threshold: 0.3 });

        steps.forEach(function (step, index) {
            step.style.opacity = '0';
            step.style.transform = 'translateY(30px)';
            step.style.transition = 'opacity 0.6s ease ' + (index * 0.15) + 's, transform 0.6s ease ' + (index * 0.15) + 's';
            observer.observe(step);
        });
    }

    // Override process step reveal
    function applyProcessStepReveal() {
        var steps = document.querySelectorAll('.process-step.aos-visible');
        steps.forEach(function (step) {
            step.style.opacity = '1';
            step.style.transform = 'translateY(0)';
        });
        if (document.querySelectorAll('.process-step:not(.aos-visible)').length > 0) {
            requestAnimationFrame(applyProcessStepReveal);
        }
    }

    // --- Initialize ---
    document.addEventListener('DOMContentLoaded', function () {
        initScrollReveal();
        initCardGlow();
        initSmoothScroll();
        initStepAnimation();
        requestAnimationFrame(applyProcessStepReveal);

        // Initial navbar check
        handleNavScroll();
    });

})();
