// Tech Medic Respons — site behaviour: mobile nav, dropdowns, tabs.
(function () {
  var toggle = document.querySelector('.nav-toggle');
  var nav = document.querySelector('.nav-main');

  if (toggle && nav) {
    toggle.addEventListener('click', function () {
      var isOpen = nav.classList.toggle('is-open');
      toggle.classList.toggle('is-active', isOpen);
      toggle.setAttribute('aria-expanded', String(isOpen));
    });
  }

  // Dropdown toggling: click-based so it works the same on touch and desktop.
  document.querySelectorAll('.has-dropdown > button.nav-link').forEach(function (btn) {
    btn.addEventListener('click', function (e) {
      e.preventDefault();
      var parent = btn.closest('.has-dropdown');
      var wasOpen = parent.classList.contains('open');
      document.querySelectorAll('.has-dropdown.open').forEach(function (el) {
        if (el !== parent) el.classList.remove('open');
      });
      parent.classList.toggle('open', !wasOpen);
      btn.setAttribute('aria-expanded', String(!wasOpen));
    });
  });

  document.addEventListener('click', function (e) {
    if (!e.target.closest('.has-dropdown')) {
      document.querySelectorAll('.has-dropdown.open').forEach(function (el) {
        el.classList.remove('open');
      });
    }
  });

  // Close mobile nav when a link is clicked.
  document.querySelectorAll('.nav-main a').forEach(function (a) {
    a.addEventListener('click', function () {
      if (window.innerWidth <= 900 && nav) {
        nav.classList.remove('is-open');
        if (toggle) { toggle.classList.remove('is-active'); toggle.setAttribute('aria-expanded', 'false'); }
      }
    });
  });

  // Tabs (used on opleidingen.html and materialen.html).
  document.querySelectorAll('[data-tabs]').forEach(function (tabGroup) {
    var buttons = tabGroup.querySelectorAll('.tab-btn');
    var panels = tabGroup.querySelectorAll('.tab-panel');
    buttons.forEach(function (btn) {
      btn.addEventListener('click', function () {
        var target = btn.getAttribute('data-tab');
        buttons.forEach(function (b) { b.classList.toggle('active', b === btn); });
        panels.forEach(function (p) { p.classList.toggle('active', p.getAttribute('data-panel') === target); });
        history.replaceState(null, '', '#' + target);
      });
    });
    var hash = window.location.hash.replace('#', '');
    if (hash) {
      var match = tabGroup.querySelector('.tab-btn[data-tab="' + hash + '"]');
      if (match) match.click();
    }
  });

  // Basic contact form handling (no backend wired up yet).
  var form = document.querySelector('#contact-form');
  if (form) {
    form.addEventListener('submit', function (e) {
      e.preventDefault();
      var note = form.querySelector('.form-note');
      if (note) {
        note.textContent = 'Bedankt! Dit formulier is nog niet gekoppeld aan een verzendservice — neem voor nu telefonisch of per e-mail contact op.';
      }
    });
  }
})();
