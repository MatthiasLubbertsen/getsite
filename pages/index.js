import { useState } from 'react';
import Head from 'next/head';
import styles from '../styles/Home.module.css';

export default function Home() {
  const [formData, setFormData] = useState({
    pageName: '',
    title: '',
    description: '',
    content: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [message, setMessage] = useState('');
  const [messageType, setMessageType] = useState(''); // 'success' or 'error'

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    const { pageName, title, content } = formData;
    
    if (!pageName.trim() || !title.trim() || !content.trim()) {
      setMessage('Vul alle verplichte velden in');
      setMessageType('error');
      return;
    }

    // Valideer pagina naam (alleen letters, cijfers, streepjes)
    if (!/^[a-zA-Z0-9-]+$/.test(pageName)) {
      setMessage('Pagina naam mag alleen letters, cijfers en streepjes bevatten');
      setMessageType('error');
      return;
    }

    setIsSubmitting(true);
    setMessage('');

    try {
      const response = await fetch('/api/create-page', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      const result = await response.json();

      if (response.ok) {
        setMessage(`Succes! Je pagina wordt aangemaakt. Na de volgende deploy is deze beschikbaar op: ${window.location.origin}/${pageName}`);
        setMessageType('success');
        setFormData({
          pageName: '',
          title: '',
          description: '',
          content: ''
        });
      } else {
        setMessage(`Fout: ${result.error}`);
        setMessageType('error');
      }
    } catch (error) {
      setMessage('Er ging iets mis. Probeer het opnieuw.');
      setMessageType('error');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <>
      <Head>
        <title>Eigen Pagina Service</title>
        <meta name="description" content="Maak je eigen pagina aan" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <div className={styles.container}>
        <header className={styles.header}>
          <h1>🚀 Eigen Pagina Service</h1>
          <p>Vraag je eigen pagina aan op dit domein</p>
        </header>

        <main className={styles.main}>
          <form onSubmit={handleSubmit} className={styles.form}>
            <div className={styles.formGroup}>
              <label htmlFor="pageName">
                Pagina naam * <span className={styles.hint}>(wordt de URL)</span>
              </label>
              <input
                type="text"
                id="pageName"
                name="pageName"
                value={formData.pageName}
                onChange={handleInputChange}
                placeholder="mijn-geweldige-pagina"
                className={styles.input}
                disabled={isSubmitting}
              />
              <small>Preview URL: {window.location?.origin || 'https://jouw-site.vercel.app'}/{formData.pageName || 'pagina-naam'}</small>
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="title">Pagina titel *</label>
              <input
                type="text"
                id="title"
                name="title"
                value={formData.title}
                onChange={handleInputChange}
                placeholder="Mijn Geweldige Pagina"
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="description">Beschrijving (optioneel)</label>
              <input
                type="text"
                id="description"
                name="description"
                value={formData.description}
                onChange={handleInputChange}
                placeholder="Een korte beschrijving van je pagina"
                className={styles.input}
                disabled={isSubmitting}
              />
            </div>

            <div className={styles.formGroup}>
              <label htmlFor="content">HTML Inhoud *</label>
              <textarea
                id="content"
                name="content"
                value={formData.content}
                onChange={handleInputChange}
                placeholder="<h1>Welkom op mijn pagina!</h1>
<p>Dit is mijn eigen pagina met <strong>custom</strong> inhoud.</p>
<img src='https://via.placeholder.com/400x200' alt='Placeholder' />
<p>Je kunt hier HTML gebruiken!</p>"
                rows={10}
                className={styles.textarea}
                disabled={isSubmitting}
              />
            </div>

            <button 
              type="submit" 
              className={styles.submitButton}
              disabled={isSubmitting}
            >
              {isSubmitting ? 'Bezig met aanmaken...' : 'Pagina Aanmaken'}
            </button>
          </form>

          {message && (
            <div className={`${styles.message} ${styles[messageType]}`}>
              {message}
            </div>
          )}
        </main>

        <footer className={styles.footer}>
          <p>Na het aanmaken wordt je pagina toegevoegd aan de repository en beschikbaar na de volgende deploy.</p>
        </footer>
      </div>
    </>
  );
}