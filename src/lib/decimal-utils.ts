/**
 * Utility functions for handling Prisma Decimal values
 * to prevent "Only plain objects can be passed to Client Components from Server Components"
 * errors when passing Decimal objects directly.
 */

/**
 * Safely converts a Prisma Decimal or any other value to a JavaScript number
 * or null if the value is null/undefined
 * 
 * @param value The value to convert (can be Decimal, number, string, null, or undefined)
 * @returns A JavaScript number or null
 */
export function toNumber(value: any): number | null {
  if (value === null || value === undefined) {
    return null;
  }
  
  // Try to convert to a number
  const num = Number(value);
  
  // Check if the conversion was successful
  return isNaN(num) ? null : num;
}

/**
 * Safely convert an object with potential Decimal properties to use
 * regular JavaScript numbers instead.
 * 
 * @param obj The object containing possible Decimal values
 * @param properties Array of property names to check and convert
 * @returns A new object with Decimal properties converted to numbers
 */
export function convertDecimalProps<T>(
  obj: T, 
  properties: (keyof T)[]
): T {
  if (!obj || typeof obj !== 'object') {
    return obj;
  }

  const result = { ...obj };
  
  for (const prop of properties) {
    if (prop in result) {
      (result as any)[prop] = toNumber((obj as any)[prop]);
    }
  }
  
  return result;
}

/**
 * Converts an array of objects with potential Decimal properties to use
 * regular JavaScript numbers instead.
 * 
 * @param array Array of objects that might contain Decimal values
 * @param properties Array of property names to check and convert in each object
 * @returns A new array with all Decimal properties converted to numbers
 */
export function convertDecimalPropsInArray<T>(
  array: T[], 
  properties: (keyof T)[]
): T[] {
  if (!Array.isArray(array)) {
    return array;
  }
  
  return array.map(item => convertDecimalProps(item, properties));
}
