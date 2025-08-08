import React from 'react';
import './TermsOfService.css'; // Reusing the same styles
import { useTranslation } from 'react-i18next';

const PrivacyPolicy = () => {
  const { t } = useTranslation();

  return (
    <div className="terms-container">
      <h1>{t('privacy_title')}</h1>
      <p className="effective-date">{t('privacy_effective_date')}</p>
      <p>{t('privacy_intro')}</p>

      <h2>{t('privacy_info_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('privacy_info_text').replace(/\n/g, '<br />') }} />

      <h2>{t('privacy_how_we_use_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('privacy_how_we_use_text').replace(/\n/g, '<br />') }} />

      <h2>{t('privacy_third_party_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('privacy_third_party_text').replace(/\n/g, '<br />') }} />

      <h2>{t('privacy_cookies_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('privacy_cookies_text').replace(/\n/g, '<br />') }} />

      <h2>{t('privacy_uploads_title')}</h2>
      <p>{t('privacy_uploads_text')}</p>

      <h2>{t('privacy_storage_title')}</h2>
      <p>{t('privacy_storage_text')}</p>

      <h2>{t('privacy_rights_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('privacy_rights_text').replace(/\n/g, '<br />') }} />

      <h2>{t('privacy_contact_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('privacy_contact_text').replace(/\n/g, '<br />') }} />

      <h2>{t('privacy_updates_title')}</h2>
      <p dangerouslySetInnerHTML={{ __html: t('privacy_updates_text').replace(/\n/g, '<br />') }} />
    </div>
  );
};

export default PrivacyPolicy;