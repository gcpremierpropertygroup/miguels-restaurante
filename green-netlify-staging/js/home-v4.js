(function () {
  'use strict';

  var STORAGE_KEY = 'miguels-lang';
  var DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
  var DAYS_ES = ['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'];
  var WEEK = {
    1: ['BBQ Chicken', 'Pork Ribs', 'Bisteque'],
    2: ['Country Fried Steak', 'Baked Chicken', 'Carne Asada'],
    3: ['Hamburger Steak', 'Chicken Spaghetti', 'Carne Asada'],
    4: ['Fried Chicken', 'Red Beans & Rice', 'Carne Asada'],
    5: ['Catfish', 'Pork Chops', 'Carne Asada']
  };
  var WEEK_ES = {
    1: ['Pollo a la barbacoa', 'Costillas de puerco', 'Bisteque'],
    2: ['Bistec empanizado', 'Pollo al horno', 'Carne asada'],
    3: ['Bistec de hamburguesa', 'Espagueti con pollo', 'Carne asada'],
    4: ['Pollo frito', 'Frijoles rojos con arroz', 'Carne asada'],
    5: ['Bagre', 'Chuletas de puerco', 'Carne asada']
  };

  function getLanguage() {
    try {
      var saved = localStorage.getItem(STORAGE_KEY);
      if (saved === 'en' || saved === 'es') return saved;
    } catch (error) {}
    return 'en';
  }

  function setLanguage(lang) {
    var useSpanish = lang === 'es';
    document.documentElement.lang = useSpanish ? 'es' : 'en';

    document.querySelectorAll('[data-es]').forEach(function (element) {
      if (!element.dataset.enHtml) element.dataset.enHtml = element.innerHTML;
      element.innerHTML = useSpanish
        ? element.getAttribute('data-es').split('|').join('<br>')
        : element.dataset.enHtml;
    });

    document.querySelectorAll('[data-es-ph]').forEach(function (element) {
      if (!element.dataset.enPlaceholder) element.dataset.enPlaceholder = element.placeholder;
      element.placeholder = useSpanish
        ? element.getAttribute('data-es-ph')
        : element.dataset.enPlaceholder;
    });

    document.querySelectorAll('[data-set-lang]').forEach(function (button) {
      var active = button.getAttribute('data-set-lang') === lang;
      button.setAttribute('aria-pressed', active ? 'true' : 'false');
      button.style.color = active ? '#1f3026' : 'rgba(42,38,32,.45)';
      button.style.borderBottom = active ? '1px solid #c6a15b' : '1px solid transparent';
    });

    document.querySelectorAll('.daycell span:first-child').forEach(function (label) {
      delete label.dataset.baseText;
    });

    try { localStorage.setItem(STORAGE_KEY, lang); } catch (error) {}
    updateServiceBoard(lang);
  }

  function updateServiceBoard(lang) {
    var now = new Date();
    var day = now.getDay();
    var useSpanish = lang === 'es';
    var plates = (useSpanish ? WEEK_ES : WEEK)[day];
    var isLunch = Boolean(plates) && now.getHours() < 14;
    var locale = useSpanish ? 'es-MX' : 'en-US';
    var date = now.toLocaleDateString(locale, { month: 'long', day: 'numeric' });
    var dayName = (useSpanish ? DAYS_ES : DAYS)[day];
    var todayLine = document.getElementById('today-line');
    var lunchNote = document.getElementById('lunch-note');
    var lunchHeading = document.getElementById('lunch-heading');
    var lunchLabel = document.getElementById('today-lunch-label');
    var lunchDay = document.getElementById('today-lunch-day');
    var lunchItems = document.getElementById('today-lunch-items');
    var lunchPrice = document.getElementById('today-lunch-price');
    var boardDay = plates ? day : 1;
    var boardPlates = (useSpanish ? WEEK_ES : WEEK)[boardDay];
    var boardDayName = (useSpanish ? DAYS_ES : DAYS)[boardDay];

    if (isLunch) {
      todayLine.textContent = useSpanish
        ? dayName + ', ' + date + ' — servimos almuerzo'
        : dayName + ', ' + date + ' — serving lunch';
      lunchNote.textContent = useSpanish
        ? 'Tres opciones. Cada plato cuesta $16.50.'
        : 'Three choices. Each plate is $16.50.';
    } else if (plates) {
      todayLine.textContent = useSpanish
        ? dayName + ', ' + date + ' — servicio de cena'
        : dayName + ', ' + date + ' — dinner service';
      lunchNote.textContent = useSpanish
        ? 'Tres platos al día, $16.50 cada uno. El almuerzo regresa mañana.'
        : 'Three plates a day, $16.50 each. Lunch returns tomorrow.';
    } else {
      todayLine.textContent = useSpanish
        ? dayName + ', ' + date + ' — carnes y mariscos esta noche'
        : dayName + ', ' + date + ' — steak & seafood tonight';
      lunchNote.textContent = useSpanish
        ? 'Tres platos al día, $16.50 cada uno. El almuerzo regresa el lunes.'
        : 'Three plates a day, $16.50 each. Lunch returns Monday.';
    }

    if (lunchHeading) {
      lunchHeading.textContent = plates
        ? (useSpanish ? 'El almuerzo de hoy' : "Today's plate lunch")
        : (useSpanish ? 'El almuerzo del lunes' : "Monday's plate lunch");
    }
    if (lunchLabel) {
      lunchLabel.textContent = plates
        ? (useSpanish ? 'En el menú de hoy' : "On today's board")
        : (useSpanish ? 'El próximo almuerzo' : 'Next plate lunch');
    }
    if (lunchDay) lunchDay.textContent = boardDayName;
    if (lunchPrice) lunchPrice.textContent = useSpanish ? '$16.50 cada uno' : '$16.50 each';
    if (lunchItems) {
      lunchItems.replaceChildren();
      boardPlates.forEach(function (plate) {
        var item = document.createElement('span');
        item.className = 'today-lunch-card__item';
        item.textContent = plate;
        lunchItems.appendChild(item);
      });
    }

    document.querySelectorAll('.daycell').forEach(function (cell) {
      cell.classList.remove('is-today');
      var label = cell.querySelector('span:first-child');
      if (label && label.dataset.baseText) label.textContent = label.dataset.baseText;
    });

    var todayCell = document.querySelector('.daycell[data-day="' + day + '"]');
    if (todayCell) {
      var todayLabel = todayCell.querySelector('span:first-child');
      if (todayLabel) {
        if (!todayLabel.dataset.baseText) todayLabel.dataset.baseText = todayLabel.textContent;
        todayLabel.textContent += useSpanish ? ' — hoy' : ' — today';
      }
      todayCell.classList.add('is-today');
    }
  }

  document.querySelectorAll('[data-set-lang]').forEach(function (button) {
    button.addEventListener('click', function () {
      setLanguage(button.getAttribute('data-set-lang'));
    });
  });

  setLanguage(getLanguage());
  window.setInterval(function () { updateServiceBoard(getLanguage()); }, 60000);
})();
