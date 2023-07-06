import { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import SectionHeader from '@components/text/SectionHeader';
import Image from '@components/graphic/Image';
import Shape from '@components/graphic/Shape';

const DATA = [
  {
    name: 'BOBOBIRD',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/brand-bobobird.png?v=1688027242',
  },
  {
    name: 'BOBOBIRD',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/brand-bobobird.png?v=1688027242',
  },
  {
    name: 'BOBOBIRDE',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/brand-bobobird.png?v=1688027242',
  },
  {
    name: 'BOBOBIRD',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/brand-bobobird.png?v=1688027242',
  },
];

const BrandsCollaboration = (props) => {
  const { className, sectionSettings, columns, autoplay, duration, reverse } =
    props;
  const COLUMNS = columns ?? 4;

  const ENABLE_AUTOPLAY = autoplay ?? true;
  const DURATION = duration ?? 15000;
  const REVERSE = reverse ?? true;

  const BrandsContainer = () => (
    <motion.div
      className={`brands-collaboration__brands ${
        ENABLE_AUTOPLAY ? 'will-change-transform' : ''
      }`}
      animate={
        ENABLE_AUTOPLAY && {
          x: REVERSE ? ['-100%', '0%'] : ['0%', '-100%'],
        }
      }
      transition={
        ENABLE_AUTOPLAY && {
          ease: 'linear',
          duration: DURATION / 1000,
          repeat: Infinity,
          repeatType: 'loop',
        }
      }
    >
      {DATA.map((item) => (
        <div className={`brands-collaboration__item`}>
          <Image src={item.image} />
        </div>
      ))}
    </motion.div>
  );

  return (
    <div className={`brands-collaboration__c ${className} col-${COLUMNS}`}>
      <SectionHeader
        heading='OUR BRANDS COLLABORATION'
        subheading='ESTABLISHED & PROMINENT PARTNERS'
      />

      <Shape className={`top border`} />

      <div className={`brands-collaboration__brands-slider`}>
        <BrandsContainer />
        {ENABLE_AUTOPLAY && <BrandsContainer />}
      </div>

      <Shape className={`bottom border`} />
    </div>
  );
};

export default BrandsCollaboration;
