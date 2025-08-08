import React from 'react';
import './LoginModal.css'; // Reusing the same styles for simplicity
import { useTranslation } from 'react-i18next';

const ContactModal = ({ isOpen, onClose }) => {
  const { t } = useTranslation();

  if (!isOpen) {
    return null;
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <button className="close-button" onClick={onClose}>&times;</button>
        <h2>{t('our_contacts')}</h2>
        <div className="contact-info">
          <pre>{t('contact_info')}</pre>
        </div>
      </div>
    </div>
  );
};

export default ContactModal;