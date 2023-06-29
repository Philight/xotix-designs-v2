document.addEventListener("DOMContentLoaded", function(event) {
  console.log('generalPage script is running');
  
    function waitForElem(selectorTxt) {
        return new Promise(resolve => {
            if (document.querySelector(selectorTxt)) {
                return resolve(document.querySelector(selectorTxt));
            }

            const observer = new MutationObserver(mutations => {
                if (document.querySelector(selectorTxt)) {
                    resolve(document.querySelector(selectorTxt));
                    observer.disconnect();
                }
            });

            observer.observe(document.body, {
                childList: true,
                subtree: true
            });
        });
    }
  /*
  	const elemCenterScreen = (elem) => {
      	var Mwidth = elem.offsetWidth;
        var Mheight = elem.offsetHeight;
        var Wwidth = window.innerWidth;
        var Wheight = window.innerHeight;
        elem.style.position = "absolute";
        elem.style.top = ((Wheight - Mheight ) / 2 +window.pageYOffset ) + "px";
      	elem.style.left = '0';	
        //elem.style.left = ((Wwidth - Mwidth) / 2 +window.pageXOffset ) + "px";
    }
    
    const showModal = ($elem) => {
      	elemCenterScreen($elem);
      	$elem.style.opacity = '1';
      	$elem.style.visibility = 'visible';
      	$elem.style.zIndex = '500';
      	document.getElementsByTagName('body')[0].style.overflow = 'hidden';
    }
    const closeModal = ($elem) => {
      	$elem.style.opacity = '0';
      	$elem.style.visibility = 'hidden';
      	$elem.style.zIndex = '-1';
      	document.getElementsByTagName('body')[0].style.overflow = 'visible';
    }
    
    const fillReviewModal = ($item) => {
    	let $img = $item.querySelector('.image-container img');
      	let imgUrl = '';
	    if ($img) { imgUrl = $img.getAttribute('src'); }
        let reviewAuthor = $item.querySelector('p.hulk-vendor-name').textContent;
		let reviewTime = $item.querySelector('p.review-time').textContent;
      	let $reviewStars = $item.querySelector('div.hulk-pr__review-icon');
      	let reviewTitle = '';
      	let reviewBody = '';
		if ($reviewStars.parentNode.nextElementSibling.classList.contains("reviewBody-caption"))
          	reviewBody = $reviewStars.parentNode.nextElementSibling.textContent;
      	else if($reviewStars.parentNode.nextElementSibling.nextElementSibling.classList.contains("reviewBody-caption")) {
          	reviewTitle = $reviewStars.parentNode.nextElementSibling.textContent;
			reviewBody = $reviewStars.parentNode.nextElementSibling.nextElementSibling.textContent;
        } else {
          	reviewTitle = $reviewStars.parentNode.nextElementSibling.textContent;
        }
		$reviewStars = $reviewStars.cloneNode(true).outerHTML;
      
      	let $productThumbnail = $item.querySelector('.review-details').nextElementSibling;
      	let productImgUrl = $productThumbnail.querySelector('img').getAttribute('src');
      	let productName = $productThumbnail.querySelector('p a').textContent;
      	let productUrl = $productThumbnail.querySelector('p a').getAttribute('href');

      	let $modal = document.querySelector('.page.customer-reviews .modal-container .modal-content');
      
      	const reviewBodyContent = '<p class="author">'+reviewAuthor+'</p><p class="date">'+reviewTime+'</p>'+$reviewStars+'<p class="title">'+reviewTitle+'</p><p class="body">'+reviewBody+'</p>';
      	const productContent = '<a href="'+productUrl+'"><div class="img-container"><img src="'+productImgUrl+'" /></div><p>'+productName+'<br><button>View Product</button></p></a>'
      	const reviewContent = '<div class="review-body">'+reviewBodyContent+'</div><div class="product-container">'+productContent+'</div>';
      	const closeIcon = '<div class="close-icon"><svg viewBox="2 2 20 20"><path fill="currentColor" d="M19 6.41L17.59 5 12 10.59 6.41 5 5 6.41 10.59 12 5 17.59 6.41 19 12 13.41 17.59 19 19 17.59 13.41 12 19 6.41z" /></svg></div>';

      	$modal.insertAdjacentHTML('afterbegin', '<img class="review-img" src="'+imgUrl+'" /><div class="review-content">'+reviewContent+closeIcon+'</div>');
    }
    
    const emptyReviewModal = () => {
      	let $modal = document.querySelector('.page.customer-reviews .modal-container .modal-content');
      	while ($modal.firstChild) {
          	$modal.firstChild.remove()
      	}
    }
*/
  if (document.querySelector('.page.customer-reviews')) {

    const url = 'https://vm110.hostmaster.sk';
    const PORT = 3000;
    const APIPrefix = '/apps/xdesigns-api';
    const SHOP_PARAM = '?shop=x-oti-x-designs.myshopify.com';
    let pagination = 1;
    const per_page = 15;

    let allReviewsData = {};

    const eventListeners = () => {
      /*waitForElem('.page.customer-reviews .judgeme-reviews .reviews-item').then((elm) => {
        const $reviewItems = document.querySelectorAll('.page.customer-reviews .judgeme-reviews .reviews-item');
        for (var i = 0; i < $reviewItems.length; i++) {
          $reviewItems[i].addEventListener("click", openModal);
        }
      })*/
      document.body.addEventListener("click", (e) => {
        if (!e.target.closest('.reviews-product-url') && e.target.closest('.reviews-item')) {
          openModal(e);
        }
        if (e.target.classList.contains('reviews-modal-overlay') || e.target.classList.contains('icon-close')) {
          closeModal(e);
        }
      })

      document.querySelector('.reviews-load-more').addEventListener("click", loadMore);
      //document.querySelector('.judgeme-reviews-modal .reviews-modal-overlay').addEventListener("click", closeModal);
      //document.querySelector('.judgeme-reviews-modal .icon-close').addEventListener("click", closeModal);
    }

    const loadMore = (e) => {
      pagination++;
      fetchReviews('loadmore', pagination);
    }

    const fillModal = (e) => {
      const $reviewModal = document.querySelector('.judgeme-reviews-modal');
      const reviewId = e.target.closest('.reviews-item').dataset.reviewId;
      const reviewImageUrl = allReviewsData[reviewId].pictures.length ? allReviewsData[reviewId].pictures[0].urls.huge : '';
      const _reviewImage = '<img src="'+reviewImageUrl+'" />'; 
      const reviewAuthor = allReviewsData[reviewId].reviewer.name; 
      const rawDate = allReviewsData[reviewId].created_at.split('T')[0].split('-');
      const reviewDate = `${rawDate[2]}/${rawDate[1]}/${rawDate[0]}`;
      const reviewBody = allReviewsData[reviewId].body;
      const reviewTitle = allReviewsData[reviewId].title;
      const ratingIconUrl = 'https://res.cloudinary.com/xotixdesigns/image/upload/v1646776155/icons/ecommerce/star-rating_pav4mq_ou16ie.svg';
      let _ratingStars = '';

      const _productTitle = allReviewsData[reviewId].product_title;
      const _productUrl = allReviewsData[reviewId].product_url;
      const _productImageUrl = allReviewsData[reviewId].product_images ? allReviewsData[reviewId].product_images[0].src : '';
      const _productImage = '<img class="reviews-product-image" src="'+_productImageUrl+'" />';
      const _productContainer = '<a class="reviews-product-url" href="'+_productUrl+'">'+'<div class="reviews-product-container">'+_productImage+'<span class="reviews-product-name">'+_productTitle+'</span></div></a>';

      for(let i=0; i < allReviewsData[reviewId].rating; i++) {
        _ratingStars += '<img class="icon icon-star rating" style="-webkit-mask: url('+ratingIconUrl+') no-repeat center; mask: url('+ratingIconUrl+') no-repeat center;" />';
        //ratingStars += '<object type="image/svg+xml" data="'+ratingIconUrl+'" class="logo"></object>';
        //ratingStars = '<object data="https://res.cloudinary.com/xotixdesigns/image/upload/v1646776155/icons/ecommerce/star-rating_pav4mq_ou16ie.svg" width="32" height="32" onload="this.contentDocument.querySelector(\'svg\').fill = \'red\'"></object>';
      }

      $reviewModal.querySelector('.reviews-modal__author').textContent = reviewAuthor;
      $reviewModal.querySelector('.reviews-modal__date').textContent = reviewDate;
      $reviewModal.querySelector('.reviews-modal__rating').insertAdjacentHTML("afterbegin", _ratingStars);
      $reviewModal.querySelector('.reviews-modal__title').textContent = reviewTitle;
      $reviewModal.querySelector('.reviews-modal__body').textContent = reviewBody;

      $reviewModal.querySelector('.reviews-modal__product-image').src = _productImageUrl;
      $reviewModal.querySelector('.reviews-modal__product-title').textContent = _productTitle;
      //$reviewModal.querySelector('.reviews-modal__body').textContent = reviewBody;
      $reviewModal.querySelector('.reviews-modal__product-cta').href = _productUrl;

      document.querySelector('.judgeme-reviews-modal .reviews-modal__image-container').insertAdjacentHTML("afterbegin", _reviewImage);
      

    }

    const openModal = (e) => {
      const $reviewModal = document.querySelector('.judgeme-reviews-modal');
      fillModal(e);
      console.log(e.target);
      console.log(e.currentTarget);

      $reviewModal.style.opacity = 1;
      $reviewModal.style.visibility = 'visible';
    }

    const closeModal = () => {
      const $reviewModal = document.querySelector('.judgeme-reviews-modal').remove();
      const _reviewsModal = `
      <div class="judgeme-reviews-modal">
        <div class="reviews-modal-overlay"></div>
        <div class="reviews-modal-container">
          <img class="icon icon-close" />
          <div class="reviews-modal__image-container"></div>
          <div class="reviews-modal__content">
            <div class="reviews-modal__inner-content">
              <figcaption class="reviews-modal__author"></figcaption>
              <span class="reviews-modal__date"></span>
              <div class="reviews-modal__rating"></div>
              <div class="reviews-modal-text__wrapper">
                <span class="reviews-modal__title"></span>
                <blockquote class="reviews-modal__body"></blockquote>
              </div>
            </div>
            <div class="reviews-modal__product-container">
              <img class="reviews-modal__product-image" onerror="this.src='https://cdn.shopify.com/s/files/1/0592/3494/3165/products/DSCF1643_720x.jpg?v=1639407837'" />
              <span class="reviews-modal__product-title"></span>
              <a class="reviews-modal__product-cta">SHOP NOW</a>
            </div>
          </div>
        </div>
      </div>`;

      document.querySelector('.page.customer-reviews').insertAdjacentHTML('afterbegin', _reviewsModal);


      //$reviewModal.style.display = 'none';
    }



    const formReviews = () => {
      const $innerPage = document.querySelector('.page__inner .page__rte');
      const reviewsContainer = `
      <div class="judgeme-reviews">
        <div class="reviews-header"></div>
        <div class="reviews-container"></div>
        <div class="reviews-load-more-wrapper"><a class="reviews-load-more">LOAD MORE</a></div>
      </div>`;
      const _reviewsModal = `
      <div class="judgeme-reviews-modal">
        <div class="reviews-modal-overlay"></div>
        <div class="reviews-modal-container">
          <img class="icon icon-close" />
          <div class="reviews-modal__image-container"></div>
          <div class="reviews-modal__content">
            <div class="reviews-modal__inner-content">
              <figcaption class="reviews-modal__author"></figcaption>
              <span class="reviews-modal__date"></span>
              <div class="reviews-modal__rating"></div>
              <div class="reviews-modal-text__wrapper">
                <span class="reviews-modal__title"></span>
                <blockquote class="reviews-modal__body"></blockquote>
              </div>
            </div>
            <div class="reviews-modal__product-container">
              <img class="reviews-modal__product-image" src="" onerror="this.src='https://cdn.shopify.com/s/files/1/0592/3494/3165/products/DSCF1643_720x.jpg?v=1639407837'"   />
              <span class="reviews-modal__product-title"></span>
              <a class="reviews-modal__product-cta">SHOP NOW</a>
            </div>
          </div>
        </div>
      </div>`;

      $innerPage.insertAdjacentHTML('afterbegin', reviewsContainer);
      document.querySelector('.page.customer-reviews').insertAdjacentHTML('afterbegin', _reviewsModal);
    }

    const fillReviews = (init, reviews, reviewsCount, reviewsRating) => {
      let _allReviews = '';
      let _reviewsCount, _reviewsAvgRating, ratingPercentage, _reviewsAvgRatingStars;

console.log(init);

      if (init) {
        _reviewsAvgRating = '<span class="reviews-avg-rating__number">'+reviewsRating+'</span>';
        _reviewsCount = '<span class="reviews-count">from '+reviewsCount+' reviews</span>';

        ratingPercentage = parseInt((reviewsRating - parseInt(reviewsRating))*100) + '%';
  console.log(ratingPercentage); 

        const ratingIconUrl = 'https://res.cloudinary.com/xotixdesigns/image/upload/v1646776155/icons/ecommerce/star-rating_pav4mq_ou16ie.svg';
        let avgRatingStars = '';
        for(let i=0; i<parseInt(reviewsRating); i++) {
          avgRatingStars += '<img class="icon icon-star rating" style="-webkit-mask: url('+ratingIconUrl+') no-repeat center; mask: url('+ratingIconUrl+') no-repeat center; -webkit-mask-size: cover;" />';
          //ratingStars += '<object type="image/svg+xml" data="'+ratingIconUrl+'" class="logo"></object>';
          //ratingStars = '<object data="https://res.cloudinary.com/xotixdesigns/image/upload/v1646776155/icons/ecommerce/star-rating_pav4mq_ou16ie.svg" width="32" height="32" onload="this.contentDocument.querySelector(\'svg\').fill = \'red\'"></object>';
        }
        for(let i=0; i<5-parseInt(reviewsRating); i++) {
          avgRatingStars += `<img class="icon icon-star rating" style="
            -webkit-mask: url('`+ratingIconUrl+`') no-repeat center; 
            mask: url('`+ratingIconUrl+`') no-repeat center;
            -webkit-mask-size: cover;
            background-image: linear-gradient(to right, #ffdc00 `+ratingPercentage+`, white);
            "
          />`;
        }
console.log(_reviewsCount);
        _reviewsAvgRatingStars = '<span class="reviews-avg-rating__stars">'+avgRatingStars+'</span>';
      }
console.log(_reviewsCount);
      

      //for (let i=0; i < reviews.length; i++) {
      for (let id in reviews) {
console.log(reviews[id]);

        if (reviews[id].hidden) continue;

        const imgUrl = reviews[id].pictures.length ? reviews[id].pictures[0].urls.compact : '';
        const rawDate = reviews[id].created_at.split('T')[0].split('-');
        const formatDate = `${rawDate[2]}/${rawDate[1]}/${rawDate[0]}`;
        const ratingIconUrl = 'https://res.cloudinary.com/xotixdesigns/image/upload/v1646776155/icons/ecommerce/star-rating_pav4mq_ou16ie.svg';
        let ratingStars= '';
        for(let i=0; i<reviews[id].rating; i++) {
          ratingStars += '<img class="icon icon-star rating" style="-webkit-mask: url('+ratingIconUrl+') no-repeat center; mask: url('+ratingIconUrl+') no-repeat center;" />';
          //ratingStars += '<object type="image/svg+xml" data="'+ratingIconUrl+'" class="logo"></object>';
          //ratingStars = '<object data="https://res.cloudinary.com/xotixdesigns/image/upload/v1646776155/icons/ecommerce/star-rating_pav4mq_ou16ie.svg" width="32" height="32" onload="this.contentDocument.querySelector(\'svg\').fill = \'red\'"></object>';
        }

        const _author = '<figcaption class="reviews-author">'+reviews[id].reviewer.name+'</figcaption>';
        const _date = '<span class="reviews-date">'+formatDate+'</span>';
        const _rating = '<span class="reviews-rating">'+ratingStars+'</span>';

        const _title = reviews[id].title ? '<span class="reviews-title">'+reviews[id].title+'</span>' : '';
        const _body = '<blockquote class="reviews-body">'+reviews[id].body+'</blockquote>';
        const _textWrapper = '<div class="reviews-text-wrapper">'+_title + _body+'</div>';

        const _productId = reviews[id].product_external_id;
        const _productHandle = reviews[id].product_handle;

        const _productTitle = reviews[id].product_title;
        const _productUrl = reviews[id].product_url;
        const _productImageUrl = reviews[id].product_images ? reviews[id].product_images[0].src : '';
        const _productImage = '<img class="reviews-product-image" src="'+_productImageUrl+'" />';
        const _productContainer = '<a class="reviews-product-url" href="'+_productUrl+'">'+'<div class="reviews-product-container">'+_productImage+'<span class="reviews-product-name">'+_productTitle+'</span></div></a>';

        let reviewItem = `
        <figure class="reviews-item" data-review-id="`+reviews[id].id+`">
          <img class="reviews-image" src="`+imgUrl+`" />
          <div class="reviews-content">
            `+_author+`
            `+_date+`
            `+_rating+`
            `+_textWrapper+`
          </div>
          `+_productContainer+`
        </figure>`;

        _allReviews += reviewItem;        
      }

      // Not empty reviews
      if (_allReviews.length > 0) {
        const $reviews = document.querySelector('.judgeme-reviews');
        const $reviewsContainer = $reviews.querySelector('.reviews-container');
        const $reviewsHeader = $reviews.querySelector('.reviews-header');
         
        if (init) {
console.log('fetchReviews init');
console.log(_reviewsCount);
          $reviewsHeader.insertAdjacentHTML('afterbegin', _reviewsCount);
          $reviewsHeader.insertAdjacentHTML('afterbegin', _reviewsAvgRatingStars);
          $reviewsHeader.insertAdjacentHTML('afterbegin', _reviewsAvgRating);
        }
        $reviewsContainer.insertAdjacentHTML('beforeend', _allReviews);
      }
    }

    const fetchReviews = async (mode, page) => {
      try {
        console.log('fetchReviews mode: '+mode);
/*
console.log('test fetch get hello');
        let responseGETH1 = await fetch(url+':'+PORT+'/'+SHOP_PARAM, { method: 'GET' });
        let messageH1 = await responseGETH1.text(); 
console.log(messageH1); 
*/
/*
console.log('test fetch get hello');
        let responseGETH = await fetch('https://x-oti-x-designs.myshopify.com/admin/oauth/install_custom_app?client_id=d12209077baccc93763ad051fc59ee30&signature=eyJfcmFpbHMiOnsibWVzc2FnZSI6ImV5SmxlSEJwY21WelgyRjBJam94TmpRMk9URTNPREUzTENKd1pYSnRZVzVsYm5SZlpHOXRZV2x1SWpvaWVDMXZkR2t0ZUMxa1pYTnBaMjV6TG0xNWMyaHZjR2xtZVM1amIyMGlMQ0pqYkdsbGJuUmZhV1FpT2lKa01USXlNRGt3TnpkaVlXTmpZemt6TnpZellXUXdOVEZtWXpVNVpXVXpNQ0lzSW5CMWNuQnZjMlVpT2lKamRYTjBiMjFmWVhCd0luMD0iLCJleHAiOiIyMDIyLTAzLTE3VDEzOjEwOjE3LjE2N1oiLCJwdXIiOm51bGx9fQ%3D%3D--d1857eac71f553d92dcfea7ecfdbba00e6ee93c0');
        let messageH = await responseGETH.text(); 
console.log(messageH); 
*/
/*
console.log('test fetch get auth');
        let responseGETHauth = await fetch(url+':'+PORT+'/auth'+SHOP_PARAM, { method: 'GET' });
        let messageHauth = await responseGETHauth.text(); 
console.log(messageHauth); 
*/
/*
console.log('test fetch get auth');
        let responseGETHauth = await fetch(url+':'+PORT+'/xotix'+SHOP_PARAM, { method: 'GET' });
        let messageHauth = await responseGETHauth.text(); 
console.log(messageHauth); 
*/
/*
console.log('test fetch get hello');
        let responseGETH = await fetch(APIPrefix+SHOP_PARAM, { method: 'GET' });
        let messageH = await responseGETH.text(); 
console.log(messageH); 
*/
/*
console.log('-- test PROXY /apps/xdesigns');
        let responseGET0 = await fetch('/apps/xdesigns-api', { method: 'GET' });
        let message0 = await responseGET0.text(); 
console.log(message0);

*//*
        const APIpath = '/apps/xdesigns-api/test-path';
console.log('-- TEST POST /apps/xdesigns-api/testpost: ');
        let responseGET1 = await fetch(APIPrefix+'/testpost'+SHOP_PARAM, {
          method: 'POST', mode: "cors", redirect: "follow", headers: {
            "Content-Type": "application/json"
            // 'Content-Type': 'application/x-www-form-urlencoded',
          }
        });
console.log(responseGET1);
        let message1 = await responseGET1.text(); 
console.log(message1);
*/

console.log('-- test fetch get reviews 10');
        const reqParams = {
          method: 'POST',
          //mode: 'no-cors',
          headers: {
            'Accept': 'application/json',
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            'pagination': page,
            'per_page': per_page
          })
        };
        let responsePOST = await fetch(APIPrefix+'/reviews', reqParams);
console.log(responsePOST);
//console.log(await responsePOST.text());

        let message = await responsePOST.json(); 
console.log(message);

        for (let i = 0; i < message.reviews.length; i++) {
          allReviewsData[message.reviews[i].id] = message.reviews[i];
        }
        
        if (mode == 'init') {
          const reviewsCount = message.reviews_count;
          const reviewsRating = parseFloat(message.reviews_rating);
          //allReviewsData = message.reviews;
          fillReviews(true, allReviewsData, reviewsCount, reviewsRating);
        
        } else {
          fillReviews(false, allReviewsData, null, null);
        }

console.log(allReviewsData);

/*
        const $innerPage = document.querySelector('.page__inner .page__rte')
        $innerPage.insertAdjacentHTML('afterbegin', message.all_reviews);
        $innerPage.insertAdjacentHTML('afterbegin', message.all_reviews_header);
*/
      } catch(err) {
        console.log(err);
      }
    }

    formReviews();
    fetchReviews('init', pagination);
    eventListeners();

/*
        var $imageDiv = document.createElement("div");
      	var $image = document.createElement("img");
      
        waitForElem('.hulk-pr__list-items .hulk-row').then((elm) => {
          
          	let $reviewList = document.querySelector('.hulk-pr__list-view');
          	const modalContent = '<div class="modal-content"></div>';
      		$reviewList.insertAdjacentHTML('afterbegin', '<div class="modal-container"><div class="modal-bkg"></div>'+modalContent+'</div>');
			
          	let $modal = document.querySelector('.modal-container');
          	//elemCenterScreen($modal);
          	$modal.addEventListener("click", function(e) {
              console.log(e.target);
              	if (e.target.closest('.close-icon') || (e.target.closest('.modal-content') == null)) {
                	closeModal($modal);
                  	emptyReviewModal();
              	}
            })
          
         	let $reviewItems = document.querySelectorAll('.hulk-pr__list-items .hulk-row');
          	//console.log($reviewItems);

            for(let i=0; i<$reviewItems.length; i++) {

              let $thumbImg = $reviewItems[i].querySelector('.product-review-photo img');
              if ($thumbImg) {
              	let imgSrc = $thumbImg.getAttribute("src").replace("/thumbnails","");
                $reviewItems[i].insertAdjacentHTML('afterbegin', '<div class="image-container"><img src="'+imgSrc+'" alt="Bracelet"/></div>');
              }
              
              let $reviewTime = $reviewItems[i].querySelector('.review-time');
              $reviewItems[i].querySelector('.hulk-item').insertBefore($reviewTime, $reviewItems[i].querySelector('.review-details'));
              
              let productHandle = $reviewItems[i].querySelector('div.font-weight-bold a').getAttribute('href');
			  //console.log(productHandle);
              fetch(productHandle+'.js')
                .then(response => response.json())
              	.then(data => {
                	let imgUrl = data.featured_image;
                	let $prodLink = $reviewItems[i].querySelector('div.font-weight-bold').insertAdjacentHTML('afterbegin', '<img src="'+imgUrl+'" />');
              	});
              
              // Add show modal listeners
              $reviewItems[i].addEventListener("click", function() {
                fillReviewModal($reviewItems[i], $modal);
                showModal($modal);
              })
            }
        })*/

    }
      
})