import React from 'react';

import NextArrow from '../common/NextArrow';
import PrevArrow from '../common/PrevArrow';

const Settings = {
    infinite: false,
    speed: 1000,
    slidesToScroll: 2,
    slidesToShow: 3,
    nextArrow: <NextArrow />,
    prevArrow: <PrevArrow />,
    useTransform: false,
    focusOnSelect: false,
    responsive: [
        {
          breakpoint: 1800,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 2,
            dots: true
          }
        }, {
            breakpoint: 800,
            settings: {
              slidesToShow: 3,
              slidesToScroll: 2,
              dots: true
            }
        }, {
          breakpoint: 500,
          settings: {
            slidesToShow: 2,
          }
        }, {
          breakpoint: 350,
          settings: {
            slidesToShow: 3,
            slidesToScroll: 2
          }
        }
      ]
}

export {
    Settings
}