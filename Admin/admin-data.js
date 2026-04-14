/* YNK-TechUSA Admin runtime config */
window.ADMIN_CONFIG = {
    /* API URL for cloud storage (S3 backend via Lambda + API Gateway).
       When set, access requests / dynamic codes / site stats are
       read from and written to S3 instead of only localStorage.
       The deploy-aws.ps1 script fills this in automatically. */
    apiUrl: 'https://enf1mo6r68.execute-api.us-east-1.amazonaws.com',

    /* SHA-256 hash of the admin access code.
       Default code: "YNK-ADMIN2026"
       To change: run in browser console:
         crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR_NEW_CODE'))
           .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join(''))
           .then(console.log);
       Then paste the hash below. */
    codeHash: '459bf3177fbb16d2cf7ab89155a05f97282712f3518f87748839b63a3a7ee34e',

    /* TOTP secret key — character codes for a Base32 string.
       Default: "YNKTECHUSAADMIN2" (encode each char's charCode)
       Only A-Z and 2-7 are valid Base32 characters.
       Add this string to Google Authenticator / Authy. */
    totpKey: [89,78,75,84,69,67,72,85,83,65,65,68,77,73,78,50],

    /* Website pages managed by this dashboard */
    pages: {
        home:        'https://ynk-techusa.com/',
        itServices:  'https://ynk-techusa.com/it-services',
        branding:    'https://ynk-techusa.com/branding',
        consultants: 'https://ynk-techusa.com/consultants'
    },

    /* EmailJS config — single template handles both notification & approval.
       Template "To Email" must be set to {{to_email}}.
       Template body uses {{heading}}, {{{content_html}}}, {{footer_note}}. */
    emailjs: {
        serviceId:  'service_sw3zais',
        templateId: 'template_99cacr8',
        publicKey:  'zG_jERVPbUUfiZ6IL'
    },

    /* Industries for consultant access codes */
    industries: [
        { name: 'Healthcare', file: 'Admin/resumes/healthcare.pdf', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V7l8-4v18"/><path d="M19 21V11l-6-4"/><path d="M9 9v.01"/><path d="M9 12v.01"/><path d="M9 15v.01"/><path d="M9 18v.01"/></svg>' },
        { name: 'Finance',    file: 'Admin/resumes/finance.pdf',    icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><line x1="12" y1="1" x2="12" y2="23"/><path d="M17 5H9.5a3.5 3.5 0 000 7h5a3.5 3.5 0 010 7H6"/></svg>' },
        { name: 'Education',  file: 'Admin/resumes/education.pdf',  icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M22 10v6M2 10l10-5 10 5-10 5z"/><path d="M6 12v5c0 2 3 3 6 3s6-1 6-3v-5"/></svg>' },
        { name: 'Technology', file: 'Admin/resumes/technology.pdf',  icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect x="2" y="3" width="20" height="14" rx="2"/><line x1="8" y1="21" x2="16" y2="21"/><line x1="12" y1="17" x2="12" y2="21"/></svg>' },
        { name: 'Government', file: 'Admin/resumes/government.pdf', icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M3 21h18"/><path d="M5 21V8l7-5 7 5v13"/><path d="M9 21v-6h6v6"/><path d="M3 8h18"/></svg>' },
        { name: 'Retail',     file: 'Admin/resumes/retail.pdf',     icon: '<svg viewBox="0 0 24 24" width="16" height="16" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z"/><line x1="3" y1="6" x2="21" y2="6"/><path d="M16 10a4 4 0 01-8 0"/></svg>' }
    ],

    /* Seed data for website tasks */
    websiteTasks: [
        {
            id:       't1',
            section:  'Home',
            task:     'Update hero headline and subtext',
            priority: 'High',
            status:   'Pending',
            file:     'index.html'
        },
        {
            id:       't2',
            section:  'IT Services',
            task:     'Add new AI service offerings section',
            priority: 'Medium',
            status:   'Pending',
            file:     'it-services.html'
        },
        {
            id:       't3',
            section:  'Branding',
            task:     'Update branding portfolio gallery',
            priority: 'Medium',
            status:   'Pending',
            file:     'branding.html'
        },
        {
            id:       't4',
            section:  'Portfolio',
            task:     'Add latest project case studies',
            priority: 'High',
            status:   'Pending',
            file:     'portfolio.html'
        }
    ],

    /* Seed prospect data */
    prospects: [
        {
            id:        'p1',
            name:      'Sample Lead',
            email:     'lead@example.com',
            phone:     '555-000-0000',
            service:   'IT Services',
            budget:    '$5,000 - $10,000',
            status:    'New Lead',
            notes:     'Interested in website development and AI integration.',
            added:     'April 13, 2026'
        }
    ],

    /* Content schema — fields editable per page */
    contentSchema: {
        home: [
            { key: 'home_hero_line1',  label: 'Hero — Line 1',       type: 'text',     hint: 'First word of headline (e.g. "Technology")' },
            { key: 'home_hero_line2',  label: 'Hero — Line 2',       type: 'text',     hint: 'Second word (e.g. "Meets")' },
            { key: 'home_hero_line3',  label: 'Hero — Line 3',       type: 'text',     hint: 'Third word with gradient (e.g. "Vision")' },
            { key: 'home_subtext',     label: 'Hero — Subtext',      type: 'text',     hint: 'e.g. "IT Solutions · Branding · Portfolio"' },
            { key: 'home_intro_title', label: 'Intro — Section Title', type: 'text',   hint: 'Main intro heading' },
            { key: 'home_intro_lead',  label: 'Intro — Lead Text',   type: 'textarea', hint: 'First paragraph below intro heading' },
            { key: 'home_cta_title',   label: 'CTA — Headline',      type: 'text',     hint: 'Call-to-action section headline' },
            { key: 'home_cta_text',    label: 'CTA — Description',   type: 'textarea', hint: 'CTA section description' }
        ],
        itServices: [
            { key: 'it_headline',      label: 'Page Headline',       type: 'text',     hint: 'Main heading on IT Services page' },
            { key: 'it_intro',         label: 'Intro Paragraph',     type: 'textarea', hint: 'Opening description' },
            { key: 'it_service_1',     label: 'Service 1 — Title',   type: 'text',     hint: 'First service block title' },
            { key: 'it_service_1_desc', label: 'Service 1 — Desc',   type: 'textarea', hint: 'First service block description' },
            { key: 'it_service_2',     label: 'Service 2 — Title',   type: 'text',     hint: 'Second service block title' },
            { key: 'it_service_2_desc', label: 'Service 2 — Desc',   type: 'textarea', hint: 'Second service block description' },
            { key: 'it_cta',           label: 'CTA Button Text',     type: 'text',     hint: 'Call-to-action button label' }
        ],
        branding: [
            { key: 'brand_headline',   label: 'Page Headline',       type: 'text',     hint: 'Main heading on Branding page' },
            { key: 'brand_intro',      label: 'Intro Paragraph',     type: 'textarea', hint: 'Opening description' },
            { key: 'brand_service_1',  label: 'Service 1 — Title',   type: 'text',     hint: 'First branding service title' },
            { key: 'brand_service_1_desc', label: 'Service 1 — Desc', type: 'textarea', hint: 'Description' },
            { key: 'brand_cta',        label: 'CTA Button Text',     type: 'text',     hint: 'Call-to-action button label' }
        ],
        consultants: [
            { key: 'cons_headline',    label: 'Page Headline',       type: 'text',     hint: 'Main heading on Consultants Portal page' },
            { key: 'cons_intro',       label: 'Intro Paragraph',     type: 'textarea', hint: 'Opening description' },
            { key: 'cons_gate_text',   label: 'Gate Text',           type: 'textarea', hint: 'Instructions shown at the access gate' }
        ]
    }
};
