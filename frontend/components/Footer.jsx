import { useState } from 'react';
import Shape from '@components/graphic/Shape';
import Icon from '@components/graphic/Icon';
import useDeviceDimensions from '@utils/useDeviceDimensions';
import { createArrayGroups } from '@utils/createArrayGroups';

const DATA = {
  newsletter: {
    heading: 'SUBSCRIBE TO NEWSLETTER',
    subheading:
      'Subscribe for 20% discount on first purchase, get frequent news about store updates, new collections and discounts.',
  },
  footer: {
    columns: [
      { title: 'EXPLORE', items: ['Blog', 'Advanced Search', 'About Us'] },
      {
        title: 'CATALOGUE',
        items: ['Jewelry', 'Bracelets', 'Kente Bags', 'Kente Masks'],
      },
      {
        title: 'SUPPORT',
        items: [
          'Shipping',
          'Refund & Return',
          'Privacy policy',
          'Terms & conditions',
        ],
      },
      {
        title: 'CONTACT US',
        items: [
          'Head Office: Dunajska 19, Bratislava, Slovakia',
          'Tel: 01743 234500',
          'Email: info@xotix.com',
        ],
      },
    ],
  },
  social: [
    {
      icon: 'facebook',
      link: 'https://www.facebook.com/profile.php?id=100076013300560',
    },
    {
      icon: 'instagram-outline',
      link: 'https://www.instagram.com/exotixdesigns/',
    },
    { icon: 'tiktok', link: 'https://www.tiktok.com/@exotixdesigns' },
    {
      icon: 'wolt',
      link: 'https://wolt.com/sk/svk/bratislava/venue/xotix-designs',
    },
  ],
};

const getGridDimensions = (DEVICE_TYPE) => {
  switch (DEVICE_TYPE) {
    case 'MOBILE_SM':
    case 'MOBILE_LG':
    case 'TABLET_SM':
    case 'TABLET_MD':
      return { rows: 2, cols: 2 };
    case 'TABLET_LG':
    case 'DESKTOP_SM':
    case 'DESKTOP_MD':
    case 'DESKTOP_LG':
    case 'DESKTOP_XL':
      return { rows: 1, cols: 4 };
    default:
      return { rows: 2, cols: 2 };
  }
};

const Footer = (props) => {
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
    <footer
      className={`footer__c f-grid ${className} cols-${COLUMNS} rows-${ROWS}`}
    >
      <form className={`footer__newsletter`}>
        <h3 className={`footer__newsletter-heading`}>
          {DATA.newsletter.heading}
        </h3>
        <h4 className={`footer__newsletter-subheading`}>
          {DATA.newsletter.subheading}
        </h4>
        <input
          className={`footer__newsletter-input`}
          type='text'
          placeholder='Enter email address...'
          name='email'
          required
        />
        <input type='submit' value='Subscribe' hidden />
      </form>

      <div className={`footer__footer`}>
        {getGridRows(DATA.footer.columns).map((rowItems) => (
          <div className={`f-grid-row`}>
            {rowItems.map((col) => (
              <div className={`footer__footer-column f-grid-item`}>
                <h4 className={`footer__footer-column__title`}>{col.title}</h4>
                {col.items.map((item) => (
                  <h5 className={`footer__footer-column__item`}>{item}</h5>
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>

      <Shape className={`footer__divider`} />

      <div className={`footer__credits`}>
        <div className={`footer__credits-social`}>
          {DATA.social.map((media) => (
            <a href={media.link} target='_blank' rel='noopener noreferrer'>
              <Icon icon={media.icon} />
            </a>
          ))}
        </div>
        <small className={`footer__credits-copyright`}>
          &copy; Copyright {new Date().getFullYear()}, XotiX Designs
        </small>
      </div>
    </footer>
  );
};

export default Footer;
