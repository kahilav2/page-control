function normalizeHostname(url) {
  return url.replace('www.','');
}

document.addEventListener('DOMContentLoaded', () => {
  const hideImagesCheckbox = document.getElementById('hideImages');
  const weakenIframesCheckbox = document.getElementById('weakenIframes');
  const listTypeSpan = document.getElementById('listType');
  const addToListButton = document.getElementById('addToList');
  const siteURLSpan = document.getElementById('siteURL');
  const openSettingsButton = document.getElementById('openSettings');

  // Set addToListButton text
  (async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentURL = new URL(tabs[0].url);
    const result = await chrome.storage.sync.get([
      'exceptionType',
      'hideImages'
    ]);
    if (("hideImages" in result && result.hideImages === false) ||
      tabs[0].url.startsWith('chrome://')) {
      return
    }
    addToListButton.style.display = "block";
    
    siteURLSpan.textContent = normalizeHostname(currentURL.hostname);
    listTypeSpan.textContent = result.exceptionType;
  })()

  // Handle addToListButton click event
  addToListButton.addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentURL = new URL(tabs[0].url);
    const normalizedCurrentHostname = normalizeHostname(currentURL.hostname)
    const { exceptionWebsites } = await chrome.storage.sync.get('exceptionWebsites') || [];
    const normalizedList = exceptionWebsites.map((url)=>normalizeHostname((new URL(url).hostname)))
    if (!normalizedList.includes(normalizedCurrentHostname)) {
      exceptionWebsites.push(currentURL.origin);
      await chrome.storage.sync.set({ exceptionWebsites });
      document.getElementById("AddPageOkInfo").style.display = "block";
      document.getElementById("AddPageExistsInfo").style.display = "none";
    } else {
      document.getElementById("AddPageExistsInfo").style.display = "block";
      document.getElementById("AddPageOkInfo").style.display = "none";
    }
  });  

  (async () => {
    const { hideImages } = await chrome.storage.sync.get('hideImages');
    hideImagesCheckbox.checked = hideImages;
  })();

  (async () => {
    const { weakenIframes } = await chrome.storage.sync.get('weakenIframes');
    weakenIframesCheckbox.checked = weakenIframes;
  })();
  
  hideImagesCheckbox.addEventListener('change', async () => {
    await chrome.storage.sync.set({ hideImages: hideImagesCheckbox.checked });
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0].url?.startsWith("chrome://")) return undefined;
    await chrome.tabs.sendMessage(tabs[0].id, { hideImages: hideImagesCheckbox.checked });
  });

  weakenIframesCheckbox.addEventListener('change', async () => {
    await chrome.storage.sync.set({ weakenIframes: weakenIframesCheckbox.checked });
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    if (tabs[0].url?.startsWith("chrome://")) return undefined;
    await chrome.tabs.sendMessage(tabs[0].id, { weakenIframes: weakenIframesCheckbox.checked })
  });

  openSettingsButton.addEventListener('click', () => {
    chrome.runtime.openOptionsPage();
  }); 
});
