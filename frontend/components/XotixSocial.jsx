import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@components/text/SectionHeader'
import Image from '@components/graphic/Image'
import Layer from '@components/graphic/Layer'
import CarouselNav from '@components/util/CarouselNav'

const DATA = [
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-1.png?v=1688033293',
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-2.png?v=1688033294',
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-3.png?v=1688033294',
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-4.jpg?v=1688033292',
  'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/social-5.png?v=1688033293',
]

const XotixSocial = (props) => {
  console.log('XotixSocial props', props)
  const { className, sectionSettings, columns } = props
  const [slideIndex, setIndex] = useState(0)
  const COLUMNS = columns ?? 4
  const MAX_SLIDES = DATA?.length - COLUMNS // + Last collection button

  const slideView = (isRightNav) => (event) => {
    const nextIndex = slideIndex + (isRightNav ? 1 : -1)
    if (nextIndex < 0 || nextIndex > MAX_SLIDES) return
    setIndex(nextIndex)
  }

  return (
    <div className={`xotix-social__c ${className} col-${COLUMNS}`}>
      <Layer className={`stripe`} />

      <div className={`xotix-social__inner`}>
        <SectionHeader heading="XOTIX SOCIAL" />
        <div className={`carousel-view`}>
          <div className={`carousel-slider xotix-social__slider`}>
            {DATA.map((image) => (
              <div
                className={`carousel-item xotix-social__item`}
                style={{ transform: `translateX(-${slideIndex * 100}%)` }}
              >
                <Image src={image} />
                <Layer className={`carousel-item xotix-social__item-overlay`} />
              </div>
            ))}
          </div>
          <CarouselNav
            className="left"
            disabled={slideIndex == 0}
            onClick={slideView(false)}
          />
          <CarouselNav
            className="right"
            disabled={slideIndex >= MAX_SLIDES}
            onClick={slideView(true)}
          />
        </div>
      </div>
    </div>
  )
}

export default XotixSocial
