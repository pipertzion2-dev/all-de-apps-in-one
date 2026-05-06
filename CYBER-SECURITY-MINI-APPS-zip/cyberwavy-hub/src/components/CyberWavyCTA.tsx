const PYRACRYPT_URL = "https://pyracrypt.replit.app";

type Props = {
  headline?: string;
};

export function CyberWavyCTA({ headline = "Want the full picture?" }: Props) {
  return (
    <div className="cta-block">
      <div className="cta-block-inner">
        <img src="/pyracrypt-logo.png" alt="Pyracrypt" className="cta-logo" />
        <p>
          <strong>{headline}</strong>
          <br />
          Pyracrypt runs advanced AI-powered security engines across your entire system in one unified scan.
        </p>
        <a className="btn-cta-large" href={PYRACRYPT_URL} target="_blank" rel="noreferrer">
          Try Pyracrypt Free →
        </a>
        <p className="muted cta-block-url">pyracrypt.replit.app</p>
      </div>
    </div>
  );
}
