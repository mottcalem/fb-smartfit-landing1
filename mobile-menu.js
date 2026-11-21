'use strict';

{
  const toggle = document.querySelector('.mobile-menu-toggle');
  const nav = document.getElementById('main-nav');
  const mobile = window.matchMedia('(max-width: 700px)');
  const isOpen = () => toggle.getAttribute('aria-expanded') === 'true';

  function closeMenu(restoreFocus = false) {
    toggle.setAttribute('aria-expanded', 'false');
    if (restoreFocus) toggle.focus();
  }

  toggle.addEventListener('click', () => {
    toggle.setAttribute('aria-expanded', String(!isOpen()));
  });

  document.addEventListener('click', event => {
    if (!isOpen() || toggle.contains(event.target)) return;
    if (nav.contains(event.target) && !event.target.closest('a')) return;
    closeMenu(nav.contains(event.target));
  });

  document.addEventListener('keydown', event => {
    if (event.key === 'Escape' && isOpen()) closeMenu(true);
  });

  mobile.addEventListener('change', () => closeMenu());
}
