# Vercel Custom Page Service

Een service waarmee gebruikers hun eigen pagina's kunnen aanvragen op jouw domein. De service slaat pagina's op in een aparte private GitHub repository en haalt ze op via Next.js.

## 🚀 Setup

### 1. Repository Setup

Je hebt **2 repositories** nodig:

#### Repository 1: App Code (deze repo)
- Bevat alle Next.js applicatie code
- Kan public zijn
- Wordt gedeployed naar Vercel

#### Repository 2: Pages Storage (private repo)
- Private repository voor opslag van gebruikerspagina's
- Structuur:
```
my-pages-storage/
├── eigensite/
│   ├── code.html
│   └── metadata.json
├── eigensite2/
│   ├── code.html
│   └── metadata.json
└── ...
```

### 2. GitHub Token

1. Ga naar GitHub Settings → Developer settings → Personal access tokens
2. Maak een nieuwe token aan met deze permissies:
   - `repo` (volledige repository toegang)
   - `read:user`
3. Bewaar de token veilig

### 3. Vercel Setup

1. Connect deze repository aan Vercel
2. Voeg deze environment variables toe in Vercel:

```bash
GITHUB_TOKEN=ghp_jouwTokenHier
GITHUB_OWNER=jouwGitHubGebruikersnaam
GITHUB_PAGES_REPO=my-pages-storage
GITHUB_BRANCH=main
```

Optioneel:
```bash
VERCEL_DEPLOY_HOOK=https://api.vercel.com/v1/integrations/deploy/...
API_SECRET=jouwRandomeSecretKey
```

### 4. Local Development

1. Clone deze repository
2. Kopieer `.env.example` naar `.env.local`
3. Vul je environment variables in
4. Installeer dependencies:
```bash
npm install
```
5. Start development server:
```bash
npm run dev
```

## 📁 Project Structuur

```
vercel-page-service/
├── pages/
│   ├── index.js          # Home pagina met formulier
│   ├── [slug].js         # Dynamic routes voor user pages
│   └── api/
│       └── create-page.js # API endpoint voor pagina creatie
├── styles/
│   └── Home.module.css   # Styling
├── .env.example          # Environment variables template
├── next.config.js        # Next.js configuratie
└── package.json
```

## 🔧 Hoe het werkt

1. **Gebruiker vult formulier in** op de home pagina
2. **API endpoint** (`/api/create-page`) wordt aangeroepen
3. **GitHub API** wordt gebruikt om bestanden toe te voegen aan de private repo:
   - `{pageName}/metadata.json` - pagina metadata
   - `{pageName}/code.html` - HTML inhoud
4. **Next.js ISR** haalt de nieuwe pagina op bij de volgende request
5. **Dynamic route** (`[slug].js`) serveert de pagina op `/{pageName}`

## 🔒 Beveiliging

- Pages repository is **private**
- GitHub token heeft alleen toegang tot de pages repository
- Input validation op pagina namen
- HTML content wordt niet gesanitized (vertrouw je gebruikers)
- Optionele API secret voor extra beveiliging

## 📝 Features

- ✅ Realtime URL preview
- ✅ HTML content met volledige vrijheid
- ✅ Metadata voor SEO
- ✅ ISR voor snelle loading
- ✅ Mobile responsive
- ✅ Error handling
- ✅ Loading states
- ✅ 404 handling voor niet-bestaande pagina's

## 🚀 Deployment

1. Push code naar GitHub
2. Vercel deployt automatisch
3. Nieuwe pagina's zijn beschikbaar na de volgende deploy of na ISR revalidation

## 🛠️ Uitbreidingen

Mogelijke uitbreidingen:
- **Authenticatie** - alleen ingelogde gebruikers
- **Admin panel** - beheer van pagina's  
- **Analytics** - tracking van pagina views
- **Templates** - voorgedefinieerde pagina templates
- **Custom CSS** - gebruikers kunnen eigen styling toevoegen
- **Media upload** - afbeeldingen uploaden naar GitHub
- **Pagina bewerking** - edit functionaliteit
- **Rate limiting** - beperking van aantal pagina's per gebruiker

## 🔧 Troubleshooting

### Pagina wordt niet getoond
- Check of de GitHub repository bestaat en toegankelijk is
- Controleer environment variables in Vercel
- Wacht even voor ISR revalidation (max 60 seconden)

### GitHub API errors
- Controleer of de GitHub token nog geldig is
- Zorg dat de token de juiste permissies heeft (`repo`)
- Check of de repository naam correct is gespeld

### Build errors
- Zorg dat alle environment variables zijn ingesteld
- Check of Node.js versie compatibel is (aanbevolen: Node 18+)

## 📞 Support

Voor vragen of issues:
1. Check de environment variables
2. Controleer de Vercel deployment logs
3. Test lokaal met `npm run dev`
4. Check GitHub API rate limits

## 📜 License

MIT License - gebruik naar eigen goeddunken!