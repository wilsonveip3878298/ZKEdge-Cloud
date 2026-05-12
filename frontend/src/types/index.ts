export interface Company {
  id: string;
  name: string;
  slug: string;
  taxId: string;
  isActive: boolean;
  settings?: Record<string, any>;
  createdAt: string;
}

export interface Branch {
  id: string;
  name: string;
  address?: string;
  city?: string;
  country?: string;
  companyId: string;
  isActive: boolean;
  settings?: Record<string, any>;
  devices?: Device[];
  createdAt: string;
}

export interface Device {
  id: string;
  name: string;
  serialNumber: string;
  model: string;
  firmwareVersion: string;
  ipAddress: string;
  port: number;
  status: 'online' | 'offline' | 'error' | 'maintenance';
  branchId: string;
  lastSyncAt?: string;
  lastSeenAt?: string;
  config?: Record<string, any>;
  createdAt: string;
}

export interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  cardNumber?: string;
  email?: string;
  phone?: string;
  department?: string;
  position?: string;
  companyId: string;
  branchId?: string;
  isActive: boolean;
  metadata?: Record<string, any>;
  createdAt: string;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeRecordId?: string;
  timestamp: string;
  type: 'check_in' | 'check_out' | 'overtime_in' | 'overtime_out';
  deviceId: string;
  companyId: string;
  isSynced?: boolean;
  rawData?: Record<string, any>;
  createdAt: string;
}

export interface Schedule {
  id: string;
  name: string;
  startTime: string;
  endTime: string;
  tolerance: number;
  days: string[];
  isActive: boolean;
  companyId?: string;
}

export interface SystemUser {
  id: string;
  name: string;
  email: string;
  role: 'super_admin' | 'admin' | 'manager' | 'viewer';
  isActive: boolean;
  companyId?: string;
  lastLogin?: string;
  createdAt?: string;
}

export interface Role {
  id: string;
  name: string;
  description: string;
  userCount: number;
  permissions: string[];
}

export interface DashboardStats {
  totalEmployees: number;
  totalDevices: number;
  onlineDevices: number;
  todayAttendance: number;
  activeBranches: number;
  presentNow: number;
}

export interface LiveEvent {
  id: string;
  type: string;
  data: any;
  timestamp: string;
}

export interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'warning' | 'error' | 'success';
  read: boolean;
  createdAt: string;
}
