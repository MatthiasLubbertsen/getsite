import { useState, useEffect } from 'react';
import Head from 'next/head';
import { useRouter } from 'next/router';

export default function AdminPanel() {
  const [password, setPassword] = useState('');
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [pages, setPages] = useState([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const router = useRouter();

  // Simple password check - in productie zou je een echte auth systeem gebruiken
  const handleLogin = async (e) => {
    e.preventDefault();
    
    if (password === 'admin123') { // Verander dit naar een veilig wachtwoord
      setIsAuthenticated(true);
      loadPages();
    } else {
      setMessage('Onjuist wachtwoord');
    }
  };

  const loadPages = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/list-pages');
      const data = await response.json();
      
      if (response.ok) {
        setPages(data.pages);
      } else {
        setMessage('Fout bij laden van pagina\'s');
      }
    } catch (error) {
      setMessage('Fout bij laden van pagina\'s');
    } finally {
      setLoading(false);
    }
  };

  const deletePage = async (pageName) => {
    if (!confirm(`Weet je zeker dat je "${pageName}" wilt verwijderen?`)) {
      return;
    }

    try {
      const response = await fetch('/api/admin/delete-page', {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ pageName }),
      });

      if (response.ok) {
        setMessage(`Pagina "${pageName}" verwijderd`);
        loadPages(); // Reload de lijst
      } else {
        const error = await response.json();
        setMessage(`Fout: ${error.error}`);
      }
    } catch (error) {
      setMessage('Fout bij verwijderen van pagina');
    }
  };

  if (!isAuthenticated) {
    return (
      <>
        <Head>
          <title>Admin Panel - Login</title>
        </Head>
        
        <div style={{ 
          maxWidth: '400px', 
          margin: '100px auto', 
          padding: '2rem',
          border: '1px solid #ddd',
          borderRadius: '8px',
          fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
        }}>
          <h1>Admin Panel</h1>
          <form onSubmit={handleLogin}>
            <div style={{ marginBottom: '1rem' }}>
              <label htmlFor="password">Wachtwoord:</label>
              <input
                type="password"
                id="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '8px',
                  marginTop: '4px',
                  border: '1px solid #ddd',
                  borderRadius: '4px'
                }}
                required
              />
            </div>
            <button 
              type="submit"
              style={{
                background: '#0070f3',
                color: 'white',
                border: 'none',
                padding: '10px 20px',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Inloggen
            </button>
          </form>
          
          {message && (
            <div style={{ 
              marginTop: '1rem', 
              color: 'red',
              fontSize: '0.9rem'
            }}>
              {message}
            </div>
          )}
        </div>
      </>
    );
  }

  return (
    <>
      <Head>
        <title>Admin Panel - Pagina Beheer</title>
      </Head>
      
      <div style={{ 
        maxWidth: '800px', 
        margin: '2rem auto', 
        padding: '2rem',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", "Roboto", sans-serif'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
          <h1>Admin Panel</h1>
          <div>
            <button 
              onClick={() => router.push('/')}
              style={{ 
                marginRight: '1rem',
                padding: '8px 16px',
                border: '1px solid #ddd',
                borderRadius: '4px',
                background: 'white',
                cursor: 'pointer'
              }}
            >
              Naar Home
            </button>
            <button 
              onClick={() => setIsAuthenticated(false)}
              style={{ 
                padding: '8px 16px',
                border: 'none',
                borderRadius: '4px',
                background: '#dc3545',
                color: 'white',
                cursor: 'pointer'
              }}
            >
              Uitloggen
            </button>
          </div>
        </div>

        {loading ? (
          <div>Laden...</div>
        ) : (
          <>
            <h2>Aangemaakte Pagina's ({pages.length})</h2>
            
            {pages.length === 0 ? (
              <p>Geen pagina's gevonden.</p>
            ) : (
              <div style={{ display: 'grid', gap: '1rem' }}>
                {pages.map((page) => (
                  <div 
                    key={page.name}
                    style={{
                      border: '1px solid #ddd',
                      borderRadius: '8px',
                      padding: '1rem',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center'
                    }}
                  >
                    <div>
                      <h3 style={{ margin: '0 0 0.5rem 0' }}>
                        <a 
                          href={`/${page.name}`}
                          target="_blank"
                          rel="noopener noreferrer"
                          style={{ color: '#0070f3', textDecoration: 'none' }}
                        >
                          {page.metadata?.title || page.name}
                        </a>
                      </h3>
                      <p style={{ margin: '0', color: '#666', fontSize: '0.9rem' }}>
                        /{page.name}
                      </p>
                      {page.metadata?.description && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.85rem' }}>
                          {page.metadata.description}
                        </p>
                      )}
                      {page.metadata?.createdAt && (
                        <p style={{ margin: '0.5rem 0 0 0', fontSize: '0.8rem', color: '#999' }}>
                          Aangemaakt: {new Date(page.metadata.createdAt).toLocaleLString('nl-NL')}
                        </p>
                      )}
                    </div>
                    
                    <button
                      onClick={() => deletePage(page.name)}
                      style={{
                        background: '#dc3545',
                        color: 'white',
                        border: 'none',
                        padding: '6px 12px',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.85rem'
                      }}
                    >
                      Verwijderen
                    </button>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {message && (
          <div style={{ 
            marginTop: '1rem',
            padding: '1rem',
            borderRadius: '4px',
            background: message.includes('Fout') ? '#f8d7da' : '#d4edda',
            color: message.includes('Fout') ? '#721c24' : '#155724',
            border: `1px solid ${message.includes('Fout') ? '#f5c6cb' : '#c3e6cb'}`
          }}>
            {message}
          </div>
        )}
      </div>
    </>
  );
}