'use strict';
(() => {
  const dialog = document.getElementById('dealer-dialog');
  const open = document.getElementById('dealer-open');
  const form = document.getElementById('dealer-form');
  const status = form.querySelector('.dealer-status');
  const submit = form.querySelector('.dealer-submit');
  open.addEventListener('click', () => { dialog.showModal(); });
  dialog.querySelector('.dealer-close').addEventListener('click', () => dialog.close());
  dialog.addEventListener('click', event => { if (event.target === dialog) dialog.close(); });
  form.addEventListener('submit', async event => {
    event.preventDefault();
    status.hidden = false;
    status.textContent = 'Başvurunuz gönderiliyor…';
    submit.disabled = true;
    try {
      const response = await fetch('/api/dealer', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(Object.fromEntries(new FormData(form)))
      });
      if (!response.ok) throw new Error('Gönderim başarısız');
      form.reset();
      status.textContent = 'Başvurunuz alındı. En kısa sürede sizinle iletişime geçeceğiz.';
    } catch (_) {
      status.textContent = 'Başvurunuz gönderilemedi. Lütfen daha sonra tekrar deneyin.';
    } finally {
      submit.disabled = false;
    }
  });
})();
