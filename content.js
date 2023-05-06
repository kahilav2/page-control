let firstClick = true;
let timeSinceLastDoubleKeydown = null;
let bothDown = false;
const DOUBLE_KEYDOWN_TIME_LIMIT = 700; // milliseconds
let settings = {}

const iframeStyleElement = document.createElement('style');
iframeStyleElement.textContent = `
  iframe {
    pointer-events: none !important;
  }
`;

const imgHideStyleElement = document.createElement('style');
imgHideStyleElement.textContent = `
  img {
    display: none !important;
  }
`;

function weakenIframes() {
  document.head.appendChild(iframeStyleElement);
}


function strenghtenIframes() {
  document.head.removeChild(iframeStyleElement);
}


async function getSettings() {
  return new Promise((resolve) => {
    chrome.storage.sync.get(
      ['hideImages', 'weakenIframes', 'exceptionType', 'exceptionWebsites'],
      (settings) => {
        resolve(settings);
      }
    );
  });
}

(async () => {
  const s = await getSettings();
  settings.hideImages = s.hideImages || false;
  settings.weakenIframes = s.weakenIframes || false;
  settings.exceptionType = s.exceptionType || 'whitelist';
  settings.exceptionWebsites = s.exceptionWebsites || [];
  if (settings.weakenIframes) weakenIframes();
  if (settings.hideImages) {
    if ((settings.exceptionType === "whitelist" &&
      !isCurrentURLInList(settings.exceptionWebsites)) ||
      (settings.exceptionType === "blacklist" &&
      settings.hideImages && isCurrentURLInList(settings.exceptionWebsites))) {
         hideImages();
    } else {
      settings.hideImages = false;
    }
  }
  
})();


function isCurrentURLInList(urlList) {
  const currentURL = new URL(window.location.href);
  return urlList.some((url) => {
    const exceptionURL = new URL(url);
    return normalizeHostname(currentURL.hostname) === normalizeHostname(exceptionURL.hostname);
  });
}

function normalizeHostname(url) {
  return url.replace('www.','');
}

chrome.runtime.onMessage.addListener(
  (request, sender, sendResponse) => {
    if (request.hideImages !== undefined) {
      settings.hideImages = request.hideImages;
      refreshImages();
    }
    if (request.weakenIframes !== undefined) {
      if (request.weakenIframes !== settings.weakenIframes) {
        settings.weakenIframes = request.weakenIframes
        request.weakenIframes ? weakenIframes() : strenghtenIframes()
      }
    }
  }
)


function onMouseDown(e) {
  if (e.ctrlKey && e.shiftKey && e.button === 0) {
    e.preventDefault();
    e.target.remove();
    if (firstClick) {
      enableTextSelection();
      removeScrollLocks();
      firstClick = false;
    }
  }
}


function onKeyDown(e) {
  if (e.ctrlKey && e.shiftKey && !bothDown) {
    bothDown = true
    if (timeSinceLastDoubleKeydown && 
      (new Date).getTime() - timeSinceLastDoubleKeydown.getTime() < DOUBLE_KEYDOWN_TIME_LIMIT) {
        toggleImages();
        timeSinceLastDoubleKeydown = null;
    } else {
      timeSinceLastDoubleKeydown = new Date();
    }
  }
  
  if (e.ctrlKey && e.altKey) {
    settings.weakenIframes = !settings.weakenIframes

    if (settings.weakenIframes) weakenIframes()
    else strenghtenIframes()
  }
  if (e.ctrlKey && e.shiftKey) {
    const crosshairEl = document.getElementById("crosshair-style");
    if (crosshairEl) return 
    const crosshairStyles = `
      html, a, a:hover, div, div:hover {
        cursor: url('crosshair.png'), crosshair !important;
      }
    `;
    const crosshairStyleElement = document.createElement("style");
    crosshairStyleElement.id = "crosshair-style";
    crosshairStyleElement.textContent = crosshairStyles;
    document.head.appendChild(crosshairStyleElement);    
  } 
}



function onKeyUp(e) {
  if (!e.ctrlKey || !e.shiftKey) {
    bothDown = false;
  }
  if (!e.ctrlKey) {
    const crosshairStyleElement = document.getElementById("crosshair-style");
    if (crosshairStyleElement) {
      crosshairStyleElement.remove();
    }
  }
}


const hideBackgroundImageStyle = document.createElement('style');
hideBackgroundImageStyle.textContent = `
  * {
    background-image: none !important;
  }
`;


function hideImages() {
  document.head.appendChild(imgHideStyleElement);
  document.head.appendChild(hideBackgroundImageStyle);
}


function showImages() {
  document.head.removeChild(imgHideStyleElement);
  document.head.removeChild(hideBackgroundImageStyle);
}


function refreshImages() {
  settings.hideImages ? hideImages() : showImages()
}


function toggleImages() {
  settings.hideImages = !settings.hideImages;
  refreshImages()
}


function enableTextSelection() {
  const styles = `
    * {
      user-select: text !important;
      -webkit-user-select: text !important;
      -moz-user-select: text !important;
      -ms-user-select: text !important;
    }
  `;
  const styleElement = document.createElement("style");
  styleElement.textContent = styles;
  document.head.appendChild(styleElement);
}


function removeScrollLocks() {
  const elements = document.querySelectorAll("*");
  for (let element of elements) {
    element.style.overflow = "auto";
  }
  document.body.style.setProperty('position', 'unset', 'important');
  document.body.style.setProperty('position', 'auto', 'important');
}


document.addEventListener("mousedown", onMouseDown);
document.addEventListener("keydown", onKeyDown)
document.addEventListener("keyup", onKeyUp);