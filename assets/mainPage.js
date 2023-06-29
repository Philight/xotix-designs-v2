document.addEventListener("DOMContentLoaded", function(event) {
  console.log('mainPage script is running');
 // console.log('DOM loaded');
  function waitForElem(selector) {
    return new Promise(resolve => {
        if (document.querySelector(selector)) {
            return resolve(document.querySelector(selector));
        }

        const observer = new MutationObserver(mutations => {
            if (document.querySelector(selector)) {
                resolve(document.querySelector(selector));
                observer.disconnect();
            }
        });

        observer.observe(document.body, {
            childList: true,
            subtree: true
        });
    });
  }

  let screenWidth = window.screen.width;
  let screenHeight = window.screen.height;
  




const url = 'https://vm110.hostmaster.sk';
const PORT = 3000;

/* Callback function */
const fetchTEST = async () => {
    
  try {
    const reqParams = {
      method: 'POST',
      //mode: 'no-cors',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
          'qr_code': 'qrCode', 
          'email': '$emailInput.value'
      })
    };

    // fetch GET
console.log('MAIN - test fetch get');
    let responseGET = await fetch(url+':'+PORT+'/hello', { method: 'GET' });
    let message = responseGET.text(); 
console.log(message);
/*
    // fetch POST
console.log('fetching');    
    let responsePOST = await fetch(url+':'+PORT+'/test/testpost', reqParams);
console.log(responsePOST);    
    let jsonRes = await responsePOST.json();
    console.log(jsonRes); 
*/
  } catch(err) {
    console.log(err);
  }
}



fetchTEST();








  // temp bugfix 
  document.querySelector('.page-transition').style.cssText ='opacity: 0; visibility: hidden;';
  
  // product quickview
  document.body.addEventListener('click', function(event) {
    //console.log('modal clicked');
    var $productQuickView = document.querySelector('.gfqv-product-wrapper');
    if ($productQuickView == null) return;
    
    if (!$productQuickView.contains(event.target)) {
      //console.log('outside container');
      document.querySelector('.page-transition').style.cssText ='opacity: 0; visibility: hidden;'; 
    } else {
      //console.log('inside container');
    }
  })
  
  // Featured Collection Table
  let $tabSelectors = document.querySelectorAll('.featured-collection-table .tab-selector');
  for (i=0; i<$tabSelectors.length; i++) {
    $tabSelectors[i].addEventListener("click", (e) => {
      console.log('tab clicked');
      const $collectionTable = e.target.closest('.featured-collection-table__content');
      const $selectedElements = $collectionTable.querySelectorAll('.selected');
      for (s=0; s<$selectedElements.length; s++) {
        $selectedElements[s].classList.remove('selected');
      }

      const $selectedTab = e.currentTarget;
      let collectionId = $selectedTab.dataset.collectionId;
      $selectedTab.classList.add('selected');


      const $selectFeaturedCollection = $collectionTable.querySelector('.featured-collection-wrapper[data-collection-id="'+collectionId+'"]');
      console.log($selectFeaturedCollection);
      $selectFeaturedCollection.classList.add('selected');
    })  
  }
  
  // Judge.me Review Carousel
  const $jdgmReviews = document.querySelector('.jdgm-carousel-wrapper');
  $jdgmReviews.closest('.shopify-block').classList.add('block--contrast');
  $jdgmReviews.querySelector('.jdgm-carousel-title').classList.add('ff-heading', 'fs-heading-2-base', 'fs-heading-1-base-ns');

  // SocialShopWave Instagram
  //document.querySelector('.gw-container .social-heading').classList.add('ff-heading', 'fs-heading-2-base', 'fs-heading-1-base-ns');  
  const sswInstagram = '.gw-container .social-heading';
  waitForElem(sswInstagram).then((elm) => {
    elm.classList.add('ff-heading', 'fs-heading-2-base', 'fs-heading-1-base-ns');  
  })

  // Footer credits accordion
  document.querySelector('.footer__credits .footer-accordion .accordion-label').addEventListener("click", (e) => {
  	e.preventDefault();
    const $accordionContent = e.currentTarget.nextElementSibling;
    if ($accordionContent.classList.contains('accordion-content')) {
      	let $footerAccordion = e.currentTarget.closest('.footer-accordion');
      
      	if ($footerAccordion.classList.contains('open')) {
        	$footerAccordion.classList.remove('open');
          	$footerAccordion.classList.add('closed');

        } else {
            $footerAccordion.classList.remove('closed');
          	$footerAccordion.classList.add('open');
        }
    }
  })
  

  // landing page hover to show/hide
  if (screenWidth > 1024) { 
    let $hoverElements = Array.from(document.querySelectorAll('div.product-item'));//.addEventListener("mouseover", function( event ) {
    const $stonesImgs = Array.from(document.querySelectorAll('.stones-and-benefits .stones-and-benefits__stone-wrapper'));
    $hoverElements.push(...$stonesImgs);

    for (let i = 0; i < $hoverElements.length; i++) {
      let targetSelector = $hoverElements[i].classList.contains('product-item') ? '.product-item__price' : '.stones-and-benefits__readmore';
      $hoverElements[i].addEventListener("mouseover", function() {
        //$products[i].nextElementSibling.querySelector('.product-item__price').style.cssText = 'opacity: 1; transform: translateY(0);';
        $hoverElements[i].querySelector(targetSelector).style.cssText = 'opacity: 1; transform: translateX(0); visibility: visible;';
      });
      $hoverElements[i].addEventListener("mouseout", function() {
        //$products[i].nextElementSibling.querySelector('.product-item__price').style.cssText = 'opacity: 0; transform: translateY(100px);';
        $hoverElements[i].querySelector(targetSelector).style.cssText = 'opacity: 0; transform: translateX(-100%); visibility: hidden; ';
      });
    }
  }
  /* Social Modal */
  /*
  let $socialImages = document.querySelectorAll('.social-proof__slide');//.addEventListener("mouseover", function( event ) {
  const $socialModal = document.querySelector('#xotix-social-modal');
  
  for (let i = 0; i < $socialImages.length; i++) {
    $socialImages[i].addEventListener("click", function() {
    	console.log("social click");
      	$socialModal.style.cssText = "opacity: 1; height: 100vh; z-index: 500;";
    })
  }
  
  $socialModal.querySelector('#xotix-social-modal .modal-close .icon').addEventListener("click", function() {
    	$socialModal.style.cssText = "opacity: 0; height: 0; z-index: -1;";
  })
  */
   /*
  class DraggableCarousel {
  	constructor(slider, slides) {
      console.log('construct start;');

      this.isDragging = false;
      this.startPos = 0;
      this.currentTranslate = 0;
      this.prevTranslate = 0;
      this.animationID;
      this.currentIndex = 0;
      
      this.$slider = slider;
      console.log(this.$slider);
      this.$slides = slides;      
      this.imageWidth = slides[0].offsetWidth;
      
      let that = this;
      this.$slides.forEach((slide, index) => {
        const slideImage = slide.querySelector('img')
        // disable default image drag
        slideImage.addEventListener('dragstart', (e) => e.preventDefault());
        // touch events
        slide.addEventListener('touchend', that.touchEnd());
        slide.addEventListener('touchstart', that.touchStart(that, index));
        
        slide.addEventListener('touchmove', that.touchMove);
        // mouse events
        slide.addEventListener('mouseup', that.touchEnd());
        slide.addEventListener('mousedown', that.touchStart(that, index));
        
        slide.addEventListener('mousemove', that.touchMove);
        slide.addEventListener('mouseleave', that.touchEnd());
      })
      
      // make responsive to viewport changes
      window.addEventListener('resize', this.setPositionByIndex)
       window.oncontextmenu = function (event) {
            event.preventDefault();
            event.stopPropagation();
            return false;
          }
      console.log('construct end;');
    }
    
    var self = this;

    // prevent menu popup on long press
    
  	getPositionX(event) {
      return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX
    }

    touchStart(_this, index) {
      let that = this;
      
      console.log('touchStart slider init');
      console.log(_this.$slider);
      console.log(this.$slider);
      console.log(that.$slider);
      return function (event) {
        
        that.currentIndex = index;
        that.startPos = that.getPositionX(event);
        that.isDragging = true;
        that.animationID = requestAnimationFrame(that.animation);
        console.log('touchStart slider grab');
		console.log(this.$slider);
		console.log(that.$slider);

        that.$slider.classList.add('grabbing');
      }
    }

    touchMove(event) {
      if (this.isDragging) {
        const currentPosition = this.getPositionX(event);
        this.currentTranslate = this.prevTranslate + this.currentPosition - this.startPos;
      }
    }

    touchEnd() {
      let that = this;
      console.log('touchEnd slider init');
      console.log(this.$slider);
      console.log(that.$slider);
      //console.log(_this.$slider);

      //return function(event) {
        cancelAnimationFrame(this.animationID);
        this.isDragging = false;
        const movedBy = this.currentTranslate - this.prevTranslate;

        // if moved enough negative then snap to next slide if there is one
        if (movedBy < -100 && this.currentIndex < this.$slides.length - 1) this.currentIndex += 1;

        // if moved enough positive then snap to previous slide if there is one
        if (movedBy > 100 && this.currentIndex > 0) this.currentIndex -= 1;

        this.setPositionByIndex();

        console.log('touchEnd slider grab');
        console.log(this.$slider);
        console.log(that.$slider);
        //console.log(_this.$slider);

        this.$slider.classList.remove('grabbing');
      //}
    }

    setSliderPosition() {
      console.log('setsliderpos start;');
      this.$slider.style.transform = `translateX(${this.currentTranslate}px)`;
    }
    animation() {
      console.log('anim start;');
      this.setSliderPosition();
      if (this.isDragging) requestAnimationFrame(animation);
      console.log('anim end;');

    }

    setPositionByIndex() {
      
      this.currentTranslate = this.currentIndex * -this.imageWidth;
      this.prevTranslate = this.currentTranslate;
      this.setSliderPosition();
    }

  }
*/
  
  /* Testimonials/Reviews slide animation */

  let $testimonials = Array.from(document.querySelectorAll('.xotix-testimonials'));
  let $featureTilesReviews = Array.from(document.querySelectorAll('.content-tile__reviews-container'));
  $testimonials.push(...$featureTilesReviews);
//console.log($testimonials) ; 

  for (let testimonialIndex = 0; testimonialIndex < $testimonials.length; testimonialIndex++) {
//console.log($testimonials[testimonialIndex]); 

    let itemsSelector;
    let isFeatureTiles = false;
    if ($testimonials[testimonialIndex].classList.contains('content-tile__reviews-container')) {
      isFeatureTiles = true;
      itemsSelector = '.content-tile__reviews-item';
    } else {
      itemsSelector = '.testimonials__item';
    }
  	let $testimonialItems = Array.from($testimonials[testimonialIndex].querySelectorAll(itemsSelector));
//console.log('test items') ; 
//console.log($testimonialItems) ; 


    const $navigationDots = !isFeatureTiles ? Array.from($testimonials[testimonialIndex].querySelectorAll('.nav-dot')) : Array.from($testimonials[testimonialIndex].parentElement.querySelectorAll('.nav-dot'));
//console.log($navigationDots) ; 
    
    const autoplayTime = $testimonials[testimonialIndex].getAttribute('data-autoplay');
    const columns = parseInt($testimonials[testimonialIndex].dataset.columns);

    let timerID = null;
    let translationComplete = true;
    let testimonialContWidth = !isFeatureTiles ? $testimonials[testimonialIndex].querySelector('.testimonials-container').clientWidth : $testimonials[testimonialIndex].clientWidth;
    let currentTrans = [];
    let slideCount = 0;
    let firstViewIndex = 0;
    let lastIndexMoved = 0;

    let transitionCompleted = function(){
        translationComplete = true;
    }
    
    // initialize translation array
    for (let i = 0; i < $testimonialItems.length; i++) {
      	currentTrans[i] = 0;
    	  $testimonialItems[i].addEventListener("transitionend", transitionCompleted, true);                    
        $testimonialItems[i].addEventListener("webkitTransitionEnd", transitionCompleted, true);                    
        $testimonialItems[i].addEventListener("oTransitionEnd", transitionCompleted, true);                    
        $testimonialItems[i].addEventListener("MSTransitionEnd", transitionCompleted, true);
    }
    
 	  slideLeft();	

    function slideLeft() {
      slideCount++;
      
      // make last items visible again
      for (let i = 0; i < columns; i++) {
        if (!$testimonialItems[lastIndexMoved+i]) break;
        $testimonialItems[lastIndexMoved+i].style.opacity = '1';
      }

      // Slide each item by container width
      for (let i = 0; i < $testimonialItems.length; i++) {
        currentTrans[i] = currentTrans[i]-testimonialContWidth;
        $testimonialItems[i].style.transform = 'translateX('+currentTrans[i]+'px)';
      }
     
      // set item index in viewport
      firstViewIndex += parseInt(columns); 
      firstViewIndex = firstViewIndex >= $testimonialItems.length ? 0 : firstViewIndex; 
//console.log('firstViewIndex: '+firstViewIndex);
      let maxSlideCount = $testimonialItems.length / columns;
//console.log('maxSlideCount: '+maxSlideCount);

      // move first to last
      if(slideCount >= maxSlideCount - 1) {

        // items index to be moved
        let outerIndex = firstViewIndex+columns+1 > $testimonialItems.length ? 0 : firstViewIndex+columns;
//console.log('outerIndex: '+outerIndex);
        
        for (let i = 0; i < columns; i++) {
//console.log('currentTrans and index: '+(outerIndex+i));
//console.log(currentTrans[outerIndex+i]);
          if (!currentTrans[outerIndex+i]) break;

          currentTrans[outerIndex+i] = ((columns - outerIndex) / columns) *testimonialContWidth;

          $testimonialItems[outerIndex+i].style.opacity = '0';
          $testimonialItems[outerIndex+i].style.transform = 'translateX('+currentTrans[outerIndex+i]+'px)';
        
          lastIndexMoved = outerIndex;
        }
      }

      // set navigation dots
      let navIndex = firstViewIndex / columns;
      if (navIndex == 0) {
        for (var i = 1; i < $navigationDots.length; i++) {
          $navigationDots[i].classList.remove('filled');
        }
      } else {
        $navigationDots[navIndex].classList.add('filled');
      }

      clearInterval(timerID);
  
      timerID = setInterval(function() {
        slideLeft();
      }, autoplayTime);
    }
  }
  
  
  if (screenWidth < 720) {
  
  	// Slideshow animation

  	let $slideshows = Array.from(document.querySelectorAll('.slideshow'));
  	for (let slideshowIndex = 0; slideshowIndex < $slideshows.length; slideshowIndex++) {
    	const $slideshowSlidesCont = $slideshows[slideshowIndex].querySelector('.slideshow__slides');
      	const $slideshowCells = Array.from($slideshowSlidesCont.querySelectorAll('.slideshow__cell'));

      	const autoplayTime = $slideshowSlidesCont.getAttribute('data-autoplay');
      
      	for (let i = 0; i < $slideshowCells.length; i++) {
        	if (i == 0) continue;          
          	$slideshowCells[i].style.position = 'absolute';
          	$slideshowCells[i].style.top = '0px';
        }
      
      	let slideIndex = 0;
      	let prevIndex = 0;
      	let timerID = null;
      	nextSlide();	
      
      	function nextSlide() {
          $slideshowCells[slideIndex].classList.add('is-selected');
          prevIndex = slideIndex;
          
          clearInterval(timerID);
          timerID = setInterval(function() {
             $slideshowCells[prevIndex].classList.remove('is-selected');
            
             slideIndex++; 
             if (slideIndex >= $slideshowCells.length) slideIndex = 0;
            
             nextSlide();
          }, autoplayTime);
        }
    }

  	// Drag Carousel
    
    let $featuredColRowSliders = Array.from(document.querySelectorAll('.featured-collection-row .featured-collection-row__slider'));
    const $featuredColSliders = Array.from(document.querySelectorAll('.featured-collection .featured-collection__slider'));
    const $socialSlider = document.querySelector('.xotix-social .social-proof__slider');

    $featuredColRowSliders.push(...$featuredColSliders);
  	$featuredColRowSliders.push($socialSlider);
  	for (let i = 0; i < $featuredColRowSliders.length; i++) {
      if (!$featuredColRowSliders[i]) continue;   

      let $slides;

      if ($featuredColRowSliders[i].classList.contains('featured-collection-row__slider')) {
        $slides = Array.from($featuredColRowSliders[i].querySelectorAll('.featured-collection-row__slide:not(.featured-collection-row__slide--text)'));
        //let aCarousel = new DraggableCarousel($featuredColRowSliders[i], $featuredRowSlides);

      } else if ($featuredColRowSliders[i].classList.contains('featured-collection__slider')) {
        $slides = Array.from($featuredColRowSliders[i].querySelectorAll('.featured-collection__slide'));
      
      } else {
        $slides = Array.from($featuredColRowSliders[i].querySelectorAll('.social-proof__slide'));
      }
      const $arrowLeft = $featuredColRowSliders[i].parentElement.parentElement.querySelector('.icon.left-nav');
      const $arrowRight = $featuredColRowSliders[i].parentElement.parentElement.querySelector('.icon.right-nav');

//console.log('SLIDER SELECTOR');
//console.log($featuredColRowSliders[i].parentElement.parentElement);

      const slider = $featuredColRowSliders[i],
            slides = $slides;
      let isDragging = false,
          startPos = 0,
          currentTranslate = 0,
          prevTranslate = 0,
          animationID,
          currentIndex = 0,
          numOfVisibleSlides = 0;

      const imageWidth = slides[0].offsetWidth;

      slides.forEach((slide, index) => {
        const slideImage = slide.querySelector('img')
        // disable default image drag
        slideImage.addEventListener('dragstart', (e) => e.preventDefault());
        // touch events
        slide.addEventListener('touchstart', touchStart(index));
        slide.addEventListener('touchend', touchEnd);
        slide.addEventListener('touchmove', touchMove);
        // mouse events
        slide.addEventListener('mousedown', touchStart(index));
        slide.addEventListener('mouseup', touchEnd)
        slide.addEventListener('mousemove', touchMove)
        slide.addEventListener('mouseleave', touchEnd)
      })

      setSlidesVisibility(slides);

      // Slide left and right chevrons
      $arrowLeft.addEventListener('click', slideLeft);
      $arrowRight.addEventListener('click', slideRight);

      // make responsive to viewport changes
      window.addEventListener('resize', setPositionByIndex)

      // prevent menu popup on long press
      window.oncontextmenu = function (event) {
        event.preventDefault();
        event.stopPropagation();
        return false;
      }

      function setSlidesVisibility($slides) {
        let paddingMarginOffset = 0;
        $slides.forEach(($slide, index) => {
          var rect = $slide.getBoundingClientRect();
          if (index == 0 && rect.left > 0) {
            paddingMarginOffset = rect.left;       
          }
        
          if ((rect.left+10-paddingMarginOffset >= 0) 
            && (rect.right-10-paddingMarginOffset <= document.documentElement.clientWidth)) {
            //$slide.classList.add('is-visible');
            numOfVisibleSlides += 1;
          } else {
            //$slide.classList.remove('is-visible');
          }

        })
      }

      function getPositionX(event) {
        return event.type.includes('mouse') ? event.pageX : event.touches[0].clientX
      }

      function touchStart(index) {
        return function (event) {
          //currentIndex = index
          startPos = getPositionX(event)
          isDragging = true
          animationID = requestAnimationFrame(animation)
          slider.classList.add('grabbing')
        }
      }

      function touchMove(event) {
        if (isDragging) {
          const currentPosition = getPositionX(event)
          currentTranslate = prevTranslate + currentPosition - startPos
        }
      }

      function touchEnd() {
        cancelAnimationFrame(animationID);
        isDragging = false;
        const movedBy = currentTranslate - prevTranslate;

        // if moved enough negative then snap to next slide if there is one
        if (movedBy < -(imageWidth/4) && currentIndex < slides.length-1-(numOfVisibleSlides-1) ) {
          currentIndex += 1;

        } else if (movedBy > (imageWidth/4) && currentIndex > 0) {
          // if moved enough positive then snap to previous slide if there is one
          currentIndex -= 1;
        }

        setPositionByIndex();

        slider.classList.remove('grabbing')

console.log('movedBy: '+movedBy);
      }

      function animation() {
        setSliderPosition()
        if (isDragging) requestAnimationFrame(animation)
          }

      function setPositionByIndex() {
        currentTranslate = currentIndex * -imageWidth;
        prevTranslate = currentTranslate;
        setSliderPosition();
      }

      function setSliderPosition() {
        slider.style.transform = `translateX(${currentTranslate}px)`;
        $arrowLeft.style.transform = `translateX(0px) translateY(-50%) rotate(90deg)`;
        $arrowRight.style.transform = `translateX(0px) translateY(-50%) rotate(-90deg)`;

        if (currentIndex == 0) {
          $arrowLeft.classList.add('hidden');

        } else if (currentIndex == ((slides.length-1)-(numOfVisibleSlides-1)) ) {
          $arrowRight.classList.add('hidden');

        } else {
          $arrowLeft.classList.remove('hidden');
          $arrowRight.classList.remove('hidden');
        }
      }
      
      function slideLeft() {
        currentIndex -= 1;
        setPositionByIndex();
      }
      
      function slideRight() {
        currentIndex += 1
        setPositionByIndex();
      }
    }
  } // END Drag Carousel


})