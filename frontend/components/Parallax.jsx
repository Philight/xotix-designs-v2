import { ParallaxProvider } from 'react-scroll-parallax';
import { ParallaxBanner } from 'react-scroll-parallax';
import Image from '@components/graphic/Image';
import Layer from '@components/graphic/Layer';

const DATA = {
  heading: 'AUGMENTED WITH THE TREE OF LIFE',
  subheading: 'SPIRIT OF THE TIGER',
  ctaText: 'READ MORE',
  ctaLink:
    'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/free-delivery.png?v=1687877503',
  image:
    'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/treeoflife2.jpg?v=1675084066',
};

const Parallax = (props) => {
  const { className } = props;

  return (
    <ParallaxProvider>
      <div className={`parallax__c ${className}`}>
        <ParallaxBanner
          className={`parallax__image`}
          layers={[{ image: DATA.image, speed: -20 }]}
        />
        <Layer className={`parallax__overlay`} />
        <div className={`parallax__content`}>
          <h3 className={`parallax__subheading`}>{DATA.subheading}</h3>
          <h2 className={`parallax__heading`}>{DATA.heading}</h2>
          <a
            href={DATA.ctaLink}
            className='parallax__button btn btn--primary-outline btn--large'
            role='button'
          >
            {DATA.ctaText}
          </a>
        </div>
      </div>
    </ParallaxProvider>
  );
};

export default Parallax;
