import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { getCurrentUserId } from '@/lib/auth-with-systems';
import { getActiveUserSystem } from '@/lib/system-utils';
import { logger } from '@/lib/logger';
import { toNumber } from '@/lib/decimal-utils';

export async function POST(req: NextRequest) {
  try {
    const userId = await getCurrentUserId();
    if (!userId) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Parse the request body
    const { query, systemId: providedSystemId } = await req.json();

    if (!query || query.trim() === '') {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    // Determine which system to use
    let systemId = providedSystemId ? parseInt(providedSystemId) : null;
    let system;

    if (systemId) {
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
      // Use the active system
      const activeUserSystem = await getActiveUserSystem(userId);
      if (!activeUserSystem) {
        return NextResponse.json({ error: 'No active system found' }, { status: 404 });
      }
      systemId = activeUserSystem.systemId;
      system = activeUserSystem.system;
    }

    logger.info('Processing agent query', { userId, systemId, query });

    // Get current system parameters
    const latestLogs = await prisma.systemLog.findMany({
      where: {
        systemId,
      },
      orderBy: {
        logDate: 'desc',
      },
      take: 20, // Get last 20 logs to ensure we have all measurement types
    });

    // Group by measurement type, keeping only the most recent
    const latestMeasurementsByType: Record<string, any> = {};
    latestLogs.forEach(log => {
      if (!latestMeasurementsByType[log.type] || 
          new Date(log.logDate) > new Date(latestMeasurementsByType[log.type].logDate)) {
        latestMeasurementsByType[log.type] = log;
      }
    });

    // Extract the current values
    const currentParameters = {
      ph: latestMeasurementsByType['ph_measurement'] ? 
        toNumber(latestMeasurementsByType['ph_measurement'].value) : null,
      ec: latestMeasurementsByType['ec_measurement'] ? 
        toNumber(latestMeasurementsByType['ec_measurement'].value) / 1000 : null, // Convert µS/cm to mS/cm
      tds: latestMeasurementsByType['tds_measurement'] ? 
        toNumber(latestMeasurementsByType['tds_measurement'].value) : null,
      temperature: latestMeasurementsByType['temperature_measurement'] ? 
        toNumber(latestMeasurementsByType['temperature_measurement'].value) : null,
    };

    // Get current plants in the system
    const activePlants = await prisma.plant.findMany({
      where: {
        systemId,
        status: { not: 'removed' }
      },
      select: {
        id: true,
        name: true,
        type: true,
        position: true,
        ph_min: true,
        ph_max: true,
        ec_min: true,
        ec_max: true,
        ppm_min: true,
        ppm_max: true,
      }
    });

    // Convert plants data to ensure all decimals are JavaScript numbers
    const plantData = activePlants.map(plant => {
      return {
        id: plant.id,
        name: plant.name,
        type: plant.type,
        position: plant.position,
        ph_min: plant.ph_min ? toNumber(plant.ph_min) : null,
        ph_max: plant.ph_max ? toNumber(plant.ph_max) : null,
        ec_min: plant.ec_min ? toNumber(plant.ec_min) : null,
        ec_max: plant.ec_max ? toNumber(plant.ec_max) : null,
        ppm_min: plant.ppm_min,
        ppm_max: plant.ppm_max,
      };
    });

    // Get all available plants from external API
    const externalApiUrl = process.env.EXTERNAL_PLANTS_API_URL || 'http://localhost:4000/api/plants';
    const externalResponse = await fetch(externalApiUrl);
    let externalPlants = [];
    
    if (externalResponse.ok) {
      const rawExternalPlants = await externalResponse.json();
      externalPlants = rawExternalPlants.map((plant: any) => ({
        id: Number(plant.id),
        name: plant.name,
        ph_min: toNumber(plant.ph_min) ?? 0,
        ph_max: toNumber(plant.ph_max) ?? 0,
        ec_min: toNumber(plant.ec_min) ?? 0,
        ec_max: toNumber(plant.ec_max) ?? 0,
        ppm_min: plant.ppm_min ?? 0,
        ppm_max: plant.ppm_max ?? 0
      }));
    }

    // Process the query
    let response = '';

    // Check the query type: environment optimization or plant selection
    const queryLower = query.toLowerCase();
    
    if (queryLower.includes('optimize') || queryLower.includes('improve') || queryLower.includes('adjust') || 
        queryLower.includes('parameter') || queryLower.includes('environment')) {
      // Environment Optimization
      response = generateEnvironmentAdvice(currentParameters, plantData);
    } else if (queryLower.includes('recommend') || queryLower.includes('suggest') || 
               queryLower.includes('plant') || queryLower.includes('grow') || 
               queryLower.includes('select') || queryLower.includes('what')) {
      // Plant Selection
      response = generatePlantRecommendations(currentParameters, externalPlants);
    } else {
      // General information
      response = generateGeneralAdvice(currentParameters, plantData, externalPlants);
    }

    return NextResponse.json({ 
      response,
      currentParameters,
      plants: plantData,
      systemName: system.name
    });
  } catch (error) {
    logger.error('Failed to process agent query', { error });
    return NextResponse.json({ error: 'Failed to process your request' }, { status: 500 });
  }
}

// Helper functions to generate advice based on current system state

function generateEnvironmentAdvice(currentParameters: any, plants: any[]): string {
  // If no plants in the system
  if (plants.length === 0) {
    return `Your system currently doesn't have any plants. Here are the optimal ranges for most hydroponic plants:\n\n` +
           `• pH: 5.5 - 6.5\n` +
           `• EC: 1.2 - 2.0 mS/cm\n` +
           `• TDS: 600 - 1000 ppm\n` +
           `• Temperature: 20°C - 25°C (68°F - 77°F)\n\n` +
           `Your current parameters are:\n` +
           `• pH: ${currentParameters.ph !== null ? currentParameters.ph.toFixed(1) : 'Not measured'}\n` +
           `• EC: ${currentParameters.ec !== null ? currentParameters.ec.toFixed(2) + ' mS/cm' : 'Not measured'}\n` +
           `• TDS: ${currentParameters.tds !== null ? currentParameters.tds + ' ppm' : 'Not measured'}\n` +
           `• Temperature: ${currentParameters.temperature !== null ? currentParameters.temperature.toFixed(1) + '°C' : 'Not measured'}\n\n` +
           `Consider adding plants to your system and adjusting parameters to the recommended ranges.`;
  }

  // Analyze each parameter for each plant
  let phIssues: string[] = [];
  let ecIssues: string[] = [];
  let tdsIssues: string[] = [];
  let tempIssues: string[] = [];

  // Get the ideal range for all plants combined
  let combinedPhMin = 0;
  let combinedPhMax = 14;
  let combinedEcMin = 0;
  let combinedEcMax = 5;
  let combinedPpmMin = 0;
  let combinedPpmMax = 3000;

  // Only use plants with defined parameters
  const plantsWithParams = plants.filter(p => 
    (p.ph_min !== null && p.ph_max !== null) || 
    (p.ec_min !== null && p.ec_max !== null) || 
    (p.ppm_min !== null && p.ppm_max !== null)
  );

  if (plantsWithParams.length > 0) {
    // Find the overlapping ideal range for all plants
    plantsWithParams.forEach(plant => {
      if (plant.ph_min !== null && plant.ph_max !== null) {
        combinedPhMin = Math.max(combinedPhMin, plant.ph_min);
        combinedPhMax = Math.min(combinedPhMax, plant.ph_max);
      }
      if (plant.ec_min !== null && plant.ec_max !== null) {
        combinedEcMin = Math.max(combinedEcMin, plant.ec_min);
        combinedEcMax = Math.min(combinedEcMax, plant.ec_max);
      }
      if (plant.ppm_min !== null && plant.ppm_max !== null) {
        combinedPpmMin = Math.max(combinedPpmMin, plant.ppm_min);
        combinedPpmMax = Math.min(combinedPpmMax, plant.ppm_max);
      }
    });
  } else {
    // Use default ranges if no plants have parameters
    combinedPhMin = 5.5;
    combinedPhMax = 6.5;
    combinedEcMin = 1.2;
    combinedEcMax = 2.0;
    combinedPpmMin = 600;
    combinedPpmMax = 1000;
  }

  // Check pH
  if (currentParameters.ph !== null) {
    if (currentParameters.ph < combinedPhMin) {
      phIssues.push(`Your pH of ${currentParameters.ph.toFixed(1)} is too low for optimal growth. Increase pH to at least ${combinedPhMin.toFixed(1)} by adding pH Up solution.`);
    } else if (currentParameters.ph > combinedPhMax) {
      phIssues.push(`Your pH of ${currentParameters.ph.toFixed(1)} is too high for optimal growth. Lower pH to at most ${combinedPhMax.toFixed(1)} by adding pH Down solution.`);
    }
  } else {
    phIssues.push(`pH has not been measured. For optimal plant growth, maintain pH between ${combinedPhMin.toFixed(1)} and ${combinedPhMax.toFixed(1)}.`);
  }

  // Check EC
  if (currentParameters.ec !== null) {
    if (currentParameters.ec < combinedEcMin) {
      ecIssues.push(`Your EC of ${currentParameters.ec.toFixed(2)} mS/cm is too low. Increase nutrient concentration to reach at least ${combinedEcMin.toFixed(2)} mS/cm.`);
    } else if (currentParameters.ec > combinedEcMax) {
      ecIssues.push(`Your EC of ${currentParameters.ec.toFixed(2)} mS/cm is too high. Dilute your solution by adding water to reach ${combinedEcMax.toFixed(2)} mS/cm or lower.`);
    }
  } else {
    ecIssues.push(`EC has not been measured. For optimal growth, maintain EC between ${combinedEcMin.toFixed(2)} and ${combinedEcMax.toFixed(2)} mS/cm.`);
  }

  // Check TDS
  if (currentParameters.tds !== null) {
    if (currentParameters.tds < combinedPpmMin) {
      tdsIssues.push(`Your TDS of ${currentParameters.tds} ppm is too low. Add nutrients to reach at least ${combinedPpmMin} ppm.`);
    } else if (currentParameters.tds > combinedPpmMax) {
      tdsIssues.push(`Your TDS of ${currentParameters.tds} ppm is too high. Dilute your solution by adding water to reach ${combinedPpmMax} ppm or lower.`);
    }
  } else {
    tdsIssues.push(`TDS has not been measured. For optimal growth, maintain TDS between ${combinedPpmMin} and ${combinedPpmMax} ppm.`);
  }

  // Check temperature (using general ranges since not plant-specific)
  if (currentParameters.temperature !== null) {
    if (currentParameters.temperature < 18) {
      tempIssues.push(`Your water temperature of ${currentParameters.temperature.toFixed(1)}°C is too low for most plants. Increase to at least 18-20°C.`);
    } else if (currentParameters.temperature > 26) {
      tempIssues.push(`Your water temperature of ${currentParameters.temperature.toFixed(1)}°C is too high for optimal root health. Decrease to at most 24-26°C.`);
    }
  } else {
    tempIssues.push(`Water temperature has not been measured. For most plants, maintain between 18-26°C.`);
  }

  // Construct the advice
  let advice = `# Environment Optimization Advice\n\n`;
  
  advice += `You have ${plants.length} plant${plants.length > 1 ? 's' : ''} in your system. `;
  advice += `Here's my advice for optimizing your growing environment:\n\n`;
  
  advice += `## Current Parameters\n`;
  advice += `• pH: ${currentParameters.ph !== null ? currentParameters.ph.toFixed(1) : 'Not measured'}\n`;
  advice += `• EC: ${currentParameters.ec !== null ? currentParameters.ec.toFixed(2) + ' mS/cm' : 'Not measured'}\n`;
  advice += `• TDS: ${currentParameters.tds !== null ? currentParameters.tds + ' ppm' : 'Not measured'}\n`;
  advice += `• Temperature: ${currentParameters.temperature !== null ? currentParameters.temperature.toFixed(1) + '°C' : 'Not measured'}\n\n`;
  
  advice += `## Ideal Range for Your Plants\n`;
  advice += `• pH: ${combinedPhMin.toFixed(1)} - ${combinedPhMax.toFixed(1)}\n`;
  advice += `• EC: ${combinedEcMin.toFixed(2)} - ${combinedEcMax.toFixed(2)} mS/cm\n`;
  advice += `• TDS: ${combinedPpmMin} - ${combinedPpmMax} ppm\n`;
  advice += `• Temperature: 18 - 26°C\n\n`;
  
  advice += `## Recommendations\n`;
  if (phIssues.length > 0) {
    advice += `**pH**: ${phIssues.join(' ')}\n\n`;
  } else if (currentParameters.ph !== null) {
    advice += `**pH**: Your current pH of ${currentParameters.ph.toFixed(1)} is within the optimal range. Maintain this level.\n\n`;
  }
  
  if (ecIssues.length > 0) {
    advice += `**EC**: ${ecIssues.join(' ')}\n\n`;
  } else if (currentParameters.ec !== null) {
    advice += `**EC**: Your current EC of ${currentParameters.ec.toFixed(2)} mS/cm is within the optimal range. Maintain this level.\n\n`;
  }
  
  if (tdsIssues.length > 0) {
    advice += `**TDS**: ${tdsIssues.join(' ')}\n\n`;
  } else if (currentParameters.tds !== null) {
    advice += `**TDS**: Your current TDS of ${currentParameters.tds} ppm is within the optimal range. Maintain this level.\n\n`;
  }
  
  if (tempIssues.length > 0) {
    advice += `**Temperature**: ${tempIssues.join(' ')}\n\n`;
  } else if (currentParameters.temperature !== null) {
    advice += `**Temperature**: Your current water temperature of ${currentParameters.temperature.toFixed(1)}°C is within the optimal range. Maintain this level.\n\n`;
  }
  
  advice += `## Additional Tips\n`;
  advice += `• Measure parameters regularly to ensure consistency\n`;
  advice += `• Adjust nutrient solution weekly or when parameters deviate from ideal ranges\n`;
  advice += `• Keep oxygen levels high by ensuring proper water circulation\n`;
  advice += `• Clean your system regularly to prevent algae growth`;
  
  return advice;
}

function generatePlantRecommendations(currentParameters: any, externalPlants: any[]): string {
  if (!currentParameters.ph && !currentParameters.ec && !currentParameters.tds) {
    return `I don't have enough information about your current system parameters to make specific recommendations. ` +
           `Please measure and record your system's pH, EC, and TDS levels. This will help me suggest plants that would thrive in your environment.`;
  }

  const compatiblePlants: any[] = [];

  // Filter plants that are compatible with current parameters
  externalPlants.forEach(plant => {
    let isCompatible = true;
    let compatibilityScore = 0;

    // Check pH compatibility
    if (currentParameters.ph !== null) {
      if (currentParameters.ph >= plant.ph_min && currentParameters.ph <= plant.ph_max) {
        compatibilityScore += 2; // Perfect pH match
      } else if (
        (currentParameters.ph >= plant.ph_min - 0.5 && currentParameters.ph < plant.ph_min) ||
        (currentParameters.ph > plant.ph_max && currentParameters.ph <= plant.ph_max + 0.5)
      ) {
        compatibilityScore += 1; // Close pH match
      } else {
        isCompatible = false; // pH too far off
      }
    }

    // Check EC compatibility
    if (isCompatible && currentParameters.ec !== null) {
      if (currentParameters.ec >= plant.ec_min && currentParameters.ec <= plant.ec_max) {
        compatibilityScore += 2; // Perfect EC match
      } else if (
        (currentParameters.ec >= plant.ec_min - 0.3 && currentParameters.ec < plant.ec_min) ||
        (currentParameters.ec > plant.ec_max && currentParameters.ec <= plant.ec_max + 0.3)
      ) {
        compatibilityScore += 1; // Close EC match
      } else {
        isCompatible = false; // EC too far off
      }
    }

    // Check TDS compatibility
    if (isCompatible && currentParameters.tds !== null) {
      if (currentParameters.tds >= plant.ppm_min && currentParameters.tds <= plant.ppm_max) {
        compatibilityScore += 2; // Perfect TDS match
      } else if (
        (currentParameters.tds >= plant.ppm_min - 100 && currentParameters.tds < plant.ppm_min) ||
        (currentParameters.tds > plant.ppm_max && currentParameters.tds <= plant.ppm_max + 100)
      ) {
        compatibilityScore += 1; // Close TDS match
      } else {
        isCompatible = false; // TDS too far off
      }
    }

    if (isCompatible) {
      compatiblePlants.push({
        ...plant,
        compatibilityScore
      });
    }
  });

  // Sort plants by compatibility score
  compatiblePlants.sort((a, b) => b.compatibilityScore - a.compatibilityScore);

  // Create the recommendation response
  let response = `# Plant Recommendations\n\n`;
  
  response += `Based on your current system parameters:\n`;
  response += `• pH: ${currentParameters.ph !== null ? currentParameters.ph.toFixed(1) : 'Not measured'}\n`;
  response += `• EC: ${currentParameters.ec !== null ? currentParameters.ec.toFixed(2) + ' mS/cm' : 'Not measured'}\n`;
  response += `• TDS: ${currentParameters.tds !== null ? currentParameters.tds + ' ppm' : 'Not measured'}\n`;
  response += `• Temperature: ${currentParameters.temperature !== null ? currentParameters.temperature.toFixed(1) + '°C' : 'Not measured'}\n\n`;

  if (compatiblePlants.length === 0) {
    response += `I couldn't find plants that are compatible with your current parameters. Consider adjusting your system parameters to match common plant requirements:\n\n`;
    response += `• pH: 5.5 - 6.5\n`;
    response += `• EC: 1.2 - 2.0 mS/cm\n`;
    response += `• TDS: 600 - 1000 ppm\n\n`;
    response += `After adjusting, check back for recommendations.`;
  } else {
    response += `## Recommended Plants\n\n`;
    
    // Top recommendations (up to 5)
    const topRecommendations = compatiblePlants.slice(0, 5);
    
    topRecommendations.forEach((plant, index) => {
      response += `### ${index + 1}. ${plant.name}\n`;
      response += `• pH: ${plant.ph_min.toFixed(1)} - ${plant.ph_max.toFixed(1)}\n`;
      response += `• EC: ${plant.ec_min.toFixed(2)} - ${plant.ec_max.toFixed(2)} mS/cm\n`;
      response += `• TDS: ${plant.ppm_min} - ${plant.ppm_max} ppm\n`;
      
      // Add compatibility note
      if (plant.compatibilityScore >= 6) {
        response += `• **Perfect Match!** This plant will thrive in your current system.\n\n`;
      } else if (plant.compatibilityScore >= 3) {
        response += `• **Good Match!** This plant should grow well with minimal adjustments.\n\n`;
      } else {
        response += `• **Acceptable Match.** Some parameter adjustments would help this plant thrive better.\n\n`;
      }
    });
    
    // Add additional tips
    response += `## How to Get Started\n\n`;
    response += `1. Select a plant from the recommendations above\n`;
    response += `2. Add the plant to your system using the "Add Plant" feature\n`;
    response += `3. Monitor growth closely during the first week\n`;
    response += `4. Adjust parameters if needed based on plant response\n\n`;
    
    response += `## Tips for Success\n\n`;
    response += `• Start with a single plant type to maintain consistent environmental parameters\n`;
    response += `• Seedlings generally prefer lower EC/TDS levels than mature plants\n`;
    response += `• Check roots regularly for health and color (healthy roots are typically white or cream-colored)\n`;
    response += `• Ensure adequate light for your chosen plant species`;
  }
  
  return response;
}

function generateGeneralAdvice(currentParameters: any, plants: any[], externalPlants: any[]): string {
  let advice = `# Hydroponic Growing Guide\n\n`;

  advice += `## System Status\n\n`;
  advice += `Your system currently has ${plants.length} plant${plants.length > 1 ? 's' : ''}.`;
  
  if (plants.length > 0) {
    advice += ` You're growing: ${plants.map(p => p.name).join(', ')}.`;
  }
  
  advice += `\n\nCurrent parameters:\n`;
  advice += `• pH: ${currentParameters.ph !== null ? currentParameters.ph.toFixed(1) : 'Not measured'}\n`;
  advice += `• EC: ${currentParameters.ec !== null ? currentParameters.ec.toFixed(2) + ' mS/cm' : 'Not measured'}\n`;
  advice += `• TDS: ${currentParameters.tds !== null ? currentParameters.tds + ' ppm' : 'Not measured'}\n`;
  advice += `• Temperature: ${currentParameters.temperature !== null ? currentParameters.temperature.toFixed(1) + '°C' : 'Not measured'}\n\n`;

  advice += `## How Can I Help?\n\n`;
  advice += `I can assist you with:\n\n`;
  advice += `1. **Environment Optimization** - Ask me how to optimize your system's parameters for your current plants\n`;
  advice += `2. **Plant Recommendations** - Ask me which plants would grow well in your current environment\n`;
  advice += `3. **Growing Tips** - Ask me for specific advice about growing certain types of plants\n\n`;
  
  advice += `## Common Questions\n\n`;
  advice += `• "How can I optimize my system for the current plants?"\n`;
  advice += `• "What plants would grow well in my current system?"\n`;
  advice += `• "How should I adjust my pH/EC levels?"\n`;
  advice += `• "What are the ideal parameters for growing lettuce/basil/etc.?"\n`;
  advice += `• "My plants have yellowing leaves - what should I do?"\n\n`;
  
  advice += `## Plant Database\n\n`;
  advice += `I have information on ${externalPlants.length} different plant species and their optimal growing conditions. `;
  advice += `Ask me about specific plants to learn more!`;

  return advice;
}
