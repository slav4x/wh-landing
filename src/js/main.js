document.addEventListener('DOMContentLoaded', () => {
  const kitchenVideosHover = document.querySelectorAll('.kitchen-menus__item-bg--hover');

  kitchenVideosHover.forEach((video) => {
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = 2;
    });
  });
});
