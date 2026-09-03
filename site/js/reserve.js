/* Miguel's Restaurante — reservation dialog.
   No backend exists for this static site, so "submitting" only assembles a
   mailto: from the request details. Nothing is transmitted until the guest
   sends that mail themselves, so the final screen must say so rather than
   claim the request was sent. */

(function () {
  'use strict';

  var RESTAURANT_EMAIL = 'miguelsrestaurantemr@gmail.com';
  var RESTAURANT_PHONE = '+17693003032';
  var RESTAURANT_PHONE_DISPLAY = '(769) 300-3032';
  var MAX_PARTY = 8;
  var MONTHS_AHEAD = 2; // how far forward the calendar lets you browse

  /* Slots are stored as canonical 24-hour strings and formatted per locale at
     render time, so the same 13 slots exist in every language. */
  var LUNCH_TIMES = ['11:30', '12:00', '12:30', '13:00', '13:30'];
  var DINNER_TIMES = ['17:00', '17:30', '18:00', '18:30', '19:00', '19:30', '20:00', '20:30'];

  function lang() {
    return (window.MiguelsI18n && window.MiguelsI18n.lang()) || 'en';
  }

  function locale() {
    return lang() === 'es' ? 'es-MX' : 'en-US';
  }

  function tr(key) {
    return (window.MiguelsI18n && window.MiguelsI18n.t(key)) || '';
  }

  function fmtTime(hhmm, loc) {
    var parts = hhmm.split(':');
    var d = new Date(2000, 0, 1, Number(parts[0]), Number(parts[1]));
    return d.toLocaleTimeString(loc || locale(), { hour: 'numeric', minute: '2-digit' });
  }

  /* 2024-09-01 was a Sunday, so this walks Sunday..Saturday in order. */
  function dowLabels() {
    var out = [];
    for (var i = 0; i < 7; i++) {
      out.push(new Date(2024, 8, 1 + i).toLocaleDateString(locale(), { weekday: 'narrow' }));
    }
    return out;
  }

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
        '<button type="button" class="reserve__close" aria-label="Close" data-i18n-aria="reserve.close">&times;</button>' +
        '<div data-reserve-form>' +
          '<div class="reserve__eyebrow">Miguel&rsquo;s Restaurante</div>' +
          '<h2 class="reserve__title" data-i18n="reserve.title">Reserve a Table</h2>' +

          '<div class="reserve__field">' +
            '<span class="reserve__label" data-i18n="reserve.date">Date</span>' +
            '<div class="reserve__cal-head">' +
              '<button type="button" class="reserve__cal-nav" data-cal-prev aria-label="Previous month" data-i18n-aria="reserve.prevMonth">&lsaquo;</button>' +
              '<span class="reserve__cal-month" data-cal-month></span>' +
              '<button type="button" class="reserve__cal-nav" data-cal-next aria-label="Next month" data-i18n-aria="reserve.nextMonth">&rsaquo;</button>' +
            '</div>' +
            '<div class="reserve__cal-grid" data-cal-dow></div>' +
            '<div class="reserve__cal-grid" data-cal-grid></div>' +
          '</div>' +

          '<div class="reserve__field">' +
            '<span class="reserve__label" data-i18n="reserve.time">Time</span>' +
            '<div class="reserve__pills" data-time-grid></div>' +
          '</div>' +

          '<div class="reserve__field">' +
            '<span class="reserve__label" data-i18n="reserve.party">Party size</span>' +
            '<div class="reserve__party">' +
              '<button type="button" class="reserve__party-btn" data-party-minus aria-label="Fewer guests" data-i18n-aria="reserve.fewer">&minus;</button>' +
              '<span class="reserve__party-count" data-party-count>2</span>' +
              '<button type="button" class="reserve__party-btn" data-party-plus aria-label="More guests" data-i18n-aria="reserve.more">+</button>' +
              '<span class="reserve__party-note" data-i18n="reserve.partyNote">Parties of ' + (MAX_PARTY + 1) + '+, please call us.</span>' +
            '</div>' +
          '</div>' +

          '<div class="reserve__row">' +
            '<div class="reserve__field">' +
              '<label class="reserve__label" for="reserve-name" data-i18n="reserve.name">Name</label>' +
              '<input class="reserve__input" id="reserve-name" type="text" autocomplete="name" required>' +
            '</div>' +
            '<div class="reserve__field">' +
              '<label class="reserve__label" for="reserve-phone" data-i18n="reserve.phone">Phone</label>' +
              '<input class="reserve__input" id="reserve-phone" type="tel" autocomplete="tel" required>' +
            '</div>' +
          '</div>' +

          '<div class="reserve__field">' +
            '<label class="reserve__label" for="reserve-notes"><span data-i18n="reserve.notes">Notes</span> <span style="text-transform:none;letter-spacing:0" data-i18n="reserve.notesOptional">(optional)</span></label>' +
            '<textarea class="reserve__textarea" id="reserve-notes" placeholder="Allergies, special occasion, seating preference&hellip;" data-i18n-placeholder="reserve.notesPlaceholder"></textarea>' +
          '</div>' +

          '<p class="reserve__error" data-reserve-error></p>' +

          '<button type="button" class="btn btn--solid reserve__submit" data-reserve-submit data-i18n="reserve.submit">Request Reservation</button>' +
        '</div>' +

        '<div class="reserve__confirm" data-reserve-confirm hidden>' +
          '<div class="reserve__confirm-icon">&#9993;</div>' +
          '<h2 class="reserve__confirm-title" data-i18n="reserve.confirmTitle">One Last Step</h2>' +
          '<p class="reserve__confirm-summary" data-confirm-summary></p>' +
          '<p class="reserve__confirm-summary" data-i18n="reserve.confirmBody">This hasn&rsquo;t reached us yet &mdash; send it below, or call us. We&rsquo;ll ring you back to confirm; the table isn&rsquo;t held until we do.</p>' +
          '<div class="reserve__confirm-actions">' +
            '<a class="btn btn--solid" data-confirm-email href="#" data-i18n="reserve.send">Send This Request</a>' +
            '<a class="btn btn--ghost" href="tel:' + RESTAURANT_PHONE + '"><span data-i18n="reserve.orCall">Or Call</span> ' + RESTAURANT_PHONE_DISPLAY + '</a>' +
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
    dow.innerHTML = dowLabels().map(function (d) { return '<span class="reserve__cal-dow">' + d + '</span>'; }).join('');
  }

  function renderCalendar() {
    var monthEl = root.querySelector('[data-cal-month]');
    monthEl.textContent = state.viewMonth.toLocaleDateString(locale(), { month: 'long', year: 'numeric' });

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

    times.forEach(function (slot) {
      var btn = document.createElement('button');
      btn.type = 'button';
      btn.className = 'reserve__pill';
      btn.textContent = fmtTime(slot);
      btn.disabled = !state.selectedDate;
      btn.setAttribute('aria-pressed', String(state.selectedTime === slot));
      btn.addEventListener('click', function () {
        state.selectedTime = slot;
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

  function fmtDate(d, loc) {
    return d.toLocaleDateString(loc || locale(), { weekday: 'long', month: 'long', day: 'numeric' });
  }

  function submit() {
    var errEl = root.querySelector('[data-reserve-error]');
    var name = root.querySelector('#reserve-name').value.trim();
    var phone = root.querySelector('#reserve-phone').value.trim();

    if (!state.selectedDate) return showError(errEl, tr('reserve.errDate'));
    if (!state.selectedTime) return showError(errEl, tr('reserve.errTime'));
    if (!name) return showError(errEl, tr('reserve.errName'));
    if (!phone) return showError(errEl, tr('reserve.errPhone'));
    showError(errEl, '');

    var notes = root.querySelector('#reserve-notes').value.trim();
    var summary = fmtDate(state.selectedDate) + ' ' + tr('reserve.summaryAt') + ' ' +
      fmtTime(state.selectedTime) + ' \u2014 ' + tr('reserve.summaryParty').replace('{n}', state.party);

    root.querySelector('[data-confirm-summary]').textContent = summary;

    /* Labels are bilingual so whoever reads the inbox scans one format for
       both languages. Date and time are always written in English so a
       booking never has to be re-parsed against the guest's locale. */
    var body = 'Name / Nombre: ' + name + '\n' +
      'Phone / Tel\u00e9fono: ' + phone + '\n' +
      'Date / Fecha: ' + fmtDate(state.selectedDate, 'en-US') + '\n' +
      'Time / Hora: ' + fmtTime(state.selectedTime, 'en-US') + '\n' +
      'Party size / Personas: ' + state.party +
      (notes ? '\nNotes / Notas: ' + notes : '');
    var mailto = 'mailto:' + RESTAURANT_EMAIL +
      '?subject=' + encodeURIComponent('Reservation request / Solicitud de reservaci\u00f3n \u2014 ' + name) +
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
    /* renderDow is included here, not just in build(), so the weekday header
       follows a language change made after the dialog was first created. */
    renderDow();
    renderCalendar();
    renderTimes();
    setParty(2);
  }

  function open() {
    if (!dialog) build();
    resetForm();
    /* The dialog is built after i18n's initial pass, and the visitor may have
       switched language since it was last opened, so translate it now. */
    if (window.MiguelsI18n) window.MiguelsI18n.apply(lang());
    dialog.showModal();
  }

  document.addEventListener('click', function (e) {
    var trigger = e.target.closest('[data-reserve]');
    if (!trigger) return;
    e.preventDefault();
    open();
  });
})();
