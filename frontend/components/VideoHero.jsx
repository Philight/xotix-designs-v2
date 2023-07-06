import Layer from '@components/graphic/Layer';
import Icon from '@components/graphic/Icon';

const VIDEO_URL =
  'https://cdn.shopify.com/s/files/1/0592/3494/3165/files/Untitled_Instagram_Post_1.mp4?v=1641845400';

const VideoHero = (props) => {
  return (
    <div className='video-hero__c'>
      <div className='video-hero__video-wrapper'>
        <Layer className='video-hero__overlay' />
        <video
          className='video-hero__video'
          autoPlay
          playsInline
          loop
          muted
          src={VIDEO_URL}
        />
      </div>

      <div className='video-hero__content-wrapper'>
        <Layer className='video-hero__content-overlay' />
        <div className='video-hero__content'>
          <h3 className='video-hero__heading ff-heading animate'>
            FASHION CHIC
          </h3>
          <h4 className='video-hero__subheading ff-body fs-body-large animate'>
            Sleek | Trendy | Fashion
          </h4>
          <Icon className='video-hero__image' icon='xotix-designs' />
          {/*
          <figure class="image__c js-enabled video-hero__image">
            <img
              class="image__img lazyload lazypreload"
              src=""
              data-src="{{ img_url }}"
              data-widths="[180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 2048]"
              data-aspectratio="{{ image.aspect_ratio }}"
              data-sizes="auto"
              alt=""
            />
          </figure>
*/}
          <div className='video-hero__button-wrapper'>
            <a
              href='#'
              className='video-hero__button animate btn btn--standard btn--large'
            >
              EXPLORE NOW
            </a>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VideoHero;
