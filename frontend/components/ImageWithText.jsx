import Image from '@components/graphic/Image'
import Layer from '@components/graphic/Layer'

const DATA = {
  heading: 'Kente Inspired Masks',
  description:
    'Our hypoallergenic, washable, and reusable masks will keep you looking stylish while protecting you and your close ones.',
  ctaText: 'SHOP MASKS',
  image:
    'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/kente-masks.jpg?v=1687880840',
  link: 'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/free-delivery.png?v=1687877503',
}

const ImageWithText = (props) => {
  console.log('ImageWithText props', props)
  const { className, columns, sectionSettings } = props
  const COLUMNS = columns ?? 4
  const IS_FULLWIDTH = sectionSettings.is_fullwidth ?? false
  const REVERSE_ORDER = sectionSettings.reverse_order ?? false
  const heading = sectionSettings.heading
  const description = sectionSettings.description
  const ctaText = sectionSettings.button_text
  const ctaLink = sectionSettings.button_link
  const image = sectionSettings.image

  return (
    <div
      className={`image-with-text__c ${className} ${
        IS_FULLWIDTH ? 'section--fullwidth' : ''
      } ${REVERSE_ORDER ? 'reverse-order' : ''}`}
    >
      <div className={`image-with-text__inner`}>
        <div className={`image-with-text__content`}>
          <h2 className={`image-with-text__heading`}>{heading}</h2>
          <h3 className={`image-with-text__description`}>{description}</h3>
          <a
            href={DATA.link}
            className="image-with-text__button btn btn--primary btn--large"
          >
            {ctaText}
          </a>
        </div>
        <Image src={image} />
      </div>
    </div>
  )
}

export default ImageWithText
