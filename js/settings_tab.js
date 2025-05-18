// settings_tab.js - Záložka nastavení
import { stav, updateState } from './app.js';
import { 
  saveData, 
  loadData, 
  LS_KEYS, 
  DEFAULT_KURZ, 
  DEFAULT_ITEMS,
  CATEGORIES,
  clearLocalStorageData 
} from './data.js';
import { 
  createEl, 
  confirmAction 
} from './utils.js';
import {
  createCard,
  createButton,
  notifySuccess,
  notifyError,
  confirmDialog
} from './ui.js';
import { toggleTheme } from './theme.js';
import { showSettings } from './settings.js';

// Render záložky nastavení
export function renderSettingsTab(container) {
  // Přidání záhlaví stránky
  const pageHeader = createEl('div', { className: 'page-header' }, [
    createEl('h2', { className: 'page-title' }, 'Nastavení aplikace')
  ]);
  container.appendChild(pageHeader);
  
  // Přidání sekcí nastavení
  container.appendChild(createAppearanceSection());
  container.appendChild(createCurrencySection());
  container.appendChild(createItemsSection());
  container.appendChild(createDataSection());
}

// Sekce vzhledu aplikace
function createAppearanceSection() {
  const content = createEl('div', { className: 'settings-section' });
  
  // Přepínač tmavého režimu
  const themeCard = createEl('div', { className: 'theme-toggle-card' });
  const currentTheme = document.documentElement.getAttribute('data-theme') || 'light';
  
  themeCard.appendChild(createEl('h3', {}, 'Barevný režim'));
  
  const themeToggleBtn = createButton(
    currentTheme === 'light' ? 'Přepnout na tmavý režim' : 'Přepnout na světlý režim', 
    toggleTheme, 
    { 
      type: 'primary',
      icon: currentTheme === 'light' 
        ? '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M17.75,4.09L15.22,6.03L16.13,9.09L13.5,7.28L10.87,9.09L11.78,6.03L9.25,4.09L12.44,4L13.5,1L14.56,4L17.75,4.09M21.25,11L19.61,12.25L20.2,14.23L18.5,13.06L16.8,14.23L17.39,12.25L15.75,11L17.81,10.95L18.5,9L19.19,10.95L21.25,11M18.97,15.95C19.8,15.87 20.69,17.05 20.16,17.8C19.84,18.25 19.5,18.67 19.08,19.07C15.17,23 8.84,23 4.94,19.07C1.03,15.17 1.03,8.83 4.94,4.93C5.34,4.53 5.76,4.17 6.21,3.85C6.96,3.32 8.14,4.21 8.06,5.04C7.79,7.9 8.75,10.87 10.95,13.06C13.14,15.26 16.1,16.22 18.97,15.95M17.33,17.97C14.5,17.81 11.7,16.64 9.53,14.5C7.36,12.31 6.2,9.5 6.04,6.68C3.23,9.82 3.34,14.64 6.35,17.66C9.37,20.67 14.19,20.78 17.33,17.97Z" /></svg>'
        : '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12,7A5,5 0 0,1 17,12A5,5 0 0,1 12,17A5,5 0 0,1 7,12A5,5 0 0,1 12,7M12,9A3,3 0 0,0 9,12A3,3 0 0,0 12,15A3,3 0 0,0 15,12A3,3 0 0,0 12,9M12,2L14.39,5.42C13.65,5.15 12.84,5 12,5C11.16,5 10.35,5.15 9.61,5.42L12,2M3.34,7L7.5,6.65C6.9,7.16 6.36,7.78 5.94,8.5C5.5,9.24 5.25,10 5.11,10.79L3.34,7M3.36,17L5.12,13.23C5.26,14 5.53,14.78 5.95,15.5C6.37,16.24 6.91,16.86 7.5,17.37L3.36,17M20.65,7L18.88,10.79C18.74,10 18.47,9.23 18.05,8.5C17.63,7.78 17.1,7.15 16.5,6.64L20.65,7M20.64,17L16.5,17.36C17.09,16.85 17.62,16.22 18.04,15.5C18.46,14.77 18.73,14 18.87,13.21L20.64,17M12,22L9.59,18.56C10.33,18.83 11.14,19 12,19C12.82,19 13.63,18.83 14.37,18.56L12,22Z" /></svg>'
    }
  );
  themeCard.appendChild(themeToggleBtn);
  
  content.appendChild(themeCard);
  
  return createCard('Vzhled aplikace', content);
}

// Sekce pro nastavení měn
function createCurrencySection() {
  const content = createEl('div', { className: 'settings-section' });
  
  // Formulář pro nastavení kurzu
  const formGroup = createEl('div', { className: 'form-group' });
  
  const rateInput = createEl('input', {
    type: 'number',
    className: 'form-control',
    id: 'kurzInput',
    min: 0.01,
    step: 0.01,
    value: stav.kurz || DEFAULT_KURZ,
    required: true
  });
  
  const rateLabel = createEl('label', { 
    className: 'form-label',
    for: 'kurzInput'
  }, 'Kurz Kč/€:');
  
  formGroup.appendChild(rateLabel);
  formGroup.appendChild(rateInput);
  
  // Tlačítko pro uložení kurzu
  const saveRateBtn = createButton('Uložit kurz', () => {
    const value = parseFloat(rateInput.value);
    
    if (isNaN(value) || value <= 0) {
      notifyError('Zadejte platnou hodnotu kurzu');
      return;
    }
    
    // Uložení kurzu
    saveData(LS_KEYS.KURZ, value);
    
    // Aktualizace stavu
    updateState({ kurz: value });
    
    // Notifikace
    notifySuccess('Kurz byl úspěšně aktualizován');
  }, { type: 'primary' });
  
  formGroup.appendChild(saveRateBtn);
  content.appendChild(formGroup);
  
  // Tlačítko pro obnovení výchozího kurzu
  const resetRateBtn = createButton('Obnovit výchozí kurz', () => {
    rateInput.value = DEFAULT_KURZ;
    
    // Uložení výchozího kurzu
    saveData(LS_KEYS.KURZ, DEFAULT_KURZ);
    
    // Aktualizace stavu
    updateState({ kurz: DEFAULT_KURZ });
    
    // Notifikace
    notifySuccess('Kurz byl obnoven na výchozí hodnotu');
  }, { type: 'secondary' });
  
  content.appendChild(resetRateBtn);
  
  return createCard('Nastavení kurzu měny', content);
}

// Sekce pro správu položek
function createItemsSection() {
  const content = createEl('div', { className: 'settings-section' });
  
  // Tlačítko pro správu položek
  const manageItemsBtn = createButton('Otevřít správu položek', showSettings, {
    type: 'primary',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M3,6H21V8H3V6M3,11H21V13H3V11M3,16H21V18H3V16Z" fill="currentColor"/></svg>'
  });
  
  content.appendChild(manageItemsBtn);
  
  return createCard('Správa položek', content);
}

// Sekce pro správu dat
function createDataSection() {
  const content = createEl('div', { className: 'settings-section' });
  
  // Tlačítko pro obnovení továrního nastavení
  const resetAppBtn = createButton('Obnovit tovární nastavení', () => {
    confirmDialog(
      'Opravdu chcete obnovit tovární nastavení? Všechny vlastní položky i historie budou smazány!',
      () => {
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
        notifySuccess('Aplikace byla obnovena do výchozího stavu');
      }
    );
  }, { 
    type: 'danger',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M12,3A9,9 0 0,0 3,12H0L4,16L8,12H5A7,7 0 0,1 12,5A7,7 0 0,1 19,12A7,7 0 0,1 12,19C10.5,19 9.09,18.5 7.94,17.7L6.5,19.14C8.04,20.3 9.94,21 12,21A9,9 0 0,0 21,12A9,9 0 0,0 12,3Z" fill="currentColor"/></svg>'
  });
  
  content.appendChild(resetAppBtn);
  
  // Vyčištění starých dat pro řešení problémů s localStorage
  const cleanDataBtn = createButton('Vyčistit starou historii', () => {
    confirmDialog(
      'Chcete vyčistit starší účtenky a ponechat pouze nejnovější? Toto může pomoci při problémech s úložištěm.',
      () => {
        if (clearLocalStorageData()) {
          // Načtení aktualizovaných dat
          const updatedState = {
            kurz: loadData(LS_KEYS.KURZ, DEFAULT_KURZ),
            items: loadData(LS_KEYS.ITEMS, DEFAULT_ITEMS),
            historie: loadData(LS_KEYS.HIST, []),
            settings: loadData(LS_KEYS.SETTINGS, { mena: "Kč" })
          };
          
          // Aktualizace stavu
          updateState(updatedState);
          
          // Notifikace
          notifySuccess('Starší data byla vyčištěna');
        } else {
          notifyError('Při čištění dat došlo k chybě');
        }
      }
    );
  }, { 
    type: 'warning',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19,4H15.5L14.5,3H9.5L8.5,4H5V6H19M6,19A2,2 0 0,0 8,21H16A2,2 0 0,0 18,19V7H6V19Z" fill="currentColor"/></svg>'
  });
  
  content.appendChild(cleanDataBtn);
  
  return createCard('Správa dat', content);
}
