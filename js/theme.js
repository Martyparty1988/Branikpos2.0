// theme.js - Správa tmavého/světlého režimu
import { loadData, saveData, LS_KEYS } from './data.js';

// Výchozí téma (light/dark)
const DEFAULT_THEME = 'light';

// Inicializace tématu
export function initTheme() {
  // Zkontrolujeme, zda má prohlížeč preferované barevné schéma
  const prefersDarkScheme = window.matchMedia('(prefers-color-scheme: dark)');
  
  // Načtení uloženého tématu nebo použití preference systému
  const savedTheme = loadData(LS_KEYS.THEME, prefersDarkScheme.matches ? 'dark' : DEFAULT_THEME);
  
  // Nastavení tématu
  setTheme(savedTheme);
  
  // Přidání event listeneru na přepínač
  const themeToggle = document.getElementById('themeToggle');
  if (themeToggle) {
    themeToggle.addEventListener('click', toggleTheme);
  }
  
  // Sledování změny preference systému
  prefersDarkScheme.addEventListener('change', (event) => {
    // Pokud uživatel explicitně nevybral téma, sledujeme systémové preference
    const currentTheme = loadData(LS_KEYS.THEME, null);
    if (!currentTheme) {
      setTheme(event.matches ? 'dark' : 'light');
    }
  });
  
  // Přidání meta tagu pro barevné schéma prohlížeče
  updateMetaThemeColor(savedTheme);
}

// Nastavení tématu
export function setTheme(theme) {
  document.documentElement.setAttribute('data-theme', theme);
  saveData(LS_KEYS.THEME, theme);
  
  // Aktualizace meta tagu pro barevné schéma prohlížeče
  updateMetaThemeColor(theme);
}

// Přepnutí tématu
export function toggleTheme() {
  const currentTheme = document.documentElement.getAttribute('data-theme') || DEFAULT_THEME;
  const newTheme = currentTheme === 'light' ? 'dark' : 'light';
  
  setTheme(newTheme);
}

// Aktualizace meta tagu pro barevné schéma prohlížeče
function updateMetaThemeColor(theme) {
  let metaThemeColor = document.querySelector('meta[name=theme-color]');
  
  // Pokud meta tag neexistuje, vytvoříme ho
  if (!metaThemeColor) {
    metaThemeColor = document.createElement('meta');
    metaThemeColor.name = 'theme-color';
    document.head.appendChild(metaThemeColor);
  }
  
  // Nastavíme barvu podle tématu
  metaThemeColor.content = theme === 'dark' ? '#1e293b' : '#6366f1';
}
