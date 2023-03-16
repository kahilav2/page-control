chrome.action.onClicked.addListener(function (tab) {
  if (tab.url?.startsWith("chrome://")) return undefined;
  
  chrome.scripting.executeScript({
    target: { tabId: tab.id },
    files: ["content.js"],
  });
});
  