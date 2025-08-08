import React, { useState, useEffect } from 'react';
import './HeroSlider.css';
import { useTranslation } from 'react-i18next';

const slides = [
  { style: 'Original', image: '/images/original.jpg' },
  { style: 'Scandinavian', image: '/images/scandinavian.jpg' },
  { style: 'Modern', image: '/images/modern.jpg' },
  { style: 'Minimalist', image: '/images/minimalist.jpg' },
  { style: 'Coastal', image: '/images/coastal.jpg' },
];

const HeroSlider = () => {
  const { t } = useTranslation();
  const [currentSlide, setCurrentSlide] = useState(0);
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % slides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, []);

  const handleSelect = (index) => {
    setCurrentSlide(index);
    setIsDropdownOpen(false);
  };

  return (
    <div className="hero-slider-container">
      <div className="hero-content">
        <h1>{t('hero_title')}</h1>
        <p className="subtitle">{t('hero_subtitle')}</p>
        <div className="hero-actions">
          <button className="try-free-btn">{t('try_free')}</button>
          <a href="/#pricing" className="start-staging-hero-btn">{t('start_design')}</a>
        </div>
        <div className="trusted-by">
          <img src="/real_estate_logos.png" alt="Trusted by" loading="lazy" />
        </div>
      </div>
      <div className="slider-column">
        <div className="slider-image">
          <img src={slides[currentSlide].image} alt={`Design in ${slides[currentSlide].style} style`} loading="lazy" />
        </div>
        <div className="slider-controls">
          <div className="dropdown-container">
            <button className="dropdown-toggle" onClick={() => setIsDropdownOpen(!isDropdownOpen)}>
              {slides[currentSlide].style}
              <span className={`arrow ${isDropdownOpen ? 'up' : 'down'}`}></span>
            </button>
            {isDropdownOpen && (
              <ul className="dropdown-menu">
                {slides.map((slide, index) => (
                  <li key={index} onClick={() => handleSelect(index)}>
                    {slide.style}
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroSlider;