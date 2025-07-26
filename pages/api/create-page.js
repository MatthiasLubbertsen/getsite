import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { pageName, title, description, content } = req.body;

  // Validatie
  if (!pageName || !title || !content) {
    return res.status(400).json({ error: 'Pagina naam, titel en inhoud zijn verplicht' });
  }

  if (!/^[a-zA-Z0-9-]+$/.test(pageName)) {
    return res.status(400).json({ error: 'Pagina naam mag alleen letters, cijfers en streepjes bevatten' });
  }

  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_PAGES_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    // Check of de pagina al bestaat
    try {
      await octokit.rest.repos.getContent({
        owner,
        repo,
        path: `${pageName}/metadata.json`,
        ref: branch,
      });
      
      return res.status(409).json({ error: 'Deze pagina naam bestaat al' });
    } catch (error) {
      // Pagina bestaat niet, dat is goed
      if (error.status !== 404) {
        throw error;
      }
    }

    // Maak metadata.json
    const metadata = {
      title: title,
      description: description || '',
      createdAt: new Date().toISOString(),
      pageName: pageName,
    };

    // Maak HTML template
    const htmlContent = `<!DOCTYPE html>
<html lang="nl">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    ${description ? `<meta name="description" content="${description}">` : ''}
    <style>
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', 'Roboto', sans-serif;
            line-height: 1.6;
            max-width: 800px;
            margin: 0 auto;
            padding: 20px;
            color: #333;
        }
        img {
            max-width: 100%;
            height: auto;
        }
        a {
            color: #0066cc;
        }
        .back-link {
            margin-top: 40px;
            padding-top: 20px;
            border-top: 1px solid #eee;
        }
    </style>
</head>
<body>
    ${content}
    
    <div class="back-link">
        <a href="/">← Terug naar home</a>
    </div>
</body>
</html>`;

    // Upload beide bestanden naar GitHub
    const promises = [
      // Upload metadata.json
      octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `${pageName}/metadata.json`,
        message: `Add metadata for page: ${pageName}`,
        content: Buffer.from(JSON.stringify(metadata, null, 2)).toString('base64'),
        branch,
      }),
      // Upload code.html
      octokit.rest.repos.createOrUpdateFileContents({
        owner,
        repo,
        path: `${pageName}/code.html`,
        message: `Add HTML content for page: ${pageName}`,
        content: Buffer.from(htmlContent).toString('base64'),
        branch,
      }),
    ];

    await Promise.all(promises);

    // Trigger een Vercel deployment (optioneel)
    if (process.env.VERCEL_DEPLOY_HOOK) {
      try {
        await fetch(process.env.VERCEL_DEPLOY_HOOK, { method: 'POST' });
      } catch (error) {
        console.error('Failed to trigger deploy:', error);
        // Niet kritiek, dus we gaan door
      }
    }

    res.status(200).json({ 
      success: true, 
      message: 'Pagina succesvol aangemaakt',
      pageName,
      url: `/${pageName}`
    });

  } catch (error) {
    console.error('Error creating page:', error);
    
    if (error.status === 401) {
      return res.status(500).json({ error: 'GitHub authenticatie mislukt' });
    }
    
    if (error.status === 404) {
      return res.status(500).json({ error: 'Repository niet gevonden' });
    }

    res.status(500).json({ 
      error: 'Er ging iets mis bij het aanmaken van de pagina',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}