import { useState } from 'react';
import { useParams, Redirect } from 'wouter';
import ToolLandingPage from '../components/ToolLandingPage';
import { Layout } from '../components/Layout';
import { getToolBySlug } from '../data/tools';

export default function ToolPage() {
  const { slug } = useParams<{ slug: string }>();
  const [launched, setLaunched] = useState(false);
  const tool = getToolBySlug(slug || '');

  if (!tool) return <Redirect to="/" />;

  if (launched) {
    return (
      <Layout>
        <div className="tool-embed-wrapper">
          <div className="tool-embed-header">
            <span>{tool.name}</span>
            <button className="btn-back" onClick={() => setLaunched(false)}>
              ← Back to overview
            </button>
          </div>
          <iframe
            src={tool.iframeSrc || `/tools/${tool.slug}/index.html`}
            title={tool.name}
            className="tool-iframe"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups"
          />
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <ToolLandingPage tool={tool} onLaunch={() => setLaunched(true)} />
    </Layout>
  );
}
