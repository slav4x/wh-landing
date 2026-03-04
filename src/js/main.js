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

  function removeScrollerDOM() {
    const scrollers = document.querySelectorAll('.scroller');

    scrollers.forEach((article) => {
      const parent = article.parentNode;

      article.querySelectorAll('.scroller-scrollbar, .scroller-navigation').forEach((el) => el.remove());

      const content = article.querySelector('.scroller-content');
      const container = article.querySelector('.scroller-container');

      let source = null;

      if (content) {
        source = content;
      } else if (container) {
        source = container;
      } else {
        source = article;
      }

      while (source.firstChild) {
        parent.insertBefore(source.firstChild, article);
      }

      article.remove();
    });

    document.querySelectorAll('.scroller-item').forEach((el) => el.classList.remove('scroller-item'));
  }

  if (window.innerWidth < 720) {
    removeScrollerDOM();
  }

  (function lazyVideos() {
    const videos = Array.from(document.querySelectorAll('video')).filter((v) => !v.closest('.hero-video'));

    if (!videos.length) return;

    videos.forEach((video) => {
      if (video.dataset.lazyPrepared === '1') return;
      video.dataset.lazyPrepared = '1';

      video.preload = 'none';

      video.querySelectorAll('source').forEach((source) => {
        if (source.src) {
          source.dataset.src = source.src;
          source.removeAttribute('src');
        }
      });

      if (video.src) {
        video.dataset.src = video.src;
        video.removeAttribute('src');
      }

      video.setAttribute('playsinline', '');
    });

    const io = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;

          const video = entry.target;

          video.querySelectorAll('source').forEach((source) => {
            if (!source.getAttribute('src') && source.dataset.src) {
              source.setAttribute('src', source.dataset.src);
            }
          });

          if (!video.getAttribute('src') && video.dataset.src) {
            video.setAttribute('src', video.dataset.src);
          }

          video.load();

          if (video.hasAttribute('autoplay')) {
            const p = video.play();
            if (p && typeof p.catch === 'function') p.catch(() => {});
          }

          obs.unobserve(video);
        });
      },
      {
        root: null,
        rootMargin: '200px 0px',
        threshold: 0.01,
      },
    );

    videos.forEach((v) => io.observe(v));
  })();

  (function lazyMapInit() {
    const block = document.querySelector('.contacts');
    if (!block) return;

    let initialized = false;

    const observer = new IntersectionObserver(
      (entries, obs) => {
        entries.forEach((entry) => {
          if (!initialized && entry.isIntersecting) {
            initialized = true;
            initMap();
            obs.disconnect();
          }
        });
      },
      {
        root: null,
        threshold: 0,
        rootMargin: '0px 0px 0px 0px',
      },
    );

    observer.observe(block);
  })();

  const twistItems = document.querySelectorAll('.twist-items li');
  const twistMedias = document.querySelectorAll('.twist-media');

  twistItems.forEach((item) => {
    item.addEventListener('mouseenter', () => {
      const id = item.dataset.id;

      twistItems.forEach((i) => i.classList.remove('active'));

      twistMedias.forEach((m) => m.classList.remove('active'));

      item.classList.add('active');

      const media = document.querySelector(`.twist-media[data-id="${id}"]`);
      if (media) media.classList.add('active');
    });
  });
});
