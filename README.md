# Mumal Tour & Travels — Website

Charter website for AC coaches, mini coaches, Urbania vans and taxis in Udaipur.
It's a plain HTML/CSS/JS site plus one small serverless function (`api/send-booking.js`) that emails bookings. Every front-end library is bundled locally in `assets/vendor`.

## Run it

```bash
cd mumal-tours-travels
npm install
npm run dev
```

Then open http://localhost:5173. `npm run dev` serves the site **and** the booking email function. Plain `python3 -m http.server` shows the site but cannot send email.

## Live site (Vercel)

**https://mumal-tours-travels.vercel.app** (Vercel project `mumal-tours-travels` in *mohitsoni777's projects*)

After you change anything, publish the update from this folder:

```bash
npx vercel@latest deploy --prod
```

`.vercelignore` keeps `_source-png/` (the 18 MB original images) out of the upload. The `.vercel/` folder links this folder to the Vercel project. Keep it, but don't share it. To use your own domain, go to Vercel → Project → Settings → Domains.

## Before going live: replace these

Everything below lives in **`assets/js/data.js`**:

| What | Where |
|---|---|
| Phone, WhatsApp number, email, address | `config` (already set to +91 79762 79155 / paramveersingh2822@gmail.com) |
| Headline numbers (vehicles, travellers, weddings) | `stats` |
| Customer reviews (currently **sample text**) | `reviews` |
| Cancellation / advance policy | `faqs` |

Also:
- **Photos:** the images in `assets/img` are AI-generated. Replace them with real photos of your own fleet (keep the same filenames). The original PNGs are in `_source-png/`.
- **Social links:** the Instagram, Facebook and YouTube links in `index.html` point to `#`.

## How booking works

There's no seat ticketing; customers charter the whole vehicle. They fill in the 4-step form (Vehicle → Trip → Contact → Review), then pick how to send it:

- **Send on WhatsApp:** opens WhatsApp to **+91 79762 79155** with the complete enquiry already typed (reference number, vehicle, dates, pickup, guests and contact details). The customer just taps Send.
- **Send by Email:** the enquiry is emailed **directly to paramveersingh2822@gmail.com** as a neat table, with no mail app needed. If the customer gave their email, Reply goes straight to them and they get an automatic confirmation.

Both options use the same reference number (e.g. `MTT-AS22I`), so a customer can send both and you'll know it's one booking. If email ever fails, the customer is offered WhatsApp, or their own mail app with everything pre-filled, so no enquiry is lost.

### Booking email setup (one time, free)

Emails are sent by the site's own function (`api/send-booking.js`) through a normal mailbox, so there's no paid service and no third party. You only need to give it a mailbox to send from.

**1. Create a Gmail App Password** (on the Gmail or Google Workspace account that should send the emails):
1. Turn on 2-Step Verification: https://myaccount.google.com/security
2. Open https://myaccount.google.com/apppasswords, name it `Mumal website`, and click **Create**.
3. Copy the 16-character password it shows.

**2. Add it to Vercel.** Go to the [Vercel dashboard](https://vercel.com) → project **mumal-tours-travels** → **Settings → Environment Variables**, and add:

| Key | Value |
|---|---|
| `SMTP_USER` | the Gmail address from step 1 |
| `SMTP_PASS` | the 16-character App Password |
| `BOOKING_TO` | `paramveersingh2822@gmail.com` (optional; this is already the default) |

**3. Redeploy:** run `npx vercel@latest deploy --prod` (or click **Redeploy** in the dashboard).

**4. Check it:** open https://mumal-tours-travels.vercel.app/api/send-booking?verify=1. It should show `"smtp":"connected"`. That only tests the login and sends nothing.

What gets sent:
- **To the trip desk:** a branded email with every detail and one-tap **Call / WhatsApp / Reply** buttons. Hitting Reply answers the customer directly.
- **To the customer** (if they gave an email): an automatic "we've received your request" confirmation. Set `SEND_CUSTOMER_CONFIRMATION=0` to turn this off.

For local testing, copy `.env.example` to `.env`, fill in the same values, and run `npm run dev`. Gmail sends up to about 500 emails a day for free. If the mailbox isn't Gmail, also set `SMTP_HOST` and `SMTP_PORT` for your mail provider.

## Features

- Preloader, custom cursor, smooth scrolling (Lenis), scroll progress bar
- Hero with mouse-parallax floating cards, golden particles and a quick-quote bar
- **Interactive 3D showroom** (Three.js) with 3 procedurally modelled vehicles (Coach, Mini Coach, Urbania). Visitors can drag to rotate, switch vehicles (each one drives in), turn on night lights with headlight beams, and take a test drive. Feature cards on the model cycle through each vehicle's highlights.
- 3D-tilt fleet cards with a featured "Most booked" coach, filters and a details popup (gallery and specs)
- Pinned horizontal-scroll occasions section with image parallax
- Multi-layer parallax banner with a generated palace skyline
- Animated route map of Udaipur and its outstation routes
- Vehicle finder (recommends the right vehicle and how many for a group size), 3D rotating reviews carousel, FAQ accordion
- Responsive from phone to desktop, and respects "reduce motion" settings

## Files

```
index.html
api/send-booking.js       booking email function (Vercel serverless)
server.js                 local dev server: site + email function (npm run dev)
.env.example              email settings template
assets/css/style.css      design system and layout
assets/js/data.js         all editable content
assets/js/main.js         UI, animations, booking, vehicle finder, map
assets/js/showroom3d.js   3D showroom
assets/vendor/            GSAP, ScrollTrigger, Lenis, Three.js
assets/img/               optimised WebP images
```
