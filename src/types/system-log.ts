export interface SystemLog {
  id: number;
  type: string;
  value: number;
  unit: string;
  note?: string | null;
  logDate: Date;
  createdAt: Date;
  userId: number;
  systemId?: number | null;
  systemName?: string | null;
}
