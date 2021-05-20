
const mainImage = document.getElementById("main_image_hidden").value;

function changeImage() {
    document.getElementById("form").submit();
};


$(function() {
  $(".image").attr("src", mainImage)
    .mouseover(function() { 
        $(this).attr("src", "https://ecoplug.xyz/images/upload_image.png"); 
    })
    .mouseout(function() {
        $(this).attr("src", mainImage); 
    });
 });

 function notifications() {
let noti1 = document.getElementById("jg1");
let noti2 = document.getElementById("jg2");
let noti3 = document.getElementById("jg3");
let noti4 = document.getElementById("jg4");

 fetch(`/profile/notification_settings`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
            noti1: noti1.checked ? true : false,
            noti2: noti2.checked ? true : false,
            noti3: noti3.checked ? true : false,
            noti4: noti4.checked ? true : false
            })
        })


};

function changeP() {
  document.getElementById("pass").submit();
}