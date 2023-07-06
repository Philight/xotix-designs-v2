const SectionHeader = (props) => {
  const { className, heading, subheading } = props;
  return (
    <div className={`section-header__c ${className ?? ''}`}>
      <h2 className='section-header__heading'>{heading ?? 'Heading'}</h2>
      {!!subheading && (
        <h3 className='section-header__subheading'>{subheading}</h3>
      )}
    </div>
  );
};

export default SectionHeader;
