import { forwardRef } from 'react'
//import { motion } from 'framer-motion';

import XotixDesigns from '@icons/xotixdesigns.svg'
import ArrowRight1 from '@icons/arrow-right-1.svg'
import ArrowRight2 from '@icons/arrow-right-2.svg'
import Facebook from '@icons/facebook.svg'
import InstagramOutline from '@icons/instagram-outline.svg'
import TikTok from '@icons/tiktok.svg'
import Pinterest from '@icons/pinterest.svg'
import Wolt from '@icons/wolt.svg'

const Icon = forwardRef((props, ref) => {
  let {
    icon,
    width,
    height,
    color,
    className,
    style,
    onClick,
    onTouchStart,
    onTouchMove,
    onTouchEnd,
    initial,
    animate,
    transition,
  } = props

  const iconName = icon.toLowerCase()
  const getIcon = () => {
    switch (iconName) {
      case 'arrow-right-1':
        return ArrowRight1
      case 'arrow-right-2':
        return ArrowRight2
      case 'xotix-designs':
        return XotixDesigns
      case 'facebook':
        return Facebook
      case 'instagram-outline':
        return InstagramOutline
      case 'tiktok':
        return TikTok
      case 'pinterest':
        return Pinterest
      case 'wolt':
        return Wolt
      default:
        return ''
    }
  }

  const isMultiColor = () => {
    switch (iconName) {
      case 'xotix-designs':
        return true

      default:
        return false
    }
  }

  const renderingStyle = isMultiColor()
    ? {
        src: getIcon(),
      }
    : {
        // 1x1 pixel PNG uri
        src: `data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNgYAAAAAMAASsJTYQAAAAASUVORK5CYII=`,
        style: {
          backgroundColor: color,
          backgroundImage: `url(${getIcon()}) no-repeat center`,
          WebkitMask: `url(${getIcon()}) no-repeat center`,
          mask: `url(${getIcon()}) no-repeat center`,
        },
      }

  return (
    <figure
      className={`icon__c icon-${iconName} flex-center ${className}`}
      style={{ width: width, height: height, ...style }}
      ref={ref}
      onClick={onClick}
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
      initial={initial}
      animate={animate}
      transition={transition}
    >
      <img
        className="icon fill-parent"
        alt={`icon: ${icon}`}
        {...renderingStyle}
      />
    </figure>
  )
})

export default Icon
