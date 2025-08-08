import React, { useState } from 'react';
import './Gallery.css';
import { useTranslation } from 'react-i18next';

const galleryData = {
  living_rooms: {
    'Original': '/Gallery/living-room-original.jpg',
    'Scandinavian': '/Gallery/living-room-scandinavian.jpg',
    'Minimalist': '/Gallery/living-room-minimalist.jpg',
    'Modern': '/Gallery/living-room-modern.jpg',
    'Coastal': '/Gallery/living-room-coastal.jpg',
  },
  bedrooms: {
    'Original': '/Gallery/bedroom-original.jpg',
    'Scandinavian': '/Gallery/bedroom-scandinavian.jpg',
    'Minimalist': '/Gallery/bedroom-minimalist.jpg',
    'Modern': '/Gallery/bedroom-modern.jpg',
    'Coastal': '/Gallery/bedroom-coastal.jpg',
  },
  kitchens: {
    'Original': '/Gallery/kitchen-original.jpg',
    'Scandinavian': '/Gallery/kitchen-scandinavian.jpg',
    'Minimalist': '/Gallery/kitchen-minimalist.jpg',
    'Modern': '/Gallery/kitchen-modern.jpg',
    'Coastal': '/Gallery/kitchen-coastal.jpg',
  },
  dining_rooms: {
    'Original': '/Gallery/dining-room-original.jpg',
    'Scandinavian': '/Gallery/dining-room-scandinavian.jpg',
    'Minimalist': '/Gallery/dining-room-minimalist.jpg',
    'Modern': '/Gallery/dining-room-modern.jpg',
    'Coastal': '/Gallery/dining-room-coastal.jpg',
  },
};

const roomTypes = Object.keys(galleryData);
const styleTypes = Object.keys(galleryData[roomTypes[0]]);

const Gallery = () => {
  const { t } = useTranslation();
  const [activeRoom, setActiveRoom] = useState('bedrooms'); // Default to Bedrooms key
  const [activeStyle, setActiveStyle] = useState('Coastal'); // Default to Coastal

  const getImagePath = () => {
    return galleryData[activeRoom][activeStyle];
  };

  const getAltText = () => {
    return `Interior design for "${t(`gallery_${activeRoom}`)}" in "${activeStyle}" style`;
  }

  return (
    <div id="gallery" className="gallery-section">
      <p className="gallery-subtitle">{t('gallery_subtitle')}</p>
      <h2 className="gallery-title">{t('gallery_title')}</h2>
      <div className="gallery-container">
        <div className="room-tabs">
          {roomTypes.map(roomKey => (
            <button
              key={roomKey}
              className={`room-tab ${activeRoom === roomKey ? 'active' : ''}`}
              onClick={() => setActiveRoom(roomKey)}
            >
              {t(`gallery_${roomKey}`)}
            </button>
          ))}
        </div>
        <div className="gallery-image">
          <img src={getImagePath()} alt={getAltText()} loading="lazy" />
        </div>
        <div className="style-tabs">
          {styleTypes.map(style => (
            <button
              key={style}
              className={`style-tab ${activeStyle === style ? 'active' : ''}`}
              onClick={() => setActiveStyle(style)}
            >
              {style}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
};

export default Gallery;