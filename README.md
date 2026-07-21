# ⚡ Real-time Energy Trading Simulator

> Full-stack webová aplikace simulující obchodování na energetické burze v reálném čase pomocí **Node.js**, **Express** a **Socket.IO**.

![Node.js](https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=node.js&logoColor=white)
![Express.js](https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white)
![Socket.IO](https://img.shields.io/badge/Socket.IO-010101?style=for-the-badge&logo=socketdotio&logoColor=white)
![JavaScript](https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black)
![HTML5](https://img.shields.io/badge/HTML5-E34F26?style=for-the-badge&logo=html5&logoColor=white)
![CSS3](https://img.shields.io/badge/CSS3-1572B6?style=for-the-badge&logo=css3&logoColor=white)

---

## 📖 O projektu

Real-time Energy Trading Simulator je webová aplikace simulující obchodování na energetické burze.

Hráč v roli obchodníka nakupuje a prodává elektrickou energii (MWh), reaguje na průběžně se měnící nabídky trhu a snaží se udržet portfolio v rovnováze. Na konci každého obchodního dne se vyhodnocuje finanční bilance a případné penalizace za nerovnováhu mezi nákupem a prodejem.

Projekt demonstruje využití realtime komunikace pomocí WebSocketů, správu více uživatelských relací, práci se stavem aplikace a kompletní frontend vytvořený bez použití frameworků.

---

## ✨ Funkce

- Realtime obchodování pomocí Socket.IO
- Dynamické generování nabídek a poptávek
- Automatická expirace obchodních nabídek
- Samostatná relace pro každého uživatele
- Automatické ukládání rozehrané hry
- Vícedenní simulace obchodování
- Penalizace za nevyrovnané portfolio
- Frontend vytvořený pouze pomocí HTML, CSS a JavaScriptu

---

## 🏗️ Architektura

```text
Browser
    │
    │ Socket.IO
    ▼
Node.js + Express
    │
    ├── Trading Engine
    ├── Session Manager
    ├── Offer Generator
    ├── Game Logic
    └── Auto Save
            │
            ▼
      JSON Session Storage
```

---

## 🛠️ Použité technologie

### Backend

- Node.js
- Express.js
- Socket.IO
- UUID

### Frontend

- HTML5
- CSS3
- Vanilla JavaScript

### Ukládání dat

- JSON soubory

---

## 📂 Struktura projektu

```text
.
├── client/
│   └── index.html
│
├── server/
│   ├── app.js
│   ├── services/
│   ├── routes/
│   ├── utils/
│   └── sessions/
│
├── package.json
└── README.md
```

---

## 🚀 Instalace

Naklonování repozitáře

```bash
git clone https://github.com/jakub-fryc/Real-time-Energy-Trading-Simulator.git
```

Přechod do složky serveru

```bash
cd Real-time-Energy-Trading-Simulator/server
```

Instalace závislostí

```bash
npm install
```

Vytvoření složky pro ukládání relací

```bash
mkdir sessions
```

Spuštění aplikace

```bash
node app.js
```

Aplikace poběží na adrese:

```
http://localhost:8000
```

---

## 🎮 Herní pravidla

- Nakupuj a prodávej elektrickou energii (MWh).
- Udržuj portfolio v rovnováze.
- Pokryj provozní náklady.
- Vyhni se penalizacím za nerovnováhu.
- Pokud je finanční bilance na konci dne záporná, hra končí.

---

## 💡 Co projekt ukazuje

- Event-driven architekturu
- Realtime komunikaci pomocí WebSocketů
- Správu více nezávislých uživatelských relací
- Automatické ukládání a obnovení stavu aplikace
- Modulární backend oddělený od herní logiky
- Frontend bez použití frameworků

---

## 🔮 Možná rozšíření

- Redis pro správu relací
- Přihlášení uživatelů (JWT)
- PostgreSQL
- Docker Compose
- Jednotkové a integrační testy
- Grafy a statistiky obchodování

---

## 📄 Licence

Tento projekt je dostupný pod licencí **MIT**.
