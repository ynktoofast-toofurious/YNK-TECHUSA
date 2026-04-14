/* YNK-TechUSA Resume Viewer - Access Code Configuration
   -------------------------------------------------------
   Each entry maps a SHA-256 hashed access code to an industry
   and a PDF filename inside the Admin/resumes/ folder.

   ACCESS CODES:
     Healthcare  -> HEALTH-YNK
     Finance     -> FINANCE-YNK
     Education   -> EDU-YNK
     Technology  -> TECH-YNK
     Government  -> GOV-YNK
     Retail      -> RETAIL-YNK

   To add a new industry:
   1. Generate the hash in browser console:
        crypto.subtle.digest('SHA-256', new TextEncoder().encode('YOUR-CODE'))
          .then(b => Array.from(new Uint8Array(b)).map(x => x.toString(16).padStart(2,'0')).join(''))
          .then(console.log);
   2. Add a new entry to the resumes array below.
   3. Drop the PDF into Admin/resumes/ with matching filename.
*/
window.RESUME_CONFIG = {
    resumes: [
        {
            hash:     '855ce6489207eff8d2c830bb74012fe5beece4980aa5ddffe8e4e1e55a0c3e4d',
            industry: 'Healthcare',
            file:     'resumes/healthcare.pdf',
            icon:     '\u{1F3E5}'
        },
        {
            hash:     'f125a06e61497cd5ccbadd5e3c1418a270af4c42f62c7f88783a157e77981427',
            industry: 'Finance',
            file:     'resumes/finance.pdf',
            icon:     '\u{1F4B0}'
        },
        {
            hash:     'e57fcf9130a8154f4dddb103cdb9abb4db0aac94f81f879c209f6c530339bc34',
            industry: 'Education',
            file:     'resumes/education.pdf',
            icon:     '\u{1F393}'
        },
        {
            hash:     '71ad716e562ce56963afd1db2d3934d68205a2dde6624fada37b18cde3cd6e1b',
            industry: 'Technology',
            file:     'resumes/technology.pdf',
            icon:     '\u{1F4BB}'
        },
        {
            hash:     '0abcfb49a64bea10e061da7ab94c7f4294f1e7e100083d40d9b2de9b313414d8',
            industry: 'Government',
            file:     'resumes/government.pdf',
            icon:     '\u{1F3DB}\uFE0F'
        },
        {
            hash:     'bcbc9804c46b36ee3a6f8801821a4256eca3175f0a913f12f506ecc1edc07d07',
            industry: 'Retail',
            file:     'resumes/retail.pdf',
            icon:     '\u{1F6CD}\uFE0F'
        }
    ]
};
