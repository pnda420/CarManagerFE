// src/app/core/models/api.models.ts

// ========== User Models ==========
export enum UserRole {
  USER = 'user',
  ADMIN = 'admin',
}


export interface LoginResponse {
  access_token: string;
  user: User;
}


export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  isVerified: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface CreateUserDto {
  email: string;
  name: string;
  password: string;

}

export interface LoginDto {
  email: string;
  password: string;
}

export interface LoginResponse {
  message: string;
  user: User;
  token?: string;
}

export interface UpdateUserDto {
  name?: string;
}

// ========== Car Models ==========
export enum FuelType {
  PETROL = 'petrol',
  DIESEL = 'diesel',
  HYBRID = 'hybrid',
  ELECTRIC = 'electric',
  LPG = 'lpg',
  CNG = 'cng',
  OTHER = 'other',
}

export enum Induction {
  NONE = 'none',
  TURBO = 'turbo',
  SUPERCHARGER = 'supercharger',
  ELECTRIC = 'electric',
  OTHER = 'other',
}

export enum Drivetrain {
  FWD = 'fwd',
  RWD = 'rwd',
  AWD = 'awd',
}

export enum Transmission {
  MANUAL = 'manual',
  AUTOMATIC = 'automatic',
  DSG = 'dsg',
  CVT = 'cvt',
  OTHER = 'other',
}

export enum BodyType {
  SEDAN = 'sedan',
  WAGON = 'wagon',
  COUPE = 'coupe',
  CONVERTIBLE = 'convertible',
  SUV = 'suv',
  VAN = 'van',
  PICKUP = 'pickup',
  HATCHBACK = 'hatchback',
  OTHER = 'other',
}

export interface CarImage {
  id: string;
  image: string;
}

export interface Car {
  id: string;
  userId: string;
  // Basics
  name: string;
  make: string;
  model: string;
  modelYear?: number;
  licensePlate?: string;
  vin?: string;
  // Performance
  horsepowerPs: number;
  torqueNm?: number;
  displacementCc?: number;
  fuel: FuelType;
  induction?: Induction;
  drivetrain?: Drivetrain;
  transmission?: Transmission;
  gears?: number;
  // Body/weights
  kerbWeightKg?: number;
  doors?: number;
  seats?: number;
  bodyType?: BodyType;
  // Mileage & maintenance
  mileageKm: number;
  mileageUpdatedAt: string;
  nextTuvDate?: string;
  nextServiceDate?: string;
  nextServiceKm?: number;
  // Stats
  powerToWeightPsPerKg?: number;
  zeroToHundredS?: number;
  topSpeedKmh?: number;
  consumptionLPer100km?: number;
  // Media
  images?: CarImage[];
  // Meta
  createdAt: string;
  updatedAt: string;
}

export interface CreateCarDto {
  name: string;
  make: string;
  model: string;
  modelYear?: number;
  licensePlate?: string;
  vin?: string;
  horsepowerPs: number;
  torqueNm?: number;
  displacementCc?: number;
  fuel: FuelType;
  induction?: Induction;
  drivetrain?: Drivetrain;
  transmission?: Transmission;
  gears?: number;
  kerbWeightKg?: number;
  doors?: number;
  seats?: number;
  bodyType?: BodyType;
  mileageKm: number;
  nextTuvDate?: string;
  nextServiceDate?: string;
  nextServiceKm?: number;
  powerToWeightPsPerKg?: number;
  zeroToHundredS?: number;
  topSpeedKmh?: number;
  consumptionLPer100km?: number;
  images?: CarImage[];
}

export interface UpdateCarDto {
  name?: string;
  make?: string;
  model?: string;
  modelYear?: number;
  licensePlate?: string;
  vin?: string;
  horsepowerPs?: number;
  torqueNm?: number;
  displacementCc?: number;
  fuel?: FuelType;
  induction?: Induction;
  drivetrain?: Drivetrain;
  transmission?: Transmission;
  gears?: number;
  kerbWeightKg?: number;
  doors?: number;
  seats?: number;
  bodyType?: BodyType;
  mileageKm?: number;
  nextTuvDate?: string;
  nextServiceDate?: string;
  nextServiceKm?: number;
  powerToWeightPsPerKg?: number;
  zeroToHundredS?: number;
  topSpeedKmh?: number;
  consumptionLPer100km?: number;
  images?: CarImage[];
}

// ========== Tuning Models ==========
export enum ModStatus {
  PLANNED = 'planned',
  ORDERED = 'ordered',
  INSTALLED = 'installed',
  DISCARDED = 'discarded',
}

export interface TuningGroup {
  id: string;
  carId: string;
  name: string;
  orderIndex: number;
  budgetEur?: number;
  createdAt: string;
  updatedAt: string;
  deletedAt?: string | null;
  parts?: TuningPart[];
}

export interface CreateTuningGroupDto {
  name: string;
  orderIndex?: number;
  budgetEur?: number;
}

export interface UpdateTuningGroupDto {
  name?: string;
  orderIndex?: number;
  budgetEur?: number;
}

export interface TuningPart {
  id: string;
  carId: string;
  groupId: string;
  orderIndex: number;
  title: string;
  description?: string;
  status: ModStatus;
  priority?: number;
  dueDate?: string;
  notes?: string;
  quantity?: number;
  unitPriceEur?: number;
  laborPriceEur?: number;
  totalPriceEur?: number;
  link?: string;
  createdAt: string;
  updatedAt: string;
  statusChangedAt?: string;
  deletedAt?: string | null;
}

export interface CreateTuningPartDto {
  groupId: string;
  title: string;
  description?: string;
  status: ModStatus;
  orderIndex?: number;
  priority?: number;
  dueDate?: string;
  notes?: string;
  quantity?: number;
  unitPriceEur?: number;
  laborPriceEur?: number;
  totalPriceEur?: number;
  link?: string;
}

export interface UpdateTuningPartDto {
  title?: string;
  description?: string;
  status?: ModStatus;
  orderIndex?: number;
  priority?: number;
  dueDate?: string;
  notes?: string;
  quantity?: number;
  unitPriceEur?: number;
  laborPriceEur?: number;
  totalPriceEur?: number;
  link?: string;
}