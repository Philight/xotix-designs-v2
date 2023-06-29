const url = 'http://e397-62-197-243-83.ngrok.io';

const urlPath = window.location.pathname;
console.log('URL PATH: '+urlPath);

var pathArray = window.location.pathname.split('/');
console.log(pathArray.length);

/* ON DOCUMENT LOAD */
document.addEventListener("DOMContentLoaded", function(event) {
  //alert('verifyDrinks script is running');

  if (pathArray.length != 4) return;
  
  const qrCode = pathArray[3];
  console.log('QR CODE: '+qrCode);
  
  /* Callback function */
  const verifyQRCode = async () => {
  	try {
      console.log('Verifying QR code..'); 
      const reqParams = {
        method: 'POST',
        //mode: 'no-cors',
        headers: {
          'Accept': 'application/json',
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          'qr_code': qrCode 
        })
      };
      let response = await fetch(url+'/promoparty/verifyqr', reqParams);
      let jsonRes = await response.json();
      console.log(jsonRes); 

      console.log('QR verified/expired');

      if (jsonRes.status == 200 && jsonRes.message == 'verified') {
        document.querySelector('#mainContainer').style.backgroundColor = '#00e600';
      	document.querySelector('.verify-drinks-content.verified').style.display = 'block';
      
      } else {
        document.querySelector('#mainContainer').style.backgroundColor = '#cc0000';
      	document.querySelector('.verify-drinks-content.expired').style.display = 'block';
      }
      
	  //let imgUrl = jsonRes.qr_url;  

      //document.querySelector('.qr-code-container img').src = imgUrl;
      //const $containers = document.querySelector('.qr-party-outer-container').style.display = 'none';
      //const $containers = document.getElementsByClassName('qr-party-outer-container');;
      //const $emailInput = document.querySelector(".qr-party-outer-container");
      //document.querySelector('.qr-code-container').style.display = 'block';

    } catch(err) {
      console.log(err);
    }
  }
  
  
  verifyQRCode();
  
  
  
})