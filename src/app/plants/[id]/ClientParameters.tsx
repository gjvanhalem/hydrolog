'use client';

import dynamic from 'next/dynamic';

// Dynamically import the parameters component with ssr disabled
const PlantParameters = dynamic(() => import('./PlantParameters'), { ssr: false });

interface ClientParametersProps {
  plantId: number;
  externalId?: number | null;
  ph_min?: number | null;
  ph_max?: number | null;
  ec_min?: number | null;
  ec_max?: number | null;
  ppm_min?: number | null;
  ppm_max?: number | null;
}

export default function ClientParameters({ 
  plantId, 
  externalId, 
  ph_min, 
  ph_max, 
  ec_min, 
  ec_max, 
  ppm_min, 
  ppm_max 
}: ClientParametersProps) {
  return (
    <PlantParameters 
      plantId={plantId} 
      externalId={externalId}
      ph_min={ph_min}
      ph_max={ph_max}
      ec_min={ec_min}
      ec_max={ec_max}
      ppm_min={ppm_min}
      ppm_max={ppm_max}
    />
  );
}
