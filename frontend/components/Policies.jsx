import Image from '@components/graphic/Image';
import Layer from '@components/graphic/Layer';
import useDeviceDimensions from '@utils/useDeviceDimensions';
import { createArrayGroups } from '@utils/createArrayGroups';

const DATA = [
  {
    name: 'Free Delivery',
    description: 'Free shipping on all orders over 100 EUR.',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/free-delivery.png?v=1687877503',
  },
  {
    name: 'Secure Payments',
    description: 'Safe online purchases through secured payment gateways',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/secure-payments.png?v=1687877504',
  },
  {
    name: 'Ethical Material',
    description:
      'All of our stones and material come from natural sources which ',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/ethical-material.png?v=1687877504',
  },
  {
    name: 'Perfect Gifts',
    description:
      'Gift wrapping. Try a name tag bracelet and make your gift even more memorable.',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/perfect-gifts_cdeaffab-e168-4890-84e1-449c6210e4b7.png?v=1687878787',
  },
];

const getGridDimensions = (DEVICE_TYPE) => {
  switch (DEVICE_TYPE) {
    case 'MOBILE_SM':
    case 'MOBILE_LG':
    case 'TABLET_SM':
    case 'TABLET_MD':
      return { rows: 2, cols: 2 };
    case 'TABLET_LG':
    case 'DESKTOP_SM':
      return { rows: 1, cols: 4 };
    case 'DESKTOP_MD':
    case 'DESKTOP_LG':
    case 'DESKTOP_XL':
      return { rows: 1, cols: 4 };
    default:
      return { rows: 2, cols: 2 };
  }
};

const Policies = (props) => {
  const { className, columns, rows } = props;
  const { DEVICE_TYPE } = useDeviceDimensions();
  const COLUMNS = columns ?? getGridDimensions(DEVICE_TYPE).cols;
  const ROWS = rows ?? getGridDimensions(DEVICE_TYPE).rows;

  const getGridRows = (data) => {
    return ROWS > 1
      ? createArrayGroups(COLUMNS, data)
      : createArrayGroups(data.length, data);
  };

  return (
    <div
      className={`policies__c ${className} f-grid cols-${COLUMNS} rows-${ROWS}`}
    >
      {getGridRows(DATA).map((rowItems, index) => (
        <div className={`f-grid-row`}>
          {rowItems.map((item) => (
            <div className={`policies__item f-grid-item`}>
              <Image src={item.image} />
              <h3 className={`policies__item-name`}>{item.name}</h3>
              <p className={`policies__item-description`}>{item.description}</p>
            </div>
          ))}
        </div>
      ))}
    </div>
  );
};

export default Policies;
