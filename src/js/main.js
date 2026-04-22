document.addEventListener('DOMContentLoaded', () => {
  const maskOptions = {
    mask: '+7 (000) 000-00-00',
    onFocus() {
      if (this.value === '') this.value = '+7 ';
    },
    onBlur() {
      if (this.value === '+7 ') this.value = '';
    },
  };

  document.querySelectorAll('.masked').forEach((item) => new IMask(item, maskOptions));

  (function initSteppers() {
    function clamp(value, min, max) {
      return Math.min(Math.max(value, min), max);
    }

    document.querySelectorAll('.stepper').forEach((stepper) => {
      const input = stepper.querySelector('input[type="number"]');
      const minus = stepper.querySelector('.stepper-button-minus');
      const plus = stepper.querySelector('.stepper-button-plus');

      if (!input || !minus || !plus) return;

      const min = Number(input.min || 1);
      const max = Number(input.max || Number.MAX_SAFE_INTEGER);

      function getValue() {
        const value = Number(input.value);

        if (Number.isNaN(value)) return min;

        return clamp(value, min, max);
      }

      function updateValue(nextValue) {
        const value = clamp(nextValue, min, max);

        input.value = value;
        minus.disabled = value <= min;
        plus.disabled = value >= max;
      }

      minus.addEventListener('click', () => updateValue(getValue() - 1));
      plus.addEventListener('click', () => updateValue(getValue() + 1));

      input.addEventListener('input', () => {
        input.value = input.value.replace(/\D/g, '');
      });

      input.addEventListener('blur', () => updateValue(getValue()));

      updateValue(getValue());
    });
  })();

  (function initDatepickers() {
    const venueTimeZone = 'Asia/Yekaterinburg';
    const monthFormatter = new Intl.DateTimeFormat('ru-RU', {
      day: 'numeric',
      month: 'long',
    });
    const monthTitleFormatter = new Intl.DateTimeFormat('ru-RU', {
      month: 'long',
      year: 'numeric',
    });
    const weekdayFormatter = new Intl.DateTimeFormat('ru-RU', { weekday: 'short' });
    const weekdayIndexes = [0, 1, 2, 3, 4, 5, 6];
    const scheduleTooltip = document.querySelector('.header-schedule__tooltip');

    function getTimeZoneParts(timeZone) {
      const formatter = new Intl.DateTimeFormat('en-CA', {
        timeZone,
        year: 'numeric',
        month: '2-digit',
        day: '2-digit',
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
      });
      const parts = formatter.formatToParts(new Date());
      const getPart = (type) => Number(parts.find((part) => part.type === type)?.value || 0);

      return {
        year: getPart('year'),
        month: getPart('month'),
        day: getPart('day'),
        hour: getPart('hour'),
        minute: getPart('minute'),
      };
    }

    function getVenueNow() {
      return getTimeZoneParts(venueTimeZone);
    }

    function getVenueToday() {
      const venueNow = getVenueNow();

      return new Date(venueNow.year, venueNow.month - 1, venueNow.day);
    }

    function getVenueCurrentHour() {
      return getVenueNow().hour;
    }

    const today = getVenueToday();

    function startOfDay(date) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate());
    }

    function startOfMonth(date) {
      return new Date(date.getFullYear(), date.getMonth(), 1);
    }

    function addDays(date, amount) {
      return new Date(date.getFullYear(), date.getMonth(), date.getDate() + amount);
    }

    function addMonths(date, amount) {
      return new Date(date.getFullYear(), date.getMonth() + amount, 1);
    }

    function isSameDay(firstDate, secondDate) {
      return (
        firstDate.getFullYear() === secondDate.getFullYear() &&
        firstDate.getMonth() === secondDate.getMonth() &&
        firstDate.getDate() === secondDate.getDate()
      );
    }

    function isSameMonth(firstDate, secondDate) {
      return firstDate.getFullYear() === secondDate.getFullYear() && firstDate.getMonth() === secondDate.getMonth();
    }

    function toIsoDate(date) {
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, '0');
      const day = String(date.getDate()).padStart(2, '0');

      return `${year}-${month}-${day}`;
    }

    function formatTimeValue(hour) {
      return `${String(hour).padStart(2, '0')}:00`;
    }

    function parseHour(time) {
      return Number(String(time).split(':')[0]);
    }

    function parseSchedule() {
      const fallback = {
        default: { openHour: 18, closeHour: 2 },
        weekend: { openHour: 18, closeHour: 3 },
      };

      if (!scheduleTooltip) return fallback;

      const scheduleText = scheduleTooltip.textContent.replace(/\s+/g, ' ').trim();
      const defaultMatch = scheduleText.match(/Ежедневно\s+(\d{1,2}:\d{2})\s*[–-]\s*(\d{1,2}:\d{2})/iu);
      const weekendMatch = scheduleText.match(/Пт\s*[–-]\s*Сб.*?(?:до|(\d{1,2}:\d{2})\s*[–-]\s*)(\d{1,2}:\d{2})/iu);
      const defaultOpenHour = defaultMatch ? parseHour(defaultMatch[1]) : fallback.default.openHour;
      const defaultCloseHour = defaultMatch ? parseHour(defaultMatch[2]) : fallback.default.closeHour;
      const weekendCloseHour = weekendMatch ? parseHour(weekendMatch[2]) : fallback.weekend.closeHour;

      return {
        default: {
          openHour: defaultOpenHour,
          closeHour: defaultCloseHour,
        },
        weekend: {
          openHour: defaultOpenHour,
          closeHour: weekendCloseHour,
        },
      };
    }

    const parsedSchedule = parseSchedule();

    function getScheduleForDate(date) {
      const weekday = date.getDay();

      if (weekday === 5 || weekday === 6) {
        return parsedSchedule.weekend;
      }

      return parsedSchedule.default;
    }

    function buildTimeSlots(schedule) {
      const slots = [];
      let hour = schedule.openHour;

      while (true) {
        slots.push(hour);

        if (hour === schedule.closeHour) break;

        hour = (hour + 1) % 24;
      }

      return slots;
    }

    function getSlotOrder(hour, schedule) {
      if (schedule.closeHour < schedule.openHour && hour < schedule.openHour) {
        return hour + 24;
      }

      return hour;
    }

    function formatDisplayDate(date) {
      const baseDate = startOfDay(today);
      const nextDay = addDays(baseDate, 1);
      const dayAfterNext = addDays(baseDate, 2);
      const formattedDate = monthFormatter.format(date);

      if (isSameDay(date, baseDate)) return `Сегодня (${formattedDate})`;
      if (isSameDay(date, nextDay)) return `Завтра (${formattedDate})`;
      if (isSameDay(date, dayAfterNext)) return `Послезавтра (${formattedDate})`;

      return formattedDate;
    }

    function getMonthLabel(date) {
      const monthTitle = monthTitleFormatter.format(date);

      return monthTitle.charAt(0).toUpperCase() + monthTitle.slice(1);
    }

    function createWeekdayLabels() {
      return weekdayIndexes
        .map((weekdayIndex) => {
          const weekdayDate = new Date(2024, 0, weekdayIndex + 1);
          const weekdayLabel = weekdayFormatter.format(weekdayDate).replace('.', '');

          return `<span>${weekdayLabel.charAt(0).toUpperCase() + weekdayLabel.slice(1, 2)}</span>`;
        })
        .join('');
    }

    function createDayCells(viewDate, selectedDate, minDate) {
      const monthStart = startOfMonth(viewDate);
      const monthStartWeekday = (monthStart.getDay() + 6) % 7;
      const cells = [];

      for (let index = 0; index < monthStartWeekday; index += 1) {
        cells.push('<span class="date-picker-day is-empty" aria-hidden="true"></span>');
      }

      const daysInMonth = new Date(viewDate.getFullYear(), viewDate.getMonth() + 1, 0).getDate();

      for (let day = 1; day <= daysInMonth; day += 1) {
        const currentDate = new Date(viewDate.getFullYear(), viewDate.getMonth(), day);
        const isDisabled = currentDate < minDate;
        const isSelected = isSameDay(currentDate, selectedDate);
        const classes = ['date-picker-day'];

        if (isDisabled) classes.push('is-disabled');
        if (isSelected) classes.push('is-selected');

        cells.push(
          `<button type="button" class="${classes.join(' ')}" data-date="${toIsoDate(currentDate)}" ${isDisabled ? 'disabled' : ''}>${currentDate.getDate()}</button>`,
        );
      }

      return cells.join('');
    }

    function syncDatepicker(datepicker, selectedDate) {
      const input = datepicker.querySelector('[data-datepicker-input]');
      const hiddenInput = datepicker.querySelector('[data-datepicker-value]');

      if (input) input.value = formatDisplayDate(selectedDate);
      if (hiddenInput) hiddenInput.value = toIsoDate(selectedDate);
    }

    function renderTimeSlots(datepicker, selectedDate) {
      const form = datepicker.closest('form');
      const timeContainer = form ? form.querySelector('[data-time-slots]') : null;

      if (!timeContainer) return;

      const schedule = getScheduleForDate(selectedDate);
      const slots = buildTimeSlots(schedule);
      const isToday = isSameDay(selectedDate, startOfDay(today));
      const currentHour = getVenueCurrentHour();
      const isOvernightSchedule = schedule.closeHour < schedule.openHour;
      const isAfterMidnightShiftTail = isOvernightSchedule && currentHour <= schedule.closeHour;
      const currentHourOrder = isAfterMidnightShiftTail ? currentHour + 24 : currentHour;
      const isOpenNow =
        isToday &&
        (isAfterMidnightShiftTail || (currentHour >= schedule.openHour && currentHour <= 23));
      const selectedTimeInput = timeContainer.querySelector('input:checked');
      const selectedTimeValue = selectedTimeInput ? selectedTimeInput.value : '';

      timeContainer.innerHTML = slots
        .map((hour) => {
          const timeValue = formatTimeValue(hour);
          const slotOrder = getSlotOrder(hour, schedule);
          const isDisabled = isOpenNow && slotOrder <= currentHourOrder;
          const checkedAttr = !isDisabled && selectedTimeValue === timeValue ? 'checked' : '';

          return `
            <label class="time-item">
              <input type="radio" name="time" value="${timeValue}" ${isDisabled ? 'disabled' : ''} ${checkedAttr} />
              <span>${timeValue}</span>
            </label>
          `;
        })
        .join('');
    }

    document.querySelectorAll('[data-datepicker]').forEach((datepicker) => {
      const input = datepicker.querySelector('[data-datepicker-input]');
      const hiddenInput = datepicker.querySelector('[data-datepicker-value]');
      const dropdown = datepicker.querySelector('[data-datepicker-dropdown]');

      if (!input || !hiddenInput || !dropdown) return;

      const minDate = startOfDay(today);
      let selectedDate = minDate;
      let viewDate = startOfMonth(selectedDate);

      function renderCalendar() {
        const disablePrevMonth = startOfMonth(viewDate) <= startOfMonth(minDate);

        dropdown.innerHTML = `
          <div class="date-picker-head">
            <button type="button" class="date-picker-nav" data-datepicker-nav="prev" ${disablePrevMonth ? 'disabled' : ''}></button>
            <div class="date-picker-title">${getMonthLabel(viewDate)}</div>
            <button type="button" class="date-picker-nav date-picker-nav-next" data-datepicker-nav="next"></button>
          </div>
          <div class="date-picker-weekdays">${createWeekdayLabels()}</div>
          <div class="date-picker-grid">${createDayCells(viewDate, selectedDate, minDate)}</div>
        `;
      }

      function openCalendar() {
        datepicker.classList.add('is-open');
        renderCalendar();
      }

      function closeCalendar() {
        datepicker.classList.remove('is-open');
      }

      function selectDate(date) {
        selectedDate = startOfDay(date);
        viewDate = startOfMonth(selectedDate);
        syncDatepicker(datepicker, selectedDate);
        renderTimeSlots(datepicker, selectedDate);
        renderCalendar();
        closeCalendar();
      }

      syncDatepicker(datepicker, selectedDate);
      renderTimeSlots(datepicker, selectedDate);
      renderCalendar();

      input.addEventListener('click', () => {
        if (datepicker.classList.contains('is-open')) {
          closeCalendar();
          return;
        }

        openCalendar();
      });

      dropdown.addEventListener('click', (event) => {
        const navButton = event.target.closest('[data-datepicker-nav]');

        if (navButton) {
          event.preventDefault();
          event.stopPropagation();

          const direction = navButton.getAttribute('data-datepicker-nav');

          viewDate = addMonths(viewDate, direction === 'next' ? 1 : -1);

          if (startOfMonth(viewDate) < startOfMonth(minDate)) {
            viewDate = startOfMonth(minDate);
          }

          renderCalendar();
          return;
        }

        const dayButton = event.target.closest('[data-date]');

        if (!dayButton || dayButton.disabled) return;

        const [year, month, day] = dayButton.getAttribute('data-date').split('-').map(Number);
        selectDate(new Date(year, month - 1, day));
      });

      document.addEventListener('click', (event) => {
        if (!datepicker.contains(event.target)) {
          closeCalendar();
        }
      });

      document.addEventListener('keydown', (event) => {
        if (event.key === 'Escape') {
          closeCalendar();
        }
      });
    });
  })();

  (function initCookie() {
    const cookie = document.querySelector('[data-cookie]');
    const acceptButton = document.querySelector('[data-cookie-accept]');
    const storageKey = 'cookieAccepted';

    if (!cookie || !acceptButton) return;

    if (window.localStorage.getItem(storageKey) === '1') {
      return;
    }

    cookie.classList.add('show');

    acceptButton.addEventListener('click', () => {
      window.localStorage.setItem(storageKey, '1');
      cookie.classList.remove('show');
    });
  })();

  (function initPopups() {
    const popupSelector = '.popup';
    const openAttr = 'data-popup-open';
    const closeAttr = 'data-popup-close';
    const popupAttr = 'data-popup';
    const body = document.body;

    function getPopup(name) {
      if (!name) return null;

      return document.querySelector(`${popupSelector}[${popupAttr}="${name}"]`) || document.getElementById(name);
    }

    function closePopups() {
      document.querySelectorAll(`${popupSelector}.show`).forEach((popup) => popup.classList.remove('show'));
      body.classList.remove('popup-open');
    }

    function openPopup(name) {
      const popup = getPopup(name);

      if (!popup) return;

      closePopups();
      popup.classList.add('show');
      body.classList.add('popup-open');
    }

    document.addEventListener('click', (event) => {
      const openTrigger = event.target.closest(`[${openAttr}]`);

      if (openTrigger) {
        event.preventDefault();
        openPopup(openTrigger.getAttribute(openAttr));
        return;
      }

      const closeTrigger = event.target.closest(`[${closeAttr}]`);

      if (closeTrigger) {
        event.preventDefault();
        closePopups();
      }
    });

    document.addEventListener('keydown', (event) => {
      if (event.key === 'Escape') {
        closePopups();
      }
    });
  })();

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
