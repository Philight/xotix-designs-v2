import Image from '@components/graphic/Image';
import Layer from '@components/graphic/Layer';

const DATA = [
  {
    heading: 'BUY 2 GET 1 FREE',
    subheading: 'ORIGINAL KENTE',
    ctaText: 'While Supplies Last',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/totebag.jpg?v=1675082481',
    link: 'https://google.com',
    overlayColor: 'rgba(8, 69, 79, 0.3)',
  },
  {
    heading: 'BOBOBIRD x X.OTI.X',
    subheading: 'EXCLUSIVE WATCHES',
    ctaText: 'Preorder Now',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/bobobird.webp?v=1675082378',
    link: 'https://google.com',
    overlayColor: 'rgba(172, 114, 88, 0.3)',
  },
];

const Banner = (props) => {
  const { className, columns } = props;
  const COLUMNS = columns ?? 2;

  return (
    <div className={`banner__c ${className} col-${COLUMNS}`}>
      {DATA.map(
        (item, index) =>
          index < COLUMNS && (
            <div className={`banner__item`}>
              <Layer className={`banner__item-overlay`} />
              <Image src={item.image} />
              <div className={`banner__item-content`}>
                <Layer
                  className={`banner__item-content__overlay`}
                  style={{ backgroundColor: item?.overlayColor }}
                />
                <h3 className={`banner__item-content__subheading`}>
                  {item.subheading}
                </h3>
                <h2 className={`banner__item-content__heading`}>
                  {item.heading}
                </h2>
                <span className={`banner__item-content__cta-text`}>
                  {item.ctaText}
                </span>
              </div>
            </div>
          ),
      )}
    </div>
  );
};

export default Banner;
