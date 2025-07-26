import { Octokit } from '@octokit/rest';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export default async function handler(req, res) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_PAGES_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    // Haal alle directories op uit de pages repo
    const { data: contents } = await octokit.rest.repos.getContent({
      owner,
      repo,
      path: '',
      ref: branch,
    });

    const pageDirectories = contents.filter(item => item.type === 'dir');
    
    // Voor elke directory, haal de metadata op
    const pagesWithMetadata = await Promise.all(
      pageDirectories.map(async (dir) => {
        try {
          // Probeer metadata.json op te halen
          const { data: metadataFile } = await octokit.rest.repos.getContent({
            owner,
            repo,
            path: `${dir.name}/metadata.json`,
            ref: branch,
          });

          const metadata = JSON.parse(
            Buffer.from(metadataFile.content, 'base64').toString('utf-8')
          );

          return {
            name: dir.name,
            metadata,
            size: metadataFile.size,
            lastModified: metadataFile.last_modified,
          };
        } catch (error) {
          // Als metadata.json niet bestaat, return basis info
          return {
            name: dir.name,
            metadata: null,
            size: 0,
            lastModified: null,
          };
        }
      })
    );

    // Sorteer op datum (nieuwste eerst)
    pagesWithMetadata.sort((a, b) => {
      const dateA = a.metadata?.createdAt ? new Date(a.metadata.createdAt) : new Date(0);
      const dateB = b.metadata?.createdAt ? new Date(b.metadata.createdAt) : new Date(0);
      return dateB - dateA;
    });

    res.status(200).json({ 
      pages: pagesWithMetadata,
      total: pagesWithMetadata.length
    });

  } catch (error) {
    console.error('Error listing pages:', error);
    
    if (error.status === 401) {
      return res.status(500).json({ error: 'GitHub authenticatie mislukt' });
    }
    
    if (error.status === 404) {
      return res.status(500).json({ error: 'Repository niet gevonden' });
    }

    res.status(500).json({ 
      error: 'Er ging iets mis bij het ophalen van de pagina\'s',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}