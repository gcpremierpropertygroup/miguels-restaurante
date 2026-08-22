/* Miguel's Restaurante — English/Spanish toggle.
   Every translatable element carries data-i18n="key"; this looks the key up
   in DICT and swaps innerHTML. Preference persists in localStorage so it
   follows the visitor from page to page. */

(function () {
  'use strict';

  var STORAGE_KEY = 'miguels-lang';

  var DICT = {
    /* ---------- shared: topbar, footer, callbar, skip link ---------- */
    'shared.skip': { en: 'Skip to content', es: 'Saltar al contenido' },
    'shared.nav.lunch': { en: 'Lunch', es: 'Almuerzo' },
    'shared.nav.dinner': { en: 'Dinner', es: 'Cena' },
    'shared.nav.story': { en: 'Our Story', es: 'Nuestra Historia' },
    'shared.nav.dishes': { en: 'Dishes', es: 'Platillos' },
    'shared.nav.visit': { en: 'Visit', es: 'Visítanos' },
    'shared.reserve': { en: 'Reserve a Table', es: 'Reservar una Mesa' },
    'shared.footer.owned': { en: 'Family-owned &middot; Opened March 7, 2026', es: 'Negocio familiar &middot; Abrimos el 7 de marzo de 2026' },
    'shared.footer.chef': { en: 'Miguel Martinez, Executive Chef', es: 'Miguel Martinez, Chef Ejecutivo' },
    'shared.footer.instagram': { en: 'Instagram', es: 'Instagram' },
    'shared.footer.facebook': { en: 'Facebook', es: 'Facebook' },
    'shared.callbar.call': { en: 'Call', es: 'Llamar' },
    'shared.callbar.directions': { en: 'Directions', es: 'Cómo llegar' },

    /* ---------- home ---------- */
    'home.hero.title': { en: 'Where Culture<br>Meets Cuisine', es: 'Donde la Cultura<br>se Encuentra con la Cocina' },
    'home.hero.kicker': { en: 'Steak &nbsp;&middot;&nbsp; Seafood &nbsp;&middot;&nbsp; Authentic Oaxaca Dishes &nbsp;&middot;&nbsp; Southern Lunch Specials', es: 'Carnes &nbsp;&middot;&nbsp; Mariscos &nbsp;&middot;&nbsp; Platillos Aut&eacute;nticos de Oaxaca &nbsp;&middot;&nbsp; Especiales Sure&ntilde;os de Almuerzo' },
    'home.hero.lunchSpecials': { en: 'Lunch Specials', es: 'Especiales de Almuerzo' },
    'home.pillars.steak.title': { en: 'Steak', es: 'Carnes' },
    'home.pillars.steak.copy': { en: 'Ribeye, tomahawk, filet &mdash; cut thick and cooked to the temperature you asked for.', es: 'Ribeye, tomahawk, filete &mdash; cortados gruesos y cocinados al t&eacute;rmino que pidas.' },
    'home.pillars.seafood.title': { en: 'Seafood', es: 'Mariscos' },
    'home.pillars.seafood.copy': { en: 'Grilled oysters, blackened fish, shrimp and crab off a hot flat top.', es: 'Ostras a la parrilla, pescado blackened, camar&oacute;n y cangrejo reci&eacute;n salidos de la plancha.' },
    'home.pillars.oaxaca.title': { en: 'Oaxaca', es: 'Oaxaca' },
    'home.pillars.oaxaca.copy': { en: 'Authentic Oaxaca dishes, made the way Miguel learned to make them.', es: 'Platillos aut&eacute;nticos de Oaxaca, hechos como Miguel aprendi&oacute; a hacerlos.' },
    'home.pillars.lunch.title': { en: 'Southern Lunch', es: 'Almuerzo Sure&ntilde;o' },
    'home.pillars.lunch.copy': { en: 'Chicken fried steak, fried catfish and the plate lunch specials, midday.', es: 'Chicken fried steak, bagre frito y los especiales de plato al mediod&iacute;a.' },
    'home.story.eyebrow': { en: 'Family-owned &middot; Open since March 2026', es: 'Negocio familiar &middot; Abierto desde marzo de 2026' },
    'home.story.title': { en: 'Cooked by the family that owns the place', es: 'Cocinado por la familia due&ntilde;a del lugar' },
    'home.story.lede': { en: 'Miguel Martinez is the Executive Chef, and he is here &mdash; not on a wall in a photograph, but in the kitchen, plating the food that goes out to your table.', es: 'Miguel Mart&iacute;nez es el Chef Ejecutivo, y est&aacute; aqu&iacute; &mdash; no en una foto en la pared, sino en la cocina, emplatando la comida que llega a tu mesa.' },
    'home.story.cta': { en: 'Read Our Story', es: 'Lee Nuestra Historia' },
    'home.topplates.eyebrow': { en: 'Guest favorites', es: 'Favoritos de los clientes' },
    'home.topplates.title': { en: 'Top Plates', es: 'Platillos Destacados' },
    'home.topplates.tomahawk': { en: 'Tomahawk, b&eacute;arnaise', es: 'Tomahawk, salsa b&eacute;arnaise' },
    'home.topplates.tamales': { en: 'Chicken tamales', es: 'Tamales de pollo' },
    'home.topplates.quesadilla': { en: 'Seafood quesadilla', es: 'Quesadilla de mariscos' },
    'home.topplates.cta': { en: 'See the Full Menu', es: 'Ver el Men&uacute; Completo' },
    'home.band.eyebrow': { en: 'Every day', es: 'Todos los d&iacute;as' },
    'home.band.line': { en: 'Southern plate lunches at noon.<br>Steak and seafood by night.', es: 'Almuerzos sure&ntilde;os al mediod&iacute;a.<br>Carnes y mariscos por la noche.' },
    'home.reviews.eyebrow': { en: 'Guest reviews', es: 'Rese&ntilde;as de clientes' },
    'home.reviews.title': { en: 'What Guests Are Saying', es: 'Lo Que Dicen Nuestros Clientes' },
    'home.reviews.source': { en: 'Madison, MS &middot; via Yelp', es: 'Madison, MS &middot; v&iacute;a Yelp' },
    'home.reviews.sourceYazoo': { en: 'Yazoo City, MS &middot; via Yelp', es: 'Yazoo City, MS &middot; v&iacute;a Yelp' },
    'home.reviews.sourceRidgeland': { en: 'Ridgeland, MS &middot; via Yelp', es: 'Ridgeland, MS &middot; v&iacute;a Yelp' },
    'home.reviews.tammie': { en: 'We loved the food! Snapper with Oaxaca sauce and the red fish were fabulous, and the homemade cheesecake&mdash;wow! Service is top notch.', es: '&iexcl;Nos encant&oacute; la comida! El huachinango con salsa de Oaxaca y el pescado rojo estuvieron fabulosos, y el pastel de queso casero&mdash;&iexcl;gua! El servicio es de primera.' },
    'home.reviews.john': { en: 'Food was excellent, service was perfect, and the ambiance was great. The guacamole dip is unique, fresh, and delicious&mdash;the grilled oysters were perfect.', es: 'La comida excelente, el servicio perfecto y el ambiente estupendo. El guacamole es &uacute;nico, fresco y delicioso&mdash;las ostras a la parrilla estaban perfectas.' },
    'home.reviews.mmj': { en: 'Their oysters with the seafood sauce were absolutely wonderful, and the hamburger was scrumptious on a homemade bun. The quality justifies the price.', es: 'Sus ostras con la salsa de mariscos estuvieron maravillosas, y la hamburguesa deliciosa en un pan casero. La calidad justifica el precio.' },
    'home.reviews.bobbie': { en: 'The best chicken tamales and empanadas. We also had the fajitas, and they were so good.', es: 'Los mejores tamales de pollo y empanadas. Tambi&eacute;n pedimos las fajitas y estaban buen&iacute;simas.' },

    /* ---------- lunch ---------- */
    'lunch.eyebrow': { en: 'Monday to Friday', es: 'Lunes a Viernes' },
    'lunch.title': { en: 'Southern Lunch Specials', es: 'Especiales Sure&ntilde;os de Almuerzo' },
    'lunch.lede': { en: 'Three plates a day, a different three every day. Every special is <span class="gold">$16.50</span>.', es: 'Tres platos al d&iacute;a, tres diferentes cada d&iacute;a. Cada especial cuesta <span class="gold">$16.50</span>.' },
    'lunch.day.mon': { en: 'Monday', es: 'Lunes' },
    'lunch.day.tue': { en: 'Tuesday', es: 'Martes' },
    'lunch.day.wed': { en: 'Wednesday', es: 'Mi&eacute;rcoles' },
    'lunch.day.thu': { en: 'Thursday', es: 'Jueves' },
    'lunch.day.fri': { en: 'Friday', es: 'Viernes' },
    'lunch.item.bbqChicken': { en: 'BBQ Chicken', es: 'Pollo a la BBQ' },
    'lunch.item.porkRibs': { en: 'Pork Ribs', es: 'Costillas de Cerdo' },
    'lunch.item.bisteque': { en: 'Bisteque', es: 'Bisteque' },
    'lunch.item.countryFriedSteak': { en: 'Country Fried Steak', es: 'Country Fried Steak' },
    'lunch.item.bakedChicken': { en: 'Baked Chicken', es: 'Pollo al Horno' },
    'lunch.item.carneAsada': { en: 'Carne Asada', es: 'Carne Asada' },
    'lunch.item.hamburgerSteak': { en: 'Hamburger Steak', es: 'Hamburger Steak' },
    'lunch.item.chickenSpaghetti': { en: 'Chicken Spaghetti', es: 'Espagueti con Pollo' },
    'lunch.item.friedChicken': { en: 'Fried Chicken', es: 'Pollo Frito' },
    'lunch.item.redBeansRice': { en: 'Red Beans &amp; Rice', es: 'Frijoles Rojos con Arroz' },
    'lunch.item.catfish': { en: 'Catfish', es: 'Bagre' },
    'lunch.item.porkChops': { en: 'Pork Chops', es: 'Chuletas de Cerdo' },
    'lunch.extra.cobbler.name': { en: 'Peach Cobbler', es: 'Peach Cobbler' },
    'lunch.extra.cobbler.kind': { en: 'Dessert', es: 'Postre' },
    'lunch.extra.tamales.name': { en: 'Tamales', es: 'Tamales' },
    'lunch.extra.tamales.kind': { en: 'Catering &middot; by the dozen', es: 'Banquetes &middot; por docena' },
    'lunch.extra.cheesecake.name': { en: 'Cheesecake', es: 'Pay de Queso' },
    'lunch.extra.cheesecake.kind': { en: 'Catering &middot; whole', es: 'Banquetes &middot; entero' },
    'lunch.fineprint': { en: 'The steak and seafood dinner menu is dine-in only. Call <a href="tel:+17693003032">(769) 300-3032</a> to reserve a table.', es: 'El men&uacute; de carnes y mariscos por la noche es s&oacute;lo para comer en el restaurante. Llama al <a href="tel:+17693003032">(769) 300-3032</a> para reservar una mesa.' },
    'lunch.gallery.catfish.name': { en: 'Fried catfish', es: 'Bagre frito' },
    'lunch.gallery.catfish.note': { en: 'Friday&rsquo;s special, with hush puppies, greens and cornbread.', es: 'El especial del viernes, con hush puppies, verduras y pan de ma&iacute;z.' },
    'lunch.gallery.freshline.name': { en: 'Fresh off the line', es: 'Reci&eacute;n salido de cocina' },
    'lunch.gallery.freshline.note': { en: 'Cooked to order, plated and out to your table.', es: 'Cocinado al momento, emplatado y directo a tu mesa.' },
    'lunch.gallery.countryFried': { en: 'Country fried steak', es: 'Country fried steak' },
    'lunch.gallery.tamalesDozen': { en: 'Tamales, by the dozen', es: 'Tamales, por docena' },
    'lunch.gallery.cheesecakeWhole': { en: 'Cheesecake, whole', es: 'Pay de queso, entero' },

    /* ---------- dinner ---------- */
    'dinner.eyebrow': { en: 'Evenings &middot; Dine-in', es: 'Noches &middot; Para comer aqu&iacute;' },
    'dinner.title': { en: 'The Dinner Table', es: 'La Mesa de la Cena' },
    'dinner.lede': { en: 'Cuts and catches change with what comes in. Ask your server for tonight&rsquo;s list and prices.', es: 'Los cortes y mariscos cambian seg&uacute;n lo que llega. Pregunta a tu mesero por la lista y los precios de hoy.' },
    'dinner.course.steak': { en: 'Steak', es: 'Carnes' },
    'dinner.course.seafood': { en: 'Seafood', es: 'Mariscos' },
    'dinner.course.oaxaca': { en: 'Oaxaca', es: 'Oaxaca' },
    'dinner.course.startFinish': { en: 'To Start &amp; Finish', es: 'Para Empezar y Terminar' },
    'dinner.item.ribeye': { en: 'Ribeye', es: 'Ribeye' },
    'dinner.item.tomahawk': { en: 'Tomahawk', es: 'Tomahawk' },
    'dinner.item.filetCrab': { en: 'Filet &amp; crab, hollandaise', es: 'Filete y cangrejo, salsa holandesa' },
    'dinner.item.hamburgerSteak': { en: 'Hamburger steak', es: 'Hamburger steak' },
    'dinner.item.grilledOysters': { en: 'Grilled oysters', es: 'Ostras a la parrilla' },
    'dinner.item.blackenedFish': { en: 'Blackened fish &amp; crab', es: 'Pescado blackened y cangrejo' },
    'dinner.item.mixedPlatter': { en: 'Mixed seafood platter', es: 'Plato mixto de mariscos' },
    'dinner.item.friedCatfish': { en: 'Fried catfish', es: 'Bagre frito' },
    'dinner.item.quesadilla': { en: 'Seafood quesadilla', es: 'Quesadilla de mariscos' },
    'dinner.item.tamales': { en: 'Chicken tamales', es: 'Tamales de pollo' },
    'dinner.item.empanadas': { en: 'Empanadas', es: 'Empanadas' },
    'dinner.item.fajitas': { en: 'Fajitas', es: 'Fajitas' },
    'dinner.item.nachos': { en: 'Chicken nachos', es: 'Nachos de pollo' },
    'dinner.item.adoboFish': { en: 'Adobo fish', es: 'Pescado en adobo' },
    'dinner.item.chipsCheese': { en: 'Chips &amp; cheese dip', es: 'Totopos con queso fundido' },
    'dinner.item.spinachSalad': { en: 'Strawberry spinach salad', es: 'Ensalada de espinaca con fresa' },
    'dinner.item.cheesecake': { en: 'Strawberry cheesecake', es: 'Pay de queso con fresa' },
    'dinner.item.cobbler': { en: 'Peach cobbler', es: 'Peach cobbler' },
    'dinner.legend': { en: '<span class="gold">&#9670;</span> &nbsp;What people keep ordering, according to their reviews.', es: '<span class="gold">&#9670;</span> &nbsp;Lo que la gente sigue pidiendo, seg&uacute;n sus rese&ntilde;as.' },
    'dinner.gallery.filet.name': { en: 'Filet &amp; crab, hollandaise', es: 'Filete y cangrejo, salsa holandesa' },
    'dinner.gallery.filet.note': { en: 'Cut thick, finished with crab and hollandaise.', es: 'Cortado grueso, terminado con cangrejo y salsa holandesa.' },
    'dinner.gallery.blackened.name': { en: 'Blackened fish &amp; crab', es: 'Pescado blackened y cangrejo' },
    'dinner.gallery.blackened.note': { en: 'Blackened off the flat top, finished with crab.', es: 'Preparado a la plancha estilo blackened, terminado con cangrejo.' },
    'dinner.gallery.tamales': { en: 'Chicken tamales', es: 'Tamales de pollo' },
    'dinner.gallery.quesadilla': { en: 'Seafood quesadilla', es: 'Quesadilla de mariscos' },
    'dinner.gallery.oysters': { en: 'Grilled oysters', es: 'Ostras a la parrilla' },

    /* ---------- story ---------- */
    'story.eyebrow': { en: 'The kitchen &middot; Open since March 2026', es: 'La cocina &middot; Abierta desde marzo de 2026' },
    'story.title': { en: 'Cooked by the family that owns the place', es: 'Cocinado por la familia due&ntilde;a del lugar' },
    'story.lede': { en: 'We opened on March 7, 2026. Miguel Martinez is the Executive Chef, and he is here &mdash; not on a wall in a photograph, but in the kitchen, plating the food that goes out to your table.', es: 'Abrimos el 7 de marzo de 2026. Miguel Mart&iacute;nez es el Chef Ejecutivo, y est&aacute; aqu&iacute; &mdash; no en una foto en la pared, sino en la cocina, emplatando la comida que llega a tu mesa.' },
    'story.body': { en: 'It is why a steakhouse ribeye, a plate of grilled oysters, an Oaxaca dish and a Southern plate lunch can all come out of one room and all be worth ordering. One cook, one standard, four traditions he knows by heart. That is what &ldquo;where culture meets cuisine&rdquo; means here.', es: 'Por eso un ribeye de steakhouse, un plato de ostras a la parrilla, un platillo de Oaxaca y un almuerzo sure&ntilde;o pueden salir de la misma cocina y todos valer la pena. Un solo cocinero, un solo est&aacute;ndar, cuatro tradiciones que conoce de memoria. Eso es lo que significa aqu&iacute; &ldquo;donde la cultura se encuentra con la cocina&rdquo;.' },
    'story.sig.role': { en: 'Executive Chef', es: 'Chef Ejecutivo' },
    'story.gallery.eyebrow': { en: 'Behind the pass', es: 'Detr&aacute;s de la cocina' },
    'story.gallery.title': { en: 'In the Kitchen', es: 'En la Cocina' },
    'story.gallery.line': { en: 'On the line', es: 'En la parrilla' },
    'story.gallery.plating': { en: 'Every plate, by hand', es: 'Cada plato, a mano' },
    'story.gallery.pass': { en: 'Miguel, at the pass', es: 'Miguel, en la cocina' },

    /* ---------- dishes ---------- */
    'dishes.eyebrow': { en: 'From the kitchen', es: 'Desde la cocina' },
    'dishes.title': { en: 'A Few Things We Are Known For', es: 'Algunas Cosas por las que Nos Conocen' },
    'dishes.tomahawk.name': { en: 'Tomahawk, b&eacute;arnaise', es: 'Tomahawk, salsa b&eacute;arnaise' },
    'dishes.tomahawk.note': { en: 'Bone-in, cut thick, finished with b&eacute;arnaise. The one people come back for.', es: 'Con hueso, cortado grueso, terminado con salsa b&eacute;arnaise. El que hace que la gente regrese.' },
    'dishes.oysters.name': { en: 'Grilled oysters', es: 'Ostras a la parrilla' },
    'dishes.oysters.note': { en: 'Off the flat top, still bubbling.', es: 'Reci&eacute;n salidas de la plancha, todav&iacute;a burbujeando.' },
    'dishes.adobo': { en: 'Adobo fish, Oaxaca', es: 'Pescado en adobo, Oaxaca' },
    'dishes.friedSteak': { en: 'Chicken fried steak', es: 'Chicken fried steak' },
    'dishes.nachos': { en: 'Chicken nachos', es: 'Nachos de pollo' },

    /* ---------- visit ---------- */
    'visit.eyebrow': { en: 'Come see us', es: 'Ven a visitarnos' },
    'visit.title': { en: 'Pull Up a Chair', es: 'Toma Asiento' },
    'visit.lede': { en: 'Southern plate lunches Monday through Friday. Steak and seafood in the evening, dine-in. Come as you are.', es: 'Almuerzos sure&ntilde;os de lunes a viernes. Carnes y mariscos por la noche, para comer aqu&iacute;. Ven como est&eacute;s.' },
    'visit.hours.label': { en: 'Hours', es: 'Horario' },
    'visit.hours.lunch': { en: 'Lunch specials Monday &ndash; Friday', es: 'Especiales de almuerzo lunes a viernes' },
    'visit.hours.dinner': { en: 'Steak &amp; seafood in the evening', es: 'Carnes y mariscos por la noche' },
    'visit.hours.call': { en: 'Call for today&rsquo;s hours', es: 'Llama para el horario de hoy' },
    'visit.gallery.night.name': { en: 'Miguel&rsquo;s after dark', es: 'Miguel&rsquo;s de noche' },
    'visit.gallery.night.note': { en: '587 Highway 51 J &mdash; look for the sign.', es: '587 Highway 51 J &mdash; busca el letrero.' },
    'visit.gallery.guest.name': { en: 'Come as you are', es: 'Ven como est&eacute;s' },
    'visit.gallery.guest.note': { en: 'Dine-in, family style, no fuss.', es: 'Para comer aqu&iacute;, estilo familiar, sin complicaciones.' },
    'visit.gallery.room.name': { en: 'A full house', es: 'Casa llena' },
    'visit.gallery.room.note': { en: 'This is what noon looks like most days.', es: 'As&iacute; se ve el mediod&iacute;a casi todos los d&iacute;as.' },
    'visit.gallery.toast.name': { en: 'Worth the toast', es: 'Digno de un brindis' },
    'visit.gallery.toast.note': { en: 'Good food, good company.', es: 'Buena comida, buena compa&ntilde;&iacute;a.' }
  };

  function currentLang() {
    return localStorage.getItem(STORAGE_KEY) || 'en';
  }

  function applyLang(lang) {
    document.documentElement.lang = lang === 'es' ? 'es' : 'en';
    document.querySelectorAll('[data-i18n]').forEach(function (el) {
      var entry = DICT[el.getAttribute('data-i18n')];
      if (!entry) return;
      var text = entry[lang];
      if (text !== undefined) el.innerHTML = text;
    });
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.textContent = lang === 'en' ? 'ES' : 'EN';
      btn.setAttribute('aria-label', lang === 'en' ? 'Switch to Spanish' : 'Cambiar a inglés');
    });
  }

  function toggle() {
    var next = currentLang() === 'en' ? 'es' : 'en';
    localStorage.setItem(STORAGE_KEY, next);
    applyLang(next);
  }

  applyLang(currentLang());

  document.addEventListener('DOMContentLoaded', function () {
    applyLang(currentLang());
    document.querySelectorAll('[data-lang-toggle]').forEach(function (btn) {
      btn.addEventListener('click', toggle);
    });
  });
})();
