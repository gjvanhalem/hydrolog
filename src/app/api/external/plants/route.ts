import { NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { toNumber } from '@/lib/decimal-utils';

// Add revalidation time for caching
export const revalidate = 3600; // Cache for 1 hour

export interface ExternalPlant {
  id: number;
  name: string;
  ph_min: number;
  ph_max: number;
  ec_min: number;
  ec_max: number;
  ppm_min: number;
  ppm_max: number;
}

// Helper function to ensure all numeric values are JavaScript numbers, not Decimal objects
function convertPlantData(plant: any): ExternalPlant {
  return {
    id: Number(plant.id),
    name: plant.name,
    ph_min: toNumber(plant.ph_min) ?? 0,
    ph_max: toNumber(plant.ph_max) ?? 0,
    ec_min: toNumber(plant.ec_min) ?? 0,
    ec_max: toNumber(plant.ec_max) ?? 0,
    ppm_min: toNumber(plant.ppm_min) ?? 0,
    ppm_max: toNumber(plant.ppm_max) ?? 0
  };
}

export async function GET() {
  try {
    // Check if user is authenticated
    const userId = await getCurrentUserId();
    
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }
      logger.info('Fetching external plant data');
    
    // Fetch plant data from the external service
    const externalApiUrl = process.env.EXTERNAL_PLANTS_API_URL || 'http://localhost:4000/api/plants';
    const response = await fetch(externalApiUrl);
    
    if (!response.ok) {
      throw new Error(`External API error: ${response.statusText}`);
    }
    
    const rawPlants = await response.json();
    // Convert all plants to ensure they use JavaScript numbers
    const plants: ExternalPlant[] = Array.isArray(rawPlants) 
      ? rawPlants.map(convertPlantData)
      : [];
    
    logger.info('External plant data fetched successfully', { count: plants.length });
    
    return NextResponse.json(plants);
  } catch (error) {
    logger.error('Failed to fetch external plant data', { error });
    return NextResponse.json(
      { error: 'Failed to fetch plant data from external service' },
      { status: 500 }
    );
  }
}
