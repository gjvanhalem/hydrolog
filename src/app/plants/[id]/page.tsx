import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import { notFound } from 'next/navigation';
import PlantLogForm from './log-form';
import PlantPositionGrid from '@/app/components/PlantPositionGrid';
import PlantHeader from './PlantHeader';

interface PlantPageProps {
  params: {
    id: string;
  };
}

// Generate metadata for the plant page
export async function generateMetadata({ params }: PlantPageProps): Promise<Metadata> {
  const plant = await prisma.plant.findUnique({
    where: { id: parseInt(params.id) },
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
  const plantId = parseInt(params.id);
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
        }
      }
    }).catch(() => null),    prisma.plant.findMany({
      where: {
        status: { not: 'removed' }
      },
      select: {
        id: true,
        name: true,
        type: true,
        position: true,
        status: true,
        startDate: true,
        createdAt: true,
        updatedAt: true
      }
    }).catch(() => [])
  ]);

  if (!plant) {
    notFound();
  }  // Extract and format plant data for client-side rendering
  const formattedPlant = {
    id: plant.id,
    name: plant.name,
    type: plant.type,
    position: plant.position ?? null,  // Ensure position is either a number or null
    status: plant.status,
    logs: plant.logs.map(log => ({
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

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Position Grid */}
        <section className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 p-6">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">System Position</h2>
          <PlantPositionGrid 
            plants={activePlants} 
            highlightPosition={formattedPlant.position}
          />
        </section>

        {/* Log Form */}
        <section>
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Add Log Entry</h2>
          <PlantLogForm plantId={formattedPlant.id} />
        </section>

        {/* Growth History */}
        <section className="lg:col-span-2">
          <h2 className="text-xl font-semibold mb-4 dark:text-white">Growth History</h2>
          <div className="bg-white dark:bg-gray-800 rounded-lg shadow-lg shadow-gray-200/50 dark:shadow-gray-900/50 divide-y divide-gray-200 dark:divide-gray-700" role="log">
            {formattedPlant.logs.length > 0 ? (
              formattedPlant.logs.map((log) => (
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
  );
}
