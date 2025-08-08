import React from 'react';
import './Testimonials.css';

const testimonialsData = [
  {
    initials: 'SH',
    name: 'Sam Hardwell',
    rating: 5,
    title: 'Best AI staging tool I’ve used',
    text: 'As a real estate agent, I’ve tried a few virtual staging services, but this one blew me away. Turnaround time was fast, and the interface is super intuitive.'
  },
  {
    initials: 'MI',
    name: 'Michael Stevenson',
    rating: 5,
    title: 'Great results, more styles please',
    text: 'Loved the realistic staging. Just wish there were more design styles beyond modern. Still very happy with the outcome!'
  },
  {
    initials: 'SN',
    name: 'Steve Norman',
    rating: 5,
    title: 'Great value, simple process',
    text: 'I was skeptical about AI staging, but this site changed my mind. Uploading my photos was a breeze, and I got fully staged images in a little over 10 seconds. Excellent value for what you get!'
  },
  {
    initials: 'EW',
    name: 'Emily Wilkinson',
    rating: 5,
    title: 'Great value and easy to use',
    text: 'Love the quality and realism of the AI staging. It’s fast, affordable, and looks fantastic on listings. My only suggestion would be to add more interior design themes.'
  }
];

const Rating = ({ rating }) => (
  <div className="rating">
    {[...Array(rating)].map((_, i) => (
      <span key={i}>★</span>
    ))}
  </div>
);

const Testimonials = () => {
  return (
    <div className="testimonials-section">
      {testimonialsData.map((testimonial, index) => (
        <div key={index} className="testimonial-card">
          <div className="card-header">
            <div className="avatar">{testimonial.initials}</div>
            <span className="name">{testimonial.name}</span>
          </div>
          <Rating rating={testimonial.rating} />
          <h4 className="card-title">{testimonial.title}</h4>
          <p className="card-text">{testimonial.text}</p>
        </div>
      ))}
    </div>
  );
};

export default Testimonials;