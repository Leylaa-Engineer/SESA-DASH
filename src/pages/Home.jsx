import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Html5Qrcode } from 'html5-qrcode';
import { ArrowRight, Camera, Keyboard, QrCode, ScanLine, ShieldCheck } from 'lucide-react';

function extractMachineCode(rawText) {
  if (rawText.includes('/')) return rawText.split('/').filter(Boolean).at(-1);
  return rawText.trim();
}

export default function Home() {
  const navigate = useNavigate();
  const [code, setCode] = useState('');
  const [scannerActive, setScannerActive] = useState(false);

  useEffect(() => {
    let scanner;
    let navigating = false;
    if (!scannerActive) return undefined;
    scanner = new Html5Qrcode('qr-reader');
    scanner.start(
      { facingMode: 'environment' },
      { fps: 10, qrbox: { width: 230, height: 230 } },
      async (decodedText) => {
        if (navigating) return;
        navigating = true;
        try { await scanner.stop(); } catch { /* kamera akışı sayfa değişirken zaten kapanabilir */ }
        navigate(`/machine/${extractMachineCode(decodedText)}`);
      },
      () => {},
    ).catch(() => {
      alert('Kameraya erişilemedi. Lütfen kamera izni verin veya makine kodunu elle girin.');
      setScannerActive(false);
    });
    return () => { if (scanner?.isScanning) scanner.stop().catch(() => {}); };
  }, [scannerActive, navigate]);

  const handleManualSubmit = (event) => {
    event.preventDefault();
    if (code.trim()) navigate(`/machine/${code.trim().toUpperCase()}`);
  };

  return (
    <>
      <section className="field-hero">
        <span className="eyebrow"><ShieldCheck size={14} /> Saha operasyonları</span>
        <h1>Arızayı doğru makineye, doğru ekibe iletin.</h1>
        <p>Makine üzerindeki QR kodu okutun veya kodu elle girin. Bildirim ilgili bölüm sorumlularının takip akışına iletilir.</p>
        <div className="field-meta"><span><QrCode size={13} /> QR ile erişim</span><span><ScanLine size={13} /> Kayıt altına alınır</span></div>
      </section>
      <section className="home-grid" aria-label="Arıza bildirimi başlangıcı">
        <article className="card scanner-card">
          {!scannerActive ? (
            <div className="scanner-content">
              <div className="scanner-icon"><Camera size={31} /></div>
              <h2>Kamera ile tarayın</h2>
              <p>Makine etiketindeki QR kodu kameraya gösterin.</p>
              <button className="btn btn-primary" onClick={() => setScannerActive(true)}><QrCode size={18} />Kamerayı aç</button>
            </div>
          ) : (
            <div className="scanner-content" style={{ width: '100%', maxWidth: 360 }}>
              <div id="qr-reader" style={{ width: '100%' }} />
              <button className="scanner-cancel" onClick={() => setScannerActive(false)}>Taramayı kapat</button>
            </div>
          )}
        </article>
        <article className="card manual-card">
          <span className="eyebrow"><Keyboard size={14} /> Alternatif erişim</span>
          <h2>Makine kodunu girin</h2>
          <p>QR kod okunamıyorsa makine etiketinde yer alan kodu kullanın.</p>
          <form onSubmit={handleManualSubmit}>
            <label className="input-label" htmlFor="machine-code">Makine kodu</label>
            <div className="manual-input"><Keyboard size={19} color="var(--color-text-muted)" /><input id="machine-code" type="text" placeholder="Örn. MKN-1024" value={code} onChange={(event) => setCode(event.target.value)} autoCapitalize="characters" /></div>
            <button type="submit" className="btn btn-primary" style={{ width: '100%', marginTop: '1rem' }}><ArrowRight size={18} />Arıza bildirimine geç</button>
          </form>
        </article>
      </section>
    </>
  );
}
