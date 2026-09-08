export interface CheckItem {
  id: string;
  label: string;
}

export interface CheckSection {
  title?: string;
  items: CheckItem[];
}

export const packingSections: CheckSection[] = [
  {
    title: 'Outfits & footwear',
    items: [
      { id: 'p1', label: 'Quick-dry, breathable clothing — September in Goa runs hot and humid (~89% average humidity)' },
      { id: 'p2', label: 'One modest outfit with covered shoulders and knees, for the Basilica of Bom Jesus and Sé Cathedral' },
      { id: 'p3', label: 'An old or dark-colored outfit you don\'t mind getting clay-stained, for the 3-day Claykind pottery workshop' },
      { id: 'p4', label: 'Comfortable walking shoes for Velha Goa and the Fontainhas heritage walk' },
      { id: 'p5', label: 'Sandals or flip-flops for the hotel, the pool, and wet pavements' },
      { id: 'p6', label: 'A going-out outfit for dinners at Ritz Classic, Viva Panjim, and Petisco' },
      { id: 'p7', label: "Swimwear, in case there's a clear-weather window at Taj Holiday Village's pool or beach access" },
      { id: 'p8', label: 'A light cardigan or shawl for air-conditioned flights and hotel rooms' },
    ],
  },
  {
    title: 'Weather & rain protection — rain is forecast on all five days',
    items: [
      { id: 'p10', label: 'Compact umbrella or a lightweight rain jacket' },
      { id: 'p11', label: 'A dry bag or zip-lock bags to protect your phone and electronics from sudden showers' },
      { id: 'p13', label: 'Laundry bag or plastic bag to keep wet or clay-stained clothes separate' },
      { id: 'p14', label: 'Sunscreen (SPF 30+) — humid but still sun exposure between showers' },
    ],
  },
  {
    title: 'Safety & health — traveling solo',
    items: [
      { id: 'p15', label: 'Photo of ID, train/flight tickets, and hotel bookings saved on your phone + one printed copy kept separate' },
      { id: 'p16', label: 'A personal safety alarm or whistle' },
      { id: 'p17', label: 'A portable door lock or rubber doorstop for extra security at Relax Inn Guesthouse' },
      { id: 'p18', label: 'Basic first-aid kit and any personal prescription medication' },
      { id: 'p19', label: 'Mosquito/insect repellent' },
      { id: 'p20', label: 'Hand sanitizer and tissues/wet wipes' },
      { id: 'p21', label: 'Emergency contacts (family, hotel numbers) written down, not just saved on your phone' },
      { id: 'p22', label: 'Power bank kept charged — for calling home or sharing your live location' },
    ],
  },
  {
    title: 'Documents, money & electronics',
    items: [
      { id: 'p24', label: 'Cash in small denominations for autos, cabs, and smaller vendors — many won\'t take cards' },
      { id: 'p25', label: 'A debit or credit card as backup' },
      { id: 'p26', label: 'Phone charger and cable' },
      { id: 'p27', label: 'Camera or charger for it, if bringing one separate from your phone' },
      { id: 'p28', label: 'Offline maps of Panjim and Old Goa downloaded in advance, in case of patchy signal during rain' },
    ],
  },
  {
    title: 'For the places you\'re going',
    items: [
      { id: 'p29', label: 'Reusable water bottle for the Velha Goa heritage walk and museum visits' },
      { id: 'p30', label: 'A light daypack for day trips (Velha Goa, the Fontainhas walk)' },
      { id: 'p32', label: 'Earplugs or an eye mask for the flights' },
      { id: 'p33', label: "Check with Claykind if they provide an apron — bring one just in case they don't" },
    ],
  },
  {
    title: 'Toiletries & misc',
    items: [
      { id: 'p34', label: 'Toiletries in travel-size bottles (toothbrush, toothpaste, shampoo, deodorant)' },
      { id: 'p35', label: 'Any skincare or haircare you rely on in humid weather' },
      { id: 'p36', label: 'Snacks for the train and flight travel days' },
    ],
  },
];

export const beforeBookingItems: CheckItem[] = [
  { id: 'b1', label: 'Confirm private room and internal door latch at Relax Inn Guesthouse' },
  { id: 'b2', label: 'Keep suitcase in locked boot of Savaari cab; carry all valuables on you' },
  { id: 'b3', label: 'Get Savaari cab driver name, number and vehicle plate before 15 Sep' },
  { id: 'b4', label: 'Confirm the 8-hour cab limit, kilometre allowance and overtime rate with Savaari' },
  { id: 'b5', label: 'Share live location and itinerary with family before leaving Balurghat' },
  { id: 'b6', label: 'Confirm parking availability at Sé Cathedral/Bom Jesus on arrival' },
  { id: 'b7', label: 'Get Claykind\'s exact street address before leaving — WhatsApp +91 73091 30348 (studio is in Campal, Panjim)' },
  { id: 'b11', label: 'Decide how to get to Velha Goa and back on 16 September (cab, auto or self-drive) and its cost' },
  { id: 'b12', label: 'Confirm Archaeological Museum\'s weekly closed day on arrival — sources disagree between Friday and no closure' },
  { id: 'b13', label: 'Decide on lunch for 16 September — no confirmed restaurant in the tracker for that afternoon yet' },
  { id: 'b15', label: 'Check which outlet(s) at Taj Holiday Village you\'ll eat at on 14 Sep — ₹3,500 in the tracker is a rough estimate' },
  { id: 'b16', label: 'Reconfirm Savaari booking details closer to 15 Sep — route now covers Museum of Goa and Houses of Goa Museum' },
  { id: 'b17', label: 'Plan 16–18 September around the Claykind sessions (times TBC with studio), keeping 18 Sep light before 1:05 PM flight' },
  { id: 'b18', label: 'Get a fresh quote for 18 Sep Goa airport transfer — the ₹2,000 in the tracker was priced for Mopa (GOX), not Dabolim (GOI)' },
  { id: 'b19', label: "Confirm Relax Inn's checkout time — need enough runway before a 1:05 PM flight from GOI" },
  { id: 'b20', label: 'Book the Kolkata → Balurghat return leg once you\'re back' },
  { id: 'b22', label: 'Decide Cafe Tato vs Cafe Bhosle for 16 Sep breakfast — both are good, pick one' },
  { id: 'b23', label: 'If swapping in Anandashram or Hospedaria Venite, double-check their hours against your actual arrival time' },
];
