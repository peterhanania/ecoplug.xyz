    const usernameInput = document.getElementById("username");
    usernameInput.addEventListener("keyup", async (event) => { 
        if (event.keyCode === 13) {
            return await signUp();
        } else return;

    });

    const emailInput = document.getElementById("email");
    emailInput.addEventListener("keyup", async (event) => { 
        if (event.keyCode === 13) {
            return await signUp();
        } else return;

    });

    const passInput = document.getElementById("password");
    passInput.addEventListener("keyup", async (event) => { 
        if (event.keyCode === 13) {
            return await signUp();
        } else return;

    });

    const cpassInput = document.getElementById("cpassword");
    cpassInput.addEventListener("keyup", async (event) => { 
        if (event.keyCode === 13) {
            return await signUp();
        } else return;

    });

   $('input').keydown(function(e) {
    if (e.keyCode == 32) {
        return false;
    }
   });


   async function signUp(){

        const loader = document.getElementById("loader");
        loader.style.display = "block";

        const form = document.getElementById("form");
        form.style.display = "none";


        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if(!email) return window.location.href = '/signup';
        if(!email.length) return window.location.href = '/signup';
        if(email.length < 1) return window.location.href = '/signup';

        if(!password) return window.location.href = '/signup';
        if(!password.length) return window.location.href = '/signup';
        if(password.length < 1) return window.location.href = '/signup';

      
       setTimeout(()=>{document.getElementById("form").submit();}, 2000);
  };
