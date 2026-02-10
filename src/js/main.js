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

  const reservationButtons = document.querySelector('.reservation-buttons');
  if (reservationButtons) {
    const bottomOffset = 32;

    const ph = document.createElement('div');
    ph.style.width = '100%';
    ph.style.height = '0px';
    reservationButtons.parentNode.insertBefore(ph, reservationButtons);

    let originalTop = 0;
    let btnH = 0;

    function measureOriginal() {
      reservationButtons.classList.remove('is-fixed');
      reservationButtons.classList.add('is-static');

      btnH = reservationButtons.offsetHeight;
      const r = reservationButtons.getBoundingClientRect();
      originalTop = r.top + window.scrollY;

      reservationButtons.classList.remove('is-static');
      reservationButtons.classList.add('is-fixed');
      ph.style.height = btnH + 'px';
    }

    function update() {
      const fixedTop = window.scrollY + window.innerHeight - bottomOffset - btnH;

      if (fixedTop >= originalTop) {
        reservationButtons.classList.remove('is-fixed');
        reservationButtons.classList.add('is-static');
        ph.style.height = '0px';
      } else {
        reservationButtons.classList.remove('is-static');
        reservationButtons.classList.add('is-fixed');
        ph.style.height = btnH + 'px';
      }
    }

    measureOriginal();
    update();

    window.addEventListener('scroll', update, { passive: true });
    window.addEventListener('resize', () => {
      measureOriginal();
      update();
    });
  }
});
