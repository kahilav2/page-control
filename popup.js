function normalizeHostname(url) {
  return url.replace('www.','');
}

function reloadActiveTab() {
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const activeTab = tabs[0];
    chrome.tabs.reload(activeTab.id);
  });
}

document.addEventListener('DOMContentLoaded', () => {
  const hideImagesCheckbox = document.getElementById('hideImages');
  const weakenIframesCheckbox = document.getElementById('weakenIframes');
  const listTypeSpan = document.getElementById('listType');
  const addToListButton = document.getElementById('addToList');
  const siteURLSpan = document.getElementById('siteURL');
  const openSettingsButton = document.getElementById('openSettings');
  const siteOnList = document.getElementById('siteOnList');
  // Set addToListButton text
  (async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentURL = new URL(tabs[0].url);
    const result = await chrome.storage.sync.get([
      'exceptionType',
      'hideImages',
      'exceptionWebsites',
    ]);
    addToListButton.style.display = "none";
    if (tabs[0].url.startsWith('chrome://')) {
      return
    }

    if (result.exceptionWebsites && result.exceptionWebsites.includes(currentURL.origin)) {
      addToListButton.style.display = "none";
      siteOnList.style.display = "block";
      siteOnList.textContent = `This site is on your image ${ result.exceptionType } list`;
    } else {
      addToListButton.style.display = "block";
    }

    siteURLSpan.textContent = normalizeHostname(currentURL.hostname);
    listTypeSpan.textContent = result.exceptionType || 'whitelist';
  })()

  // Handle addToListButton click event
  addToListButton.addEventListener('click', async () => {
    const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
    const currentURL = new URL(tabs[0].url);
    const normalizedCurrentHostname = normalizeHostname(currentURL.hostname)
    let result = await chrome.storage.sync.get([
      'exceptionWebsites',
      'exceptionType',
    ]);
    const exceptionType = result.exceptionType || 'whitelist';
    const exceptionWebsites = result.exceptionWebsites || [];
    const normalizedList = exceptionWebsites.map((url)=>normalizeHostname((new URL(url).hostname)))
    if (!normalizedList.includes(normalizedCurrentHostname)) {
      exceptionWebsites.push(currentURL.origin);
      await chrome.storage.sync.set({ exceptionWebsites, exceptionType });
      document.getElementById("AddPageOkInfo").style.display = "block";
      document.getElementById("AddPageExistsInfo").style.display = "none";
      addToListButton.style.display = "none";
      reloadActiveTab();
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
