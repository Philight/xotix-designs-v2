import { forwardRef } from 'react'
//import { motion } from 'framer-motion';

const Shape = forwardRef((props, ref) => {
  let { className, style, children, width, height, left, bottom, onClick } =
    props

  return (
    <canvas
      className={`shape__c ${className}`}
      style={{
        width: width,
        height: height,
        marginLeft: left,
        marginBottom: bottom,
        ...style,
      }}
      ref={ref}
      onClick={onClick}
    >
      {children}
    </canvas>
  )
})

export default Shape
