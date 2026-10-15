# Dreamy Needle by Shruti — Atelier Web Application

Bespoke, handcrafted embroidery atelier website featuring interactive customization, dynamic review showcase, continuous animated scroll stitch, and instant zero-flicker client-side routing.

---

## ✨ Features

- **Instant Zero-Flicker Navigation**: Fluid client-side tab switching across all 5 studio views (`Home`, `Creations & Gallery`, `Custom Ordering`, `About Studio`, `Contact & FAQ`) while preserving clean, bookmarkable URLs and smooth active indicator animations.
- **Handcrafted Running Stitch Engine**: Responsive SVG-based continuous cotton embroidery seam with real needle translation and tilt along the left border as the user scrolls.
- **Dynamic Review Storage**: Client review submission modal with interactive star rating selection, saving to `reviews.json` on local/server environments and falling back gracefully to `localStorage`.
- **Artisanal Custom Dropdowns**: Luxury boutique select menu replacement eliminating default OS dropdowns.
- **Fast WhatsApp Order Builder**: Interactive garment & motif builder compiling pre-formatted WhatsApp commission messages.
- **Mobile-First Responsive Layout**: Drawer navigation with backdrop blur, touch-friendly tap targets, and 0 horizontal scroll overflow on all viewports.
- **SEO & Social Share Ready**: Complete Open Graph and Twitter card meta tags for rich previews on WhatsApp, iMessage, and social media.

---

## 📁 Project Structure

```text
dreamy-needle/
├── api/
│   └── reviews.js          # Zero-dependency Vercel Serverless Function for /api/reviews
├── assets/
│   └── img/                # High-resolution embroidery lookbook & logo assets
├── index.html              # Studio Home View
├── creations.html          # 11 Styles Catalog & Gallery Lookbook
├── custom-order.html       # Ordering Guide & Interactive WhatsApp Message Builder
├── about.html              # Atelier Story & Hand vs Machine Embroidery Philosophy
├── contact.html            # Contact Cards & Accessible FAQ Accordions
├── styles.css              # Artisanal styling, stitch animations & boutique UI
├── script.js               # Shared SPA router, stitch engine & review handlers
├── reviews.json            # Folder directory persistent review storage
├── vercel.json             # Vercel deployment config (clean URLs, caching, API rewrites)
├── package.json            # Node.js project manifest & scripts
├── server.js               # Lightweight Node.js local development server
└── .gitignore              # Ignores .vercel, node_modules, and test files
```

---

## 🚀 Quick Start (Local Development)

```bash
npm start
# Server runs at http://localhost:8000
```

---

## 🌐 Deploy to Vercel

### Option 1: Git Integration (Recommended)
1. Push your repository to GitHub, GitLab, or Bitbucket.
2. Go to [vercel.com/new](https://vercel.com/new) and import the repository.
3. Deploy with default settings.

### Option 2: Vercel CLI
```bash
npx vercel
```

---

---

## 💬 Studio Reviews Management (Pure File-Based, No Database Needed)

Reviews are stored directly in `reviews.json` and served automatically by the Vercel serverless API.

### How to Manage Reviews

You can manage all reviews directly from your terminal using `manage-reviews.js`:

```bash
# 1. View all reviews
node manage-reviews.js list

# 2. Add an authentic client review
node manage-reviews.js add "Client Name" "City" "Item Embroidered" 5 "Review text..."

# 3. Delete a review by ID
node manage-reviews.js delete <review_id>

# 4. Clear all reviews
node manage-reviews.js clear
```

### Publishing Updates to Your Live Website

Whenever you add, edit, or delete reviews:
```bash
git commit -am "Update studio reviews"
git push origin main
```
Vercel automatically redeploys within seconds, and all visitors globally will immediately see the updated reviews.

