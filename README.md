# 🏛️ MuseumPass — Bangalore Museum Ticket Booking Platform

A modern, AI-powered web application for browsing and booking tickets to museums across Bangalore. Features a multilingual chatbot assistant supporting 13 Indian languages.

## ✨ Features

### Visitor Features
- **🏛️ Multi-Museum Aggregator** — Browse 8 museums in Bangalore from a single platform
- **🤖 AI Chatbot** — Book tickets, get museum info, and FAQs through a conversational assistant
- **🌐 13 Indian Languages** — English, Hindi, Bengali, Tamil, Telugu, Marathi, Gujarati, Kannada, Malayalam, Punjabi, Odia, Assamese, and Urdu
- **🎫 Smart Booking** — Step-by-step ticket booking with date, time slot, and category selection
- **💳 QR Payments** — Secure cashless payment with QR code generation
- **📱 Responsive Design** — Optimized for desktop, tablet, and mobile devices

### Admin Features
- **📊 Dashboard** — Overview of bookings, revenue, and visitor analytics
- **📋 Booking Management** — View and manage all ticket bookings
- **💰 Payment Tracking** — Monitor payment transactions
- **📈 Analytics** — Data-driven insights with visual charts
- **✏️ Content Management** — Update museum information, galleries, and events
- **🤖 Chatbot Management** — Configure and monitor chatbot performance

## 🏛️ Museums Included

| Museum | Type | Highlights |
|---|---|---|
| 🔬 Visvesvaraya Industrial & Technological Museum | Science | Interactive exhibits, 3D shows, robotics workshops |
| 🏛️ Government Museum (Cubbon Park) | Heritage | Ancient coins, sculptures, Mysore paintings |
| ✈️ HAL Aerospace Museum | Aviation | Real aircraft, flight simulators, engine gallery |
| 🖼️ National Gallery of Modern Art | Art | Amrita Sher-Gil, Tagore, M.F. Husain works |
| 🏰 Bangalore Palace | Palace | Tudor-style architecture, royal chambers |
| 🐅 Tipu Sultan's Summer Palace | History | Teak wood palace, murals, artifacts |
| 🌌 Jawaharlal Nehru Planetarium | Space | Sky theatre, telescope nights, science park |
| 🎵 Indian Music Experience Museum | Music | Interactive instruments, folk & Bollywood music |

## 🛠️ Tech Stack

- **Frontend** — React 18 + Vite
- **Styling** — Tailwind CSS with custom design system
- **Routing** — React Router v6
- **Icons** — React Icons (FontAwesome, Heroicons)
- **Build Tool** — Vite

## 🚀 Getting Started

### Prerequisites
- Node.js (v18 or higher)
- npm

### Installation

```bash
# Clone the repository
git clone https://github.com/AnasShams/museum-project.git
cd museum-project

# Install dependencies
npm install

# Start development server
npm run dev
```

The app will be available at `http://localhost:5173`

### Build for Production

```bash
npm run build
```

## 📁 Project Structure

```
src/
├── components/
│   ├── chatbot/
│   │   └── ChatWidget.jsx          # Chatbot UI widget
│   └── common/
│       ├── Navbar.jsx               # Navigation bar
│       ├── Footer.jsx               # Footer
│       ├── AdminLayout.jsx          # Admin page layout
│       └── AdminSidebar.jsx         # Admin sidebar navigation
├── data/
│   ├── mockMuseumInfo.js            # Museum data (8 Bangalore museums)
│   ├── chatbotResponses.js          # Multilingual chatbot responses
│   ├── mockBookings.js              # Mock booking data
│   └── mockAnalytics.js             # Mock analytics data
├── pages/
│   ├── visitor/
│   │   ├── Home.jsx                 # Landing page
│   │   ├── Museums.jsx              # Museum listing with search
│   │   ├── MuseumInfo.jsx           # Museum detail page
│   │   ├── BookTickets.jsx          # Ticket booking flow
│   │   ├── Payment.jsx              # Payment page
│   │   └── Confirmation.jsx         # Booking confirmation
│   └── admin/
│       ├── AdminLogin.jsx           # Admin login
│       ├── Dashboard.jsx            # Admin dashboard
│       ├── Bookings.jsx             # Booking management
│       ├── Payments.jsx             # Payment tracking
│       ├── Analytics.jsx            # Analytics & reports
│       ├── ContentManagement.jsx    # Content editor
│       └── ChatbotManagement.jsx    # Chatbot settings
├── utils/
│   └── chatbotEngine.js            # Chatbot conversation engine
├── App.jsx                          # Root component with routing
├── main.jsx                         # Entry point
└── index.css                        # Global styles & design tokens
```

## 🌐 Supported Languages

| Language | Code | Script |
|---|---|---|
| English | en | Latin |
| हिंदी (Hindi) | hi | Devanagari |
| বাংলা (Bengali) | bn | Bengali |
| தமிழ் (Tamil) | ta | Tamil |
| తెలుగు (Telugu) | te | Telugu |
| मराठी (Marathi) | mr | Devanagari |
| ગુજરાતી (Gujarati) | gu | Gujarati |
| ಕನ್ನಡ (Kannada) | kn | Kannada |
| മലയാളം (Malayalam) | ml | Malayalam |
| ਪੰਜਾਬੀ (Punjabi) | pa | Gurmukhi |
| ଓଡ଼ିଆ (Odia) | or | Odia |
| অসমীয়া (Assamese) | as | Assamese |
| اردو (Urdu) | ur | Nastaliq |

## 📄 License

This project is for educational purposes.

---

Built with ❤️ for Bangalore's cultural heritage
