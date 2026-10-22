# ShikshaShare — Community Engagement Platform

> **"Connecting Students, Resources & Community"**  
> *Find what you need. Share what you have. Support someone in your community.*

---

## 🌟 Overview

**ShikshaShare** is a production-quality, community-based educational platform created for a college **Community Engagement Project (CEP)**. Designed to bridge the educational resource gap, ShikshaShare connects students, resource providers, community organizations (NGOs, NSS units, schools, orphanages, and educational foundations), and academic administrators.

Rather than an e-commerce marketplace or SaaS product, ShikshaShare centers on **educational access, circular reuse, free donations, and mutual community support**.

---

## 🧭 Core UX Principle: User Intent Driven

The application is structured directly around real human intent:

1. **“I Need a Resource”** — Find textbooks, scientific calculators, drafting instruments, and study materials matching specific curricula.
2. **“I Have a Resource”** — Sell or provide educational materials to fellow students at modest, non-exploitative prices or free.
3. **“I Want to Donate”** — Give usable textbooks, calculators, geometry sets, and backpacks directly to students or partner drives for 100% free.
4. **“My Community Needs Resources”** — View and support grassroot requirements posted by NSS units, registered NGOs, and schools.

---

## 👥 Supported Roles & Workflows

### 1. 🎓 Student
- **Progressive Curriculum Selection**: School (5th–10th), HSC (11th–12th streams), College/Undergraduate (B.Tech, B.Sc, branch & semester), Master's, and Competitive Exams (JEE, NEET, GATE, UPSC, CAT).
- **Personalized Discovery**: Prioritizes resources relevant to the student's exact branch and semester.
- **Actions**: Request Free Donations, Request to Buy affordable resources, Save to Wishlist, View Handover Locations.

### 2. 🏷️ Resource Provider
- Lists educational equipment or textbooks with an explicit per-item choice:
  1. **Sell** — enter the asking price.
  2. **Donate for free** — set price to ₹0 and mark as a free donation.
- Combined donor functionality: donate surplus materials, pledge to community partner drives, and track impact.
- Tracks active listings, buyer requests, and completed handovers in a dedicated provider dashboard.

### 3. 🤝 Community Partner (NGOs, NSS College Units, Schools, Trusts)
- Dedicated non-commercial dashboard tailored for community distribution.
- **Workflow**: `POST REQUIREMENT` &rarr; `RECEIVE COMMUNITY PLEDGES` &rarr; `VERIFY` &rarr; `DISTRIBUTE TO BENEFICIARIES` &rarr; `MARK FULFILLED`.
- Live visual progress meter on community drives (e.g., *"14 of 25 School Bags Received"*).

### 4. ⚙️ System Administrator
- Discrete administrative portal accessible for CEP faculty and coordinators.
- Resource moderation queue, verified partner approvals, user role management, and community impact reports.

---

## 🚀 Running Locally

ShikshaShare is built with standard HTML5, CSS3, Vanilla JavaScript, and Node.js Express backend.

Start a local server with Node.js & Express:

```bash
# 1. Install dependencies
npm install

# 2. Run the server (serves frontend and exposes /api endpoints)
npm start
```

Open your browser and navigate to:
```
http://localhost:3000
```

Backend API endpoints are exposed under `/api` (e.g. `http://localhost:3000/api`).

---

## 🔐 Authentication & Roles

Users register and authenticate with their individual credentials through the standard authentication flow. The four supported roles across the system are:
- **Student**
- **Resource Provider**
- **Community Partner**
- **System Administrator**
