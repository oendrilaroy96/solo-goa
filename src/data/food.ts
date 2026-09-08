export interface FoodItem {
  status: string;
  name: string;
  tags: string[];
  specialityTags: string[];
  details: string;
  links?: { label: string; url: string }[];
  isAlternative?: boolean;
}

export interface FoodGroup {
  title: string;
  items: FoodItem[];
}

export const foodGroups: FoodGroup[] = [
  {
    title: 'Breakfast & bakery',
    items: [
      {
        status: 'Scheduled · 16 Sep',
        name: 'Cafe Tato',
        tags: ['Breakfast'],
        specialityTags: ['Puri-bhaji, dosa, batata wada'],
        details: 'Souza Towers, near Municipal Market/Garden, Panjim. Picked over Cafe Bhosle somewhat arbitrarily — see the alternative below.',
      },
      {
        status: 'Alt to Cafe Tato · 16 Sep',
        name: 'Cafe Bhosle',
        tags: ['Breakfast'],
        specialityTags: ['Traditional Goan breakfast — exact dishes unconfirmed'],
        details: 'Cunha Rivara Road, near the National Theatre, Panjim. Phone (single-source, unconfirmed): +91 832 222 2260. Old Panjim breakfast institution, opens 6:00 AM.',
        isAlternative: true,
      },
      {
        status: 'Scheduled · 17 Sep',
        name: 'Caravela Cafe & Bistro',
        tags: ['Breakfast'],
        specialityTags: ['Goan breakfast ₹600, veg breakfast ₹540, masala beans on toast ₹180'],
        details: 'House 27, 31st January Road, Fontainhas / São Tomé area, Panjim 403001. Hours: 8:00 AM–8:00 PM. First café in Goa with in-house coffee roasters. Est. ₹400–₹650 for a full breakfast + coffee. No-laptop policy.',
      },
      {
        status: 'Scheduled · 17 Sep',
        name: 'Confeitaria 31 de Janeiro',
        tags: ['Bakery, morning'],
        specialityTags: ['Patties (veg/prawn/chicken), chicken-cheese roll, bebinca'],
        details: 'Corte De Oiterio, Rua 31 de Janeiro (31st January Road), behind Mary Immaculate Girls School, Fontainhas, Panjim 403001. Phone: +91 832 222 5791. Hours: Mon–Sat 8:00 AM–8:00 PM. Est. 1930, wood-fired oven. ~₹50–100 per item.',
        links: [{ label: 'Instagram', url: 'https://www.instagram.com/confeitariagoa.31/?hl=en' }],
      },
      {
        status: 'Scheduled · 17 Sep',
        name: 'Mr Baker 1922',
        tags: ['Bakery, morning'],
        specialityTags: ['Heritage bakery — item not specified'],
        details: 'Cost not yet estimated.',
        links: [{ label: 'Map', url: 'https://www.google.com/maps/search/?api=1&query=Mr+Baker+1922+Panjim' }],
      },
      {
        status: 'Possible add-on · 17 Sep',
        name: 'Perfect Bakery and Cafe',
        tags: ['Bakery, takeaway'],
        specialityTags: ['Patties & cheese straws'],
        details: 'Ozari, Panjim — exact address, phone and hours all unconfirmed. Possible add-on if you happen to find it.',
        isAlternative: true,
      },
      {
        status: 'Note only · 15 Sep',
        name: 'MOG Art Café',
        tags: ['Coffee/snack'],
        specialityTags: ['Budget-friendly café items, no alcohol'],
        details: 'Inside Museum of Goa (Pilerne), 10 AM–6 PM. A coffee-during-the-visit option on 15 September rather than a separate meal.',
        isAlternative: true,
      },
    ],
  },
  {
    title: 'Lunch',
    items: [
      {
        status: 'Scheduled · 17 Sep',
        name: 'Kokni Kanteen',
        tags: ['Lunch'],
        specialityTags: ['Fish curry rice, rava-fried surmai, sol kadi, prawn papad'],
        details: 'Dr. Dada Vaidya Road, near Mahalaxmi Temple, Altinho, Panaji. Phone: +91 95792 75664. Est. 1972, lunch-only. Standard Konkani thali (rice, fish curry, fried fish, sol kadi, sides): ₹350–₹480. Special "Bappa" thali (crab + prawn + mussels + fried fish) at higher end.',
        links: [{ label: 'Map', url: 'https://www.google.com/maps/search/?api=1&query=Kokni+Kanteen+Altinho+Panaji' }],
      },
      {
        status: 'Alt to Kokni Kanteen · 17 Sep',
        name: 'Anandashram',
        tags: ['Lunch'],
        specialityTags: ['Kingfish/Surmai fish thali'],
        details: '31st January Road, near the Head Post Office, Altinho. Phone +91 98231 95245. ~₹400 for two. Lunch-only hours make it less flexible.',
        isAlternative: true,
      },
      {
        status: 'Not currently scheduled',
        name: 'Ashok Bar & Restaurant',
        tags: ['Lunch'],
        specialityTags: ['Xacuti (confirmed signature dish since 1969)'],
        details: 'Fontainhas, behind the Head Post Office. Was under consideration for 18 September lunch; no time before the 1:05 PM flight.',
        isAlternative: true,
      },
    ],
  },
  {
    title: 'Dinner',
    items: [
      {
        status: 'Scheduled · 15 Sep',
        name: 'Ritz Classic',
        tags: ['Dinner'],
        specialityTags: ['Fish thali'],
        details: '~₹400 estimate (reused from an earlier day\'s price you gave for the same place). Full details in the 15 September panel.',
        links: [
          { label: 'Instagram', url: 'https://www.instagram.com/ritzclassic/?hl=en' },
          { label: 'Map', url: 'https://www.google.com/maps/search/?api=1&query=Ritz+Classic+Panjim' },
        ],
      },
      {
        status: 'Scheduled · 16 Sep',
        name: 'Viva Panjim',
        tags: ['Dinner'],
        specialityTags: ['Crab xec-xec, prawn vindaloo, pomfret recheado, bebinca'],
        details: 'Behind Mary Immaculate High School, 31st January Road, Fontainhas, Panjim. Reasonably priced Goan seafood. Est. ₹650–₹800/person for dinner without drinks; ~₹900–₹1,100 with a beer or two.',
        links: [
          { label: 'Website', url: 'https://www.vivapanjim.com/' },
          { label: 'Map', url: 'https://www.google.com/maps/search/?api=1&query=Viva+Panjim+Fontainhas' },
        ],
      },
      {
        status: 'Scheduled · 17 Sep',
        name: 'Petisco – Kitchen & Bar',
        tags: ['Dinner'],
        specialityTags: ['Pulled pork sandwich, polenta, chimichurri dishes, "Ambo" cocktail'],
        details: 'Souza Towers, Dr. D.D.R.S. Road, opposite Municipal Garden, Panjim. Phone +91 80105 21438. 3-floor gastrobar with live music evenings. Est. ₹900–₹1,200/person for dinner + 1–2 cocktails (cocktails ~₹350–₹500 each, small plates ~₹250–₹450 each).',
        links: [
          { label: 'Instagram', url: 'https://www.instagram.com/petiscogoa/?hl=en' },
          { label: 'Map', url: 'https://www.google.com/maps/search/?api=1&query=Petisco+Kitchen+and+Bar+Panjim' },
        ],
      },
      {
        status: 'Alt to Petisco · 17 Sep',
        name: 'Hospedaria Venite',
        tags: ['Dinner'],
        specialityTags: ['Goan-Portuguese & seafood menu'],
        details: 'Rua de 31 de Janeiro, Fontainhas. Phone +91 98504 67008. ~₹1,200 for two. Heritage Portuguese-era restaurant, open 9 AM–10:30 PM, closed Tuesdays.',
        isAlternative: true,
      },
      {
        status: 'Not currently scheduled',
        name: 'Janôt by Avinash Martins',
        tags: ['Dinner'],
        specialityTags: ['Chef-driven, ingredient-led tasting menu'],
        details: 'Panjim Gymkhana, overlooking the Mandovi. No published address, phone or prices. Was under consideration for 18 September evening; no room before the 1:05 PM flight.',
        isAlternative: true,
      },
    ],
  },
  {
    title: 'Drinks & bars',
    items: [
      {
        status: 'Scheduled · 15 Sep',
        name: "Joseph's Bar",
        tags: ['Drinks'],
        specialityTags: ['Feni, urak & Susegado craft beer on tap'],
        details: 'E-250 Gomes Pereira Road, Altinho, Panjim. Phone +91 98221 28885. Hours: 12:00 PM–11:00 PM daily.',
      },
      {
        status: 'Not currently scheduled',
        name: 'K-Bar & Resto',
        tags: ['Drinks & bar food'],
        specialityTags: ['Chinese/N. Indian/Goan; "tempura prawns" unverified'],
        details: 'Church Square, Altinho. Was the first stop of a bar-crawl idea for 18 September evening; no time before the 1:05 PM flight.',
        isAlternative: true,
      },
      {
        status: 'Not currently scheduled',
        name: 'Slurr',
        tags: ['Drinks'],
        specialityTags: ['Cocktails (rosemary gin & tonic mentioned)'],
        details: 'Fontainhas lanes; address, phone and hours all unconfirmed. Was the second stop of the same bar-crawl idea.',
        isAlternative: true,
      },
      {
        status: 'Not currently scheduled',
        name: 'MTW',
        tags: ['Drinks'],
        specialityTags: ['Nao Spirits gin cocktails'],
        details: 'Mayfair Hotel, Altinho — the Nao Spirits gin office by day, a speakeasy by night. Was the third stop of the same bar-crawl idea.',
        isAlternative: true,
      },
      {
        status: 'Not currently scheduled',
        name: 'Bebde',
        tags: ['Dinner & drinks'],
        specialityTags: ['Goan/Continental/Indo-Chinese/American gastropub menu'],
        details: 'MG Road, Patto Colony. Was the fourth stop of the same bar-crawl idea.',
        isAlternative: true,
      },
      {
        status: 'Not currently scheduled',
        name: 'DTR (Down The Road)',
        tags: ['Dinner & drinks'],
        specialityTags: ['Vindaloo, xacuti; "Pepper Pork Roast" unverified'],
        details: 'Near Old Patto Bridge. Was the final stop of the same bar-crawl idea.',
        isAlternative: true,
      },
      {
        status: 'Identity unconfirmed',
        name: '"FRR" — possibly FTR – For The Record?',
        tags: ['Drinks (not a meal spot)'],
        specialityTags: ['Feni-forward craft cocktails'],
        details: 'I could not find any real Panjim venue called exactly "FRR." My best guess is FTR – For The Record, a vinyl listening bar near Maruti Temple, Panaji (49, Jukebox/Mala · phone +91 75074 72587 · roughly ₹700 per cocktail) — but I\'m not confident it\'s what you meant.',
        links: [{ label: 'Map (best guess only)', url: 'https://www.google.com/maps/search/?api=1&query=FTR+For+The+Record+Panaji' }],
        isAlternative: true,
      },
    ],
  },
];
