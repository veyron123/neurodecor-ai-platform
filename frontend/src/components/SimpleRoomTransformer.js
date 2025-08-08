import React, { useState, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { api } from '../utils/api';
import { helpers } from '../utils/helpers';
import { ROOM_TYPES, FURNITURE_STYLES } from '../utils/constants';
import './SimpleRoomTransformer.css';

const SimpleRoomTransformer = ({ credits, deductCredit }) => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [originalUrl, setOriginalUrl] = useState(null);
  const [transformedUrl, setTransformedUrl] = useState(null);
  const [roomType, setRoomType] = useState('bedroom');
  const [furnitureStyle, setFurnitureStyle] = useState('scandinavian');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState(null);
  const fileInputRef = useRef(null);

  const handleImageUpload = (file) => {
    const validation = helpers.validateFile(file);
    if (!validation.valid) {
      setError(validation.error);
      return;
    }

    setError(null);
    setSelectedImage(file);
    
    // Clean up previous URLs
    if (originalUrl) helpers.revokeImageUrl(originalUrl);
    if (transformedUrl) helpers.revokeImageUrl(transformedUrl);
    
    setOriginalUrl(helpers.createImageUrl(file));
    setTransformedUrl(null);
  };

  const handleTransform = async () => {
    if (!selectedImage || credits <= 0 || isLoading) return;

    setIsLoading(true);
    setError(null);

    try {
      const blob = await api.transformImage(selectedImage, roomType, furnitureStyle);
      setTransformedUrl(helpers.createImageUrl(blob));
      deductCredit();
    } catch (error) {
      setError(error.message);
    } finally {
      setIsLoading(false);
    }
  };

  const canTransform = selectedImage && roomType && furnitureStyle && !isLoading && credits > 0;

  return (
    <div className="room-transformer-simple">
      <div className="upload-section">
        <h3>{t('upload_image_title')}</h3>
        
        <div 
          className="upload-area"
          onClick={() => fileInputRef.current?.click()}
        >
          {originalUrl ? (
            <img src={originalUrl} alt="Original" className="uploaded-image" />
          ) : (
            <div className="upload-placeholder">
              <p>{t('drag_drop_or_click')}</p>
            </div>
          )}
        </div>

        <input
          type="file"
          ref={fileInputRef}
          accept="image/jpeg,image/png"
          onChange={(e) => e.target.files[0] && handleImageUpload(e.target.files[0])}
          style={{ display: 'none' }}
        />

        {error && <div className="error-message">{error}</div>}
      </div>

      <div className="controls-section">
        <div className="control-group">
          <label htmlFor="room-type-select">{t('room_type')}</label>
          <select 
            id="room-type-select"
            value={roomType} 
            onChange={(e) => setRoomType(e.target.value)}
          >
            {Object.entries(ROOM_TYPES).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        <div className="control-group">
          <label htmlFor="furniture-style-select">{t('furniture_style')}</label>
          <select 
            id="furniture-style-select"
            value={furnitureStyle} 
            onChange={(e) => setFurnitureStyle(e.target.value)}
          >
            {Object.entries(FURNITURE_STYLES).map(([id, label]) => (
              <option key={id} value={id}>{label}</option>
            ))}
          </select>
        </div>

        <button 
          onClick={handleTransform}
          disabled={!canTransform}
          className="transform-button"
        >
          {isLoading ? t('processing') : t('transform_button')}
          {credits > 0 && ` (${credits} ${t('credits')})`}
        </button>
      </div>

      {transformedUrl && (
        <div className="result-section">
          <h3>{t('transformed_result')}</h3>
          <div className="comparison-view">
            <div className="image-pair">
              <div className="image-container">
                <img src={originalUrl} alt="Original" />
                <span>{t('original')}</span>
              </div>
              <div className="image-container">
                <img src={transformedUrl} alt="Transformed" />
                <span>{t('transformed')}</span>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default SimpleRoomTransformer;