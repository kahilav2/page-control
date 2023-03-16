document.addEventListener('DOMContentLoaded', async () => {
  const hideImagesCheckbox = document.getElementById('hideImages');
  const weakenIframesCheckbox = document.getElementById('weakenIframes');
  const exceptionTypeSelect = document.getElementById('exceptionType');
  const exceptionWebsitesTextarea = document.getElementById('exceptionWebsites');
  const saveButton = document.getElementById('save');

  const settings = await chrome.storage.sync.get([
    'hideImages',
    'weakenIframes',
    'exceptionType',
    'exceptionWebsites',
  ]);

  hideImagesCheckbox.checked = settings.hideImages || false;
  weakenIframesCheckbox.checked = settings.weakenIframes || false;
  exceptionTypeSelect.value = settings.exceptionType || 'whitelist';
  exceptionWebsitesTextarea.value = (settings.exceptionWebsites || []).join('\n');

  saveButton.addEventListener('click', async () => {
    const exceptionWebsites = exceptionWebsitesTextarea.value.split('\n').filter((url) => url === '');
    try {
      exceptionWebsites.every((item) => new URL(item))
    } catch(err) {
      // Validation has failed
      document.getElementById('exceptionWebsitesError').style.display = "block";
      document.getElementById('settingsSavedInfo').style.display = "none";
      return
    }
    await chrome.storage.sync.set({
      hideImages: hideImagesCheckbox.checked,
      weakenIframes: weakenIframesCheckbox.checked,
      exceptionType: exceptionTypeSelect.value,
      exceptionWebsites: exceptionWebsitesTextarea.value.split('\n').filter((item) => item.trim() !== ''),
    });
    document.getElementById('exceptionWebsitesError').style.display = "none";
    document.getElementById('settingsSavedInfo').style.display = "block";
  });
});
