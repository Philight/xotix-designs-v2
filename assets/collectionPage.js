document.addEventListener("DOMContentLoaded", function(event) {
  console.log('collectionPage script is running');
  
  document.addEventListener("click", (e) => {
    if (e.target.classList.contains('gfqv-close-modal') || e.target.classList.contains('gfqv-modal-content')) {
      console.log(e.target);
      document.querySelector('.page-transition').style.cssText = "opacity: 0; pointer-events:none; visibility: hidden";
    }
  })
    
})