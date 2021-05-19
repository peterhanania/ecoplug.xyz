
    const emailInput = document.getElementById("email");
    emailInput.addEventListener("keyup", async (event) => { 
        if (event.keyCode === 13) {
            return await login();
        } else return;

    });

    const passInput = document.getElementById("password");
    passInput.addEventListener("keyup", async (event) => { 
        if (event.keyCode === 13) {
            return await login();
        } else return;

    });

   async function login(){

        const loader = document.getElementById("loader");
        loader.style.display = "block";

        const form = document.getElementById("form");
        form.style.display = "none";


        const email = document.getElementById("email").value;
        const password = document.getElementById("password").value;

        if(!email) return window.location.href = '/login';
        if(!email.length) return window.location.href = '/login';
        if(email.length < 1) return wwindow.location.href = '/login';

        if(!password) return window.location.href = '/login';
        if(!password.length) return window.location.href = '/login';
        if(password.length < 1) return window.location.href = '/login';

      
        setTimeout(()=>{document.getElementById("form").submit();}, 2000) 
};
