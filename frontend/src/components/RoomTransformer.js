import React, { useState, useRef, useEffect } from 'react';
import './RoomTransformer.css';
import { useTranslation } from 'react-i18next';

const CompareSlider = ({ original, transformed }) => {
  const [sliderPos, setSliderPos] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const sliderRef = useRef(null);

  const handleMouseDown = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleTouchStart = (e) => {
    setIsDragging(true);
  };

  useEffect(() => {
    const handleUp = () => setIsDragging(false);

    const handleMove = (clientX) => {
      if (!sliderRef.current) return;
      const rect = sliderRef.current.getBoundingClientRect();
      const x = Math.max(0, Math.min(clientX - rect.left, rect.width));
      const percent = (x / rect.width) * 100;
      setSliderPos(percent);
    };

    const handleMouseMove = (e) => handleMove(e.clientX);
    const handleTouchMove = (e) => handleMove(e.touches[0].clientX);

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('touchmove', handleTouchMove);
      window.addEventListener('mouseup', handleUp);
      window.addEventListener('touchend', handleUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('touchmove', handleTouchMove);
      window.removeEventListener('mouseup', handleUp);
      window.removeEventListener('touchend', handleUp);
    };
  }, [isDragging]);

  return (
    <div ref={sliderRef} className="compare-slider" onMouseDown={handleMouseDown} onTouchStart={handleTouchStart}>
      <img src={original} alt="Original" className="base-image" />
      <div className="overlay-image" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }}>
        <img src={transformed} alt="Transformed" />
      </div>
      <div className="slider-line" style={{ left: `${sliderPos}%` }}>
        <div className="slider-handle">
          <div className="slider-arrow-left"></div>
          <div className="slider-arrow-right"></div>
        </div>
      </div>
    </div>
  );
};


const RoomTransformer = ({ credits, deductCredit }) => {
  const { t } = useTranslation();
  const [selectedImage, setSelectedImage] = useState(null);
  const [selectedImageUrl, setSelectedImageUrl] = useState(null);
  const [roomType, setRoomType] = useState('bedroom');
  const [furnitureStyle, setFurnitureStyle] = useState('scandinavian');
  const [transformedImage, setTransformedImage] = useState(null);
  const [isLoading, setIsLoading] = useState(false);
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef(null);
  const [activeTab, setActiveTab] = useState('original');

  const handleImageUpload = (file) => {
    if (file && (file.type === 'image/jpeg' || file.type === 'image/png')) {
      setSelectedImage(file);
      const url = URL.createObjectURL(file);
      setSelectedImageUrl(url);
      setTransformedImage(null);
    } else {
      alert('Please upload an image in JPG or PNG format');
    }
  };
  const handleDrop = (e) => { e.preventDefault(); setIsDragOver(false); const files = e.dataTransfer.files; if (files[0]) handleImageUpload(files[0]); };
  const handleDragOver = (e) => { e.preventDefault(); setIsDragOver(true); };
  const handleDragLeave = (e) => { e.preventDefault(); setIsDragOver(false); };
  const handleFileSelect = (e) => { if (e.target.files[0]) handleImageUpload(e.target.files[0]); };

  const handleTransform = async () => {
    if (!selectedImage || !roomType || !furnitureStyle) return;

    if (credits <= 0) {
      alert("You don't have enough credits to transform the image.");
      return;
    }

    setIsLoading(true);
    deductCredit();
    const formData = new FormData();
    formData.append('image', selectedImage);
    formData.append('roomType', roomType);
    formData.append('furnitureStyle', furnitureStyle);
    try {
      const response = await fetch('http://localhost:3001/transform', {
        method: 'POST',
        body: formData,
      });
      if (response.ok) {
        const blob = await response.blob();
        setTransformedImage(URL.createObjectURL(blob));
        setActiveTab('staged');
      } else {
        alert('Error processing image');
      }
    } catch (error) {
      console.error('Error:', error);
      alert('Server connection error');
    } finally {
      setIsLoading(false);
    }
  };

  const isTransformEnabled = selectedImage && roomType && furnitureStyle && !isLoading;

  const roomTypes = [
    { id: 'bedroom', label: t('room_type_bedroom') },
    { id: 'living-room', label: t('room_type_living-room') },
    { id: 'kitchen', label: t('room_type_kitchen') },
    { id: 'dining-room', label: t('room_type_dining-room') },
    { id: 'bathroom', label: t('room_type_bathroom') },
    { id: 'home-office', label: t('room_type_home-office') }
  ];
  const furnitureStyles = [
    { id: 'scandinavian', label: t('style_scandinavian') },
    { id: 'modern', label: t('style_modern') },
    { id: 'minimalist', label: t('style_minimalist') },
    { id: 'coastal', label: t('style_coastal') },
    { id: 'industrial', label: t('style_industrial') },
    { id: 'traditional', label: t('style_traditional') }
  ];

  return (
    <div className="room-transformer-horizontal">
      <div className="controls-column">
        <div className="control-block">
          <h4>{t('upload_image_title')}</h4>
          <div
            className={`upload-area ${isDragOver ? 'drag-over' : ''}`}
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current.click()}
          >
            <div className="upload-icon">⬆</div>
            <p>{t('upload_prompt')}</p>
            <span>{t('upload_formats')}</span>
            <input ref={fileInputRef} type="file" accept="image/jpeg,image/png" onChange={handleFileSelect} style={{ display: 'none' }} />
          </div>
        </div>
        <div className="control-block">
          <h4>{t('room_type_title')}</h4>
          <div className="button-grid">
            {roomTypes.map(room => (
              <button key={room.id} className={`selection-btn ${roomType === room.id ? 'selected' : ''}`} onClick={() => setRoomType(room.id)}>
                {room.label}{roomType === room.id && <span className="checkmark">✓</span>}
              </button>
            ))}
          </div>
        </div>
        <div className="control-block">
          <h4>{t('furniture_style_title')}</h4>
          <div className="button-grid">
            {furnitureStyles.map(style => (
              <button key={style.id} className={`selection-btn ${furnitureStyle === style.id ? 'selected' : ''}`} onClick={() => setFurnitureStyle(style.id)}>
                {style.label}{furnitureStyle === style.id && <span className="checkmark">✓</span>}
              </button>
            ))}
          </div>
        </div>
        <button className={`transform-btn ${isTransformEnabled ? 'enabled' : 'disabled'}`} onClick={handleTransform} disabled={!isTransformEnabled}>
          {isLoading ? t('transforming_button') : t('transform_button')}
        </button>
      </div>
      <div className="images-column">
        <div className="image-tabs">
          <button className={`tab ${activeTab === 'original' ? 'active' : ''}`} onClick={() => setActiveTab('original')}>{t('tab_original')}</button>
          <button className={`tab ${activeTab === 'staged' ? 'active' : ''}`} onClick={() => setActiveTab('staged')}>{t('tab_staged')}</button>
          <button className={`tab ${activeTab === 'compare' ? 'active' : ''}`} onClick={() => setActiveTab('compare')} disabled={!transformedImage}>{t('tab_compare')}</button>
        </div>
        <div className="image-display">
          {isLoading && <div className="loading-spinner"></div>}
          {!selectedImageUrl && (
            <div className="empty-image">
              <div className="image-placeholder-icon">🖼️</div>
              <p>{t('upload_placeholder')}</p>
            </div>
          )}
          {selectedImageUrl && activeTab === 'original' && (
            <div className="image-container"><img src={selectedImageUrl} alt="Original room" className="room-image" /></div>
          )}
          {selectedImageUrl && activeTab === 'staged' && (
            transformedImage ? <div className="image-container"><img src={transformedImage} alt="Transformed room" className="room-image" /></div>
              : <div className="empty-image"><p>{t('transform_placeholder')}</p></div>
          )}
          {selectedImageUrl && activeTab === 'compare' && (
            transformedImage ? <div className="image-container"><CompareSlider original={selectedImageUrl} transformed={transformedImage} /></div>
              : <div className="empty-image"><p>{t('compare_placeholder')}</p></div>
          )}
        </div>
      </div>
    </div>
  );
};

export default RoomTransformer;