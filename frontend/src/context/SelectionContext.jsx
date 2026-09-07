import React, { createContext, useContext, useState, useEffect } from 'react';
import { hasAdminSession, useAdminSession } from '../services/adminSession';

const SelectionContext = createContext();

const LOCAL_STORAGE_KEY = 'selectedHairStyles';
const LEGACY_STORAGE_KEY = 'selectedProducts';
const VERSION_KEY = 'selectionDataVersion';
const CURRENT_VERSION = 'v2-real-products'; // bump this whenever products change

export const SelectionProvider = ({ children }) => {
  const isAdmin = useAdminSession();
  const [selectedStyles, setSelectedStyles] = useState(() => {
    try {
      // Clear old selections if product data version changed
      const savedVersion = localStorage.getItem(VERSION_KEY);
      if (savedVersion !== CURRENT_VERSION) {
        localStorage.removeItem(LOCAL_STORAGE_KEY);
        localStorage.removeItem(LEGACY_STORAGE_KEY);
        localStorage.setItem(VERSION_KEY, CURRENT_VERSION);
        return [];
      }
      const saved = localStorage.getItem(LOCAL_STORAGE_KEY) || localStorage.getItem(LEGACY_STORAGE_KEY);
      return saved ? JSON.parse(saved) : [];
    } catch (e) {
      console.error('Failed to parse selectedHairStyles from localStorage', e);
      return [];
    }
  });

  // Sync to localStorage under key selectedHairStyles on state change
  useEffect(() => {
    try {
      localStorage.setItem(LOCAL_STORAGE_KEY, JSON.stringify(selectedStyles));
    } catch (e) {
      console.error('Failed to save selectedHairStyles to localStorage', e);
    }
  }, [selectedStyles]);

  // Check if style is selected
  const isStyleSelected = (styleId) => {
    return hasAdminSession() && selectedStyles.some((s) => s.id === styleId);
  };

  // Toggle selection state safely (avoids duplicate selections)
  const toggleStyleSelection = (style) => {
    if (!hasAdminSession()) return;
    setSelectedStyles((prev) => {
      const exists = prev.some((s) => s.id === style.id);
      if (exists) {
        return prev.filter((s) => s.id !== style.id);
      } else {
        return [...prev, style];
      }
    });
  };

  // Explicitly remove style by ID
  const removeStyle = (styleId) => {
    if (!hasAdminSession()) return;
    setSelectedStyles((prev) => prev.filter((s) => s.id !== styleId));
  };

  // Clear all selections
  const clearSelection = () => {
    if (!hasAdminSession()) return;
    setSelectedStyles([]);
    try {
      localStorage.removeItem(LOCAL_STORAGE_KEY);
      localStorage.removeItem(LEGACY_STORAGE_KEY);
    } catch (e) {
      // ignore
    }
  };

  return (
    <SelectionContext.Provider
      value={{
        selectedStyles: isAdmin ? selectedStyles : [],
        selectedProducts: isAdmin ? selectedStyles : [], // Compatibility alias
        selectedCount: isAdmin ? selectedStyles.length : 0,
        isStyleSelected,
        isSelected: isStyleSelected, // Compatibility alias
        toggleStyleSelection,
        toggleSelect: toggleStyleSelection, // Compatibility alias
        removeStyle,
        removeProduct: removeStyle, // Compatibility alias
        clearSelection
      }}
    >
      {children}
    </SelectionContext.Provider>
  );
};

export const useSelection = () => {
  const context = useContext(SelectionContext);
  if (!context) {
    throw new Error('useSelection must be used within a SelectionProvider');
  }
  return context;
};
