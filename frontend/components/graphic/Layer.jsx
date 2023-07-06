//import { motion } from 'framer-motion';

const Layer = (props) => {
  let { className, style } = props;

  return (
    <canvas
      className={`layer__c ${className} absolute-fill fill-parent`}
      style={{ ...style }}
    />
  );
};

export default Layer;
