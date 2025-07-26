// Script om de pages repository te initialiseren met een README
// Run dit script eenmalig na het aanmaken van je private repository

const { Octokit } = require('@octokit/rest');

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

async function initializeRepo() {
  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_PAGES_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    console.log(`Initializing repository: ${owner}/${repo}`);

    // Check of repository bestaat en leeg is
    try {
      await octokit.rest.repos.getContent({
        owner,
        repo,
        path: '',
        ref: branch,
      });
      
      console.log('Repository already has content, skipping initialization');
      return;
    } catch (error) {
      if (error.status !== 404) {
        throw error;
      }
      // Repository is leeg, dat is wat we willen
      console.log('Repository is empty, proceeding with initialization');
    }

    // Maak een README.md bestand aan om de repository te initialiseren
    const readmeContent = `# Pages Storage Repository

Dit is een private repository voor het opslaan van gebruiker-aangemaakte pagina's.

## Structuur

Elke pagina heeft zijn eigen directory met twee bestanden:
- \`metadata.json\` - bevat pagina metadata (titel, beschrijving, datum)
- \`code.html\` - bevat de HTML inhoud van de pagina

## Automatisch beheerd

Deze repository wordt automatisch beheerd door de Vercel app.
Bestanden worden toegevoegd/verwijderd via de API.

**Wijzig bestanden niet handmatig tenzij je weet wat je doet!**

---

Aangemaakt op: ${new Date().toISOString()}
`;

    await octokit.rest.repos.createOrUpdateFileContents({
      owner,
      repo,
      path: 'README.md',
      message: 'Initialize pages repository',
      content: Buffer.from(readmeContent).toString('base64'),
      branch,
    });

    console.log('✅ Repository successfully initialized with README.md');
    console.log(`Repository URL: https://github.com/${owner}/${repo}`);

  } catch (error) {
    console.error('❌ Error initializing repository:', error.message);
    
    if (error.status === 401) {
      console.error('   -> Check if your GITHUB_TOKEN is valid and has repo permissions');
    }
    
    if (error.status === 404) {
      console.error('   -> Check if the repository exists and the name is correct');
      console.error(`   -> Expected repository: ${process.env.GITHUB_OWNER}/${process.env.GITHUB_PAGES_REPO}`);
    }
    
    process.exit(1);
  }
}

// Run het script als het direct wordt uitgevoerd
if (require.main === module) {
  // Check required environment variables
  const requiredEnvVars = ['GITHUB_TOKEN', 'GITHUB_OWNER', 'GITHUB_PAGES_REPO'];
  const missingVars = requiredEnvVars.filter(varName => !process.env[varName]);
  
  if (missingVars.length > 0) {
    console.error('❌ Missing required environment variables:');
    missingVars.forEach(varName => {
      console.error(`   - ${varName}`);
    });
    console.error('\nMake sure to set these in your .env.local file or environment');
    process.exit(1);
  }

  initializeRepo();
}

module.exports = { initializeRepo };