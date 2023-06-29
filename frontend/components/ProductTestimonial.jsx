import { useState, useEffect, useRef } from 'react'
import SectionHeader from '@components/text/SectionHeader'
import Image from '@components/graphic/Image'
import Shape from '@components/graphic/Shape'

const DATA = [
  {
    review: {
      text: '"Received my shiny beautiful bracelet and I am very happy with it."',
      author: 'Barbora - Bratislava',
      image:
        'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/review-gabi-1.png?v=1687972434',
    },
    product: {
      name: 'GABI',
      description: 'Howlite and Tiger’s eye. Properties & Energies:',
      image:
        'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/gabi_2.png?v=1687973064',
      link: 'https://google.com',
    },
  },
  {
    review: {
      text: '"What a beautiful gift."',
      author: 'Dano - Bratislava',
      image:
        'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/review-gabi-1.png?v=1687972434',
    },
    product: {
      name: 'GADZO',
      description:
        'Hematite and Tiger’s eye. Properties & Energies:Howlite and Tiger’s eye. Properties & EnergiesHowlite and Tiger’s eye. Properties & EnergiesHowlite and Tiger’s eye. Properties & Energies',
      image:
        'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/gabi_2.png?v=1687973064',
      link: 'https://google.com',
    },
  },
  {
    review: {
      text: '"Good quality, great service."',
      author: 'Mindza - Bratislava',
      image:
        'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/review-gabi-1.png?v=1687972434',
    },
    product: {
      name: 'GADZO',
      description:
        'Cats eye and Tiger’s eye. Properties & Energies:Howlite and Tiger’s eye. Properties & Energies',
      image:
        'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/gabi_2.png?v=1687973064',
      link: 'https://google.com',
    },
  },
]

const ProductTestimonial = (props) => {
  console.log('ProductTestimonial props', props)
  const { className, sectionSettings, delay } = props
  const [slideIndex, setIndex] = useState(0)
  const timeoutRef = useRef(null)
  const DELAY = delay ?? 4000

  function resetTimeout() {
    if (timeoutRef.current) {
      clearTimeout(timeoutRef.current)
    }
  }

  useEffect(() => {
    resetTimeout()
    timeoutRef.current = setTimeout(
      () =>
        setIndex((prevIndex) =>
          prevIndex === DATA.length - 1 ? 0 : prevIndex + 1
        ),
      DELAY
    )

    return () => {
      resetTimeout()
    }
  }, [slideIndex])

  return (
    <div className={`product-testimonial__c ${className}`}>
      <SectionHeader
        heading="OUR HAPPY CUSTOMERS"
        subheading="WE THANK YOU FOR BEING WITH US"
      />
      <div className={`product-testimonial__content`}>
        <div className={`product-testimonial__content-row reviews`}>
          <div
            className={`product-testimonial__content-row__text carousel-view`}
          >
            {DATA.map((item) => (
              <figure
                className={`product-testimonial__content-row__quote carousel-group`}
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              >
                <blockquote
                  className={`product-testimonial__content-row__quote-text`}
                >
                  {item.review.text}
                </blockquote>
                <figcaption
                  className={`product-testimonial__content-row__quote-author`}
                >
                  {item.review.author}
                </figcaption>
              </figure>
            ))}
            <div className={`product-testimonial__content-row__pagination`}>
              {DATA.map((item, index) => (
                <Shape
                  className={`product-testimonial__content-row__pagination-dot ${
                    index <= slideIndex && 'filled'
                  }`}
                />
              ))}
            </div>
          </div>

          <div
            className={`product-testimonial__content-row__images carousel-view`}
          >
            {DATA.map((item) => (
              <Image
                className={`product-testimonial__content-row__image carousel-group`}
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                src={item.review.image}
              />
            ))}
          </div>
        </div>

        <Shape className={`product-testimonial__content-row__divider`} />

        <div className={`product-testimonial__content-row products`}>
          <div
            className={`product-testimonial__content-row__images carousel-view`}
          >
            {DATA.map((item) => (
              <Image
                className={`product-testimonial__content-row__image carousel-group`}
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
                src={item.product.image}
              />
            ))}
          </div>

          <div
            className={`product-testimonial__content-row__text carousel-view`}
          >
            <div className={`product-testimonial__content-row__pagination`}>
              {DATA.map((item, index) => (
                <Shape
                  className={`product-testimonial__content-row__pagination-dot ${
                    index <= slideIndex && 'filled'
                  }`}
                />
              ))}
            </div>
            {DATA.map((item) => (
              <div
                className={`product-testimonial__content-row__product carousel-group`}
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              >
                <h3 className={`product-testimonial__content-row__name`}>
                  {item.product.name}
                </h3>
                <p className={`product-testimonial__content-row__description`}>
                  {item.product.description}
                </p>
                <a
                  className="product-testimonial__content-row__button btn btn--primary btn--large"
                  role="button"
                  href={item.product.link}
                >
                  MORE DETAILS
                </a>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default ProductTestimonial
