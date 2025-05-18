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
  }
  
  main.appendChild(content);
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
  
  if (tabParam && ['invoice', 'history', 'stats'].includes(tabParam)) {
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
