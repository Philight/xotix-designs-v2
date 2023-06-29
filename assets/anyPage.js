document.addEventListener("DOMContentLoaded", function(event) {
  //console.log('anyPage.js');

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
  
  // header__links-list
  let $links = document.querySelectorAll(".header__bottom-fullwidth .header__links-list > li[data-submenu-parent]");
  console.log('header links');
  console.log($links);
  /*
  let $linkBtns = [];
  for(let i = 0; i < $links.length; i++) {
    $linkBtns[i] = $links[i].querySelector('button');
    
  	$linkBtns[i].addEventListener("click", function() {
      console.log($links[i].querySelector('ul'));
      $links[i].querySelector('ul').style.cssText = "visibility: visible; opacity: 1";
      $links[i].querySelector('ul').classList.add("visible");
    })
  }
  */
  const showNav = () => {
    
  }
  
  const hideNav = () => {
    const $visibleNavs = document.querySelectorAll('.navigation__submenu.visible'); 
    for (let i = 0; i < $visibleNavs.length; i++) {
    	$visibleNavs[i].classList.remove('visible');
    }
    //elem.classList.toggle("visible");
  }
  
  window.addEventListener('click', function(e){  
    //$links[i]//.querySelector('button');
    const classNames = ['navigation__submenu-trigger', 'navigation__submenu', 'navigation__submenu-item', 'navigation__submenu-child-link'];
    //let $navSubmenus = document.querySelectorAll('.navigation__submenu');
    //const $inBoxElements = [...$linkBtns , ...$navSubmenus];
    console.log(e.target);
    console.log(e.currentTarget);

    let $visibleMenu = document.querySelector('.navigation__submenu.visible');
    if (classNames.some(className => e.target.classList.contains(className))) {
      // Clicked in box
      if (e.target.classList.contains('navigation__submenu-trigger')) {
        if ($visibleMenu && e.target.parentNode.hasAttribute('data-submenu-parent')) {
       	  // main submenu
          console.log(e.target);
          console.log(e.target.parentNode.hasAttribute('data-submenu-parent'));
          hideNav();
        } 
        
      	e.target.parentNode.querySelector('.navigation__submenu').classList.toggle("visible");
       /* const $listItems = e.target.closest('.navigation__submenu').querySelectorAll(".navigation__submenu > .navigation__submenu-item");
        console.log($listItems);
        for(let i=0; i<$listItems.length; i++) {
        	$listItems[i].classList.add('hidden-1');
        }*/
        let $listItem = e.target.parentNode;
        while($listItem) {
          //console.log('while');
        	$listItem.classList.add('hidden-1');
          	$listItem = $listItem.nextElementSibling;
        }
      }
      
//    if ($inBoxElements.contains(e.target)){
    } else{
      
      hideNav();
    }
  });
  
  //const start = Date.now(); let timeElapsed = 0;
  let popAdsProduct = '.Autoketing-Spu__mainStyle-module__line2 a';
  
  waitForElem(popAdsProduct).then((elm) => {
    //console.log('Element is ready'); console.log(elm);
    //timeElapsed = Date.now() - start;
    //console.log(`seconds elapsed = ${Math.floor(timeElapsed / 1000)}`);
  
    elm.addEventListener("click", function() {
      //alert('pop click');
      let selector = '.Autoketing-Spu__quick-view-module__wrapPrice';
	    waitForElem(selector).then((elm) => {
      	//console.log('Element is ready'); console.log(elm);
      	//console.log(elm.innerText.includes('€0,') ? 'is zero' : 'is not zero'); 
      	if (elm.innerText.includes('€0,00')) {
        	document.querySelector('.Autoketing-Spu__quick-view-module__wrapCloseButton').click();
            document.querySelector(popAdsProduct).click();
        }
      })
      
      selector = '.Autoketing-Spu__quick-view-module__wrapAddCartButton';
      waitForElem(selector).then((elm) => {
      	//console.log('Element is ready'); console.log(elm);
		    elm.addEventListener("click", function() {
          //alert(' addcart click');
          setTimeout(function(){
          	window.location.reload();             // window.location.reload();
          }, 1000)
        });
      })
    });
  });


  // Stones & Benefits Infinite Carousel

  let $stonesBenefitsContainers = Array.from(document.querySelectorAll('.stones-and-benefits .stones-and-benefits__stones-container'));

  for (let i = 0; i < $stonesBenefitsContainers.length; i++) {
    if (!$stonesBenefitsContainers[i]) continue;   

    // Stones Order Shuffling
    if ($stonesBenefitsContainers[i].closest('.stones-and-benefits.section').dataset.sectionRandomize == 'true') {
      var parentContainer = $stonesBenefitsContainers[i];
      for (let i = parentContainer.children.length; i >= 0; i--) {
        parentContainer.appendChild(parentContainer.children[Math.random() * i | 0]);
      }
    } 

    let $stoneWrappers = Array.from($stonesBenefitsContainers[i].querySelectorAll('.stones-and-benefits__stone-wrapper'));
    const $navLeft = $stonesBenefitsContainers[i].parentElement.querySelector('.icon.nav.left');
    const $navRight = $stonesBenefitsContainers[i].parentElement.querySelector('.icon.nav.right');
    
    var stoneStyle = getComputedStyle($stoneWrappers[0]);
    let stoneWrapperWidth = $stoneWrappers[0].offsetWidth + parseInt(stoneStyle.marginLeft) + parseInt(stoneStyle.marginRight);

    let currentTrans = [];
    let slideCount = 0;
    let firstIndex = 0;
    let lastIndex = $stoneWrappers.length-1;
    let translationComplete = false;

    let transitionCompleted = function(event) {
      if (event.currentTarget.classList.contains('transitioning')) {
        event.currentTarget.classList.remove('transitioning');
        event.currentTarget.classList.add('make-visible');
        event.currentTarget.classList.remove('make-visible');
      }

      translationComplete = true;
    }

    // initialize translation array
    for (let i = 0; i < $stoneWrappers.length; i++) {
      currentTrans[i] = -stoneWrapperWidth;
      $stoneWrappers[i].stoneIndex = i;
      $stoneWrappers[i].addEventListener("transitionend", transitionCompleted, true);                    
      $stoneWrappers[i].addEventListener("webkitTransitionEnd", transitionCompleted, true);                    
      $stoneWrappers[i].addEventListener("oTransitionEnd", transitionCompleted, true);                    
      $stoneWrappers[i].addEventListener("MSTransitionEnd", transitionCompleted, true);

      // move starting position one time to left
      $stoneWrappers[i].style.transform = 'translateX('+currentTrans[i]+'px)';
    }

    const showNav = (event) => {
      $navLeft.classList.add('shown');
      $navRight.classList.add('shown');
    }
    const hideNav = (event) => {
      setTimeout(() => {
        $navLeft.classList.remove('shown');
        $navRight.classList.remove('shown');
      }, 4000)
    }

    const slide = (event) => {
console.log('sliding');
console.log(event.currentTarget.direction);
      const direction = event.currentTarget.direction;

      // Move all stones
      for (let i = 0; i < $stoneWrappers.length; i++) {
        currentTrans[i] = direction == 'left' ? currentTrans[i] + stoneWrapperWidth : currentTrans[i] - stoneWrapperWidth;
        $stoneWrappers[i].style.transform = 'translateX('+currentTrans[i]+'px)';
      }

      // Transfer 
      if (direction == 'left') {
        currentTrans[lastIndex] = currentTrans[lastIndex] - $stoneWrappers.length*stoneWrapperWidth;
        $stoneWrappers[lastIndex].classList.add('transitioning');
        $stoneWrappers[lastIndex].style.transform = 'translateX('+currentTrans[lastIndex]+'px)';

        firstIndex = lastIndex;
        lastIndex = lastIndex-1 < 0 ? $stoneWrappers.length-1 : lastIndex-1; 
     
      } else {
        currentTrans[firstIndex] = currentTrans[firstIndex] + $stoneWrappers.length*stoneWrapperWidth;
        $stoneWrappers[firstIndex].classList.add('transitioning');
        $stoneWrappers[firstIndex].style.transform = 'translateX('+currentTrans[firstIndex]+'px)';
        
        lastIndex = firstIndex;
        firstIndex = firstIndex+1 >= $stoneWrappers.length ? 0 : firstIndex+1; 
      }
    }

    if (screenWidth > 1024) { 
      $stonesBenefitsContainers[i].closest('.stones-and-benefits').addEventListener("mouseover", showNav); 
      $stonesBenefitsContainers[i].closest('.stones-and-benefits').addEventListener("mouseleave", hideNav); 
    }
    $navLeft.addEventListener("click", slide);
    $navLeft.direction = 'left';
    $navRight.addEventListener("click", slide);
    $navRight.direction = 'right';
  } // END Stones & Benefits Infinite Carousel

})