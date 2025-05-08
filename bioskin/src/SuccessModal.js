// src/SuccessModal.js
import React from 'react';
import { FaCheckCircle } from 'react-icons/fa';
import './SuccessModal.css';

function SuccessModal({ onClose }) {
  return (
    <div className="modal-overlay" onClick={onClose}> {/* Close on overlay click */}
      <div className="modal-content" onClick={(e) => e.stopPropagation()}> {/* Prevent closing when clicking inside modal */}
        <div className="modal-icon success">
          <FaCheckCircle />
        </div>
        <h2 className="modal-title">ALL GOOD!</h2>
        <p className="modal-message">Product was saved into the inventory</p>
        <button className="button modal-close-button" onClick={onClose}>
          OK
        </button>
      </div>
    </div>
  );
}

export default SuccessModal;