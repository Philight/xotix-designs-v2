document.addEventListener("DOMContentLoaded", function(event) {
  console.log('thankYouPage script is running');

  const $lineProducts = document.querySelectorAll('.product-table .product');
  const $lineProductProperties = document.querySelectorAll('.hidden.line-item-properties div');
console.log($lineProducts);

  const shopURL = 'https://xotixdesigns.com';
  let productIds = [];
  let productHandles = [];
  let variantIds = [];
  let lineProductProperties = [];

  let lineProducts = [];
  let recommendedProducts = [];

  for (var i = 0; i < $lineProducts.length; i++) {
   productIds.push($lineProducts[i].dataset.productId); 
console.log($lineProducts[i].dataset.productId);   
  }
console.log(productIds);

  for (var i = 0; i < $lineProductProperties.length; i++) {
    lineProductProperties.push({ 
      index: $lineProductProperties[i].dataset.lineItemIndex,
      id: $lineProductProperties[i].dataset.productId,
      handle: $lineProductProperties[i].dataset.productHandle,
      variant_id: $lineProductProperties[i].dataset.variantId
    })
  }
console.log(lineProductProperties);   

  for (var i = 0; i < lineProductProperties.length; i++) {
    productHandles.push(lineProductProperties[i].handle);
    variantIds.push(lineProductProperties[i].variant_id);
  }

  const fillBuyMore = (fetchedProds) => {
    const _navArrowLeft = `<span class="icon-wrapper left"><img class="icon-nav left" /></span>`;
    const _navArrowRight = `<span class="icon-wrapper right"><img class="icon-nav right" /></span>`;
    const sectionTitle = 'Buy more for 30% OFF';

    let _recommendedContainer = `
    <div class="buy-more">`
      +_navArrowLeft
      +_navArrowRight
      +'<h3 class="section-title">'+sectionTitle+'</h3>'
      +'<div class="buy-more__container">';

    for (let i = 0; i < fetchedProds.length; i++) {

      let _images = '';
      if (fetchedProds[i].images) {
        for (let j = 1; j < fetchedProds[i].images.length; j++) {
          _images += '<div class="image-wrapper"><img src="'+fetchedProds[i].images[j].src+'" /></div>';

          if (j == fetchedProds[i].images.length - 1) {
            _images += '<div class="image-wrapper"><img src="'+fetchedProds[i].images[0].src+'" /></div>';
          }
        }
      } 

      const _navArrowLeftImg = `<span class="icon-wrapper left img-nav"><img class="icon-nav left" /></span>`;
      const _navArrowRightImg = `<span class="icon-wrapper right img-nav"><img class="icon-nav right" /></span>`;

      let _itemImages = `<div class="product-images">`+_images+'</div>';
      let _itemTitle = `<div class="product-title-wrapper">`+_navArrowLeftImg+`<span class="product-title">`+fetchedProds[i].title+'</span>'+_navArrowRightImg+'</div>';
      
      let _itemSalePrice, onSale, _itemPrice;
      let variantId = variantIds[i];
      for (let j = 0; j < fetchedProds[i].variants.length; j++) {
        if (fetchedProds[i].variants[j].id == variantId) {
          _itemSalePrice = fetchedProds[i].variants[j].compare_at_price ? `<span class="sale-price">€`+fetchedProds[i].variants[j].compare_at_price+'</span>' : '';
          onSale = fetchedProds[i].variants[j].compare_at_price ? 'on-sale' : '';
          _itemPrice = `<div class="product-price `+onSale+`">`+_itemSalePrice+'<span class="price">€'+fetchedProds[i].variants[j].price+'</span></div>';
        }
      }

      let _itemAddToCart = `
      <form action="/cart/add" method="post" id="product-form-`+fetchedProds[i].id+`"> 
        <input type="hidden" name="id" value="`+fetchedProds[i].variants[0].id+`"> 
        <div class="add-to-cart-wrapper"> <button type="submit" name="add">Add to cart</button> </div> 
      </form>`;

      let _recommendedItem = `
      <div class="product-item">`   
      +_itemTitle
      +_itemPrice      
      +_itemImages
      +_itemAddToCart
      +`</div>`;

      _recommendedContainer += _recommendedItem;
    }

    _recommendedContainer += '</div></div>';

    document.querySelector('.order-summary').insertAdjacentHTML('afterend', _recommendedContainer);
  }

  const fillRecommendedProducts = (fetchedProds) => {
//console.log(fetchedProds);
    const _navArrowLeft = `<span class="icon-wrapper left"><img class="icon-nav left" /></span>`;
    const _navArrowRight = `<span class="icon-wrapper right"><img class="icon-nav right" /></span>`;
    const sectionTitle = 'Add one of these for free shipping';

    let _recommendedContainer = `
    <div class="recommended-products">`
      +_navArrowLeft
      +_navArrowRight
      +'<h3 class="section-title">'+sectionTitle+'</h3>'
      +'<div class="recommended-products__container">';

    for (let i = 0; i < fetchedProds.length; i++) {
//console.log(fetchedProds[i]);
//console.log(fetchedProds[i].title);

      let _itemImage = `<div class="product-image"><img src="`+fetchedProds[i].featured_image+'" /></div>';
      let _itemTitle = `<div class="product-title">`+fetchedProds[i].title+'</div>';
      
      let _itemSalePrice = fetchedProds[i].compare_at_price ? `<span class="sale-price">€`+(fetchedProds[i].compare_at_price/100.00).toFixed(2)+'</span>' : '';
      let onSale = fetchedProds[i].compare_at_price ? 'on-sale' : '';
      let _itemPrice = `<div class="product-price `+onSale+`">`+_itemSalePrice+'<span class="price">€'+(fetchedProds[i].price/100.00).toFixed(2)+'</span></div>';

      let _itemAddToCart = `
      <form action="/cart/add" method="post" id="product-form-`+fetchedProds[i].id+`"> 
        <input type="hidden" name="id" value="`+fetchedProds[i].variants[0].id+`"> 
        <div class="add-to-cart-wrapper"> <button type="submit" name="add">Add to cart</button> </div> 
      </form>`;


      let _recommendedItem = `
      <div class="recommended-item">`
      +_itemImage
      +_itemTitle
      +_itemPrice
      +_itemAddToCart
      +`</div>`;

      _recommendedContainer += _recommendedItem;
    }

    _recommendedContainer += '</div></div>';

    document.querySelector('.os-order-number').closest('.section').insertAdjacentHTML('afterend', _recommendedContainer);
  }

  const fillRecommendedCollections = (collections) => {
    const _navArrowLeft = collections.length > 3 ? `<span class="icon-wrapper left"><img class="icon-nav left" /></span>` : '';
    const _navArrowRight = collections.length > 3 ? `<span class="icon-wrapper right"><img class="icon-nav right" /></span>` : '';
    const sectionTitle = 'You might check out';

    let _recommendedContainer = `
    <div class="recommended-collections">`
      +_navArrowLeft
      +_navArrowRight
      +'<h3 class="section-title">'+sectionTitle+'</h3>'
      +'<div class="recommended-collections_container">';

    for (let i = 0; i < collections.length; i++) {
      let imageSrc = collections[i].image ? collections[i].image.src : '';
      let _collectionImage = `<div class="collection-image"><img src="`+imageSrc+'" /><div class="collection-overlay"></div></div>';
      let _collectionTitle = `<div class="collection-title">`+collections[i].title+'</div>';
      let collectionURL = shopURL+'/collections/'+collections[i].handle;

      let _recommendedItem = `
      <div class="recommended-item">
        <a class="collection-link" href="`+collectionURL+`">`
          +_collectionImage
          +_collectionTitle
        +`</a>
      </div>`;

      _recommendedContainer += _recommendedItem;
    }

    _recommendedContainer += '</div></div>';
    document.querySelector('.os-step__description').closest('.content-box').insertAdjacentHTML('afterend', _recommendedContainer);
  }

  const fetchAPI = async () => {
    let fetchedProds = [];
    const url = 'https://vm110.hostmaster.sk';
    const PORT = 3000;
    const APIPrefix = '/apps/xdesigns-api';
/*
      var lolo = fetch("/products/accon.js")
        .then(response => response.json())
        .then( product => {
          console.log(product);
        })
*/
    // Fetch line products
    var ctrBuyMore = 0;
    productHandles.forEach( prodHandle => {
console.log('fetching product');
console.log(prodHandle);
      var result = fetch("/products/"+prodHandle+".json")
        .then(response => response.json() )
        .then( ({product}) => {
console.log(product);
          lineProducts.push(product);

          ctrBuyMore++; 
          if (ctrBuyMore === productHandles.length) {
console.log(lineProducts);
            fillBuyMore(lineProducts);
            return lineProducts;
          }
        })
    })

    // Fetch recommended products
    var ctrRecommendedProds = 0;
    productIds.forEach( prodId => {
console.log('fetching recommended products');
      fetch("/recommendations/products.json?product_id="+prodId)
        .then(response => response.json())
        .then(({ products }) => {
          if (products.length > 0) {
            //const firstRecommendedProduct = products[0];
//console.log(products);

            for (const property in products) {
//console.log(`${property}: ${products[property]}`);
//console.log(products[property]);

              fetchedProds.push(products[property]);
            }

            ctrRecommendedProds++; 
            if (ctrRecommendedProds === productIds.length) {
//console.log(fetchedProds);

              fillRecommendedProducts(fetchedProds);
              return fetchedProds;
            }

          }
        });
    })

    // Fetch Recommended collections
console.log('-- fetch get collection');
    const productIdsStr = productIds[0];
    for (var i = 1; i < productIds.length; i++) {
      productIdsStr += ','+productIds[i];
    }
    const reqParams = {
      method: 'POST',
      //mode: 'no-cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        'product_ids': productIdsStr
      })
    };
    let responsePOST = await fetch(APIPrefix+'/getcollections', reqParams);
//console.log(responsePOST);
    let collections = await responsePOST.json(); 
//console.log(collections);
    fillRecommendedCollections(collections);
  }

  fetchAPI();
})
