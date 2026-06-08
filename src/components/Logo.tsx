/**
 * Componente Logo
 * Muestra el logo del Hotel Vista al Mar junto al nombre.
 * Usa la imagen pública logo_del_hotel.jpeg
 */
import { publicUrl } from '../lib/assets';

interface LogoProps {
  /** Variante para contextos claros u oscuros */
  variant?: 'default' | 'white';
  /** Tamaño del logo en píxeles */
  size?: number;
}

export function Logo({ size = 40 }: LogoProps) {
  return (
    <div className="flex items-center gap-3">
      <img
        src={publicUrl('logo_del_hotel.jpeg')}
        alt="Hotel Vista al Mar"
        style={{ width: size, height: size }}
        className="object-contain rounded"
      />
      <div className="flex flex-col">
        <span className="font-bold text-sky-700 leading-tight tracking-wide text-sm uppercase">
          Visita al Mar
        </span>
        <span className="text-xs text-sky-500 leading-tight">Hotel &amp; Boutique</span>
      </div>
    </div>
  );
}
