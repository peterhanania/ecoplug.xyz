

    const emailInput = document.getElementById("email");
    emailInput.addEventListener("keyup", async (event) => { 
        if (event.keyCode === 13) {
            return await submit();
        } else return;

    });
    
    
    $('input').keydown(function(e) {
    if (e.keyCode == 32) {
        return false;
    }   
    });
    
function submit(){

        const loader = document.getElementById("loader");
        loader.style.display = "block";

        const form = document.getElementById("form");
        form.style.display = "none";
      
         setTimeout(()=>{document.getElementById("form").submit();}, 2000) 
}