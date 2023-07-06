import React from 'react';
import ReactDOM from 'react-dom/client';
import HelloWorld from '@components/HelloWorld';
import VideoHero from '@components/VideoHero';
import FeaturedCollection from '@components/FeaturedCollection';
import Banner from '@components/Banner';
import Policies from '@components/Policies';
import ImageWithText from '@components/ImageWithText';
import CollectionTabs from '@components/CollectionTabs';
import Parallax from '@components/Parallax';
import ProductTestimonial from '@components/ProductTestimonial';
import StonesBenefits from '@components/StonesBenefits';
import BrandsCollaboration from '@components/BrandsCollaboration';
import XotixSocial from '@components/XotixSocial';
import Footer from '@components/Footer';

const COMPONENTS = [
  { $selector: '.hello-world__c', Component: HelloWorld },
  { $selector: '.video-hero__cmp', Component: VideoHero },
  { $selector: '.featured-collection__cmp', Component: FeaturedCollection },
  { $selector: '.banner__cmp', Component: Banner },
  { $selector: '.policies__cmp', Component: Policies },
  { $selector: '.image-with-text__cmp', Component: ImageWithText },
  { $selector: '.collection-tabs__cmp', Component: CollectionTabs },
  { $selector: '.parallax__cmp', Component: Parallax },
  { $selector: '.product-testimonial__cmp', Component: ProductTestimonial },
  { $selector: '.stones-benefits__cmp', Component: StonesBenefits },
  { $selector: '.brands-collaboration__cmp', Component: BrandsCollaboration },
  { $selector: '.xotix-social__cmp', Component: XotixSocial },
  { $selector: '.footer__cmp', Component: Footer },
];

/* Render multiple times for multiple components */

const createReactApp = (app) => {
  const $rootElems = document.querySelectorAll(app.$selector);
  for (let i = 0; i < $rootElems.length; i++) {
    const shopifyProps = {};
    for (const attr of $rootElems[i].attributes) {
      shopifyProps[attr.name] = attr.value;
    }

    console.log(`### ${app['$selector']} shopifyProps ${i}`, shopifyProps);

    console.log(
      `### ${app['$selector']} sectionSettings ${i}`,
      shopifyProps?.sectionsettings,
    );
    let sectionSettings = null;
    if (!!shopifyProps?.sectionsettings) {
      const jsonStr = shopifyProps.sectionsettings.split("'").join('"');
      console.log(jsonStr);
      sectionSettings = JSON.parse(jsonStr);
      console.log(
        `### ${app['$selector']} sectionSettings ${i}`,
        sectionSettings,
      );
    }

    ReactDOM.createRoot($rootElems[i]).render(
      <React.StrictMode>
        <app.Component
          shopifyProps={shopifyProps}
          sectionSettings={sectionSettings}
        />
      </React.StrictMode>,
    );
  }
};

for (const instance of COMPONENTS) {
  createReactApp(instance);
}
