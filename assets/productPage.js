document.addEventListener("DOMContentLoaded", function(event) {
  //console.log('productPage script is running');

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
  } // END Testimonials/Reviews slide animation

  // Product View Count
  let $viewCounts = document.querySelectorAll('.product__view-count');
  for (i=0; i < $viewCounts.length; i++) {
    let maxViewCount = $viewCounts[i].dataset.counter;
    const canBeZero = $viewCounts[i].dataset.nullified;
    const $count = $viewCounts[i].querySelector('.count');

    if (canBeZero == 'true') {
      let oneThirdChance = Math.floor(Math.random() * 3);
console.log('oneThirdChance: '+oneThirdChance);
      if (oneThirdChance == 1) {
        let randCount = Math.floor((Math.random() * maxViewCount) + 1);
        $count.textContent = $count.textContent.replace("2", randCount); 
        $viewCounts[i].dataset.counter = randCount;  
      
      } else {
        $viewCounts[i].remove();
      }

    } else {
      let randCount = Math.floor((Math.random() * maxViewCount) + 1);
      $count.textContent = $count.textContent.replace("2", randCount); 
      $viewCounts[i].dataset.counter = randCount;   
    }
  }

})