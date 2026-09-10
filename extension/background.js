const UNISTRA_ORIGIN = "https://monemploidutemps.unistra.fr";

function isUnistraSchedulePage(url) {
  try {
    return new URL(url).origin === UNISTRA_ORIGIN;
  } catch (_error) {
    return false;
  }
}

async function togglePanel(tabId) {
  const response = await chrome.tabs.sendMessage(tabId, { type: "UEXT_TOGGLE_PANEL" });
  if (!response?.ok) {
    throw new Error(response?.message || "Le panneau n'a pas répondu.");
  }
}

chrome.action.onClicked.addListener(async (tab) => {
  if (!tab.id || !isUnistraSchedulePage(tab.url)) return;

  try {
    await togglePanel(tab.id);
    return;
  } catch (_error) {
    // Le script peut être absent si l'onglet était déjà ouvert lors de l'installation.
  }

  try {
    await chrome.scripting.insertCSS({
      target: { tabId: tab.id },
      files: ["styles.css"]
    });
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      files: ["content.js"]
    });
    await togglePanel(tab.id);
  } catch (error) {
    console.warn("Unistra Schedule n'a pas pu ouvrir le panneau.", error);
  }
});
