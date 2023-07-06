import { useState } from 'react';
import SectionHeader from '@components/text/SectionHeader';
import Icon from '@components/graphic/Icon';
import Image from '@components/graphic/Image';
import Layer from '@components/graphic/Layer';
import CarouselNav from '@components/util/CarouselNav';
import useDeviceDimensions from '@utils/useDeviceDimensions';

const COLLECTION_IMAGE =
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/collectionstar2.jpg?v=1687861854';

const DATA = [
  {
    name: 'Starlite - Green',
    price: '€ 49,99',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_green.jpg?v=1687795171',
    link: 'https://google.com',
  },
  {
    name: 'Starlite - Yellow',
    price: '€ 49,99',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_yellow.png?v=1687795174',
    link: 'https://google.com',
  },
  {
    name: 'Starlite - Breeze',
    price: '€ 49,99',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_ocean.png?v=1687795175',
    link: 'https://google.com',
  },
  {
    name: 'Starlite - Bluemarine',
    price: '€ 49,99',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_bluemarine.png?v=1687795171',
    link: 'https://google.com',
  },
  {
    name: 'Starlite - Pink',
    price: '€ 49,99',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_pink.png?v=1687795175',
    link: 'https://google.com',
  },
  {
    name: 'Starlite - Green',
    price: '€ 49,99',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_green.jpg?v=1687795171',
    link: 'https://google.com',
  },
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

const FeaturedCollection = (props) => {
  console.log('FeaturedCollection props', props);
  const { className, sectionSettings, columns, rows } = props;
  const [slideIndex, setIndex] = useState(0);
  const { DEVICE_TYPE } = useDeviceDimensions();

  const COLUMNS = columns ?? getGridDimensions(DEVICE_TYPE).cols;
  const ROWS = rows ?? getGridDimensions(DEVICE_TYPE).rows;
  const MAX_SLIDES = DATA.length - COLUMNS + 1; // + Last collection button

  const slideView = (isRightNav) => (event) => {
    const nextIndex = slideIndex + (isRightNav ? 1 : -1);
    if (nextIndex < 0 || nextIndex > MAX_SLIDES) return;
    setIndex(nextIndex);
  };

  return (
    <div
      className={`featured-collection__c f-grid cols-${COLUMNS} rows-${ROWS} ${
        className ?? ''
      }`}
    >
      <SectionHeader
        heading='THE STARLITE COLLECTION'
        subheading='STARS AND THEIR ORIGIN'
      />

      <div className={`carousel-view`}>
        <div className={`carousel-slider f-grid-row`}>
          {DATA.map((item) => (
            <div
              className={`carousel-item f-grid-item featured-collection__item`}
              style={{ transform: `translateX(-${slideIndex * 100}%)` }}
            >
              <Image src={item.image} />
              <h4 className={`featured-collection__item-name`}>{item.name}</h4>
              <h5 className={`featured-collection__item-price`}>
                {item.price}
              </h5>
            </div>
          ))}
          <div
            className={`carousel-item f-grid-item featured-collection__view-collection`}
            style={{ transform: `translateX(-${slideIndex * 100}%)` }}
          >
            <Image src={COLLECTION_IMAGE} />
            <Layer
              className={`featured-collection__view-collection__overlay`}
            />
            <div className={`featured-collection__view-collection__content`}>
              <Icon
                className={`featured-collection__view-collection__button`}
                icon='arrow-right-1'
                onClick={false}
              />
              <span className={`featured-collection__view-collection__text`}>
                View Collection
              </span>
            </div>
          </div>
        </div>

        <CarouselNav
          className={`left`}
          disabled={slideIndex === 0}
          onClick={slideView(false)}
        />
        <CarouselNav
          className={`right`}
          disabled={slideIndex >= MAX_SLIDES}
          onClick={slideView(true)}
        />
      </div>
    </div>
  );
};

export default FeaturedCollection;
