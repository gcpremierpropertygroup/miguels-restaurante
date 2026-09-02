/* Miguel's Restaurante — reservation dialog.
   No backend exists for this static site, so "submitting" builds a mailto:
   with the request details and shows a confirmation screen that's honest
   about it being a request, not an instant-confirmed booking. */

(function () {
  'use strict';

  var RESTAURANT_EMAIL = 'miguelsrestaurantemr@gmail.com';
  var RESTAURANT_PHONE = '+17693003032';
  var RESTAURANT_PHONE_DISPLAY = '(769) 300-3032';
  var MAX_PARTY = 8;
  var MONTHS_AHEAD = 2; // how far forward the calendar lets you browse

  var LUNCH_TIMES = ['11:30 AM', '12:00 PM', '12:30 PM', '1:00 PM', '1:30 PM'];
  var DINNER_TIMES = ['5:00 PM', '5:30 PM', '6:00 PM', '6:30 PM', '7:00 PM', '7:30 PM', '8:00 PM', '8:30 PM'];
  var DOW_LABELS = ['S', 'M', 'T', 'W', 'T', 'F', 'S'];
  var MONTH_LABELS = ['January', 'February', 'March', 'April', 'May', 'June', 'July', 'August', 'September', 'October', 'November', 'December'];

  /* Lunch specials only run Monday–Friday; dinner runs every day. */
  function timesFor(date) {
    var dow = date.getDay();
    var isWeekday = dow >= 1 && dow <= 5;
    return isWeekday ? LUNCH_TIMES.concat(DINNER_TIMES) : DINNER_TIMES;
  }

  function startOfDay(d) {
    var c = new Date(d);
    c.setHours(0, 0, 0, 0);
    return c;
  }

  function sameDay(a, b) {
    return a.getFullYear() === b.getFullYear() && a.getMonth() === b.getMonth() && a.getDate() === b.getDate();
  }

  var today = startOfDay(new Date());
  var maxDate = new Date(today.getFullYear(), today.getMonth() + MONTHS_AHEAD, today.getDate());

  var state = {
    viewMonth: new Date(today.getFullYear(), today.getMonth(), 1),
    selectedDate: null,
    selectedTime: null,
    party: 2
  };

  var dialog, root;

  function build() {
    dialog = document.createElement('dialog');
    dialog.className = 'reserve-dialog';
    dialog.id = 'reserve-dialog';
    dialog.innerHTML =
      '<div class="reserve" role="document">' +
        '<button type="button" class="reserve__close" aria-label="Close">&times;</button>' +
        '<div data-reserve-form>' +
          '<div class="reserve__eyebrow">Miguel&rsquo;s Restaurante</div>' +
          '<h2 class="reserve__title">Reserve a Table</h2>' +

          '<div class="reserve__field">' +
            '<span class="reserve__label">Date</span>' +
            '<div class="reserve__cal-head">' +
              '<button type="button" class="reserve__cal-nav" data-cal-prev aria-label="Previous month">&lsaquo;</button>' +
              '<span class="reserve__cal-month" data-cal-month></span>' +
              '<button type="button" class="reserve__cal-nav" data-cal-next aria-label="Next month">&rsaquo;</button>' +
            '</div>' +
            '<div class="reserve__cal-grid" data-cal-dow></div>' +
            '<div class="reserve__cal-grid" data-cal-grid></div>' +
          '</div>' +

          '<div class="reserve__field">' +
            '<span class="reserve__label">Time</span>' +
            '<div class="reserve__pills" data-time-grid></div>' +
          '</div>' +

          '<div class="reserve__field">' +
            '<span class="reserve__label">Party size</span>' +
            '<div class="reserve__party">' +
              '<button type="button" class="reserve__party-btn" data-party-minus aria-label="Fewer guests">&minus;</button>' +
              '<span class="reserve__party-count" data-party-count>2</span>' +
              '<button type="button" class="reserve__party-btn" data-party-plus aria-label="More guests">+</button>' +
              '<span class="reserve__party-note">Parties of ' + (MAX_PARTY + 1) + '+, please call us.</span>' +
            '</div>' +
          '</div>' +

          '<div class="reserve__row">' +
            '<div class="reserve__field">' +
              '<label class="reserve__label" for="reserve-name">Name</label>' +
              '<input class="reserve__input" id="reserve-name" type="text" autocomplete="name" required>' +
            '</div>' +
            '<div class="reserve__field">' +
              '<label class="reserve__label" for="reserve-phone">Phone</label>' +
              '<input class="reserve__input" id="reserve-phone" type="tel" autocomplete="tel" required>' +
            '</div>' +
          '</div>' +

          '<div class="reserve__field">' +
            '<label class="reserve__label" for="reserve-notes">Notes <span style="text-transform:none;letter-spacing:0">(optional)</span></label>' +
            '<textarea class="reserve__textarea" id="reserve-notes" placeholder="Allergies, special occasion, seating preference&hellip;"></textarea>' +
          '</div>' +

          '<p class="reserve__error" data-reserve-error></p>' +

          '<button type="button" class="btn btn--solid reserve__submit" data-reserve-submit>Request Reservation</button>' +
        '</div>' +

        '<div class="reserve__confirm" data-reserve-confirm hidden>' +
          '<div class="reserve__confirm-icon">&#10003;</div>' +
          '<h2 class="reserve__confirm-title">Request Sent</h2>' +
          '<p class="reserve__confirm-summary" data-confirm-summary></p>' +
          '<p class="reserve__confirm-summary">We&rsquo;ll call you to confirm &mdash; tables aren&rsquo;t booked until we do.</p>' +
          '<div class="reserve__confirm-actions">' +
            '<a class="btn btn--solid" data-confirm-email href="#">Email Us This Request</a>' +
            '<a class="btn btn--ghost" href="tel:' + RESTAURANT_PHONE + '">Or Call ' + RESTAURANT_PHONE_DISPLAY + '</a>' +
          '</div>' +
        '</div>' +
      '</div>';
    document.body.appendChild(dialog);
    root = dialog;

    dialog.addEventListener('click', function (e) {
      if (e.target === dialog) dialog.close();
    });
    root.querySelector('.reserve__close').addEventListener('click', function () { dialog.close(); });
    dialog.addEventListener('close', resetForm);

    root.querySelector('[data-cal-prev]').addEventListener('click', function () { shiftMonth(-1); });
    root.querySelector('[data-cal-next]').addEventListener('click', function () { shiftMonth(1); });
    root.querySelector('[data-party-minus]').addEventListener('click', function () { setParty(state.party - 1); });
    root.querySelector('[data-party-plus]').addEventListener('click', function () { setParty(state.party + 1); });
    root.querySelector('[data-reserve-submit]').addEventListener('click', submit);

    renderDow();
    renderCalendar();
    renderTimes();
    setParty(state.party);
  }

  function shiftMonth(delta) {
    var next = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + delta, 1);
    if (next < new Date(today.getFullYear(), today.getMonth(), 1)) return;
    if (next > new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) return;
    state.viewMonth = next;
    renderCalendar();
  }

  function renderDow() {
    var dow = root.querySelector('[data-cal-dow]');
    dow.innerHTML = DOW_LABELS.map(function (d) { return '<span class="reserve__cal-dow">' + d + '</span>'; }).join('');
  }

  function renderCalendar() {
    var monthEl = root.querySelector('[data-cal-month]');
    monthEl.textContent = MONTH_LABELS[state.viewMonth.getMonth()] + ' ' + state.viewMonth.getFullYear();

    root.querySelector('[data-cal-prev]').disabled =
      state.viewMonth.getFullYear() === today.getFullYear() && state.viewMonth.getMonth() === today.getMonth();
    root.querySelector('[data-cal-next]').disabled =
      state.viewMonth.getFullYear() === maxDate.getFullYear() && state.viewMonth.getMonth() === maxDate.getMonth();

    var grid = root.querySelector('[data-cal-grid]');
    grid.innerHTML = '';

    var firstDow = state.viewMonth.getDay();
    var daysInMonth = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth() + 1, 0).getDate();

    for (var i = 0; i < firstDow; i++) {
      var pad = document.createElement('span');
      pad.className = 'reserve__cal-day is-empty';
      grid.appendChild(pad);
    }

    for (var day = 1; day <= daysInMonth; day++) {
      var date = new Date(state.viewMonth.getFullYear(), state.viewMonth.getMonth(), day);
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reserve__cal-day';
      btn.textContent = String(day);
      var disabled = date < today || date > maxDate;
      btn.disabled = disabled;
      if (!disabled) {
        btn.setAttribute('aria-pressed', state.selectedDate ? String(sameDay(date, state.selectedDate)) : 'false');
        btn.addEventListener('click', function (d) {
          return function () { selectDate(d); };
        }(date));
      }
      grid.appendChild(btn);
    }
  }

  function selectDate(date) {
    state.selectedDate = date;
    state.selectedTime = null;
    renderCalendar();
    renderTimes();
  }

  function renderTimes() {
    var container = root.querySelector('[data-time-grid]');
    container.innerHTML = '';
    var times = state.selectedDate ? timesFor(state.selectedDate) : LUNCH_TIMES.concat(DINNER_TIMES);

    times.forEach(function (t) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reserve__pill';
      btn.textContent = t;
      btn.disabled = !state.selectedDate;
      btn.setAttribute('aria-pressed', String(state.selectedTime === t));
      btn.addEventListener('click', function () {
        state.selectedTime = t;
        renderTimes();
      });
      container.appendChild(btn);
    });
  }

  function setParty(n) {
    state.party = Math.max(1, Math.min(MAX_PARTY, n));
    root.querySelector('[data-party-count]').textContent = String(state.party);
    root.querySelector('[data-party-minus]').disabled = state.party <= 1;
    root.querySelector('[data-party-plus]').disabled = state.party >= MAX_PARTY;
  }

  function fmtDate(d) {
    return d.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function submit() {
    var errEl = root.querySelector('[data-reserve-error]');
    var name = root.querySelector('#reserve-name').value.trim();
    var phone = root.querySelector('#reserve-phone').value.trim();

    if (!state.selectedDate) return showError(errEl, 'Pick a date.');
    if (!state.selectedTime) return showError(errEl, 'Pick a time.');
    if (!name) return showError(errEl, 'Enter your name.');
    if (!phone) return showError(errEl, 'Enter a phone number.');
    showError(errEl, '');

    var notes = root.querySelector('#reserve-notes').value.trim();
    var summary = fmtDate(state.selectedDate) + ' at ' + state.selectedTime + ' — party of ' + state.party;

    root.querySelector('[data-confirm-summary]').textContent = summary;

    var body = 'Name: ' + name + '\n' +
      'Phone: ' + phone + '\n' +
      'Date: ' + fmtDate(state.selectedDate) + '\n' +
      'Time: ' + state.selectedTime + '\n' +
      'Party size: ' + state.party +
      (notes ? '\nNotes: ' + notes : '');
    var mailto = 'mailto:' + RESTAURANT_EMAIL +
      '?subject=' + encodeURIComponent('Reservation request — ' + name) +
      '&body=' + encodeURIComponent(body);
    root.querySelector('[data-confirm-email]').href = mailto;

    root.querySelector('[data-reserve-form]').hidden = true;
    root.querySelector('[data-reserve-confirm]').hidden = false;
  }

  function showError(el, msg) { el.textContent = msg; }

  function resetForm() {
    state.selectedDate = null;
    state.selectedTime = null;
    state.party = 2;
    state.viewMonth = new Date(today.getFullYear(), today.getMonth(), 1);
    if (!root) return;
    root.querySelector('[data-reserve-form]').hidden = false;
    root.querySelector('[data-reserve-confirm]').hidden = true;
    root.querySelector('#reserve-name').value = '';
    root.querySelector('#reserve-phone').value = '';
    root.querySelector('#reserve-notes').value = '';
    showError(root.querySelector('[data-reserve-error]'), '');
    renderCalendar();
    renderTimes();
    setParty(2);
  }

  function open() {
    if (!dialog) build();
    resetForm();
    dialog.showModal();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-reserve]');
    if (!trigger) return;
    e.preventDefault();
    open();
  });
})();
