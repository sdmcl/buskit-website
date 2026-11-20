(() => {
  const tabList = document.querySelector(".products-tabs");
  if (!tabList) return;

  const tabs = Array.from(tabList.querySelectorAll("a[href^='#']"));
  const panels = tabs.map((tab) => document.getElementById(tab.hash.slice(1)));
  if (!tabs.length || panels.some((panel) => !panel)) return;

  function showTab(selectedIndex) {
    tabs.forEach((tab, index) => {
      const isSelected = index === selectedIndex;
      tab.setAttribute("aria-selected", String(isSelected));
      tab.tabIndex = isSelected ? 0 : -1;
      panels[index].hidden = !isSelected;
    });
  }

  function selectFromLocation() {
    const index = tabs.findIndex((tab) => tab.hash === window.location.hash);
    const activeIndex = index < 0 ? 0 : index;
    const targetWasHidden = panels[activeIndex].hidden;
    showTab(activeIndex);
    if (index >= 0 && targetWasHidden) tabList.scrollIntoView({ block: "start" });
  }

  function activateTab(index, replaceHistory = false) {
    showTab(index);
    const hash = tabs[index].hash;
    if (window.location.hash === hash) return;
    if (replaceHistory) history.replaceState(history.state, "", hash);
    else history.pushState(history.state, "", hash);
  }

  tabList.setAttribute("role", "tablist");
  tabList.setAttribute("aria-label", "Sistemas BUSKIT");
  tabs.forEach((tab, index) => {
    const panel = panels[index];
    tab.setAttribute("role", "tab");
    tab.setAttribute("aria-controls", panel.id);
    panel.setAttribute("role", "tabpanel");
    panel.setAttribute("aria-labelledby", tab.id);
    panel.tabIndex = 0;

    tab.addEventListener("click", (event) => {
      if (event.ctrlKey || event.metaKey || event.shiftKey || event.altKey || event.button !== 0) return;
      event.preventDefault();
      activateTab(index);
    });

    tab.addEventListener("keydown", (event) => {
      if (event.altKey || event.ctrlKey || event.metaKey || event.shiftKey) return;
      let nextIndex;
      switch (event.key) {
        case "Home": nextIndex = 0; break;
        case "End": nextIndex = tabs.length - 1; break;
        case "ArrowLeft": nextIndex = (index - 1 + tabs.length) % tabs.length; break;
        case "ArrowRight": nextIndex = (index + 1) % tabs.length; break;
        case " ": nextIndex = index; break;
        default: return;
      }
      event.preventDefault();
      activateTab(nextIndex, true);
      tabs[nextIndex].focus();
    });
  });

  const initialIndex = tabs.findIndex((tab) => tab.hash === window.location.hash);
  showTab(initialIndex < 0 ? 0 : initialIndex);
  window.addEventListener("hashchange", selectFromLocation);
})();
