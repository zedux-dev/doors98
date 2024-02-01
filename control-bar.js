const start = document.querySelector("#start");
start.addEventListener("click", openStart);

function openStart(e) {
    if(start.classList.contains("active")) {
        start.classList.remove("active");
    } else {
        start.classList.add("active");
    }
}