import Image from '@components/graphic/Image'
import Layer from '@components/graphic/Layer'

const DATA = [
  {
    name: 'Free Delivery',
    description: 'Free shipping on all orders over 100 EUR.',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/free-delivery.png?v=1687877503',
  },
  {
    name: 'Secure Payments',
    description: 'Safe online purchases through secured payment gateways',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/secure-payments.png?v=1687877504',
  },
  {
    name: 'Ethical Material',
    description:
      'All of our stones and material come from natural sources which ',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/ethical-material.png?v=1687877504',
  },
  {
    name: 'Perfect Gifts',
    description:
      'Gift wrapping. Try a name tag bracelet and make your gift even more memorable.',
    image:
      'https://cdn.shopify.com/s/files/1/0720/9998/7768/files/perfect-gifts_cdeaffab-e168-4890-84e1-449c6210e4b7.png?v=1687878787',
  },
]

const Policies = (props) => {
  console.log('Policies props', props)
  const { className, columns } = props
  const COLUMNS = columns ?? 4

  return (
    <div className={`policies__c ${className} col-${COLUMNS}`}>
      {DATA.map((item, index) => (
        <div className={`policies__item`}>
          <Image src={item.image} />
          <h3 className={`policies__item-name`}>{item.name}</h3>
          <p className={`policies__item-description`}>{item.description}</p>
        </div>
      ))}
    </div>
  )
}

export default Policies
