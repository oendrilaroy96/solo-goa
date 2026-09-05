export interface BudgetItem {
  id: string;
  label: string;
  sublabel: string;
  defaultValue: number;
}

export interface BudgetGroup {
  id: string;
  name: string;
  subtitle: string;
  items: BudgetItem[];
}

export const budgetGroups: BudgetGroup[] = [
  {
    id: 'transport',
    name: 'Transport',
    subtitle: 'Train & flights',
    items: [
      { id: 'train-out', label: 'Balurghat → Kolkata train', sublabel: '12 September, 7:00 PM · Balurghat → Sealdah, arriving 4:35 AM on 13 Sep · booked, confirmed cost', defaultValue: 1079.05 },
      { id: 'flight-to-goa', label: 'Kolkata → Goa flight', sublabel: 'IndiGo 6E 634 · confirmed cost', defaultValue: 9000 },
      { id: 'flight-return', label: 'Goa → Kolkata return flight', sublabel: '18 September, 1:05 PM, departing GOI (Dabolim) · confirmed cost', defaultValue: 11000 },
      { id: 'train-return', label: 'Kolkata → Balurghat return leg', sublabel: 'Exact date/train not yet booked · outbound was ₹1,079.05 so use as reference', defaultValue: 1079.05 },
    ],
  },
  {
    id: 'cabs',
    name: 'Cab & local transfers',
    subtitle: 'Airport runs, day-trip cabs',
    items: [
      { id: 'kolkata-cab', label: 'Kolkata airport transfer', sublabel: '14 September · local transfer to the airport · confirmed cost', defaultValue: 300 },
      { id: 'goa-airport-cab', label: 'Goa airport → hotel transfer', sublabel: '14 September · worth reconfirming since Taj is farther from the airport', defaultValue: 1452 },
      { id: 'savaari', label: 'Savaari 8-hour cab', sublabel: '15 September · confirmed price, but route now starts from Taj Holiday Village in Candolim — may need reconfirming', defaultValue: 2750 },
      { id: 'velha-goa-cab', label: 'Transport to Velha Goa', sublabel: '16 September · round trip, Panjim ↔ Old Goa · mode and cost not yet decided', defaultValue: 0 },
      { id: 'goi-transfer', label: 'Goa airport (GOI) transfer', sublabel: '18 September · was priced for Mopa/GOX route — GOI (Dabolim) is closer to Panjim, so this ₹2,000 figure likely needs a fresh quote', defaultValue: 2000 },
    ],
  },
  {
    id: 'stays',
    name: 'Stays',
    subtitle: '2 bookings, 14–18 Sep',
    items: [
      { id: 'taaj-kutir', label: 'TaajKutir Boutique Hotel & Spa, Kolkata', sublabel: '13–14 September · 1 night · confirmed cost', defaultValue: 0 },
      { id: 'taj', label: 'Taj Holiday Village Resort & Spa', sublabel: '14–15 September · 1 night · confirmed cost, paid', defaultValue: 11947.50 },
      { id: 'relax-inn', label: 'Relax Inn Guesthouse', sublabel: '15–18 September · 3 nights · confirmed cost', defaultValue: 6600 },
    ],
  },
  {
    id: 'pottery',
    name: 'Pottery workshop',
    subtitle: 'Claykind, 3 days',
    items: [
      { id: 'claykind', label: 'Claykind pottery workshop', sublabel: '15–17 September (assumed) · 3-day hand-building workshop, 4–6 PM · confirmed cost', defaultValue: 6000 },
    ],
  },
  {
    id: 'activities',
    name: 'Activities & entries',
    subtitle: 'Museums & heritage sites',
    items: [
      { id: 'mog', label: 'Museum of Goa (MOG)', sublabel: '15 September · adult entry, per the museum\'s own ticketing page', defaultValue: 300 },
      { id: 'houses-of-goa', label: 'Houses of Goa Museum', sublabel: '15 September · confirmed cost', defaultValue: 150 },
      { id: 'velha-goa-entries', label: 'Velha Goa (Old Goa) entry fees', sublabel: '16 September · Archaeological Museum ~₹10 + Museum of Christian Art ₹100; every other site appears free', defaultValue: 110 },
      { id: 'sunaparanta', label: 'Sunaparanta Goa Centre for the Arts', sublabel: '17 September · entry fee not published, treating as free for now', defaultValue: 0 },
    ],
  },
  {
    id: 'food',
    name: 'Food & drinks',
    subtitle: '11 meals, snacks & drinks',
    items: [
      { id: 'taj-dinner', label: 'Dinner, drinks & snacks at Taj Holiday Village', sublabel: 'Evening of 14 September · rough estimate scaled from resort pricing plus 18% GST', defaultValue: 3500 },
      { id: 'cafe-tato', label: 'Breakfast at Cafe Tato', sublabel: '16 September · rough estimate from a directory\'s "cost for two" figure', defaultValue: 450 },
      { id: 'lunch-16', label: 'Lunch, 16 September', sublabel: 'Annapurna Restaurant near Bom Jesus — a placeholder location, not booked', defaultValue: 0 },
      { id: 'ritz-classic', label: 'Dinner at Ritz Classic', sublabel: '15 September · reusing the ~₹400 fish thali figure for the same restaurant', defaultValue: 400 },
      { id: 'josephs-bar', label: "Drinks at Joseph's Bar", sublabel: '15 September · cost not yet estimated', defaultValue: 0 },
      { id: 'viva-panjim', label: 'Dinner at Viva Panjim', sublabel: '16 September · cost not yet estimated', defaultValue: 0 },
      { id: 'caravela-cafe', label: 'Breakfast at Caravela Cafe & Bistro', sublabel: '17 September · cost not yet estimated', defaultValue: 0 },
      { id: 'confeitaria', label: 'Confeitaria 31 de Janeiro', sublabel: '17 September · rough estimate from published low per-item prices', defaultValue: 50 },
      { id: 'mr-baker', label: 'Mr Baker 1922', sublabel: '17 September · cost not yet estimated', defaultValue: 0 },
      { id: 'kokni-kanteen', label: 'Lunch at Kokni Kanteen', sublabel: '17 September · cost not yet estimated', defaultValue: 0 },
      { id: 'petisco', label: 'Dinner at Petisco – Kitchen & Bar', sublabel: '17 September · cost not yet estimated', defaultValue: 0 },
    ],
  },
  {
    id: 'buffer',
    name: 'Buffer',
    subtitle: 'Contingency',
    items: [
      { id: 'contingency', label: 'Water + contingency', sublabel: 'Small buffer for the planned period', defaultValue: 500 },
    ],
  },
];

export const STORAGE_KEY = 'goaBudget';
