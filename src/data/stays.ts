export interface StayItem {
  status: string;
  name: string;
  mapUrl?: string;
  websiteUrl?: string;
  details: string;
  isAlternative?: boolean;
}

export const stays: StayItem[] = [
  {
    status: 'Booked · 14–15 Sep',
    name: 'Taj Holiday Village Resort & Spa',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Taj+Holiday+Village+Resort+%26+Spa%2C+Sinquerim%2C+Candolim%2C+Goa+403515',
    websiteUrl: 'https://www.tajhotels.com/en-in/hotels/taj-holiday-village-goa',
    details: 'Sinquerim, Candolim, Goa 403515. Phone: +91 83266 45858. One night, ₹11,947.50, confirmed. Staying in for the evening — dinner, drinks and snacks at the resort. Checkout confirmed for 12:00 PM on 15 September.',
  },
  {
    status: 'Not booked',
    name: 'Welcome Heritage Hotel',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=WelcomHeritage+Hotel+Fontainhas+Panjim+Goa',
    details: 'Original plan for the 14th, replaced first by Relax Inn Guesthouse and now by Taj Holiday Village Resort & Spa. Heritage stay in Fontainhas, one night with breakfast would have been ₹4,148. Kept here only as a record of the earlier plan.',
    isAlternative: true,
  },
  {
    status: 'Booked · 15–18 Sep',
    name: 'Relax Inn Guesthouse',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Relax+Inn+Guesthouse+Panjim',
    details: '235 St Tome Street, São Tomé ward, Panjim. Phone: 98504 36998 / 70302 70370. Three nights, ₹6,600 total, confirmed.',
  },
  {
    status: 'Alternative option',
    name: 'Agonda Villas',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=Agonda+Villas+Goa',
    details: 'Starting around ₹10,000–₹12,000 per night. Alternative only; not included in the trip subtotal.',
    isAlternative: true,
  },
  {
    status: 'Alternative option',
    name: 'O Pescador – an Indy Resort',
    mapUrl: 'https://www.google.com/maps/search/?api=1&query=O+Pescador+an+Indy+Resort+Goa',
    details: 'Alternative stay to consider. Price not yet added and not included in the trip subtotal.',
    isAlternative: true,
  },
];
