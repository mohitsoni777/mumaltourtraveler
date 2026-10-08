/* =========================================================
   Mumal Tour & Travels — site content
   Edit this file to change contact details, fleet,
   occasions, routes and reviews. No other file needs to change.
   ========================================================= */
window.MUMAL = {
  /* ---- Business details (REPLACE with real ones) ---- */
  config: {
    brand: "Mumal Tour & Travels",
    phoneDisplay: "+91 79762 79155",
    phone: "+917976279155",
    whatsapp: "917976279155", // country code + number, digits only — booking enquiries arrive here
    email: "paramveersingh2822@gmail.com", // shown on the site; booking emails are delivered here
    // Booking emails are sent by the site's own function (api/send-booking.js).
    // It needs SMTP_USER + SMTP_PASS set once in Vercel — see README.
    emailEndpoint: "/api/send-booking",
    address: "Udaipur, Rajasthan 313001",
    hours: "Open 24 × 7 · 365 days",
    mapQuery: "Udaipur, Rajasthan",
  },

  /* ---- Headline numbers (update to your real figures) ---- */
  stats: [
    { value: 25, suffix: "+", label: "Fully AC vehicles" },
    { value: 12000, suffix: "+", label: "Happy travellers" },
    { value: 1500, suffix: "+", label: "Weddings & events" },
    { value: 24, suffix: "×7", label: "On-call support" },
  ],

  /* ---- Fleet ---- */
  vehicles: [
    {
      id: "coach",
      name: "Luxury AC Coach",
      tag: "35–45 Seater · 2×2 Push-back",
      category: "bus",
      seats: 45,
      img: "assets/img/coach.webp",
      gallery: ["assets/img/coach.webp", "assets/img/coach-interior.webp", "assets/img/corporate.webp"],
      blurb: "Our flagship coach for big groups — wedding guest shuttles, corporate offsites and school tours. Whisper-quiet, roof-mounted AC and reclining seats make every kilometre comfortable.",
      features: ["Roof-mounted dual AC", "2×2 push-back seats", "LED TV & Bluetooth audio", "USB charging at every row", "Large under-floor luggage hold", "Ambient cabin lighting"],
      ideal: ["Weddings", "Corporate", "School trips", "Pilgrimage"],
      specs: { Seating: "35 – 45 + crew", "Air-conditioning": "Roof-mounted, dual zone", Luggage: "40+ suitcases", Entertainment: "LED TV · PA mic · Bluetooth", Charging: "USB at every row", Suspension: "Air suspension" },
    },
    {
      id: "minibus",
      name: "AC Mini Coach",
      tag: "20–26 Seater · Tempo Traveller",
      category: "bus",
      seats: 26,
      img: "assets/img/minibus.webp",
      gallery: ["assets/img/minibus.webp", "assets/img/coach-interior.webp", "assets/img/lake-pichola.webp"],
      blurb: "The sweet spot for medium groups. Nimble enough for Udaipur's old-city lanes and hill roads to Kumbhalgarh, with comfortable pushback seats and a powerful AC.",
      features: ["Powerful roof AC", "Push-back seats", "Music system", "Roof carrier for luggage", "Charging points", "Ideal for hill roads"],
      ideal: ["Family trips", "Pilgrimage", "Sightseeing", "Baraat"],
      specs: { Seating: "20 – 26 + driver", "Air-conditioning": "Roof AC with ducts", Luggage: "Roof carrier + rear boot", Entertainment: "Music system", Charging: "USB points", Best: "Old city & hill routes" },
    },
    {
      id: "urbania",
      name: "Urbania Luxury Van",
      tag: "13 / 17 Seater · Premium",
      category: "van",
      seats: 17,
      img: "assets/img/urbania.webp",
      gallery: ["assets/img/urbania.webp", "assets/img/coach-interior.webp", "assets/img/wedding.webp"],
      blurb: "The new benchmark for premium group travel. Captain-style seats, individual AC vents and a car-like ride — the favourite for VIP wedding guests and executive groups.",
      features: ["Individual AC vents", "Captain-style recliners", "Panoramic windows", "Personal reading lights", "USB charging per seat", "Car-like smooth ride"],
      ideal: ["VIP guests", "Executives", "Family tours", "Airport runs"],
      specs: { Seating: "13 or 17 + driver", "Air-conditioning": "Roof AC with individual vents", Luggage: "Rear luggage bay", Comfort: "Recliners with armrests", Charging: "USB at every seat", Ride: "Monocoque, low-noise" },
    },
    {
      id: "suv",
      name: "Premium SUV",
      tag: "Innova Crysta · 6+1",
      category: "taxi",
      seats: 7,
      img: "assets/img/taxi.webp",
      imgPos: "18% 70%",
      gallery: ["assets/img/taxi.webp", "assets/img/lake-pichola.webp", "assets/img/hero.webp"],
      blurb: "Spacious, smooth and reliable — the go-to for family sightseeing, airport pickups and outstation drives to Mount Abu, Jodhpur or Ahmedabad.",
      features: ["Dual AC with rear vents", "Captain seats", "Carrier for luggage", "Bottled water", "Courteous uniformed chauffeur", "Clean & sanitised"],
      ideal: ["Airport", "Family", "Outstation", "City tour"],
      specs: { Seating: "6 + driver", "Air-conditioning": "Dual zone with rear vents", Luggage: "4 bags + carrier", Model: "Toyota Innova Crysta", Fuel: "Diesel", Best: "Long highway drives" },
    },
    {
      id: "sedan",
      name: "Sedan Taxi",
      tag: "Dzire / Etios · 4+1",
      category: "taxi",
      seats: 4,
      img: "assets/img/taxi.webp",
      imgPos: "82% 70%",
      gallery: ["assets/img/taxi.webp", "assets/img/lake-pichola.webp", "assets/img/hero.webp"],
      blurb: "Comfortable, economical and always on time. Ideal for couples and small families, railway and airport transfers, and quick trips to Nathdwara or Eklingji.",
      features: ["Fully AC", "Comfortable 4 seats", "Boot space for 3 bags", "GPS-tracked", "Verified drivers", "Transparent pricing"],
      ideal: ["Couples", "Transfers", "Temple visits", "City tour"],
      specs: { Seating: "4 + driver", "Air-conditioning": "Climate AC", Luggage: "3 bags", Model: "Swift Dzire / Etios", Fuel: "CNG / Petrol", Best: "Transfers & short trips" },
    },
  ],

  /* ---- Occasions ---- */
  occasions: [
    { id: "wedding", title: "Weddings & Baraat", kicker: "Royal celebrations", img: "assets/img/wedding.webp", icon: "heart",
      text: "Flower-decorated coaches for the baraat, guest shuttles between palaces and hotels, and airport pickups for every relative — coordinated by one dedicated travel manager.",
      vehicles: ["coach", "urbania", "suv"] },
    { id: "corporate", title: "Corporate & MICE", kicker: "Business, smoothly", img: "assets/img/corporate.webp", icon: "briefcase",
      text: "Offsites, conferences and incentive tours with punctual coaches, branded welcome boards and real-time tracking for your admin team.",
      vehicles: ["coach", "urbania", "suv"] },
    { id: "sightseeing", title: "Udaipur Sightseeing", kicker: "City of Lakes", img: "assets/img/lake-pichola.webp", icon: "camera",
      text: "City Palace, Lake Pichola, Fateh Sagar, Sajjangarh sunset and Saheliyon-ki-Bari — full-day and half-day loops with drivers who know every shortcut.",
      vehicles: ["urbania", "suv", "sedan"] },
    { id: "school", title: "School & College Trips", kicker: "Safe group travel", img: "assets/img/coach-interior.webp", icon: "school",
      text: "Educational tours, picnics and inter-school events with experienced drivers, first-aid kits, GPS tracking and a fixed pickup–drop plan shared with teachers and parents.",
      vehicles: ["coach", "minibus"] },
    { id: "pilgrimage", title: "Pilgrimage Yatra", kicker: "Darshan in comfort", img: "assets/img/minibus.webp", icon: "temple",
      text: "Shrinathji at Nathdwara, Eklingji, Charbhuja, Sanwariya Seth and beyond. Early-morning departures timed for mangla aarti.",
      vehicles: ["minibus", "coach", "suv"] },
    { id: "transfer", title: "Airport & Railway Transfers", kicker: "Always on time", img: "assets/img/taxi.webp", icon: "plane",
      text: "Maharana Pratap Airport and Udaipur City station pickups with flight tracking, name-board meet & greet and 60 minutes of free waiting.",
      vehicles: ["sedan", "suv", "urbania"] },
  ],

  /* ---- Routes (approx. road distance from Udaipur) ---- */
  routes: {
    outstation: [
      { id: "nathdwara", name: "Nathdwara", km: 48, time: "1 hr", note: "Shrinathji temple", x: 258, y: 320, lx: 14, ly: 4 },
      { id: "kumbhalgarh", name: "Kumbhalgarh", km: 84, time: "2 hrs", note: "UNESCO hill fort", x: 224, y: 290, lx: 10, ly: -12 },
      { id: "ranakpur", name: "Ranakpur", km: 91, time: "2 hr 15 min", note: "Jain temple marvel", x: 205, y: 294, lx: -14, ly: 18, anchor: "end" },
      { id: "chittorgarh", name: "Chittorgarh", km: 117, time: "2 hr 15 min", note: "Largest fort in India", x: 378, y: 326, lx: 14, ly: 4 },
      { id: "mountabu", name: "Mount Abu", km: 163, time: "3 hr 30 min", note: "Rajasthan's hill station", x: 92, y: 365, lx: -14, ly: 4, anchor: "end" },
      { id: "jodhpur", name: "Jodhpur", km: 250, time: "5 hrs", note: "The Blue City", x: 138, y: 143, lx: 14, ly: 4 },
      { id: "ahmedabad", name: "Ahmedabad", km: 260, time: "4 hr 30 min", note: "Gujarat's heritage city", x: 71, y: 577, lx: 14, ly: 4 },
      { id: "jaipur", name: "Jaipur", km: 395, time: "6 hr 30 min", note: "The Pink City", x: 553, y: 52, lx: -14, ly: 4, anchor: "end" },
    ],
    local: [
      { name: "City Palace & Lake Pichola", km: "Old city", time: "3 hrs" },
      { name: "Fateh Sagar & Moti Magri", km: "5 km", time: "2 hrs" },
      { name: "Sajjangarh Monsoon Palace", km: "8 km", time: "Sunset" },
      { name: "Saheliyon-ki-Bari & Bharatiya Lok Kala", km: "6 km", time: "1.5 hrs" },
      { name: "Eklingji & Sas-Bahu Temple", km: "22 km", time: "3 hrs" },
      { name: "Haldighati", km: "44 km", time: "Half day" },
      { name: "Maharana Pratap Airport", km: "22 km", time: "35 min" },
      { name: "Shilpgram & Badi Lake", km: "10 km", time: "2 hrs" },
    ],
  },

  /* ---- Optional extras offered in the booking form ---- */
  addons: [
    { id: "flowers", label: "Wedding flower decoration" },
    { id: "welcome", label: "Welcome drinks & snacks" },
    { id: "board", label: "Name board & meet-greet" },
  ],

  /* ---- Reviews (SAMPLE text — replace with your real Google reviews) ---- */
  reviews: [
    { name: "Ritika & Aman", event: "Wedding · Jag Mandir", text: "Six coaches, three Urbanias and zero chaos. Every guest reached the venue on time and the flower-decorated baraat bus was the talk of the wedding.", rating: 5 },
    { name: "Karan Mehta", event: "School trip · 2 mini coaches", text: "Took 48 students to Kumbhalgarh and Ranakpur. Spotless mini coaches, careful drivers on the ghats and live location shared with every parent.", rating: 5 },
    { name: "Priya Nair", event: "Corporate offsite · 120 pax", text: "Booked three AC coaches for our team offsite. Punctual, spotless and the coordinator shared live locations on WhatsApp. Will book again.", rating: 5 },
    { name: "The Sharma Family", event: "Kumbhalgarh & Ranakpur", text: "The Urbania was super comfortable for grandparents. The driver was patient, careful on the ghats and suggested a lovely lunch stop.", rating: 5 },
    { name: "Vikram Singh", event: "Nathdwara Yatra", text: "Early 4 AM pickup for mangla darshan, mini coach was clean and cold. Very fair pricing with no hidden charges.", rating: 5 },
    { name: "Ananya Rao", event: "Airport transfer", text: "Flight was delayed by 2 hours and the driver still waited with a name board. Smooth Innova ride to our lake-side hotel.", rating: 5 },
  ],

  faqs: [
    { q: "Can I book a single seat or a bus ticket?", a: "No — we're a charter service, not a ticketing operator. You book the entire vehicle for your group, so the route, timing and stops are completely yours." },
    { q: "Are all vehicles air-conditioned?", a: "Yes. Every coach, mini coach, Urbania and taxi in our fleet is fully air-conditioned, and the AC runs for the whole trip — including hill sections." },
    { q: "What is included in a booking?", a: "Every booking includes the vehicle, fuel, a trained uniformed driver and full-time AC. Tolls, parking and state-entry permits for outstation trips are explained clearly before you confirm — no surprises on the day." },
    { q: "Do you decorate buses for weddings?", a: "Absolutely. Fresh marigold & rose decoration for baraat coaches, plus ribbons and welcome name boards for guest shuttles — just pick the add-on while booking." },
    { q: "How early should I book?", a: "For the wedding season (November–February) and long weekends, we recommend 4–6 weeks in advance. For taxis and small vans, 24 hours is usually enough." },
    { q: "How do I confirm my booking?", a: "Fill in the booking form and send it on WhatsApp or by email — both reach our trip desk instantly. We share a written quote within 30 minutes, and a 25% advance confirms the vehicle. The balance is paid on the day of travel." },
    { q: "Do you travel outside Udaipur?", a: "Yes — anywhere in Rajasthan, Gujarat and Madhya Pradesh: Mount Abu, Jodhpur, Jaipur, Ahmedabad, Chittorgarh, Kumbhalgarh, Ranakpur and more." },
    { q: "What is your cancellation policy?", a: "Free cancellation up to 7 days before the trip. Within 7 days, 50% of the advance is retained; within 24 hours, the advance is non-refundable." },
  ],
};
