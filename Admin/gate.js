// The staging links are AES-GCM encrypted with a key derived from the access code,
// so neither the code nor the links appear in the page source.
(function () {
  var SEALED = {
    iter: 310000,
    salt: 'd3y+f3fWD/B51+QD4vTzpQ==',
    iv: 'OHmom092yPA88YIF',
    data: 'LR8I2EtAFYX6Sgct5frisx6ZpyUCpk1qjkNcg+YSFwLpG4gj53DS7g4f4UA3aRwAQZRX7i6m176PmZzuCxQfIH9dRJdwiUIWghTYBh9eyc31OeZu7p+JxnSZcP4GoeQU3bwMw0grSEZKJiU8pDyccjUzL5czru4ZQBz0DFhomnJWWy72kybvQsGogZsk9/OmvsS5AnjxEBneO/av0uGI530S7Kw0rD5D2j+ouKWOdHEIg1h62MDUTIkccTaUVEdKkyrhy8Gh/H8ud2nueEU2TPBaW2tjtw==',
  };
  var form = document.getElementById('gate');
  var input = document.getElementById('code');
  var go = document.getElementById('go');
  var err = document.getElementById('err');
  var fails = 0;

  function bytes(b64) {
    return Uint8Array.from(atob(b64), function (c) { return c.charCodeAt(0); });
  }

  function unseal(code) {
    var subtle = window.crypto.subtle;
    return subtle.importKey('raw', new TextEncoder().encode(code), 'PBKDF2', false, ['deriveKey'])
      .then(function (base) {
        return subtle.deriveKey({ name: 'PBKDF2', salt: bytes(SEALED.salt), iterations: SEALED.iter, hash: 'SHA-256' },
          base, { name: 'AES-GCM', length: 256 }, false, ['decrypt']);
      })
      .then(function (key) { return subtle.decrypt({ name: 'AES-GCM', iv: bytes(SEALED.iv) }, key, bytes(SEALED.data)); })
      .then(function (plain) { return JSON.parse(new TextDecoder().decode(plain)); });
  }

  form.addEventListener('submit', function (e) {
    e.preventDefault();
    var code = input.value.replace(/\s+/g, '');
    if (!code) return;
    go.disabled = true;
    err.textContent = '';
    unseal(code).then(function (links) {
      document.getElementById('main-link').href = links.main;
      document.getElementById('alt-link').href = links.alt;
      form.hidden = true;
      document.getElementById('open').hidden = false;
    }).catch(function () {
      fails += 1;
      input.value = '';
      err.textContent = 'Incorrect code.';
      // Slow down repeated guessing.
      setTimeout(function () { go.disabled = false; input.focus(); }, Math.min(30000, 1000 * Math.pow(2, fails - 1)));
    });
  });
})();
