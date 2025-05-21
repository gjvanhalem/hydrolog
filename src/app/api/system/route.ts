import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getCurrentUserId } from "@/lib/auth-with-systems";
import { getActiveUserSystem } from "@/lib/system-utils";
import { logger } from "@/lib/logger";

export async function GET(req: Request) {
  try {
    const userId = await getCurrentUserId();

    if (!userId) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Check for systemId in query parameters
    const url = new URL(req.url);
    const querySystemId = url.searchParams.get('systemId');
    
    let system;
    
    if (querySystemId) {
      // Fetch the specific system
      const systemId = parseInt(querySystemId);
      
      // Verify user has access to this system
      const userSystem = await prisma.userSystem.findFirst({
        where: {
          userId,
          systemId
        },
        include: {
          system: true
        }
      });
      
      if (!userSystem) {
        return NextResponse.json({ error: "System not found or access denied" }, { status: 404 });
      }
      
      system = userSystem.system;
    } else {
      // Fetch the active system for the current user
      const activeUserSystem = await getActiveUserSystem(userId);
      
      if (!activeUserSystem) {
        return NextResponse.json({ error: "No active system found" }, { status: 404 });
      }
      
      system = activeUserSystem.system;
    }

    return NextResponse.json({
      id: system.id,
      name: system.name,
      positionsPerRow: system.positionsPerRow,
      rows: system.rows
    });
  } catch (error) {
    logger.error("Failed to fetch system", { 
      error: error instanceof Error ? { message: error.message, stack: error.stack } : String(error) 
    });
    return NextResponse.json({ error: "Failed to fetch system" }, { status: 500 });
  }
}
