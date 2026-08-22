#!/bin/bash
# Restyle Miguel's Restaurante dish photos with nano-banana-pro-edit.
# Each entry: slug|source-url|aspect|dish-specific prompt body
cd "$(dirname "$0")"
mkdir -p final

BASE="Reimagine this as an upscale restaurant marketing photograph. Softly blurred warm dark restaurant backdrop with ambient bokeh lighting, shallow depth of field, dramatic side lighting, high-end editorial food photography, 85mm lens. Remove all background clutter, utensils, and counter surfaces."

run() {
  slug="$1"; url="$2"; ar="$3"; body="$4"
  muapi image edit "$BASE $body" -i "$url" -m nano-banana-pro-edit -a "$ar" -d final --output-json > "final/$slug.json" 2>&1
  out=$(python3 -c "
import json,re,sys
t=open('final/$slug.json').read()
m=re.search(r'https://cdn\.muapi\.ai/outputs/generated/[a-f0-9]+\.(png|jpg)',t)
c=re.search(r'\"amount_usd\":\s*([0-9.]+)',t)
print((m.group(0) if m else 'FAIL'), (c.group(1) if c else '?'))
")
  echo "$slug -> $out"
}

run tomahawk-bearnaise "https://cdn.muapi.ai/outputs/generated/aa2a31c471624bf68938a1f867dc0c13.jpg" 16:9 \
"Replate the bone-in tomahawk ribeye with sauteed mushrooms and bearnaise sauce onto an elegant modern white plate: steak angled to show the full long bone, mushrooms in a tidy cluster, bearnaise in a small clean ramekin or neat quenelle rather than a metal cup. Keep the steak's char and doneness exactly as they are."

run filet-crab-hollandaise "https://cdn.muapi.ai/outputs/generated/1f8f717eba084068b81ef33b3fe675dd.jpg" 16:9 \
"Replate the char-grilled steak topped with lump crabmeat and hollandaise onto an elegant modern white plate. Keep the crabmeat visibly lump and the hollandaise glossy, but tighten it into a deliberate mound on the steak instead of a spill, with only a small controlled sauce accent on the plate. Keep the steak's char intact."

run blackened-fish-crab "https://cdn.muapi.ai/outputs/generated/46d7666d5d68475aa954e20f096677ec.jpg" 16:9 \
"Replate the blackened fish fillet topped with lump crabmeat cream sauce, alongside the loaded baked potato, onto an elegant modern white plate. Keep the blackening spice crust on the fish clearly visible. Arrange the potato neatly beside the fish with a fresh lemon wedge. Tidy the cream sauce into a deliberate pool rather than a spill."

run fried-catfish-southern "https://cdn.muapi.ai/outputs/generated/d41186bab32a4cbc86a4ca6962fe0a5f.jpg" 16:9 \
"Replate the cornmeal-fried catfish fillets with hushpuppies and cornbread onto an elegant modern white plate, with the collard greens and baked beans in small clean white ramekins arranged behind. Keep the golden fried crust texture crisp and appetizing. Southern comfort food styled with care."

run adobo-fish-oaxaca "https://cdn.muapi.ai/outputs/generated/297a8a8f56e4490abbcb65773ed26f49.jpg" 16:9 \
"Replate the red chile adobo-sauced fish fillet with mixed greens and orange slices onto an elegant modern white plate. Keep the deep red-orange chile sauce vivid and glossy. Arrange the greens as a tidy nest and fan the orange slices deliberately. Authentic Oaxacan character."

run chicken-nachos "https://cdn.muapi.ai/outputs/generated/43b69c68bca74c31af0c1173f41e8b06.jpg" 16:9 \
"Replate the grilled chicken nachos onto an elegant modern white platter with deliberate arrangement: tortilla chips fanned, grilled chicken and queso distributed evenly, with distinct tidy mounds of guacamole, black beans, pico de gallo, and pickled jalapenos. Keep every topping recognizable and fresh-looking."

run chicken-fried-steak "https://cdn.muapi.ai/outputs/generated/35a09ed3c725482a8f1628d4017925f2.jpg" 16:9 \
"Replate the chicken-fried steak with cream gravy onto an elegant modern white plate, with the lima beans and hashbrown casserole in small clean white ramekins beside it. Keep the crispy breaded edges of the steak visible rather than fully drowned in gravy - gravy poured deliberately over the center only. Southern lunch plate styled with care."

run burger-menu "https://cdn.muapi.ai/outputs/generated/7ece98510f6e4bcd9c24dccbfafaa268.jpg" 16:9 \
"Keep the navy Miguel's Restaurante MR menu standing behind the plate exactly as it is, fully legible and unaltered - do not change the logo, text, or menu design in any way. Improve only the lighting and background: warm restaurant lighting, blur out the kitchen clutter behind. Refine the burger and hand-cut fries plating slightly - burger centered, fries stacked tidily."

run strawberry-salad "https://cdn.muapi.ai/outputs/generated/abf1996b9e474d6fbd475eaec5e2468a.jpg" 16:9 \
"Replate the strawberry spinach salad with toasted almonds onto an elegant modern white bowl or plate with deliberate composition: strawberries fanned attractively, greens lifted with volume rather than flat, almonds scattered evenly. Put the vinaigrette in a small clean white ramekin instead of a metal cup. Fresh and vibrant."

run cheesecake "https://cdn.muapi.ai/outputs/generated/7ab84c66eba84005b29d06d75df95aed.jpg" 16:9 \
"Replate the strawberry-topped cheesecake slice onto an elegant modern white dessert plate, set on a table rather than held in a hand - remove the hand entirely. Remove the chocolate script writing from the plate rim. Keep the cheesecake's graham crust and strawberry compote topping exactly as they are, with a deliberate compote drizzle."

echo "Done."
