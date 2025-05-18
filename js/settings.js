// Funkce showSettings - úprava pro zajištění funkčnosti
export function showSettings() {
  // Vytvoření obsahu modálního okna
  const modalContent = createEl('div', { className: 'settings-modal' });
  
  // Záhlaví modálního okna
  const modalHeader = createEl('div', { className: 'modal-header' });
  modalHeader.appendChild(createEl('h3', { className: 'modal-title' }, 'Nastavení'));
  modalHeader.appendChild(createEl('button', { 
    className: 'close-modal',
    innerHTML: '×',
    events: { 
      click: () => {
        const modal = document.getElementById('modal');
        modal.classList.remove('active');
      }
    }
  }));
  modalContent.appendChild(modalHeader);
  
  // Sekce - Kurz měny
  modalContent.appendChild(createCurrencyRateSection());
  
  // Sekce - Správa položek
  modalContent.appendChild(createItemsManagementSection());
  
  // Sekce - Obecné nastavení
  modalContent.appendChild(createGeneralSettingsSection());
  
  // Zobrazení modálního okna
  const modal = document.getElementById('modal');
  const modalContentElement = document.getElementById('modalContent');
  modalContentElement.innerHTML = '';
  modalContentElement.appendChild(modalContent);
  modal.classList.add('active');
}

// Upravíme sekci pro nastavení kurzu měny
function createCurrencyRateSection() {
  const sectionContent = createEl('div', { className: 'settings-section' });
  
  // Formulář pro nastavení kurzu
  const formGroup = createEl('div', { className: 'form-group' });
  
  // Vstup pro kurz
  const rateInput = createNumberInput(
    stav.kurz || DEFAULT_KURZ,
    (e) => {
      // Validace vstupu
      const value = parseFloat(e.target.value);
      if (isNaN(value) || value <= 0) {
        e.target.setCustomValidity('Zadejte platnou hodnotu kurzu');
      } else {
        e.target.setCustomValidity('');
      }
    },
    {
      id: 'kurzInput',
      min: 0.01,
      step: 0.01,
      required: true
    }
  );
  
  formGroup.appendChild(createFormField('Kurz Kč/€:', rateInput, {
    id: 'kurzInput',
    required: true
  }));
  
  // Tlačítko pro uložení kurzu
  const saveRateBtn = createButton('Uložit kurz', () => {
    const input = document.getElementById('kurzInput');
    if (!input) return;
    
    const value = parseFloat(input.value);
    
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
  sectionContent.appendChild(formGroup);
  
  // Tlačítko pro obnovení výchozího kurzu
  const resetRateBtn = createButton('Obnovit výchozí kurz', () => {
    const input = document.getElementById('kurzInput');
    if (input) input.value = DEFAULT_KURZ;
    
    // Uložení výchozího kurzu
    saveData(LS_KEYS.KURZ, DEFAULT_KURZ);
    
    // Aktualizace stavu
    updateState({ kurz: DEFAULT_KURZ });
    
    // Notifikace
    notifySuccess('Kurz byl obnoven na výchozí hodnotu');
  }, { type: 'secondary' });
  
  sectionContent.appendChild(resetRateBtn);
  
  return createCard('Nastavení kurzu měny', sectionContent);
}
