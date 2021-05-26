const button = document.getElementById("lets_go");

button.onclick = function() {

const check = document.getElementById("customCheck");
const error = document.getElementById("understand");



if(check.checked == false) {
 error.innerHTML="Please check the checkbox below.";
} else {
document.getElementById("step1").style.display = "none";
document.getElementById("step2").style.display = "block";
AOS.init();
}

};

$("input[type='radio']").change(function() {
                if ($(this).val() == "other") {
                    $("#otherAnswer").show();
                } else {
                    $("#otherAnswer").hide();
                }
            });

            
