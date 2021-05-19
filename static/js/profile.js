
const mainImage = document.getElementById("main_image_hidden").value;

function changeImage() {
    document.getElementById("form").submit();
}

$(function() {
  $(".image").attr("src", mainImage)
    .mouseover(function() { 
        $(this).attr("src", "https://lh3.googleusercontent.com/proxy/t7rf8f8TuFCRe5lkmrABaStNJ30thVqh8oFJOzul3mog3nOOCspvjzcchhZVumca_2ViNmqRX6ItPPb_V6cOAlER01aG7eRg0FDF0lDf8-Dl"); 
    })
    .mouseout(function() {
        $(this).attr("src", mainImage); 
    });
 });