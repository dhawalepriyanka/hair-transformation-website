import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useSelection } from '../context/SelectionContext';
import { Scissors, ArrowRight } from 'lucide-react';

const SelectionBar = () => {
  const { selectedCount, clearSelection } = useSelection();
  const navigate = useNavigate();

  if (selectedCount === 0) return null;

  return (
    <div className="selection-bar">
      <div className="selection-info">
        <Scissors size={20} color="#C88A75" />
        <span>
          <span className="selection-count-pill">{selectedCount}</span>{' '}
          {selectedCount === 1 ? 'Style Selected' : 'Styles Selected'}
        </span>
      </div>

      <div className="selection-actions">
        <button
          className="btn-clear-selection"
          onClick={clearSelection}
          type="button"
          title="Clear all selections"
        >
          Clear Selection
        </button>

        <button
          className="btn-view-selected"
          onClick={() => navigate('/selected-styles')}
          type="button"
        >
          View Selected Styles <ArrowRight size={16} />
        </button>
      </div>
    </div>
  );
};

export default SelectionBar;
