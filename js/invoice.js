// invoice.js - Komponenty a logika účtenky
import { stav, updateState } from './app.js';
import { 
  CATEGORIES, 
  saveData, 
  LS_KEYS, 
  vypocitejCelkem, 
  konvertujCastku, 
  formatujCastku,
  resetForm
} from './data.js';

import { 
  createEl, 
  formatDate, 
  generateId, 
  validateNumberInput, 
  validateAmountInput,
  confirmAction
} from './utils.js';

import {
  createCard, 
  createCategorySection, 
  createButton, 
  createFormField, 
  createTextInput, 
  createNumberInput, 
  createCheckbox,
  createCurrencySelector,
  notifySuccess,
  notifyError
} from './ui.js';

import { exportToPdf, exportCsv } from './export.js';

// Render účtenky
export function renderInvoice(container) {
  // Přidání záhlaví stránky
  const pageHeader = createEl('div', { className: 'page-header' }, [
    createEl('h2', { className: 'page-title' }, 'Nová účtenka')
  ]);
  container.appendChild(pageHeader);
  
  // Detekce mobilního zařízení
  const isMobile = window.innerWidth <= 768;
  
  // Na mobilních zařízeních přidáme třídu pro optimalizaci
  if (isMobile) {
    container.classList.add('mobile-view');
  }
  
  // Přidání detailů účtenky (jméno hosta, rezervace, poznámka)
  container.appendChild(renderInvoiceDetails());
  
  // Přidání výběru měny
  const currencySelector = createCurrencySelector(
    stav.settings.mena, 
    stav.kurz,
    (e) => {
      stav.settings.mena = e.target.value;
      saveData(LS_KEYS.SETTINGS, stav.settings);
      updateState({});
    }
  );
  container.appendChild(createCard('Měna', currencySelector, 'currency-card'));
  
  // Přidání sekcí s položkami
  CATEGORIES.forEach(category => {
    const categoryItems = stav.items.filter(i => i.kategorie === category && !i.skryto);
    
    // Přeskočit prázdné kategorie (kromě Dárků, ty zobrazit vždy)
    if (categoryItems.length === 0 && category !== "Dárky") return;
    
    // Speciální třída pro Dárky
    const className = category === "Dárky" ? 'gift-section' : '';
    
    const categorySection = createCategorySection(
      category, 
      categoryItems, 
      (item, index) => renderItemRow(item, index, category), 
      className
    );
    
    // Přidání tlačítka "Přidat dárek" pro kategorii Dárky
    if (category === "Dárky") {
      const addGiftBtn = createButton('Přidat dárek', addGift, {
        type: 'success',
        icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M20,11V13H13V20H11V13H4V11H11V4H13V11H20Z" fill="currentColor"/></svg>',
        className: 'add-gift-btn'
      });
      categorySection.appendChild(addGiftBtn);
    }
    
    container.appendChild(categorySection);
  });
  
  // Přidání součtu a tlačítek pro akce
  container.appendChild(renderInvoiceSummary());
  
  // Pokud je to mobilní zařízení, přidáme extra padding na konec pro lepší scrollování
  if (isMobile) {
    const extraSpace = createEl('div', { 
      style: 'height: 70px;'  // Extra prostor pod tlačítky
    });
    container.appendChild(extraSpace);
  }
}

// Render detailů účtenky
function renderInvoiceDetails() {
  const isMobile = window.innerWidth <= 768;
  
  const detailsCard = createCard('Detaily účtenky', '', 'details-card');
  const detailsContent = detailsCard.querySelector('.card-content');
  
  // Formulář pro detaily
  const formRow = createEl('div', { className: 'form-row' });
  
  // Jméno hosta
  const hostNameInput = createTextInput(
    stav.settings.hostName || '',
    (e) => {
      stav.settings.hostName = e.target.value;
      saveData(LS_KEYS.SETTINGS, stav.settings);
    },
    { 
      id: 'hostName', 
      placeholder: 'Jméno hosta',
      autocomplete: 'off' // Pro lepší mobilní zkušenost
    }
  );
  formRow.appendChild(createEl('div', { className: 'form-col' }, [
    createFormField('Jméno hosta', hostNameInput, { id: 'hostName' })
  ]));
  
  // Číslo rezervace
  const resNumInput = createTextInput(
    stav.settings.resNum || '',
    (e) => {
      stav.settings.resNum = e.target.value;
      saveData(LS_KEYS.SETTINGS, stav.settings);
    },
    { 
      id: 'reservationNum', 
      placeholder: 'Číslo rezervace',
      autocomplete: 'off' // Pro lepší mobilní zkušenost
    }
  );
  formRow.appendChild(createEl('div', { className: 'form-col' }, [
    createFormField('Číslo rezervace', resNumInput, { id: 'reservationNum' })
  ]));
  
  detailsContent.appendChild(formRow);
  
  // Druhý řádek s poznámkou a datem
  const formRow2 = createEl('div', { className: 'form-row' });
  
  // Poznámka
  const noteInput = createTextInput(
    stav.settings.invoiceNote || '',
    (e) => {
      stav.settings.invoiceNote = e.target.value;
      saveData(LS_KEYS.SETTINGS, stav.settings);
    },
    { 
      id: 'invoiceNote', 
      placeholder: 'Např. Přejeme krásný pobyt!',
      autocomplete: 'off' // Pro lepší mobilní zkušenost
    }
  );
  formRow2.appendChild(createEl('div', { className: 'form-col' }, [
    createFormField('Poznámka k účtence', noteInput, { id: 'invoiceNote' })
  ]));
  
  // Datum
  formRow2.appendChild(createEl('div', { className: 'form-col' }, [
    createEl('div', { className: 'form-group' }, [
      createEl('label', { className: 'form-label' }, 'Datum'),
      createEl('div', { className: 'form-control-static' }, formatDate())
    ])
  ]));
  
  detailsContent.appendChild(formRow2);
  
  return detailsCard;
}

// Render řádku s položkou
function renderItemRow(item, index, category) {
  const id = `item-${category}-${index}`;
  const row = createEl('div', { className: `item-row ${category === "Dárky" ? "gift-row" : ""}` });
  
  // Detekce mobilního zařízení
  const isMobile = window.innerWidth <= 768;
  
  // Název položky (upravený pro lepší mobilní zobrazení)
  const nameElement = createEl('div', { className: 'item-name' }, [
    createEl('span', {
      style: isMobile ? 'font-size: 0.9rem;' : ''  // Menší písmo na mobilech
    }, item.nazev),
    item.poznamka ? createEl('small', { 
      className: 'item-note',
      style: isMobile ? 'font-size: 0.75rem;' : ''  // Menší písmo poznámky na mobilech
    }, `(${item.poznamka})`) : null
  ]);
  row.appendChild(nameElement);
  
  // Ovládací prvky dle typu položky
  const controls = createEl('div', { className: 'item-controls' });
  
  // City tax
  if (item.typ === "citytax") {
    // Input pro počet osob
    const osobyInput = createNumberInput(
      item.osoby || '',
      (e) => {
        item.osoby = parseInt(e.target.value) || 0;
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { 
        id: `${id}-osoby`, 
        placeholder: 'Osob', 
        min: 0,
        className: isMobile ? 'small-input' : ''  // Menší vstup na mobilech
      }
    );
    controls.appendChild(createFormField('Osob', osobyInput, { 
      className: 'mini-form' + (isMobile ? ' mobile-mini-form' : '')
    }));
    
    // Input pro počet dní
    const dnyInput = createNumberInput(
      item.dny || '',
      (e) => {
        item.dny = parseInt(e.target.value) || 0;
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { 
        id: `${id}-dny`, 
        placeholder: 'Dní', 
        min: 0,
        className: isMobile ? 'small-input' : ''  // Menší vstup na mobilech
      }
    );
    controls.appendChild(createFormField('Dní', dnyInput, { 
      className: 'mini-form' + (isMobile ? ' mobile-mini-form' : '')
    }));
  }
  // Manuální položky (např. wellness)
  else if (item.manualni) {
    const manualInput = createNumberInput(
      item.castka || '',
      (e) => {
        item.castka = validateAmountInput(e.target);
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { 
        id: `${id}-manual`, 
        placeholder: 'částka', 
        min: 0, 
        step: '0.01',
        className: 'amount-input' + (isMobile ? ' small-input' : '')
      }
    );
    controls.appendChild(manualInput);
  }
  // Dárky
  else if (category === "Dárky") {
    // Poznámka k dárku
    const noteInput = createTextInput(
      item.poznamka || '',
      (e) => {
        item.poznamka = e.target.value;
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { 
        id: `${id}-note`, 
        placeholder: 'Poznámka (např. welcome drink)',
        className: 'gift-note' + (isMobile ? ' small-input' : '')
      }
    );
    controls.appendChild(noteInput);
    
    // Checkbox pro výběr
    const checkbox = createCheckbox(
      item.vybrano || false,
      (e) => {
        item.vybrano = e.target.checked;
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { 
        id: `${id}-select`,
        className: isMobile ? 'mobile-checkbox' : ''
      }
    );
    controls.appendChild(checkbox);
  }
  // Standardní položky s počtem kusů
  else {
    const countInput = createNumberInput(
      item.pocet || '',
      (e) => {
        item.pocet = validateNumberInput(e.target);
        saveData(LS_KEYS.ITEMS, stav.items);
        updateState({});
      },
      { 
        id: `${id}-count`, 
        placeholder: '0',
        min: 0,
        className: 'count-input' + (isMobile ? ' small-input' : '')
      }
    );
    controls.appendChild(countInput);
  }
  
  row.appendChild(controls);
  
  // Cena - upravená pro lepší zobrazení na mobilech
  const cenaStr = category === "Dárky" 
    ? "—" 
    : formatujCenu(item);
  
  row.appendChild(createEl('div', { 
    className: 'item-price',
    style: isMobile ? 'font-size: 0.9rem;' : ''  // Menší písmo ceny na mobilech
  }, cenaStr));
  
  return row;
}

// Formátování ceny položky
function formatujCenu(item) {
  // Pro manuální položku zobrazujeme zadanou částku
  if (item.manualni && item.castka) {
    return stav.settings.mena === item.mena
      ? `${item.castka} ${item.mena}`
      : `${konvertujCastku(item.castka, item.mena, stav.settings.mena, stav.kurz)} ${stav.settings.mena}`;
  }
  
  // Pro standardní položku zobrazujeme základní cenu
  if (stav.settings.mena === item.mena) {
    return `${item.cena} ${item.mena}`;
  } 
  else if (stav.settings.mena === "€" && item.mena === "Kč") {
    return `${Math.round(item.cena / stav.kurz * 100) / 100} €`;
  } 
  else if (stav.settings.mena === "Kč" && item.mena === "€") {
    return `${Math.round(item.cena * stav.kurz)} Kč`;
  }
  
  return `${item.cena} ${item.mena}`;
}

// Render souhrnu účtenky
function renderInvoiceSummary() {
  const sum = vypocitejCelkem(stav.items, stav.settings, stav.kurz);
  const summaryContainer = createEl('div', { className: 'invoice-summary' });
  
  // Detekce mobilního zařízení
  const isMobile = window.innerWidth <= 768;
  
  // Celková částka
  summaryContainer.appendChild(createEl('div', { 
    className: 'total-amount' 
  }, `Celkem k platbě: ${sum.celkova} ${stav.settings.mena}`));
  
  // Sleva pokud existuje
  if (sum.sleva > 0) {
    summaryContainer.appendChild(createEl('div', { 
      className: 'discount-info' 
    }, `Sleva/akce: -${sum.sleva} ${stav.settings.mena}`));
  }
  
  // Tlačítka pro akce
  const actionButtons = createEl('div', { 
    className: 'action-buttons' + (isMobile ? ' mobile-actions' : '')
  });
  
  // Uložit účtenku
  const saveBtn = createButton('Uložit účtenku', ulozUctenku, {
    type: 'primary',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M15,9H5V5H15M12,19A3,3 0 0,1 9,16A3,3 0 0,1 12,13A3,3 0 0,1 15,16A3,3 0 0,1 12,19M17,3H5C3.89,3 3,3.9 3,5V19A2,2 0 0,0 5,21H19A2,2 0 0,0 21,19V7L17,3Z" fill="currentColor"/></svg>'
  });
  actionButtons.appendChild(saveBtn);
  
  // Na mobilech optimalizujeme počet tlačítek - jen nejdůležitější
  if (!isMobile) {
    // Export PDF
    const pdfBtn = createButton('Export PDF', exportToPdf, {
      type: 'secondary',
      icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19M10.59,10.08C10.57,10.13 10.3,11.84 8.5,14.77C8.5,14.77 5,14 5,16C5,17.5 7.5,16.5 7.5,16.5L10.08,15.15C10.08,15.15 14.62,15.8 15.5,15.07C16.5,14.25 14.46,13.08 14.46,13.08L13.5,11.08C13.5,11.08 15.18,8.62 14.58,7.92C13.85,7.29 12,9.69 12,9.69L10.59,10.08Z" fill="currentColor"/></svg>'
    });
    actionButtons.appendChild(pdfBtn);
    
    // Export CSV
    const csvBtn = createButton('Export CSV', exportCsv, {
      type: 'secondary',
      icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L10.9,15H13.3L12.2,19H15L16,15H13.8L14.7,11H11.8L10.9,15H8.6L9.5,11H7L6,15H8.2L7.1,19H10Z" fill="currentColor"/></svg>'
    });
    actionButtons.appendChild(csvBtn);
  } else {
    // Na mobilech přidáme rozklikávací tlačítko pro export
    const exportBtn = createButton('Export', (e) => {
      // Jednoduchý dropdown
      const button = e.currentTarget;
      const dropdownId = 'export-dropdown';
      
      // Odstraníme existující dropdown, pokud existuje
      const existingDropdown = document.getElementById(dropdownId);
      if (existingDropdown) {
        existingDropdown.remove();
        return;
      }
      
      const dropdown = createEl('div', { 
        id: dropdownId,
        className: 'export-dropdown',
        style: 'position: absolute; bottom: 50px; right: 16px; background: var(--color-surface); box-shadow: var(--sha
