# AeroBio

A personal website with a Windows 7 Aero aesthetic.

![Preview](preview.png)

![Next.js](https://img.shields.io/badge/Next.js_15-000000?style=flat-square&logo=nextdotjs&logoColor=white)
![TypeScript](https://img.shields.io/badge/TypeScript-3178C6?style=flat-square&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React_19-61DAFB?style=flat-square&logo=react&logoColor=black)
![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-06B6D4?style=flat-square&logo=tailwindcss&logoColor=white)
![Framer Motion](https://img.shields.io/badge/Framer_Motion-0055FF?style=flat-square&logo=framer&logoColor=white)
![Prisma](https://img.shields.io/badge/Prisma-2D3748?style=flat-square&logo=prisma&logoColor=white)
![SQLite](https://img.shields.io/badge/SQLite-003B57?style=flat-square&logo=sqlite&logoColor=white)

---

## Features

| | |
|---|---|
| Profile card | Live Discord status via Lanyard |
| Music widget | Recently played tracks from Last.fm |
| Guestbook | Anonymous messages from visitors |
| About | A section about me |
| Visitor counter | Tracks unique visits |

## Setup

```bash
git clone https://github.com/Akryst/akryst.git
cd akryst
npm install
cp .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

## Environment Variables

```env
DATABASE_URL="file:./dev.db"
ADMIN_SECRET=your-secret-here
NEXT_PUBLIC_LASTFM_API_KEY=your-lastfm-api-key
NEXT_PUBLIC_LASTFM_USERNAME=your-lastfm-username
NEXT_PUBLIC_DISCORD_ID=your-discord-id
```

- **Last.fm API key** — [last.fm/api/account/create](https://www.last.fm/api/account/create)
- **Discord ID** — Developer mode > right-click profile > Copy ID
- **Admin secret** — Any random string, used to manage the guestbook

## Admin Mode

Append `?admin=YOUR_SECRET` to the URL to enable guestbook moderation.

## Deployment

```bash
npm run build
npm start
# or
pm2 start ecosystem.config.js
```

## Credits

- [7.css](https://github.com/nicepkg/7.css) — Windows 7 UI kit
- [Lanyard](https://github.com/Phineas/lanyard) — Discord rich presence API
- [Last.fm API](https://www.last.fm/api) — Music scrobbling data
- [schuh.wtf](https://schuh.wtf/) — Inspo for vibes and design

---

MIT License