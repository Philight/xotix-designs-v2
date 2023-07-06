import { useState } from 'react';
import SectionHeader from '@components/text/SectionHeader';
import Icon from '@components/graphic/Icon';
import Image from '@components/graphic/Image';
import Layer from '@components/graphic/Layer';
import useDeviceDimensions from '@utils/useDeviceDimensions';
import { createArrayGroups } from '@utils/createArrayGroups';

const DATA = [
  {
    name: 'New Arrivals',
    link: 'https://google.com',
    items: [
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
    ],
  },
  {
    name: 'Bestselling',
    link: 'https://google.com',
    items: [
      {
        name: 'Starlite - Breeze',
        price: '€ 49,99',
        image:
          'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_ocean.png?v=1687795175',
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
        name: 'Starlite - Green',
        price: '€ 49,99',
        image:
          'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_green.jpg?v=1687795171',
        link: 'https://google.com',
      },
      {
        name: 'Starlite - Bluemarine',
        price: '€ 49,99',
        image:
          'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_bluemarine.png?v=1687795171',
        link: 'https://google.com',
      },
    ],
  },
  {
    name: 'Specials',
    link: 'https://google.com',
    items: [
      {
        name: 'Starlite - Bluemarine',
        price: '€ 49,99',
        image:
          'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_bluemarine.png?v=1687795171',
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
        name: 'Starlite - Green',
        price: '€ 49,99',
        image:
          'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/starlite_green.jpg?v=1687795171',
        link: 'https://google.com',
      },
    ],
  },
];

const getGridDimensions = (DEVICE_TYPE) => {
  switch (DEVICE_TYPE) {
    case 'MOBILE_SM':
    case 'MOBILE_LG':
    case 'TABLET_SM':
    case 'TABLET_MD':
      return { rows: 4, cols: 1 };
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

const CollectionTabs = (props) => {
  const { className, columns, rows } = props;
  const { DEVICE_TYPE } = useDeviceDimensions();
  const [tabIndex, setIndex] = useState(0);
  const COLUMNS = columns ?? getGridDimensions(DEVICE_TYPE).cols;
  const ROWS = rows ?? getGridDimensions(DEVICE_TYPE).rows;

  const changeTab = (newIndex) => (event) => {
    setIndex(newIndex);
  };

  const getGridRows = (data) => {
    return ROWS > 1
      ? createArrayGroups(COLUMNS, data)
      : createArrayGroups(data.length, data);
  };

  return (
    <div
      className={`collection-tabs__c ${className} f-grid cols-${COLUMNS} rows-${ROWS}`}
    >
      <SectionHeader heading='THIS WEEK’S PICKS' subheading='LATEST TRENDS' />

      <div className={`collection-tabs__tabs-container`}>
        {DATA.map((collection, index) => (
          <h3
            className={`collection-tabs__tab ${
              tabIndex === index ? 'selected' : ''
            }`}
            onClick={changeTab(index)}
          >
            {collection.name}
          </h3>
        ))}
      </div>

      <div className={`carousel-view collection-tabs__items-container`}>
        <div className={`carousel-slider`}>
          {DATA.map((collection) => (
            <div
              data-collection={collection.name}
              className={`carousel-group collection-tabs__items-group f-grid-group`}
              style={{ transform: `translateX(-${tabIndex * 100}%)` }}
            >
              {getGridRows(collection?.items)?.map((rowItems, index) => (
                <div className={`f-grid-row`}>
                  {rowItems.map(
                    (item, index) =>
                      index < COLUMNS && (
                        <div
                          className={`carousel-item collection-tabs__item f-grid-item`}
                        >
                          <Image src={item.image} />
                          <h4 className={`collection-tabs__item-name`}>
                            {item.name}
                          </h4>
                          <h5 className={`collection-tabs__item-price`}>
                            {item.price}
                          </h5>
                        </div>
                      ),
                  )}
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      <div className={`collection-tabs__buttons-container carousel-view`}>
        {DATA.map((collection) => (
          <div
            className={`collection-tabs__button-wrapper carousel-group`}
            style={{ transform: `translateX(-${tabIndex * 100}%)` }}
          >
            <a
              href={collection.link}
              className='collection-tabs__button btn btn--outline btn--large'
            >
              View {collection.name}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
};

export default CollectionTabs;
