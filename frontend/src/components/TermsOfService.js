import React from 'react';
import './TermsOfService.css';
import { useTranslation } from 'react-i18next';

const TermsOfService = () => {
  const { t } = useTranslation();

  return (
    <div className="terms-container">
      <h1>{t('terms_title')}</h1>
      <p className="effective-date">{t('terms_effective_date')}</p>
      <p>{t('terms_welcome')}</p>

      <h2>{t('terms_acceptance_title')}</h2>
      <p>{t('terms_acceptance_text')}</p>

      <h2>{t('terms_services_title')}</h2>
      <p>{t('terms_services_text')}</p>

      <h2>{t('terms_accounts_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('terms_accounts_text').replace(/\n/g, '<br />') }} />

      <h2>{t('terms_content_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('terms_content_text').replace(/\n/g, '<br />') }} />

      <h2>{t('terms_ip_title')}</h2>
      <p>{t('terms_ip_text')}</p>

      <div id="payments-and-subscriptions">
        <h2>{t('terms_payments_title')}</h2>
        <p dangerouslySetInnerHTML={{ __html: t('terms_payments_text').replace(/\n/g, '<br />') }} />
      </div>

      <h2>{t('terms_use_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('terms_use_text').replace(/\n/g, '<br />') }} />

      <h2>{t('terms_liability_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('terms_liability_text').replace(/\n/g, '<br />') }} />

      <h2>{t('terms_termination_title')}</h2>
      <p>{t('terms_termination_text')}</p>

      <h2>{t('terms_law_title')}</h2>
      <p>{t('terms_law_text')}</p>

      <h2>{t('terms_contact_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('terms_contact_text').replace(/\n/g, '<br />') }} />
    </div>
  );
};

export default TermsOfService;