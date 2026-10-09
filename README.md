# ShikshaShare — Community Engagement Platform

> **"Connecting Students, Resources & Community"**  
> *Find what you need. Share what you have. Support someone in your community.*

---

## 🌟 Overview

**ShikshaShare** is a production-quality, community-based educational platform created for a college **Community Engagement Project (CEP)**. Designed to bridge the educational resource gap, ShikshaShare connects students, resource providers, donors, and community organizations (NGOs, NSS units, schools, orphanages, and educational foundations).

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
- Lists educational equipment or textbooks for fellow students.
- Easily toggles between **For Sale (Affordable Student Price)** and **100% Free / Donation**.
- Tracks active listings, buyer requests, and completed handovers in a dedicated provider dashboard.

### 3. 🎁 Resource Donor
- Streamlined 4-step donation flow with zero friction.
- Donates surplus materials generally to students or links donations directly to active **Community Partner Drives**.
- Tracks total donations, community impact score, and pledge handover status.

### 4. 🤝 Community Partner (NGOs, NSS College Units, Schools, Trusts)
- Dedicated non-commercial dashboard tailored for community distribution.
- **Workflow**: `POST REQUIREMENT` &rarr; `RECEIVE COMMUNITY PLEDGES` &rarr; `VERIFY` &rarr; `DISTRIBUTE TO BENEFICIARIES` &rarr; `MARK FULFILLED`.
- Live visual progress meter on community drives (e.g., *"14 of 25 School Bags Received"*).

### 5. ⚙️ System Administrator
- Discrete administrative portal accessible for CEP faculty and coordinators.
- Resource moderation queue, verified partner approvals, and community impact reports.

---

## 🚀 Running Locally

ShikshaShare is built with standard, dependency-free HTML5, CSS3, and Vanilla JavaScript. It requires zero build tools, bundlers, or package managers.

Start a local server with Python:

```bash
python -m http.server 3000
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 🧪 Testing & Quick Demo Profiles

Click **Log In** in the top navigation to access 1-click demo profiles:
- **Student**: Swarup Patil (College, Computer Engg Sem 3, VJTI)
- **Community Partner**: Aditya Kale (NSS Unit - VJTI Youth Wing)
- **Donor**: Priya Iyer (Alumni Donor)
- **Resource Provider**: Aarav Sharma (Student Seller)
- **System Admin**: Prof. M. K. Deshmukh (CEP Faculty Lead)

All platform interactions (pledges, requests, listings, profile updates) persist in your browser's `localStorage`.
