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
      { id: 'p9', label: 'Sleepwear and one spare change of everyday clothes' },
    ],
  },
  {
    title: 'Weather & rain protection — rain is forecast on all five days',
    items: [
      { id: 'p10', label: 'Compact umbrella or a lightweight rain jacket' },
      { id: 'p11', label: 'A dry bag or zip-lock bags to protect your phone and electronics from sudden showers' },
      { id: 'p12', label: 'A quick-dry travel towel, useful for both rain and any pool/beach time' },
      { id: 'p13', label: 'Laundry bag or plastic bag to keep wet or clay-stained clothes separate' },
      { id: 'p14', label: 'Sunscreen (SPF 30+) — humid but still sun exposure between showers' },
    ],
  },
  {
    title: 'Safety & health — traveling solo',
    items: [
      { id: 'p15', label: 'Photo of your ID and hotel booking saved on your phone, plus one printed copy kept separate' },
      { id: 'p16', label: 'A personal safety alarm or whistle' },
      { id: 'p17', label: 'A portable door lock or rubber doorstop for extra security at the guesthouse' },
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
      { id: 'p23', label: 'Physical or digital copies of ID, flight tickets, and hotel booking confirmations' },
      { id: 'p24', label: 'Cash in small denominations for autos, cabs, and smaller vendors — many won\'t take cards' },
      { id: 'p25', label: 'A debit or credit card as backup' },
      { id: 'p26', label: 'Phone charger, cable, and a spare power bank' },
      { id: 'p27', label: 'Camera or charger for it, if bringing one separate from your phone' },
      { id: 'p28', label: 'Offline maps of Panjim and Old Goa downloaded in advance, in case of patchy signal during rain' },
    ],
  },
  {
    title: 'For the places you\'re going',
    items: [
      { id: 'p29', label: 'Reusable water bottle for the Velha Goa heritage walk and museum visits' },
      { id: 'p30', label: 'A light daypack for day trips (Velha Goa, the Fontainhas walk)' },
      { id: 'p31', label: 'A change of clothes in your carry-on in case checked luggage or transfers are delayed' },
      { id: 'p32', label: 'Earplugs or an eye mask for the flights' },
      { id: 'p33', label: "Ask Claykind if they provide an apron for the pottery workshop — bring one just in case they don't" },
    ],
  },
  {
    title: 'Toiletries & misc',
    items: [
      { id: 'p34', label: 'Toiletries in travel-size bottles (toothbrush, toothpaste, shampoo, deodorant)' },
      { id: 'p35', label: 'Any skincare or haircare you rely on in humid weather' },
      { id: 'p36', label: 'Snacks for the flights and travel days' },
    ],
  },
];

export const beforeBookingItems: CheckItem[] = [
  { id: 'b1', label: 'Confirm private room and internal door latch' },
  { id: 'b2', label: 'Keep suitcase in locked boot; carry all valuables' },
  { id: 'b3', label: 'Get cab driver name, number and vehicle plate' },
  { id: 'b4', label: 'Confirm the 8-hour cab limit, kilometre allowance and overtime' },
  { id: 'b5', label: 'Share live location and itinerary with family' },
  { id: 'b6', label: 'No published parking fee found for Sé Cathedral/Bom Jesus — confirm roadside parking availability and cost on arrival' },
  { id: 'b7', label: 'Confirm the exact dates of the 3-day Claykind workshop — currently assumed as 15–17 September — and get Claykind\'s exact street address' },
  { id: 'b8', label: "Call Joseph's Bar ahead if possible — no published hours found anywhere" },
  { id: 'b9', label: "Check Confeitaria 31 de Janeiro's exact address, phone and hours on arrival — sources disagree" },
  { id: 'b10', label: 'Price-check and/or estimate costs for Viva Panjim, Caravela Cafe & Bistro, Kokni Kanteen and Petisco — Kitchen & Bar; none have confirmed menu prices in the tracker yet' },
  { id: 'b11', label: 'Decide how you\'ll get to Velha Goa and back on 16 September (cab, auto, self-drive) and its cost' },
  { id: 'b12', label: "Confirm Archaeological Museum's actual weekly closed day — sources disagree between Friday and no closure" },
  { id: 'b13', label: 'Decide on lunch for 16 September — Annapurna Restaurant is a placeholder, not booked or price-checked' },
  { id: 'b14', label: 'Confirm breakfast inclusion and exact checkout time at Taj Holiday Village Resort & Spa on 15 September' },
  { id: 'b15', label: 'Check which in-house outlet(s) at Taj Holiday Village you\'ll actually eat at on the 14th and their real menu prices — ₹3,500 in the tracker is only a rough estimate' },
  { id: 'b16', label: 'Reconfirm the 15 September Savaari quote and route — it now starts from Taj Holiday Village in Candolim and covers Museum of Goa and Houses of Goa Museum too' },
  { id: 'b17', label: 'Plan the rest of 16–18 September around the 4–6 PM Claykind sessions, keeping 18 September light since you fly out at 1:05 PM' },
  { id: 'b18', label: 'Get a fresh quote for the 18 September Goa airport transfer — the ₹2,000 figure in the tracker was priced for the longer Mopa (GOX) route, not Dabolim (GOI)' },
  { id: 'b19', label: "Confirm Relax Inn's checkout time and how much runway that leaves before a 1:05 PM flight from GOI" },
  { id: 'b20', label: 'Book the Kolkata → Balurghat return leg and confirm the exact return date once you\'re back' },
  { id: 'b21', label: '"FRR" — clarify what this refers to for a future trip; best guess so far is FTR – For The Record, still unconfirmed' },
  { id: 'b22', label: 'Decide Cafe Tato vs Cafe Bhosle for 16 September breakfast — Tato was picked arbitrarily since you named both' },
  { id: 'b23', label: 'If swapping in Anandashram or Hospedaria Venite for Kokni Kanteen/Petisco, double-check their hours against your actual arrival time that day' },
];
