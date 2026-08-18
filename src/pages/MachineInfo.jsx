import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, ImagePlus, Info, Send, Trash2, Wrench } from 'lucide-react';
import { mysqlApi } from '../api/client';

export default function MachineInfo() {
  const { code } = useParams();
  const navigate = useNavigate();
  const [machine, setMachine] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [description, setDescription] = useState('');
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const fetchMachine = async () => {
      setLoading(true);
      try {
        const machines = await mysqlApi.machines(code);
        if (!machines.length) setError('Bu koda ait aktif makine bulunamadı. Etiketi kontrol edip tekrar deneyin.');
        else setMachine(machines[0]);
      } catch (err) {
        console.error('Makine getirilirken hata:', err);
        setError('Makine bilgileri alınırken bir bağlantı sorunu oluştu.');
      } finally { setLoading(false); }
    };
    fetchMachine();
  }, [code]);

  const handlePhotoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (readerEvent) => {
      const image = new Image();
      image.onload = () => {
        const maxSize = 800;
        const scale = Math.min(1, maxSize / Math.max(image.width, image.height));
        const canvas = document.createElement('canvas');
        canvas.width = Math.round(image.width * scale);
        canvas.height = Math.round(image.height * scale);
        canvas.getContext('2d').drawImage(image, 0, 0, canvas.width, canvas.height);
        const compressed = canvas.toDataURL('image/jpeg', 0.6);
        setPhoto(compressed);
        setPhotoPreview(compressed);
      };
      image.src = readerEvent.target.result;
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (!description.trim()) return;
    setSubmitting(true);
    const issueData = {
      makine_id: machine.id,
      aciklama: description.trim(),
      foto_url: photo,
    };
    try {
      await mysqlApi.createIssue(issueData);
      navigate('/success');
    } catch (err) {
      console.error('Arıza kaydedilirken hata:', err);
      alert('Arıza kaydedilemedi. Lütfen bağlantınızı kontrol edip tekrar deneyin.');
    } finally { setSubmitting(false); }
  };

  if (loading) return <div className="empty-state">Makine bilgileri doğrulanıyor…</div>;
  if (error) return <div><button className="back-button" onClick={() => navigate('/')}><ArrowLeft size={17} />Saha başlangıcına dön</button><section className="card text-center" style={{ maxWidth: 560, margin: '2rem auto' }}><Info size={34} color="var(--color-status-open)" style={{ marginBottom: 12 }} /><h1 className="page-title" style={{ fontSize: '1.4rem' }}>Makine doğrulanamadı</h1><p className="page-subtitle" style={{ margin: '0.65rem 0 1.25rem' }}>{error}</p><button className="btn btn-primary" onClick={() => navigate('/')}>Kodu yeniden gir</button></section></div>;

  return (
    <div>
      <button className="back-button" onClick={() => navigate('/')}><ArrowLeft size={17} />Saha başlangıcına dön</button>
      <header className="page-header"><div><span className="eyebrow"><Wrench size={14} /> Doğrulanmış makine</span><h1 className="page-title">Arıza bildirimi oluştur</h1><p className="page-subtitle">Bildirim, ilgili bölümün takip akışına açık kayıt olarak iletilecektir.</p></div></header>
      <section className="card machine-summary"><div className="machine-summary__icon"><Wrench size={22} /></div><div><span className="eyebrow">Makine bilgisi</span><h2>{machine.ad}</h2><div className="machine-summary__meta"><span>{machine.kod}</span><span>{machine.bolum_ad || 'Bölüm bilgisi yok'}</span></div></div></section>
      <section className="card" style={{ maxWidth: 820 }}><h2 style={{ fontSize: '1.15rem' }}>Arıza detayları</h2><p className="page-subtitle" style={{ marginBottom: '1.2rem' }}>Sorunu mümkün olduğunca kısa ve net açıklayın. Fotoğraf eklemek çözüm sürecini hızlandırabilir.</p><form onSubmit={handleSubmit}><div className="input-group"><label className="input-label" htmlFor="description">Arıza açıklaması <span style={{ color: 'var(--color-status-open)' }}>*</span></label><textarea id="description" className="input-field" rows="5" placeholder="Örn. Pres ünitesi başlatıldığında olağandışı ses geliyor ve işlem duruyor." value={description} onChange={(event) => setDescription(event.target.value)} required /></div><div className="input-group"><label className="input-label" htmlFor="photo-upload">Fotoğraf <span style={{ color: 'var(--color-text-muted)', fontWeight: 500 }}>(isteğe bağlı)</span></label>{!photoPreview ? <label className="photo-dropzone" htmlFor="photo-upload"><ImagePlus size={25} /><span><strong>Fotoğraf ekleyin</strong><small>Arızayı destekleyen bir görsel seçin veya kamerayı kullanın.</small></span><input id="photo-upload" type="file" accept="image/*" onChange={handlePhotoChange} /></label> : <div className="photo-preview"><img src={photoPreview} alt="Arıza fotoğrafı önizlemesi" /><button type="button" className="btn btn-secondary" onClick={() => { setPhoto(null); setPhotoPreview(null); }}><Trash2 size={16} />Kaldır</button></div>}</div><button type="submit" className="btn btn-primary" style={{ width: '100%' }} disabled={submitting}><Send size={18} />{submitting ? 'Bildirim kaydediliyor…' : 'Arıza bildirimini gönder'}</button></form></section>
    </div>
  );
}
