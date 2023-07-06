//import { motion } from 'framer-motion';

const Image = (props) => {
  let { className, src, alt, style } = props;

  return (
    <figure className={`image__c js-enabled ${className}`} style={style}>
      <img
        className='image__img lazyload lazypreload'
        src={src}
        data-src={src}
        data-widths='[180, 360, 540, 720, 900, 1080, 1296, 1512, 1728, 2048]'
        data-aspectratio='{{ image.aspect_ratio }}'
        data-sizes='auto'
        alt={alt ?? 'Image not found'}
      />
    </figure>
  );
};

export default Image;
