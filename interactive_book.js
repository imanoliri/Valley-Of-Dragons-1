function showTab(index) {
    var tabs = document.getElementsByClassName('tab');
    var buttons = document.getElementsByClassName('tab-button');
    for (var i = 0; i < tabs.length; i++) {
        tabs[i].style.display = 'none';
        buttons[i].classList.remove('active');
    }
    tabs[index].style.display = 'block';
    buttons[index].classList.add('active');
}
window.onload = function() {
    showTab(0);
}
