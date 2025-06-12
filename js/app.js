// app.js - Hlavní vstupní bod aplikace
import { loadData, saveData, DEFAULT_KURZ, DEFAULT_ITEMS, CATEGORIES, LS_KEYS } from './data.js';
import { renderInvoice } from './invoice.js';
import { renderHistory } from './history.js';
import { renderStats } from './stats.js';
import { initModal, showModal, closeModal } from './ui.js';
import { showSettings } from './settings.js';
import { initTheme } from './theme.js';

// Globální stav aplikace
export let stav = {
  kurz: loadData(LS_KEYS.KURZ, DEFAULT_KURZ),
  items: loadData(LS_KEYS.ITEMS, DEFAULT_ITEMS),
  historie: loadData(LS_KEYS.HIST, []),
  settings: loadData(LS_KEYS.SETTINGS, { mena: "Kč" }),
  tab: "invoice"
};

// Aktualizuje stav a znovu vykreslí
export function updateState(newState) {
  stav = { ...stav, ...newState };
  renderApp();
}

// Přepínání záložek
export function switchTab(tab) {
  stav.tab = tab;
  document.querySelectorAll(".tab-btn").forEach(b => 
    b.classList.toggle("active", b.dataset.tab === tab)
  );
  renderApp();
}

// Hlavní render funkce
function renderApp() {
  const main = document.getElementById("app");
  main.innerHTML = ''; // Vyčistit obsah

  const content = document.createElement('div');
  content.className = 'fade-in';
  
  switch (stav.tab) {
    case "invoice":
      renderInvoice(content);
      break;
    case "history":
      renderHistory(content);
      break;
    case "stats":
      renderStats(content);
      break;
    case "settings":
      // Jednoduchý obsah záložky nastavení místo samostatného modulu
      renderSettingsContent(content);
      break;
  }
  
  main.appendChild(content);
}

// Render obsahu záložky nastavení přímo v app.js
function renderSettingsContent(container) {
  // Přidání záhlaví stránky
  const pageHeader = document.createElement('div');
  pageHeader.className = 'page-header';
  pageHeader.innerHTML = '<h2 class="page-title">Nastavení aplikace</h2>';
  container.appendChild(pageHeader);
  
  // Sekce vzhledu aplikace
  const appearanceCard = document.createElement('div');
  appearanceCard.className = 'card';
  
  const cardHeader = document.createElement('div');
  cardHeader.className = 'card-header';
  cardHeader.innerHTML = '<h3 class="card-title">Vzhled aplikace</h3>';
  
  const cardContent = document.createElement('div');
  cardContent.className = 'card-content';
  
  // Přepínač tmavého režimu
  const themeCard = document.createElement('div');
  themeCard.className = 'theme-toggle-card';
  
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  
  const themeTitle = document.createElement('h3');
  themeTitle.textContent = 'Barevný režim';
  themeCard.appendChild(themeTitle);
  
  const themeToggleBtn = document.createElement('button');
  themeToggleBtn.className = 'btn btn-primary';
  themeToggleBtn.textContent = currentTheme === 'light' ? 'Přepnout na tmavý režim' : 'Přepnout na světlý režim';
  themeToggleBtn.innerHTML = (currentTheme === 'light' 
    ? '<span><svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z" /></svg></span>'
    : '<span><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" /></svg></span>') 
    + (currentTheme === 'light' ? ' Přepnout na tmavý režim' : ' Přepnout na světlý režim');
  
  themeToggleBtn.addEventListener('click', () => {
    const theme = document.documentElement.getAttribute('data-theme') || 'light';
    const newTheme = theme === 'light' ? 'dark' : 'light';
    document.documentElement.setAttribute('data-theme', newTheme);
    saveData(LS_KEYS.THEME, newTheme);
    
    // Aktualizace tlačítka
    themeToggleBtn.innerHTML = (newTheme === 'light' 
      ? '<span><svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z" /></svg></span>' 
      : '<span><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" /></svg></span>') 
      + (newTheme === 'light' ? ' Přepnout na tmavý režim' : ' Přepnout na světlý režim');
    
    // Aktualizace meta tagu pro barevné schéma prohlížeče
    let metaThemeColor = document.querySelector('meta[name=theme-color]');
    if (metaThemeColor) {
      metaThemeColor.content = newTheme === 'dark' ? '#1e293b' : '#6366f1';
    }
  });
  
  themeCard.appendChild(themeToggleBtn);
  cardContent.appendChild(themeCard);
  
  appearanceCard.appendChild(cardHeader);
  appearanceCard.appendChild(cardContent);
  container.appendChild(appearanceCard);
  
  // Sekce nastavení kurzu měny
  const currencyCard = document.createElement('div');
  currencyCard.className = 'card';
  
  const currencyHeader = document.createElement('div');
  currencyHeader.className = 'card-header';
  currencyHeader.innerHTML = '<h3 class="card-title">Nastavení kurzu měny</h3>';
  
  const currencyContent = document.createElement('div');
  currencyContent.className = 'card-content';
  
  const formGroup = document.createElement('div');
  formGroup.className = 'form-group';
  
  const rateLabel = document.createElement('label');
  rateLabel.className = 'form-label';
  rateLabel.htmlFor = 'kurzInput';
  rateLabel.textContent = 'Kurz Kč/€:';
  
  const rateInput = document.createElement('input');
  rateInput.type = 'number';
  rateInput.className = 'form-control';
  rateInput.id = 'kurzInput';
  rateInput.min = 0.01;
  rateInput.step = 0.01;
  rateInput.value = stav.kurz || DEFAULT_KURZ;
  rateInput.required = true;
  
  formGroup.appendChild(rateLabel);
  formGroup.appendChild(rateInput);
  
  const saveRateBtn = document.createElement('button');
  saveRateBtn.className = 'btn btn-primary';
  saveRateBtn.textContent = 'Uložit kurz';
  saveRateBtn.addEventListener('click', () => {
    const value = parseFloat(rateInput.value);
    
    if (isNaN(value) || value <= 0) {
      showToast('Zadejte platnou hodnotu kurzu', 'error');
      return;
    }
    
    // Uložení kurzu
    saveData(LS_KEYS.KURZ, value);
    
    // Aktualizace stavu
    updateState({ kurz: value });
    
    // Notifikace
    showToast('Kurz byl úspěšně aktualizován', 'success');
  });
  
  formGroup.appendChild(saveRateBtn);
  currencyContent.appendChild(formGroup);
  
  const resetRateBtn = document.createElement('button');
  resetRateBtn.className = 'btn btn-secondary';
  resetRateBtn.textContent = 'Obnovit výchozí kurz';
  resetRateBtn.addEventListener('click', () => {
    rateInput.value = DEFAULT_KURZ;
    
    // Uložení výchozího kurzu
    saveData(LS_KEYS.KURZ, DEFAULT_KURZ);
    
    // Aktualizace stavu
    updateState({ kurz: DEFAULT_KURZ });
    
    // Notifikace
    showToast('Kurz byl obnoven na výchozí hodnotu', 'success');
  });
  
  currencyContent.appendChild(resetRateBtn);
  
  currencyCard.appendChild(currencyHeader);
  currencyCard.appendChild(currencyContent);
  container.appendChild(currencyCard);
  
  // Sekce správy položek
  const itemsCard = document.createElement('div');
  itemsCard.className = 'card';
  
  const itemsHeader = document.createElement('div');
  itemsHeader.className = 'card-header';
  itemsHeader.innerHTML = '<h3 class="card-title">Správa položek</h3>';
  
  const itemsContent = document.createElement('div');
  itemsContent.className = 'card-content';
  
  const manageItemsBtn = document.createElement('button');
  manageItemsBtn.className = 'btn btn-primary';
  manageItemsBtn.innerHTML = '<span><svg viewBox="0 0 24 24" width="16" height="16"><path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" fill="currentColor"/></svg></span> Otevřít správu položek';
  manageItemsBtn.addEventListener('click', showSettings);
  
  itemsContent.appendChild(manageItemsBtn);
  
  itemsCard.appendChild(itemsHeader);
  itemsCard.appendChild(itemsContent);
  container.appendChild(itemsCard);
  
  // Sekce správy dat
  const dataCard = document.createElement('div');
  dataCard.className = 'card';
  
  const dataHeader = document.createElement('div');
  dataHeader.className = 'card-header';
  dataHeader.innerHTML = '<h3 class="card-title">Správa dat</h3>';
  
  const dataContent = document.createElement('div');
  dataContent.className = 'card-content';
  
  const resetAppBtn = document.createElement('button');
  resetAppBtn.className = 'btn btn-danger';
  resetAppBtn.innerHTML = '<span><svg viewBox="0 0 24 24" width="16" height="16"><path d="M12,3A9,9 0 0,0 3,12H0L4,16L8,12H5A7,7 0 0,1 12,5A7,7 0 0,1 19,12A7,7 0 0,1 12,19C10.5,19 9.09,18.5 7.94,17.7L6.5,19.14C8.04,20.3 9.94,21 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3Z" fill="currentColor"/></svg></span> Obnovit tovární nastavení';
  resetAppBtn.addEventListener('click', () => {
    const modal = document.getElementById('modal');
    const modalContent = document.getElementById('modalContent');
    
    const container = document.createElement('div');
    container.className = 'confirm-dialog';
    
    const message = document.createElement('p');
    message.className = 'confirm-message';
    message.textContent = 'Opravdu chcete obnovit tovární nastavení? Všechny vlastní položky i historie budou smazány!';
    container.appendChild(message);
    
    const buttonsContainer = document.createElement('div');
    buttonsContainer.className = 'confirm-buttons';
    
    const confirmButton = document.createElement('button');
    confirmButton.className = 'btn btn-danger';
    confirmButton.textContent = 'Potvrdit';
    confirmButton.addEventListener('click', () => {
      // Smazání všech dat
      localStorage.clear();
      
      // Obnovení výchozích hodnot
      const defaultState = {
        kurz: DEFAULT_KURZ,
        items: DEFAULT_ITEMS,
        historie: [],
        settings: { mena: "Kč" }
      };
      
      // Aktualizace stavu
      updateState(defaultState);
      
      // Notifikace
      showToast('Aplikace byla obnovena do výchozího stavu', 'success');
      
      // Zavření modálního okna
      modal.classList.remove('active');
    });
    
    const cancelButton = document.createElement('button');
    cancelButton.className = 'btn btn-outline';
    cancelButton.textContent = 'Zrušit';
    cancelButton.addEventListener('click', () => {
      modal.classList.remove('active');
    });
    
    buttonsContainer.appendChild(cancelButton);
    buttonsContainer.appendChild(confirmButton);
    container.appendChild(buttonsContainer);
    
    modalContent.innerHTML = '';
    modalContent.appendChild(container);
    modal.classList.add('active');
  });
  
  dataContent.appendChild(resetAppBtn);
  
  dataCard.appendChild(dataHeader);
  dataCard.appendChild(dataContent);
  container.appendChild(dataCard);
}

// Pomocná funkce pro zobrazení toast notifikací
function showToast(message, type = 'info') {
  const toast = document.getElementById('toast');
  if (!toast) return;
  
  // Ikony podle typu
  const icons = {
    success: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M12,2A10,10 0 0,1 22,12A10,10 0 0,1 12,22A10,10 0 0,1 2,12A10,10 0 0,1 12,2M12,4A8,8 0 0,0 4,12A8,8 0 0,0 12,20A8,8 0 0,0 20,12A8,8 0 0,0 12,4M11,16.5L6.5,12L7.91,10.59L11,13.67L16.59,8.09L18,9.5L11,16.5Z" /></svg>',
    error: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13,13H11V7H13M13,17H11V15H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>',
    info: '<svg viewBox="0 0 24 24" width="24" height="24"><path fill="currentColor" d="M13,9H11V7H13M13,17H11V11H13M12,2A10,10 0 0,0 2,12A10,10 0 0,0 12,22A10,10 0 0,0 22,12A10,10 0 0,0 12,2Z" /></svg>'
  };
  
  toast.innerHTML = `
    ${icons[type] || icons.info}
    <div class="toast-content">${message}</div>
  `;
  
  toast.className = `toast toast-${type} show`;
  
  setTimeout(() => {
    toast.className = 'toast';
  }, 3000);
}

// Inicializace aplikace
function initApp() {
  // Přepínače záložek
  document.querySelectorAll(".tab-btn").forEach(btn =>
    btn.addEventListener("click", () => switchTab(btn.dataset.tab))
  );

  // Nastavení
  document.getElementById("settingsBtn").addEventListener("click", showSettings);
  
  // Inicializace modálního okna
  initModal();
  
  // Inicializace přepínače témat
  initTheme();
  
  // Zaregistrovat service worker pro offline režim
  registerServiceWorker();
  
  // Kontrola URL parametrů pro přímé přepnutí na záložku
  checkUrlParams();
  
  // Vykreslit aplikaci
  renderApp();
  
  // Přidat listener pro změnu velikosti okna
  window.addEventListener('resize', handleResize);
}

// Service worker pro offline režim
function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    window.addEventListener('load', () => {
      // Použití relativní cesty namísto absolutní
      navigator.serviceWorker.register('./service-worker.js')
        .then(registration => {
          console.log('ServiceWorker registered: ', registration);
        })
        .catch(error => {
          console.log('ServiceWorker registration failed: ', error);
        });
    });
  }
}

// Kontrola URL parametrů - např. ?tab=history
function checkUrlParams() {
  const urlParams = new URLSearchParams(window.location.search);
  const tabParam = urlParams.get('tab');
  
  if (tabParam && ['invoice', 'history', 'stats', 'settings'].includes(tabParam)) {
    switchTab(tabParam);
  }
}

// Handler pro resize okna
function handleResize() {
  // Přidání nebo odebrání třídy pro mobilní zařízení
  if (window.innerWidth <= 768) {
    document.body.classList.add('mobile-view');
  } else {
    document.body.classList.remove('mobile-view');
  }
  
  // Aktualizace rozhraní
  renderApp();
}

// Po načtení stránky
window.addEventListener('DOMContentLoaded', initApp);

// Exporty pro globální použití (pro kompatibilitu se starým kódem)
window.closeModal = closeModal;
window.showModal = showModal;
