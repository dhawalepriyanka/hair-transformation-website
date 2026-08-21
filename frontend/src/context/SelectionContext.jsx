import React, { createContext, useContext, useState, useEffect } from 'react';

const SelectionContext = createContext();

const LOCAL_STORAGE_KEY = 'selectedHairStyles';
const LEGACY_STORAGE_KEY = 'selectedProducts';

export const SelectionProvider = ({ children }) => {
  const [selectedStyles, setSelectedStyles] = useState(() => {
    try {
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
    return selectedStyles.some((s) => s.id === styleId);
  };

  // Toggle selection state safely (avoids duplicate selections)
  const toggleStyleSelection = (style) => {
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
    setSelectedStyles((prev) => prev.filter((s) => s.id !== styleId));
  };

  // Clear all selections
  const clearSelection = () => {
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
        selectedStyles,
        selectedProducts: selectedStyles, // Compatibility alias
        selectedCount: selectedStyles.length,
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
