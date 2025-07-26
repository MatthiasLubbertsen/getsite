import { Octokit } from '@octokit/rest';
import Head from 'next/head';

const octokit = new Octokit({
  auth: process.env.GITHUB_TOKEN,
});

export default function DynamicPage({ pageData, error }) {
  if (error) {
    return (
      <>
        <Head>
          <title>Pagina niet gevonden</title>
        </Head>
        <div style={{ 
          maxWidth: '600px', 
          margin: '100px auto', 
          padding: '20px', 
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
        }}>
          <h1>404 - Pagina niet gevonden</h1>
          <p>De pagina die je zoekt bestaat niet of is nog niet gepubliceerd.</p>
          <a href="/" style={{ color: '#0066cc', textDecoration: 'none' }}>
            ← Terug naar home
          </a>
        </div>
      </>
    );
  }

  if (!pageData) {
    return (
      <>
        <Head>
          <title>Laden...</title>
        </Head>
        <div style={{ 
          maxWidth: '600px', 
          margin: '100px auto', 
          padding: '20px', 
          textAlign: 'center',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
        }}>
          <p>Pagina wordt geladen...</p>
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>{pageData.metadata.title}</title>
        {pageData.metadata.description && (
          <meta name="description" content={pageData.metadata.description} />
        )}
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>
      
      <div dangerouslySetInnerHTML={{ __html: pageData.html }} />
    </>
  );
}

export async function getStaticPaths() {
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

    const paths = contents
      .filter(item => item.type === 'dir')
      .map(item => ({
        params: { slug: item.name }
      }));

    return {
      paths,
      fallback: 'blocking' // Nieuwe pagina's kunnen worden toegevoegd na build
    };
  } catch (error) {
    console.error('Error getting static paths:', error);
    return {
      paths: [],
      fallback: 'blocking'
    };
  }
}

export async function getStaticProps({ params }) {
  const { slug } = params;

  try {
    const owner = process.env.GITHUB_OWNER;
    const repo = process.env.GITHUB_PAGES_REPO;
    const branch = process.env.GITHUB_BRANCH || 'main';

    // Haal metadata en HTML op
    const [metadataResponse, htmlResponse] = await Promise.all([
      octokit.rest.repos.getContent({
        owner,
        repo,
        path: `${slug}/metadata.json`,
        ref: branch,
      }),
      octokit.rest.repos.getContent({
        owner,
        repo,
        path: `${slug}/code.html`,
        ref: branch,
      }),
    ]);

    // Decodeer de base64 content
    const metadata = JSON.parse(
      Buffer.from(metadataResponse.data.content, 'base64').toString('utf-8')
    );
    
    const html = Buffer.from(htmlResponse.data.content, 'base64').toString('utf-8');

    return {
      props: {
        pageData: {
          metadata,
          html,
        },
      },
      // Revalidate elke 60 seconden voor nieuwe updates
      revalidate: 60,
    };
  } catch (error) {
    console.error(`Error loading page ${slug}:`, error);
    
    // Als de pagina niet bestaat (404), return een error prop
    if (error.status === 404) {
      return {
        props: {
          error: 'Page not found',
        },
        // Korte revalidate voor het geval de pagina binnenkort wordt toegevoegd
        revalidate: 30,
      };
    }

    // Voor andere errors, throw zodat Next.js een 500 page toont
    throw error;
  }
}