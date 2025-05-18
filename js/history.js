// history.js - Zobrazení a správa historie účtenek
import { stav, updateState } from './app.js';
import { saveData, LS_KEYS } from './data.js';
import {
  createEl,
  formatDate,
  confirmAction
} from './utils.js';
import {
  createCard,
  createButton,
  notifySuccess,
  showModal,
  confirmDialog
} from './ui.js';
import { exportHistoryItemToPdf, exportCsv } from './export.js';

// Render historie účtenek
export function renderHistory(container) {
  // Přidání záhlaví stránky
  const pageHeader = createEl('div', { className: 'page-header' }, [
    createEl('h2', { className: 'page-title' }, 'Historie účtenek')
  ]);
  container.appendChild(pageHeader);
  
  // Detekce mobilního zařízení
  const isMobile = window.innerWidth <= 768;
  
  // Zobrazení prázdného stavu, pokud není historie
  if (!stav.historie || stav.historie.length === 0) {
    const emptyState = createEl('div', { className: 'empty-state' }, [
      createEl('div', { className: 'empty-state-icon' }, '📋'),
      createEl('h3', { className: 'empty-state-title' }, 'Zatím nemáte žádné účtenky'),
      createEl('p', { className: 'empty-state-text' }, 'Vytvořte novou účtenku a bude se zobrazovat zde.')
    ]);
    container.appendChild(emptyState);
    return;
  }
  
  // Zobrazení počtu účtenek a možnost exportu
  const headerActions = createEl('div', { className: 'header-actions' + (isMobile ? ' mobile-header-actions' : '') });
  
  // Informace o počtu účtenek
  headerActions.appendChild(createEl('div', { 
    className: 'info-box' 
  }, [
    createEl('span', {}, `Celkem ${stav.historie.length} ${getWordForm(stav.historie.length)}`)
  ]));
  
  // Tlačítko pro export historie
  headerActions.appendChild(createButton('Exportovat historii (CSV)', exportHistorie, {
    type: 'secondary',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M14,2H6A2,2 0 0,0 4,4V20A2,2 0 0,0 6,22H18A2,2 0 0,0 20,20V8L14,2M18,20H6V4H13V9H18V20M10,19L12,15H9V11H15V15L13,19H10Z" fill="currentColor"/></svg>'
  }));
  
  container.appendChild(headerActions);
  
  // Seznam účtenek
  const historyList = createEl('div', { 
    className: 'history-list' + (isMobile ? ' mobile-history-list' : '') 
  });
  
  // Seřazení historie podle data (nejnovější nahoře)
  stav.historie.forEach((uctenka, index) => {
    const historyItem = createHistoryItem(uctenka, index);
    historyList.appendChild(historyItem);
  });
  
  container.appendChild(historyList);
  
  // Na mobilních zařízeních přidáme extra padding na konec pro lepší scrollování
  if (isMobile) {
    const extraSpace = createEl('div', { 
      style: 'height: 60px;'  // Extra prostor na konci
    });
    container.appendChild(extraSpace);
  }
}

// Vytvoření položky historie
function createHistoryItem(uctenka, index) {
  // Detekce mobilního zařízení
  const isMobile = window.innerWidth <= 768;
  
  const item = createEl('div', { 
    className: 'history-item' + (isMobile ? ' mobile-history-item' : '') 
  });
  
  // Levá část s detaily
  const itemDetails = createEl('div', { className: 'history-item-details' });
  
  // Datum
  itemDetails.appendChild(createEl('div', { 
    className: 'history-item-date' 
  }, uctenka.datum));
  
  // Jméno hosta / číslo rezervace
  const title = uctenka.hostName || uctenka.resNum || `Účtenka č. ${index + 1}`;
  itemDetails.appendChild(createEl('div', { 
    className: 'history-item-name' 
  }, title));
  
  // Dodatečné informace
  const infoItems = [];
  if (uctenka.hostName && uctenka.resNum) {
    infoItems.push(`Rezervace: ${uctenka.resNum}`);
  }
  
  if (uctenka.polozky.length > 0) {
    // Počet položek mimo dárků
    const regularItems = uctenka.polozky.filter(p => p.kategorie !== "Dárky").length;
    // Počet dárků
    const giftItems = uctenka.polozky.filter(p => p.kategorie === "Dárky").length;
    
    const itemText = `${regularItems} ${getWordForm(regularItems, 'položka', 'položky', 'položek')}`;
    if (giftItems > 0) {
      infoItems.push(`${itemText}, ${giftItems} ${getWordForm(giftItems, 'dárek', 'dárky', 'dárků')}`);
    } else {
      infoItems.push(itemText);
    }
  }
  
  if (infoItems.length > 0) {
    itemDetails.appendChild(createEl('div', {
      className: 'history-item-info'
    }, infoItems.join(' • ')));
  }
  
  item.appendChild(itemDetails);
  
  // Částka
  item.appendChild(createEl('div', {
    className: 'history-item-amount'
  }, `${uctenka.celkem} ${uctenka.mena}`));
  
  // Akce
  const itemActions = createEl('div', { className: 'history-item-actions' });
  
  // Tlačítko pro detail
  itemActions.appendChild(createButton('Detail', () => showInvoiceDetail(uctenka), {
    type: 'primary',
    size: 'sm',
    className: isMobile ? 'mobile-button' : ''
  }));
  
  // Tlačítko pro smazání
  itemActions.appendChild(createButton('Smazat', () => deleteInvoice(index), {
    type: 'danger',
    size: 'sm',
    className: isMobile ? 'mobile-button' : ''
  }));
  
  item.appendChild(itemActions);
  
  return item;
}

// Zobrazení detailu účtenky
function showInvoiceDetail(uctenka) {
  // Detekce mobilního zařízení
  const isMobile = window.innerWidth <= 768;
  
  // Vytvoření obsahu modálního okna
  const modalContent = createEl('div', { 
    className: 'invoice-detail-modal' + (isMobile ? ' mobile-modal' : '')
  });
  
  // Záhlaví modálního okna
  const modalHeader = createEl('div', { className: 'modal-header' });
  modalHeader.appendChild(createEl('h3', { className: 'modal-title' }, 'Detail účtenky'));
  modalHeader.appendChild(createEl('button', { 
    className: 'close-modal',
    innerHTML: '×',
    events: { click: () => showModal(null) }
  }));
  modalContent.appendChild(modalHeader);
  
  // Informace o účtence
  const infoSection = createEl('div', { className: 'invoice-info-section' });
  
  infoSection.appendChild(createEl('div', { className: 'info-item' }, [
    createEl('strong', {}, 'Datum: '),
    createEl('span', {}, uctenka.datum)
  ]));
  
  if (uctenka.hostName) {
    infoSection.appendChild(createEl('div', { className: 'info-item' }, [
      createEl('strong', {}, 'Host: '),
      createEl('span', {}, uctenka.hostName)
    ]));
  }
  
  if (uctenka.resNum) {
    infoSection.appendChild(createEl('div', { className: 'info-item' }, [
      createEl('strong', {}, 'Rezervace: '),
      createEl('span', {}, uctenka.resNum)
    ]));
  }
  
  modalContent.appendChild(infoSection);
  
  // Tabulka s položkami - na mobilech upravená pro lepší zobrazení
  if (isMobile) {
    const itemsList = createEl('div', { className: 'mobile-items-list' });
    
    uctenka.polozky.forEach(item => {
      const itemCard = createEl('div', { 
        className: item.kategorie === "Dárky" ? 'mobile-item-card gift-item' : 'mobile-item-card' 
      });
      
      // Název položky
      itemCard.appendChild(createEl('div', { className: 'mobile-item-name' }, 
        item.kategorie === "Dárky" ? `🎁 ${item.nazev}` : item.nazev
      ));
      
      // Detaily položky
      const itemDetails = createEl('div', { className: 'mobile-item-details' });
      
      // Počet/částka
      let countCell = '';
      if (item.kategorie === "Dárky") {
        countCell = '—';
      } else if (item.typ === "citytax" && item.osoby && item.dny) {
        countCell = `${item.osoby} os. × ${item.dny} dní`;
      } else if (item.manualni && item.castka) {
        countCell = item.castka;
      } else if (item.pocet) {
        countCell = `${item.pocet}×`;
      }
      
      if (countCell) {
        itemDetails.appendChild(createEl('div', { className: 'mobile-item-detail' }, [
          createEl('span', { className: 'mobile-item-label' }, 'Počet/částka: '),
          createEl('span', {}, countCell)
        ]));
      }
      
      // Poznámka
      if (item.poznamka) {
        itemDetails.appendChild(createEl('div', { className: 'mobile-item-detail' }, [
          createEl('span', { className: 'mobile-item-label' }, 'Poznámka: '),
          createEl('span', {}, item.poznamka)
        ]));
      }
      
      // Cena
      let priceCell = '';
      if (item.kategorie === "Dárky") {
        priceCell = '—';
      } else if (item.typ === "citytax" && item.osoby && item.dny) {
        priceCell = uctenka.mena === "€"
          ? `${(item.osoby * item.dny * item.cena)} €`
          : `${Math.round(item.osoby * item.dny * item.cena * uctenka.kurz)} Kč`;
      } else if (item.manualni && item.castka) {
        priceCell = uctenka.mena === item.mena
          ? `${item.castka} ${item.mena}`
          : (item.mena === "Kč"
            ? `${Math.round(item.castka / uctenka.kurz * 100) / 100} €`
            : `${Math.round(item.castka * uctenka.kurz)} Kč`);
      } else if (item.pocet) {
        priceCell = uctenka.mena === item.mena
          ? `${item.cena} ${item.mena}`
          : (item.mena === "Kč"
            ? `${Math.round(item.cena / uctenka.kurz * 100) / 100} €`
            : `${Math.round(item.cena * uctenka.kurz)} Kč`);
      }
      
      if (priceCell) {
        itemDetails.appendChild(createEl('div', { className: 'mobile-item-detail' }, [
          createEl('span', { className: 'mobile-item-label' }, 'Cena: '),
          createEl('span', { className: 'mobile-item-price' }, priceCell)
        ]));
      }
      
      itemCard.appendChild(itemDetails);
      itemsList.appendChild(itemCard);
    });
    
    // Celkem
    const totalCard = createEl('div', { className: 'mobile-item-card total-card' });
    totalCard.appendChild(createEl('div', { className: 'mobile-total' }, 
      `Celkem: ${uctenka.celkem} ${uctenka.mena}`
    ));
    itemsList.appendChild(totalCard);
    
    modalContent.appendChild(itemsList);
  } else {
    // Standardní tabulka pro desktopy
    const table = createEl('table', { className: 'table invoice-detail-table' });
    
    // Hlavička tabulky
    const tableHead = createEl('thead');
    const headerRow = createEl('tr');
    
    headerRow.appendChild(createEl('th', {}, 'Položka'));
    headerRow.appendChild(createEl('th', {}, 'Počet/částka'));
    headerRow.appendChild(createEl('th', {}, 'Poznámka'));
    headerRow.appendChild(createEl('th', {}, 'Cena'));
    
    tableHead.appendChild(headerRow);
    table.appendChild(tableHead);
    
    // Tělo tabulky
    const tableBody = createEl('tbody');
    
    uctenka.polozky.forEach(item => {
      const row = createEl('tr', {
        className: item.kategorie === "Dárky" ? 'gift-row' : ''
      });
      
      // Položka
      row.appendChild(createEl('td', {}, item.kategorie === "Dárky" ? `🎁 ${item.nazev}` : item.nazev));
      
      // Počet/částka
      let countCell = '';
      if (item.kategorie === "Dárky") {
        countCell = '—';
      } else if (item.typ === "citytax" && item.osoby && item.dny) {
        countCell = `${item.osoby} os. × ${item.dny} dní`;
      } else if (item.manualni && item.castka) {
        countCell = item.castka;
      } else if (item.pocet) {
        countCell = `${item.pocet}×`;
      }
      row.appendChild(createEl('td', {}, countCell));
      
      // Poznámka
      row.appendChild(createEl('td', {}, item.poznamka || ''));
      
      // Cena
      let priceCell = '';
      if (item.kategorie === "Dárky") {
        priceCell = '—';
      } else if (item.typ === "citytax" && item.osoby && item.dny) {
        priceCell = uctenka.mena === "€"
          ? `${(item.osoby * item.dny * item.cena)} €`
          : `${Math.round(item.osoby * item.dny * item.cena * uctenka.kurz)} Kč`;
      } else if (item.manualni && item.castka) {
        priceCell = uctenka.mena === item.mena
          ? `${item.castka} ${item.mena}`
          : (item.mena === "Kč"
            ? `${Math.round(item.castka / uctenka.kurz * 100) / 100} €`
            : `${Math.round(item.castka * uctenka.kurz)} Kč`);
      } else if (item.pocet) {
        priceCell = uctenka.mena === item.mena
          ? `${item.cena} ${item.mena}`
          : (item.mena === "Kč"
            ? `${Math.round(item.cena / uctenka.kurz * 100) / 100} €`
            : `${Math.round(item.cena * uctenka.kurz)} Kč`);
      }
      row.appendChild(createEl('td', {}, priceCell));
      
      tableBody.appendChild(row);
    });
    
    // Řádek s celkovou částkou
    const totalRow = createEl('tr', { className: 'total-row' });
    totalRow.appendChild(createEl('td', { 
      colSpan: 3,
      style: 'text-align: right;'
    }, 'Celkem:'));
    totalRow.appendChild(createEl('td', {}, `${uctenka.celkem} ${uctenka.mena}`));
    tableBody.appendChild(totalRow);
    
    table.appendChild(tableBody);
    modalContent.appendChild(table);
  }
  
  // Poznámka k účtence
  if (uctenka.invoiceNote) {
    modalContent.appendChild(createEl('div', { className: 'invoice-note' }, [
      createEl('strong', {}, 'Poznámka: '),
      createEl('span', {}, uctenka.invoiceNote)
    ]));
  }
  
  // Tlačítka akcí
  const actionButtons = createEl('div', { 
    className: 'modal-actions' + (isMobile ? ' mobile-modal-actions' : '') 
  });
  
  // Export do PDF
  actionButtons.appendChild(createButton('Export PDF', () => exportHistoryItemToPdf(uctenka), {
    type: 'primary',
    icon: '<svg viewBox="0 0 24 24" width="16" height="16"><path d="M19,3A2,2 0 0,1 21,5V19A2,2 0 0,1 19,21H5C3.89,21 3,20.1 3,19V5C3,3.89 3.89,3 5,3H19M10.59,10.08C10.57,10.13 10.3,11.84 8.5,14.77C8.5,14.77 5,14 5,16C5,17.5 7.5,16.5 7.5,16.5L10.08,15.15C10.08,15.15 14.62,15.8 15.5,15.07C16.5,14.25 14.46,13.08 14.46,13.08L13.5,11.08C13.5,11.08 15.18,8.62 14.58,7.92C13.85,7.29 12,9.69 12,9.69L10.59,10.08Z" fill="currentColor"/></svg>'
  }));
  
  modalContent.appendChild(actionButtons);
  
  // Zobrazení modálního okna
  showModal(modalContent);
}

// Smazání účtenky
function deleteInvoice(index) {
  confirmDialog(
    'Opravdu chcete smazat tuto účtenku?',
    () => {
      // Vytvoření kopie pole historie
      const historie = [...stav.historie];
      
      // Odstranění účtenky
      historie.splice(index, 1);
      
      // Uložení změn
      saveData(LS_KEYS.HIST, historie);
      
      // Aktualizace stavu
      updateState({ historie });
      
      // Notifikace
      notifySuccess('Účtenka byla smazána');
    }
  );
}

// Export historie do CSV
function exportHistorie() {
  const isMobile = window.innerWidth <= 768;
  
  let rows = [["Datum", "Host", "Rezervace", "Celkem", "Měna", "Položky"]];
  
  stav.historie.forEach(uctenka => {
    let polozky = uctenka.polozky
      .map(p => p.kategorie === "Dárky" 
        ? `${p.nazev} (dárek)` 
        : `${p.nazev}${p.pocet ? ` (${p.pocet}×)` : ""}`
      )
      .join(", ");
    
    rows.push([
      uctenka.datum,
      uctenka.hostName || "",
      uctenka.resNum || "",
      uctenka.celkem,
      uctenka.mena,
      polozky
    ]);
  });
  
  let csvContent = rows.map(r => r.map(cell => {
    // Escapování hodnot pro CSV
    let cellStr = String(cell || "");
    // Pokud buňka obsahuje čárky, středníky nebo uvozovky, obalíme ji uvozovkami
    if (cellStr.includes(',') || cellStr.includes(';') || cellStr.includes('"')) {
      // Zdvojení uvozovek uvnitř řetězce
      cellStr = cellStr.replace(/"/g, '""');
      return `"${cellStr}"`;
    }
    return `"${cellStr}"`;
  }).join(";")).join("\n");
  
  // Přidání BOM pro správné kódování
  const blob = new Blob(["\uFEFF" + csvContent], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  
  // Na mobilních zařízeních zkusit nejprve Web Share API
  if (isMobile && navigator.share && navigator.canShare) {
    const file = new File([blob], "historie-uctenek.csv", { type: "text/csv" });
    
    // Zkontrolovat, zda lze sdílet soubory
    const shareData = { files: [file] };
    
    if (navigator.canShare(shareData)) {
      navigator.share(shareData).then(() => {
        notifySuccess('Historie byla exportována');
      }).catch(error => {
        console.log('Sdílení selhalo, stahuji přímo...', error);
        // Fallback na přímé stažení
        downloadFile();
      });
    } else {
      // Sdílení souborů není podporováno
      downloadFile();
    }
  } else {
    // Na desktopech stáhnout přímo
    downloadFile();
  }
  
  function downloadFile() {
    const a = document.createElement("a");
    a.href = url;
    a.download = "historie-uctenek.csv";
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    // Notifikace
    notifySuccess('Historie byla exportována do CSV');
    
    // Uvolnění URL
    setTimeout(() => {
      URL.revokeObjectURL(url);
    }, 100);
  }
}

// Pomocná funkce pro správný tvar slova podle počtu
function getWordForm(count, form1 = 'účtenka', form2 = 'účtenky', form5 = 'účtenek') {
  if (count === 1) return form1;
  if (count >= 2 && count <= 4) return form2;
  return form5;
}
