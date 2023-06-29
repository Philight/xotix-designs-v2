import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import SectionHeader from '@components/text/SectionHeader'
import Image from '@components/graphic/Image'
import Layer from '@components/graphic/Layer'

const DATA = [
  {
    name: 'RED JASPER',
    properties: ['COURAGE', 'STRENGTH'],
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/red-jasper-natural_transparent_tfozjk.png?v=1687986227',
  },
  {
    name: 'LAPIS LAZULI',
    properties: ['INTUITION', 'WISDOM'],
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/lapis-lazuli-natural_transparent_d6zpfa.png?v=1687986227',
  },
  {
    name: 'AQUAMARINE',
    properties: ['CALMNESS', 'INNER PEACE'],
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/aquamarine-natural-stone_transparent_ahur3p.png?v=1687986228',
  },
  {
    name: 'AMETHYST',
    properties: ['SPIRITUAL PROTECTION', 'BALANCE'],
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/amethyst-natural-stone_transparent_z1kz2u.png?v=1687986227',
  },
]

const StonesBenefits = (props) => {
  console.log('StonesBenefits props', props)
  const { className, sectionSettings, duration, columns } = props
  const [slideIndex, setIndex] = useState(0)
  const COLUMNS = columns ?? 4
  const DURATION = duration ?? 25000

  const StonesContainer = () => {
    return (
      <motion.div
        className={`stones-benefits__stones-container`}
        animate={{
          x: ['0%', '-100%'],
        }}
        transition={{
          ease: 'linear',
          duration: DURATION / 1000,
          repeat: Infinity,
          repeatType: 'loop',
        }}
      >
        {DATA.map((item) => (
          <motion.div className={`stones-benefits__stones-item`}>
            <Image src={item.image} />
            <h3 className={`stones-benefits__stones-item__name`}>
              {item.name}
            </h3>
            {item.properties.map((prop) => (
              <h4 className={`stones-benefits__stones-item__property`}>
                {prop}
              </h4>
            ))}
          </motion.div>
        ))}
      </motion.div>
    )
  }

  return (
    <div className={`stones-benefits__c ${className} col-${COLUMNS}`}>
      <SectionHeader
        heading="STONES AND BENEFITS"
        subheading="ENERGIES & UNIQUE PROPERTIES"
      />

      <Layer className={`stripe`} />

      <div className={`stones-benefits__stones-slider`}>
        <StonesContainer />
        <StonesContainer />
      </div>
    </div>
  )
}

export default StonesBenefits
