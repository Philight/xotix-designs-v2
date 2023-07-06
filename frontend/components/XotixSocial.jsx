import { useState } from 'react';
import SectionHeader from '@components/text/SectionHeader';
import Image from '@components/graphic/Image';
import Layer from '@components/graphic/Layer';
import CarouselNav from '@components/util/CarouselNav';
import useDeviceDimensions from '@utils/useDeviceDimensions';

const DATA = [
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-1.png?v=1688033293',
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-2.png?v=1688033294',
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-3.png?v=1688033294',
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-4.jpg?v=1688033292',
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-5.png?v=1688033293',
];

const getGridDimensions = (DEVICE_TYPE) => {
  switch (DEVICE_TYPE) {
    case 'MOBILE_SM':
    case 'MOBILE_LG':
    case 'TABLET_SM':
    case 'TABLET_MD':
      return { rows: 1, cols: 1 };
    case 'TABLET_LG':
    case 'DESKTOP_SM':
      return { rows: 1, cols: 3 };
    case 'DESKTOP_MD':
    case 'DESKTOP_LG':
    case 'DESKTOP_XL':
      return { rows: 1, cols: 4 };
    default:
      return { rows: 1, cols: 1 };
  }
};

const XotixSocial = (props) => {
  const { className, columns, rows } = props;
  const { DEVICE_TYPE } = useDeviceDimensions();
  const [slideIndex, setIndex] = useState(0);

  const COLUMNS = columns ?? getGridDimensions(DEVICE_TYPE).cols;
  const ROWS = rows ?? getGridDimensions(DEVICE_TYPE).rows;
  const MAX_SLIDES = DATA?.length - COLUMNS;

  const slideView = (isRightNav) => (event) => {
    const nextIndex = slideIndex + (isRightNav ? 1 : -1);
    if (nextIndex < 0 || nextIndex > MAX_SLIDES) return;
    setIndex(nextIndex);
  };

  return (
    <div
      className={`xotix-social__c ${className} f-grid cols-${COLUMNS} rows-${ROWS}`}
    >
      <Layer className={`stripe`} />

      <div className={`xotix-social__inner`}>
        <SectionHeader heading='XOTIX SOCIAL' />
        <div className={`carousel-view`}>
          <div className={`carousel-slider xotix-social__slider f-grid-row`}>
            {DATA.map((image) => (
              <div
                className={`carousel-item xotix-social__item f-grid-item`}
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              >
                <Image src={image} />
                <Layer className={`carousel-item xotix-social__item-overlay`} />
              </div>
            ))}
          </div>
          <CarouselNav
            className='left'
            disabled={slideIndex === 0}
            onClick={slideView(false)}
          />
          <CarouselNav
            className='right'
            disabled={slideIndex >= MAX_SLIDES}
            onClick={slideView(true)}
          />
        </div>
      </div>
    </div>
  );
};

export default XotixSocial;
