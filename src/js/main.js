document.addEventListener('DOMContentLoaded', () => {
  const kitchenVideosHover = document.querySelectorAll('.kitchen-menus__item-bg--hover');
  kitchenVideosHover.forEach((video) => {
    video.addEventListener('loadedmetadata', () => {
      video.currentTime = 2;
    });
  });

  Fancybox.bind('[data-fancybox]', {
    dragToClose: false,
    autoFocus: false,
    placeFocusBack: false,
    Thumbs: false,
    Images: {
      zoom: false,
    },
    Iframe: {
      attr: {
        allow: 'autoplay; fullscreen; picture-in-picture; screen-wake-lock',
      },
    },
  });

  const lenis = new Lenis({
    duration: 2,
    lerp: 0.2,
    easing: (t) => (t === 1 ? 1 : 1 - Math.pow(2, -10 * t)),
    smooth: true,
    smoothTouch: false,
  });

  requestAnimationFrame(function raf(time) {
    lenis.raf(time);
    requestAnimationFrame(raf);
  });
});
