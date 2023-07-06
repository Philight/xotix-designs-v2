import Icon from '@components/graphic/Icon';

const CarouselNav = (props) => {
  console.log('CarouselNav props', props);
  const { className, onClick, disabled } = props;
  const IS_DISABLED = disabled ?? false;

  return (
    <Icon
      className={`carousel-nav__c carousel-nav ${className ?? ''} ${
        IS_DISABLED ? 'disabled' : ''
      }`}
      icon='arrow-right-1'
      onClick={onClick}
    />
  );
};

export default CarouselNav;
