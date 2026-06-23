import { ChevronLeft } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { labels } from '../../utils/labels.js';

// Tombol kembali untuk halaman sekunder (yang tidak ada di bottom nav).
// navigate(-1) kembali ke halaman asal; fallback ke /more bila tidak ada history.
export default function BackButton({ fallback = '/more' }) {
  const navigate = useNavigate();

  function handleBack() {
    if (window.history.length > 1) {
      navigate(-1);
    } else {
      navigate(fallback);
    }
  }

  return (
    <button
      type="button"
      aria-label={labels.back}
      onClick={handleBack}
      className="-ml-2 mr-1 grid h-11 w-11 shrink-0 place-items-center rounded-xl text-text-secondary"
    >
      <ChevronLeft size={24} />
    </button>
  );
}
