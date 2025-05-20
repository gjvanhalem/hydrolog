import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PlantLogForm from './log-form';
import PlantPositionGrid from '@/app/components/PlantPositionGrid';
import PlantHeader from './PlantHeader';
import ClientParameters from './ClientParameters';
import { toNumber } from '@/lib/decimal-utils';

// Helper function to safely get positions per row
function getPositionsPerRow(system: any): number[] {
  if (!system || !system.positionsPerRow) {
    return [4]; // Default fallback
  }
  
  try {
    // If it's already an array, return it
    if (Array.isArray(system.positionsPerRow)) {
      return system.positionsPerRow;
    }
    
    // If it's a JSON string, try to parse it
    const parsed = JSON.parse(system.positionsPerRow.toString());
    return Array.isArray(parsed) ? parsed : [4];
  } catch (error) {
    console.error('Error parsing positionsPerRow:', error);
    return [4]; // Fallback to default on error
  }
}

// Helper function to safely convert all Decimal values to numbers in Prisma data
function convertDecimalFieldsToNumbers(obj: any): any {
  if (!obj || typeof obj !== 'object') return obj;
  
  const result = { ...obj };
  
  // List of fields that might contain Decimal values
  const decimalFields = [
    'ph_min', 'ph_max', 'ec_min', 'ec_max', 'ppm_min', 'ppm_max', 'external_id'
  ];
  
  for (const field of decimalFields) {
    if (field in result) {
      result[field] = toNumber(result[field]);
    }
  }
  
  return result;
}

interface PlantPageProps {
  params: Promise<{
    id: string;
  }>;
}

// Generate metadata for the plant page
export async function generateMetadata({ params }: PlantPageProps): Promise<Metadata> {
  const { id } = await params; // Await params before accessing its properties

  const plant = await prisma.plant.findUnique({
    where: { id: parseInt(id) },
    select: { name: true, type: true }
  });

  if (!plant) {
    return {
      title: 'Plant Not Found | HydroLog'
    };
  }

  return {
    title: `${plant.name} (${plant.type}) | HydroLog`,
    description: `View and manage growth logs for ${plant.name}, a ${plant.type} plant in your hydroponic system.`
  };
}

export default async function PlantPage({ params }: PlantPageProps) {
  const { id } = await params; // Await params before accessing its properties
  const plantId = parseInt(id);  
  if (isNaN(plantId)) {
    notFound();
  }
  
  const [plant, activePlants] = await Promise.all([
    prisma.plant.findUnique({
      where: { id: plantId },
      include: {
        logs: {
          orderBy: {
            logDate: 'desc'
          },
          select: {
            id: true,
            status: true,
            logDate: true,
            note: true,
            photo: true
          }
        },
        system: {
          select: {
            id: true,
            name: true,
            positionsPerRow: true
          }
        }
      }
    }).catch(() => null),
    prisma.plant.findMany({
      where: {
        status: { not: 'removed' }
      }
    })
  ]);
  
  if (!plant) {
    notFound();
  }
  // Filter active plants to only include those from the same system
  interface ActivePlant {
    id: number;
    name: string;
    type: string;
    position: number | null;
    status: string;
    systemId: number | null;
    ph_min?: number | null;
    ph_max?: number | null;
    ec_min?: number | null;
    ec_max?: number | null;
    ppm_min?: number | null;
    ppm_max?: number | null;
    external_id?: number | null;
    startDate?: Date | string | null;
    userId?: number | string | null;
    createdAt?: Date | string | null;
    updatedAt?: Date | string | null;
  }

  // Map to PlantWithParameters shape with placeholder values for missing fields
  const plantsInSameSystem = (activePlants as ActivePlant[])
    .filter((p: ActivePlant) => p.systemId === plant.systemId)
    .map((p: ActivePlant) => {
      const safe = convertDecimalFieldsToNumbers(p);
      return {
        ...safe,
        startDate: safe.startDate ?? null,
        userId: safe.userId ?? null,
        createdAt: safe.createdAt ?? null,
        updatedAt: safe.updatedAt ?? null,
      };
    });
  
  // Check if the plant has external parameters
  const plantWithSafeValues = convertDecimalFieldsToNumbers(plant);
  const externalId = 'external_id' in plantWithSafeValues ? plantWithSafeValues.external_id : null;
  
  // Extract and format plant data for client-side rendering
  const formattedPlant = {
    id: plantWithSafeValues.id,
    name: plantWithSafeValues.name,
    type: plantWithSafeValues.type,
    position: plantWithSafeValues.position ?? null,  // Ensure position is either a number or null
    status: plantWithSafeValues.status,
    ph_min: plantWithSafeValues.ph_min ?? null,
    ph_max: plantWithSafeValues.ph_max ?? null,
    ec_min: plantWithSafeValues.ec_min ?? null,
    ec_max: plantWithSafeValues.ec_max ?? null,
    ppm_min: plantWithSafeValues.ppm_min ?? null, 
    ppm_max: plantWithSafeValues.ppm_max ?? null,
    external_id: plantWithSafeValues.external_id ?? null,    logs: plantWithSafeValues.logs.map((log: any) => ({
      id: log.id,
      status: log.status,
      note: log.note,
      photo: log.photo,
      logDate: log.logDate.toISOString()
    }))
  };
  
  return (
    <div className="p-6">
      {/* Plant Header */}
      <PlantHeader 
        id={formattedPlant.id}
        name={formattedPlant.name}
        type={formattedPlant.type}
        position={formattedPlant.position}
        status={formattedPlant.status}
      />
      
      {/* Main 2-column layout */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Left column */}
        <div className="flex flex-col gap-6">
          {/* Top left: Position Grid */}
          <section>
            <h2 className="text-lg font-semibold mb-3 dark:text-white">System Position</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-md shadow-gray-200/50 dark:shadow-gray-900/50 p-4">
              {plant.system ? (
                <>
                  <p className="text-xs text-gray-600 dark:text-gray-400 mb-3">System: {plant.system.name}</p>
                  <PlantPositionGrid 
                    plants={plantsInSameSystem} 
                    positionsPerRow={getPositionsPerRow(plant.system)} 
                    highlightPosition={formattedPlant.position}
                  />
                </>
              ) : (
                <p className="text-gray-600 dark:text-gray-400">No system information available</p>
              )}
            </div>
          </section>
          
          {/* Bottom left: Plant Parameters */}
          <section className="h-auto">
            <h2 className="text-lg font-semibold mb-3 dark:text-white">Parameters</h2>
            <ClientParameters 
              plantId={formattedPlant.id} 
              externalId={externalId}
              ph_min={formattedPlant.ph_min}
              ph_max={formattedPlant.ph_max}
              ec_min={formattedPlant.ec_min}
              ec_max={formattedPlant.ec_max}
              ppm_min={formattedPlant.ppm_min}
              ppm_max={formattedPlant.ppm_max}
            />
          </section>
        </div>
        
        {/* Right column */}
        <div className="flex flex-col gap-6">
          {/* Top right: Log Form */}
          <section>
            <div>
              <h2 className="text-lg font-semibold mb-3 dark:text-white">Add Log</h2>
              <PlantLogForm plantId={formattedPlant.id} />
            </div>
          </section>
            {/* Bottom right: Growth History */}
          <section>
            <h2 className="text-lg font-semibold mb-3 dark:text-white">Growth History</h2>
            <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700 max-h-96 overflow-y-auto" role="log">
              <p className="p-3 text-xs text-gray-500 dark:text-gray-400 bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                This shows your plant's growth journey. Add new entries to track growth stages and changes.
              </p>              {formattedPlant.logs.length > 0 ? (
                formattedPlant.logs.map((log: any) => (
                  <article key={log.id} className="p-4">
                    <div className="flex justify-between items-start mb-2">
                      <span className="font-medium dark:text-white">{log.status}</span>
                      <time className="text-sm text-gray-600 dark:text-gray-400" dateTime={log.logDate}>
                        {new Date(log.logDate).toLocaleString()}
                      </time>
                    </div>
                    {log.note && (
                      <p className="text-gray-600 dark:text-gray-400">{log.note}</p>
                    )}
                    {log.photo && (
                      <img
                        src={log.photo}
                        alt={`Growth stage photo for ${formattedPlant.name} - ${log.status}`}
                        className="mt-2 rounded-lg max-h-48 object-cover"
                        loading="lazy"
                      />
                    )}
                  </article>
                ))
              ) : (
                <p className="p-4 text-gray-600 dark:text-gray-400">No logs yet. Add your first log entry!</p>
              )}
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}
