'use strict';

(() => {
  const tabs = Array.from(document.querySelectorAll('[role="tab"]'));
  const study = document.querySelector('.system-study');
  const panels = Array.from(document.querySelectorAll('[role="tabpanel"]'));

  function selectTab(tab, moveFocus = false) {
    if (!tab || !study) return;
    for (const current of tabs) {
      const selected = current === tab;
      current.setAttribute('aria-selected', String(selected));
      current.tabIndex = selected ? 0 : -1;
      current.classList.toggle('is-active', selected);
    }
    for (const panel of panels) panel.hidden = panel.id !== tab.getAttribute('aria-controls');
    study.dataset.active = tab.dataset.system;
    if (moveFocus) tab.focus();
  }

  for (const tab of tabs) {
    tab.addEventListener('click', () => selectTab(tab));
    tab.addEventListener('keydown', (event) => {
      const i = tabs.indexOf(tab);
      let next;
      if (event.key === 'ArrowDown' || event.key === 'ArrowRight') next = (i + 1) % tabs.length;
      if (event.key === 'ArrowUp' || event.key === 'ArrowLeft') next = (i - 1 + tabs.length) % tabs.length;
      if (event.key === 'Home') next = 0;
      if (event.key === 'End') next = tabs.length - 1;
      if (next !== undefined) {
        event.preventDefault();
        selectTab(tabs[next], true);
      }
    });
  }

})();
