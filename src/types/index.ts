export interface Plant {
  id: string;
  name: string;
  position: string;
  status: string;
  photoUrl: string;
  logs: PlantLog[]; // Updated to use the `PlantLog` type
}

export interface PlantLog {
  date: string;
  position: string; // Added position attribute
  status: string;
  photoUrl: string;
  notes: string;
}

export interface SystemLog {
  date: string;
  waterRefill: boolean;
  pH: number | null; // Allow null values
  EC: number | null; // Allow null values
  TDS: number | null; // Allow null values
  temperature: number | null; // Allow null values
  notes: string;
}

export interface Status {
  id: number;
  name: string;
}