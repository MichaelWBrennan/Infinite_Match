export interface SecurityEvent {
  id: string;
  type: SecurityEventType;
  severity: SecuritySeverity;
  playerId?: string;
  description: string;
  metadata: Record<string, any>;
  timestamp: Date;
  resolved: boolean;
  resolvedAt?: Date;
  resolvedBy?: string;
}

export enum SecurityEventType {
  CHEAT_DETECTED = 'CHEAT_DETECTED',
  SUSPICIOUS_ACTIVITY = 'SUSPICIOUS_ACTIVITY',
  DEVICE_CHANGE = 'DEVICE_CHANGE',
  MULTIPLE_DEVICES = 'MULTIPLE_DEVICES',
  RAPID_ACTIONS = 'RAPID_ACTIONS',
  IMPOSSIBLE_SCORE = 'IMPOSSIBLE_SCORE',
  ACCOUNT_SHARING = 'ACCOUNT_SHARING',
  DEVICE_SPOOFING = 'DEVICE_SPOOFING',
  INVALID_PURCHASE = 'INVALID_PURCHASE',
  DATA_TAMPERING = 'DATA_TAMPERING',
}

export enum SecuritySeverity {
  LOW = 'LOW',
  MEDIUM = 'MEDIUM',
  HIGH = 'HIGH',
  CRITICAL = 'CRITICAL',
}
