document.addEventListener('DOMContentLoaded', () => {
  const kitchenVideosHover = document.querySelectorAll('.kitchen-menus__item-bg--hover');

  kitchenVideosHover.forEach((video) => {
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = 2;
    });
  });

  new Splide('.backyard-carousel', {
    type: 'loop',
    perPage: 1,
    focus: 0,
    omitEnd: true,
    arrows: false,
  }).mount();
});
