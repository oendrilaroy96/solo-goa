export interface ShopItem {
  status: string;
  name: string;
  details: string;
  links?: { label: string; url: string }[];
  isPlanned?: boolean;
}

export interface ShopGroup {
  title: string;
  items: ShopItem[];
}

export const shopGroups: ShopGroup[] = [
  {
    title: 'What Goa is actually known for',
    items: [
      {
        status: 'Souvenir/gift category',
        name: 'Cashews & cashew feni',
        details: "Goa's signature buy. Feni (750ml): local/unbranded ~₹300–600, mid-range brands (Big Boss, Tinto, Cazulo) ~₹600–1,200, premium (Moji, Volando) ~₹1,200–2,000. Worth knowing: fresh cashew harvest/feni distillation season is March–June, not September, though bottled feni is sold year-round.",
      },
      {
        status: 'Souvenir/gift category',
        name: 'Spices & Goan sweets',
        details: 'Pepper, nutmeg and Xacuti masala sold loose in local markets; bebinca and dodol are the well-known sweets.',
      },
      {
        status: 'Souvenir/gift category',
        name: 'Azulejo tiles, Kunbi textiles & craft items',
        details: 'Hand-painted Portuguese-style tiles range from under ₹100 for a small piece to thousands for custom work. Kunbi cotton check-pattern saris are a real traditional textile; coconut-shell crafts, shell jewelry and Mario Miranda-themed art/merchandise are all genuine categories.',
      },
    ],
  },
  {
    title: 'Mapusa Friday Market',
    items: [
      {
        status: 'Weekly market · Fridays only for the full bazaar',
        name: 'Mapusa Market',
        details: 'The big, well-known weekly bazaar runs on Fridays specifically. Good for spices, cashews, feni, chourico sausages, homemade Goan snacks, fresh produce and household items. Roughly 11–15 km / 20–30 min from Panjim. Sources suggest arriving from ~9:30 AM for the best stock, and that bargaining is expected practice. No 18 September in this trip is a Friday, so this would need a dedicated day — it isn\'t currently scheduled.',
        links: [{ label: 'Map', url: 'https://www.google.com/maps/search/?api=1&query=Mapusa+Market+Goa' }],
      },
    ],
  },
  {
    title: 'Panjim & Fontainhas — walkable from where you\'re already staying',
    items: [
      {
        status: 'Daily market',
        name: 'Panjim Municipal Market',
        details: 'Rua Heliodoro Salgado, Panaji. Roughly 7:30 AM–8 PM. Produce, spices, apparel and handicraft/souvenir stalls.',
        isPlanned: true,
      },
      {
        status: 'Craft & lifestyle shops in Fontainhas',
        name: 'Velha Goa Galeria, Marcou Artifacts, Pausa Living, No Nasties',
        details: 'All confirmed real shops in the Fontainhas lanes: Velha Goa Galeria and Marcou Artifacts for hand-painted azulejo tiles, ceramics and Portuguese-style gift items; Pausa Living for Goan artisan crafts (notebooks, pottery, crochet); No Nasties for organic cotton clothing.',
        isPlanned: true,
      },
      {
        status: 'Art prints',
        name: 'Mario Miranda Gallery',
        details: 'Natal Road, Fontainhas — prints and merchandise from the well-known Goan cartoonist.',
        isPlanned: true,
      },
      {
        status: 'Boutique',
        name: "Sosa's",
        details: 'E-245, opposite the Foot Bridge, Altinho, Panjim (near where you\'ll already be for Sunaparanta and Kokni Kanteen on 17 September). Multi-designer Indo-western apparel boutique, roughly ₹2,000–8,000 per piece.',
        isPlanned: true,
      },
      {
        status: 'Khadi outlet',
        name: 'Khadi India, Panjim',
        details: 'Atmaram Borkar Road, near the Municipality building. Khadi clothing, soaps and oils.',
        isPlanned: true,
      },
      {
        status: 'Bookshops, lightly sourced',
        name: 'Broadway Book Centre & Varsha Book Stall',
        details: 'Listed Panjim bookshops near Caculo Circle/Azad Maidan — real businesses, but their specific stock isn\'t independently verified beyond directory listings.',
        isPlanned: true,
      },
    ],
  },
];
