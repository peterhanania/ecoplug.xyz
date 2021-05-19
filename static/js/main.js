  const input = document.getElementById("searchQueryInput");

   
    input.addEventListener("keyup", async (event) => {
        if (event.keyCode === 13) {
            await doSearch();
        } else return;
    });

    async function doSearch() {
        
        if(!input.value) return;
        if(!input.value.length) return;
        if(input.value.length < 1) return;

        const loader = document.getElementById("loader");
        loader.style.display = "block";


      
        document.getElementById("form").submit();
          

    };


    $(function(){
    var lastScrollTop = 0, delta = 15;
    $(window).scroll(function(event){
       var st = $(this).scrollTop();
       
       if(Math.abs(lastScrollTop - st) <= delta)
          return;
if ((st > lastScrollTop) && (lastScrollTop>0)) {
   
      $(".nav").css("top","-80px");
  
   } else {
   
      $(".nav").css("top","0px");
   }
       lastScrollTop = st;
    });
});