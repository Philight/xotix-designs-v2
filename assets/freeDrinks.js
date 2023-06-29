//var urlToWrite = "/admin/variants/" + myVariantId + ".json";
//var dataObject =  '{"variant": {"id": ' + myVariantId + ',"price": "99.00"}}';

//const url = 'http://localhost:3000/testget';
const url = 'http://e397-62-197-243-83.ngrok.io';

//alert('freeDrinks script running');

const urlPath = window.location.pathname;
console.log('URL PATH: '+urlPath);

var pathArray = window.location.pathname.split('/');

console.log(pathArray.length);
//console.log(window.location.host); // "xotixdesigns.com"


window.addEventListener('scroll', ()=>{

    let screenHeight = document.documentElement.clientHeight; //window.innerHeight;
    let screenHeightMid = screenHeight / 2; 
	let blurOverlayHeight = screenHeight * 0.17;                        
    //console.log('screenHeightMid: '+screenHeightMid);
    //console.log('screenHeight: '+screenHeight);

	// Product images                         
	let $images = document.querySelectorAll('.product-wrapper');  
	for (let i = 0; i < $images.length; i++) {
      
      let imgTop = $images[i].getBoundingClientRect().top;
      let imgBottom = $images[i].getBoundingClientRect().bottom;

      //document.querySelector('#windowScrollY').textContent = 'scrollY:'+window.scrollY+' scrollTop: '+window.scrollTop;
      //document.querySelector('#elementTop').textContent = imgTop;   
      //document.querySelector('#elementBottom').textContent = imgBottom;    
      let imgMiddle = (imgBottom + imgTop) / 2;
      //console.log('imgMiddle: '+imgMiddle);

      if ((imgMiddle >= 0) && (imgMiddle <= screenHeightMid)) {
          let ratio = imgMiddle / screenHeightMid;
          //console.log('ratio: '+ratio);
          let newScale = 0.7 * ratio + 0.3; //(ratio + 1) * 0.5;
          //console.log('newScale: '+newScale);	
          $images[i].style.transform = 'scale('+newScale+')';
      }

      if ((imgMiddle >= screenHeightMid) && (imgMiddle <= screenHeight)) {
          let ratio = (screenHeight - imgMiddle) / screenHeightMid;
          //console.log('ratio: '+ratio);
          let newScale = 0.7 * ratio + 0.3; //(ratio + 1) * 0.3;
          //console.log('newScale: '+newScale);	
          $images[i].style.transform = 'scale('+newScale+')';
      }
    }

	// Blur overlays
	let instructSectionPos = document.querySelector('.instructions-section .inner-container').getBoundingClientRect();
	
	if ((instructSectionPos.bottom - blurOverlayHeight) < 0) {
      	//console.log(instructSectionPos.bottom - blurOverlayHeight);
        document.querySelector('.blur-top-overlay').classList.add('white');
      /*
    	document.querySelector('.blur-top-overlay').style.cssText = `
    		background: rgba(255,255,255,0.1);
			background: linear-gradient(180deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.1) 100%);
		`; */
    } else {
      document.querySelector('.blur-top-overlay').classList.remove('white');
      /*
      	document.querySelector('.blur-top-overlay').style.cssText = `
    		background: rgba(227,215,184,0.1);
			background: linear-gradient(180deg, rgba(227,215,184,1) 0%, rgba(227,215,184,0.7) 60%, rgba(227,215,184,0.1) 100%);
		`;*/
    }

	if (instructSectionPos.top < 0) {
      	document.querySelector('.blur-top-overlay').style.display = 'block';
    } else {
      	document.querySelector('.blur-top-overlay').style.display = 'none';
    }

    if ((instructSectionPos.top + blurOverlayHeight) < 0) {
      document.querySelector('.blur-bottom-overlay').classList.add('white');
      /*
      	document.querySelector('.blur-bottom-overlay').style.cssText = `
    		background: rgba(255,255,255,0.1);
			background: linear-gradient(0deg, rgba(255,255,255,1) 0%, rgba(255,255,255,0.7) 60%, rgba(255,255,255,0.1) 100%);
		`; */
    } else {
      document.querySelector('.blur-bottom-overlay').classList.remove('white');
      /*
        document.querySelector('.blur-bottom-overlay').style.cssText = `
            background: rgba(227,215,184,0.1);
			background: linear-gradient(0deg, rgba(227,215,184,1) 0%, rgba(227,215,184,0.7) 60%, rgba(227,215,184,0.1) 100%);
  		`;*/
    }
})

/* ON DOCUMENT LOAD */
document.addEventListener("DOMContentLoaded", function(event) {
  
  	if (pathArray.length != 4) {  return;}

    const qrCode = pathArray[3];
    //console.log('QR CODE: '+qrCode);
  
    /* SELECTORS */
    const $submitButton = document.querySelector(".qr-form-submit");
    const $emailInput = document.querySelector(".input-email");
  	let $products = document.querySelectorAll('.product-wrapper');
  	const $notices = document.querySelector('.notices-container');
  
    const showNotices = (message) => {
      $notices.innerText = message;
      $notices.style.cssText = 'display: block; height: 30px';
      
      setTimeout(hideNotices, 5000);
    }
  
  	const hideNotices = () => {
      $notices.style.cssText = 'display: none; height: 0px';
    }

    /* Callback function */
    const fetchQRCode = async () => {
        
		try {
          	var re = /\S+@\S+\.\S+/;
        	let valid = re.test($emailInput.value);
          	
          	if (!valid) { showNotices('Invalid Email format. Use example@gmail.com'); console.log('invalid email'); return; }
          
          	//console.log('Email: '+$emailInput.value);
        	//console.log('qr code fetching'); 
            const reqParams = {
                method: 'POST',
                //mode: 'no-cors',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    'qr_code': qrCode, 
                  	'email': $emailInput.value,
                })
            };
            let response = await fetch(url+'/promoparty/generateqr', reqParams);
            let jsonRes = await response.json();
            console.log(jsonRes); 
          
          	//console.log('Email Submitted');
          	//jsonRes.qr_url
          
          	if (jsonRes.status == 200 || jsonRes.status == 410) {
              //let imgUrl = 'https://upload.wikimedia.org/wikipedia/commons/thumb/d/d0/QR_code_for_mobile_English_Wikipedia.svg/330px-QR_code_for_mobile_English_Wikipedia.svg.png';
              let imgUrl = jsonRes.qr_url;  

              document.querySelector('.qr-form-container').style.display = 'none';
			  document.querySelector('.qr-section h1').style.cssText = 'color: #cfbe90;';
              document.querySelector('.black-overlay').style.cssText = 'opacity: 0.1;';
              document.querySelector('.qr-code-container img').src = imgUrl;
              document.querySelector('.qr-code-container').style.display = 'block';
              document.querySelector('.instructions-section').style.display = 'block';
              document.querySelector('.products-section').style.display = 'block';            
            
              if (jsonRes.message == 'expired') {
              	showNotices('QR Code is Expired.');
              }
                
            } else {
              	//alert('Invalid QR code');
              	showNotices('QR Code is Invalid.');
            }
          	
/*
      	console.log('qr code test fetch 1');
            response = await fetch(url+'/hello', { method: 'GET' });
            let message = response.text(); 
            console.log(message);

      	console.log('qr code test fetch 2'); 
            const reqParamsTest = {
                method: 'POST',
                //mode: 'no-cors',
                headers: {
                  'Accept': 'application/json',
                  'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                  message: 'Hello World',
                })
            };
            response = await fetch(url+'/test/testPOST', reqParamsTest);
            let jsonResTest = response.json();
            console.log(jsonResTest);
*/          
        } catch(err) {
			console.log(err);
        }
    }
  
  	// Product modals
    const showModal = () => {
      
    }

    /* Event listeners */
    $submitButton.addEventListener("click", fetchQRCode, false);
  	for (let i = 0; i < $products.length; i++) {
      $products[i].addEventListener("click", function() {
        console.log($products[i].nextElementSibling);
        $products[i].nextElementSibling.style.cssText = 'display: block;';
        //$products[i].nextElementSibling.querySelector('.product-item__price').style.cssText = 'opacity: 1; transform: translateY(0);';
      });

      $products[i].addEventListener("mouseout", function() {
        //console.log($products[i].nextElementSibling);
        //$products[i].nextElementSibling.querySelector('.product-item__price').style.cssText = 'opacity: 0; transform: translateY(100%);';
      });
    }
  	
  	
});


/*** API REQUESTS ***/
/*
fetch(url+'/hello', { method: 'GET' })
	.then((res) => { console.log(res); return res.text(); })
	.then((data) => console.log(data))
  	//.then((res) => res.json())
	.catch((e) => console.log(e));


fetch(url+'/test/testPOST',{
  method: 'POST',
  //mode: 'no-cors',
  headers: {
    'Accept': 'application/json',
	'Content-Type': 'application/json'
  },
  body: JSON.stringify({
        message: 'Hello World',
  }),
})
  .then((res) => {return res.json()} )
  .then((res) => console.log(res))
  .catch((e) => console.log(e));
*/


//(function($){
/*
$(function() {
  alert('jquery running');
	$.ajax({
      url: 'http://localhost:8081/api/testGET',
      type: 'GET', 
      //dataType: 'jsonp',
      crossDomain: true,
      "headers": {
        "accept": "application/json",
        "Access-Control-Allow-Origin":"*",
      },
      //contentType: 'application/json',
      //dataType: "json",
      //data: JSON.stringify(dataObject),
      success: function(data) 
      {
        console.log('jquery ajax success');
          console.log(data);
      },
      error: function(data) 
      {
          alert("error: " + JSON.stringify(data));
      }
	});
    //Functions, Plugins, Etc.. Here
    //(does not wait for DOM READY STATE) 
})//(jQuery);
*/

/*
axios({
  url: url,
  method: 'get'
})
 */

//const url = 'http://localhost:8081/api/test/';
//const url = 'http://localhost:8081/api/testGET';
      //'https://shopify-price-calculator-app.herokuapp.com/hello/?shop=oniwa-app-development-store.myshopify.com/';

//Super Agent
/*
request
   .get(url)
   //.query({ name: 'Templeton' })
   //.query({ lastname: 'Peck' })
   //.query({ order: 'desc' })
   .then(res => {console.dir(res)}
});
*/

/*
(async () => {
  const response = await fetch(url, {
    method: ‘GET’,
    //headers: {
      //‘Accept’: ‘application/json’,
      //‘Content-Type’: ‘application/json’
    //},
    //body: JSON.stringify({name:’Murdock’})
  });
const result = await response.json();
})
*/

