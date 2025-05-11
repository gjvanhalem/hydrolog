import { Metadata } from 'next';
import { prisma } from '@/lib/prisma';
import ReportsClient from './page.client';

export const metadata: Metadata = {
  title: 'System Reports | HydroLog',
  description: 'View and analyze system measurements and plant growth data over time'
};

export default async function ReportsPage() {
  // Fetch system logs and plants data in parallel
  const [systemLogs, plants] = await Promise.all([
    prisma.systemLog.findMany({
      orderBy: {
        createdAt: 'asc'
      },
      select: {
        id: true,
        type: true,
        value: true,
        unit: true,
        createdAt: true,
      }
    }).then(logs => logs.map(log => ({
      ...log,
      createdAt: log.createdAt.toISOString()
    }))),
    prisma.plant.findMany({
      include: {
        logs: {
          orderBy: {
            createdAt: 'asc'
          },
          select: {
            id: true,
            plantId: true,
            status: true,
            createdAt: true
          }
        }
      }
    }).then(plants => plants.map(plant => ({
      ...plant,
      logs: plant.logs.map(log => ({
        ...log,
        createdAt: log.createdAt.toISOString()
      }))
    })))
  ]);

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-6">Reports</h1>
      <ReportsClient systemLogs={systemLogs} plants={plants} />
    </div>
  );
}
