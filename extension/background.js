chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !tab.url?.startsWith("https://monemploidutemps.unistra.fr/consult/calendar")) {
    return;
  }

  try {
    await chrome.tabs.sendMessage(tab.id, { type: "UEXT_TOGGLE_PANEL" });
  } catch (_error) {
    // La page n'avait probablement pas encore fini de charger.
  }
});
