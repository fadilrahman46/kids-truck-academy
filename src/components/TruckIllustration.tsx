import { useState } from 'react';
import { VEHICLE_MAP, type VehicleId } from '../types/game';
import { VEHICLE_ILLUSTRATIONS } from '../assets/storybookArt';
import { VehicleStickerPictogram } from './Pictograms';

interface TruckIllustrationProps {
  vehicleId: VehicleId;
  className?: string;
  locked?: boolean;
}

/**
 * Resilient 2D realistic children's picture-book truck portrait with automatic
 * painted SVG fallback so no broken image frame can ever appear.
 */
export function TruckIllustration({
  vehicleId,
  className = 'h-16 w-16',
  locked = false,
}: TruckIllustrationProps) {
  const [failed, setFailed] = useState(false);
  const vehicle = VEHICLE_MAP[vehicleId];
  const src = VEHICLE_ILLUSTRATIONS[vehicleId];

  if (failed || !src) {
    return (
      <div
        className={`flex items-center justify-center overflow-hidden rounded-xl bg-[#FDF8EE] ${
          locked ? 'opacity-50 sepia grayscale-[0.45]' : ''
        } ${className}`}
      >
        <VehicleStickerPictogram vehicleId={vehicleId} className="h-[82%] w-[82%]" />
      </div>
    );
  }

  return (
    <div
      className={`relative overflow-hidden rounded-xl bg-[#FDF8EE] ${className}`}
    >
      <img
        src={src}
        alt={`Ilustrasi buku cerita ${vehicle.nameId} (${vehicle.nameEn})`}
        referrerPolicy="no-referrer"
        loading="eager"
        decoding="async"
        onError={() => setFailed(true)}
        className={`h-full w-full object-contain transition-transform duration-200 ${
          locked ? 'opacity-45 sepia-[0.75] contrast-90 grayscale-[0.4]' : 'scale-[1.06]'
        }`}
      />
    </div>
  );
}
