// Úprava funkce renderItemRow v invoice.js - upravený blok pro počet kusů:

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
  
  // City tax nebo Osoba navíc
  if (item.typ === "citytax" || item.typ === "osobanavic") {
    // Input pro počet osob
    const osobyInput = createNumberInput(
      item.osoby || '',
      null, // Bez změny při každém vstupu
      { 
        id: `${id}-osoby`, 
        placeholder: 'Osob', 
        min: 0,
        className: isMobile ? 'small-input' : '',
        events: {
          // Aktualizovat pouze při ztrátě fokusu
          blur: (e) => {
            item.osoby = parseInt(e.target.value) || 0;
            saveData(LS_KEYS.ITEMS, stav.items);
            updateState({});
          },
          // Potvrzení enterem
          keydown: (e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          }
        }
      }
    );
    controls.appendChild(createFormField('Osob', osobyInput, { 
      className: 'mini-form' + (isMobile ? ' mobile-mini-form' : '')
    }));
    
    // Input pro počet dní
    const dnyInput = createNumberInput(
      item.dny || '',
      null, // Bez změny při každém vstupu
      { 
        id: `${id}-dny`, 
        placeholder: 'Dní', 
        min: 0,
        className: isMobile ? 'small-input' : '',
        events: {
          // Aktualizovat pouze při ztrátě fokusu
          blur: (e) => {
            item.dny = parseInt(e.target.value) || 0;
            saveData(LS_KEYS.ITEMS, stav.items);
            updateState({});
          },
          // Potvrzení enterem
          keydown: (e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          }
        }
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
      null, // Bez změny při každém vstupu
      { 
        id: `${id}-manual`, 
        placeholder: 'částka', 
        min: 0, 
        step: '0.01',
        className: 'amount-input' + (isMobile ? ' small-input' : ''),
        events: {
          // Aktualizovat pouze při ztrátě fokusu
          blur: (e) => {
            item.castka = validateAmountInput(e.target);
            saveData(LS_KEYS.ITEMS, stav.items);
            updateState({});
          },
          // Potvrzení enterem
          keydown: (e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          }
        }
      }
    );
    controls.appendChild(manualInput);
  }
  // Dárky
  else if (category === "Dárky") {
    // Poznámka k dárku
    const noteInput = createTextInput(
      item.poznamka || '',
      null, // Bez změny při každém vstupu
      { 
        id: `${id}-note`, 
        placeholder: 'Poznámka (např. welcome drink)',
        className: 'gift-note' + (isMobile ? ' small-input' : ''),
        events: {
          // Aktualizovat pouze při ztrátě fokusu
          blur: (e) => {
            item.poznamka = e.target.value;
            saveData(LS_KEYS.ITEMS, stav.items);
            updateState({});
          }
        }
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
      null, // Bez změny při každém vstupu
      { 
        id: `${id}-count`, 
        placeholder: '0',
        min: 0,
        className: 'count-input' + (isMobile ? ' small-input' : ''),
        events: {
          // Aktualizovat pouze při ztrátě fokusu
          blur: (e) => {
            item.pocet = validateNumberInput(e.target);
            saveData(LS_KEYS.ITEMS, stav.items);
            updateState({});
          },
          // Potvrzení enterem
          keydown: (e) => {
            if (e.key === 'Enter') {
              e.target.blur();
            }
          }
        }
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