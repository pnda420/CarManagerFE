// src/app/core/services/api.service.ts
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { CreateUserDto, User, LoginDto, LoginResponse, UpdateUserDto, CreateCarDto, Car, UpdateCarDto, CreateTuningGroupDto, TuningGroup, UpdateTuningGroupDto, CreateTuningPartDto, TuningPart, UpdateTuningPartDto } from './api.models';


@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  private getHeaders(): HttpHeaders {
    return new HttpHeaders({
      'Content-Type': 'appl ication/json'
    });
  }

  // ========== User Endpoints ==========

  register(dto: CreateUserDto): Observable<User> {
    return this.http.post<User>(`${this.apiUrl}/users/register`, dto, {
      headers: this.getHeaders()
    });
  }

  login(dto: LoginDto): Observable<LoginResponse> {
    return this.http.post<LoginResponse>(`${this.apiUrl}/users/login`, dto, {
      headers: this.getHeaders()
    });
  }

  getAllUsers(): Observable<User[]> {
    return this.http.get<User[]>(`${this.apiUrl}/users`, {
      headers: this.getHeaders()
    });
  }

  getUser(id: string): Observable<User> {
    return this.http.get<User>(`${this.apiUrl}/users/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateUser(id: string, dto: UpdateUserDto): Observable<User> {
    return this.http.patch<User>(`${this.apiUrl}/users/${id}`, dto, {
      headers: this.getHeaders()
    });
  }

  deleteUser(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/users/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== Car Endpoints ==========

  createCar(dto: CreateCarDto): Observable<Car> {
    return this.http.post<Car>(`${this.apiUrl}/cars`, dto, {
      headers: this.getHeaders()
    });
  }

  getCarById(id: string): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/cars/${id}`, {
      headers: this.getHeaders()
    });
  }

  getAllCars(): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.apiUrl}/cars`, {
      headers: this.getHeaders()
    });
  }

  getAllCarsGlobal(): Observable<Car[]> {
    return this.http.get<Car[]>(`${this.apiUrl}/cars/all`, {
      headers: this.getHeaders()
    });
  }

  getCar(id: string): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/cars/${id}`, {
      headers: this.getHeaders()
    });
  }

  getCarGlobal(id: string): Observable<Car> {
    return this.http.get<Car>(`${this.apiUrl}/cars/all/${id}`, {
      headers: this.getHeaders()
    });
  }

  updateCar(id: string, dto: UpdateCarDto): Observable<Car> {
    return this.http.patch<Car>(`${this.apiUrl}/cars/${id}`, dto, {
      headers: this.getHeaders()
    });
  }

  deleteCar(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/cars/${id}`, {
      headers: this.getHeaders()
    });
  }

  // ========== Tuning Group Endpoints ==========

  createTuningGroup(carId: string, dto: CreateTuningGroupDto): Observable<TuningGroup> {
    return this.http.post<TuningGroup>(
      `${this.apiUrl}/cars/${carId}/tuning/groups`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  getAllTuningGroups(carId: string): Observable<TuningGroup[]> {
    return this.http.get<TuningGroup[]>(
      `${this.apiUrl}/cars/${carId}/tuning/groups`,
      { headers: this.getHeaders() }
    );
  }

  getTuningGroup(carId: string, groupId: string): Observable<TuningGroup> {
    return this.http.get<TuningGroup>(
      `${this.apiUrl}/cars/${carId}/tuning/groups/${groupId}`,
      { headers: this.getHeaders() }
    );
  }

  updateTuningGroup(
    carId: string,
    groupId: string,
    dto: UpdateTuningGroupDto
  ): Observable<TuningGroup> {
    return this.http.patch<TuningGroup>(
      `${this.apiUrl}/cars/${carId}/tuning/groups/${groupId}`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  deleteTuningGroup(carId: string, groupId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/cars/${carId}/tuning/groups/${groupId}`,
      { headers: this.getHeaders() }
    );
  }

  // ========== Tuning Part Endpoints ==========

  createTuningPart(carId: string, dto: CreateTuningPartDto): Observable<TuningPart> {
    return this.http.post<TuningPart>(
      `${this.apiUrl}/cars/${carId}/tuning/parts`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  getAllTuningParts(carId: string): Observable<TuningPart[]> {
    return this.http.get<TuningPart[]>(
      `${this.apiUrl}/cars/${carId}/tuning/parts`,
      { headers: this.getHeaders() }
    );
  }

  getTuningPartsByGroup(carId: string, groupId: string): Observable<TuningPart[]> {
    return this.http.get<TuningPart[]>(
      `${this.apiUrl}/cars/${carId}/tuning/groups/${groupId}/parts`,
      { headers: this.getHeaders() }
    );
  }

  getTuningPart(carId: string, partId: string): Observable<TuningPart> {
    return this.http.get<TuningPart>(
      `${this.apiUrl}/cars/${carId}/tuning/parts/${partId}`,
      { headers: this.getHeaders() }
    );
  }

  updateTuningPart(
    carId: string,
    partId: string,
    dto: UpdateTuningPartDto
  ): Observable<TuningPart> {
    return this.http.patch<TuningPart>(
      `${this.apiUrl}/cars/${carId}/tuning/parts/${partId}`,
      dto,
      { headers: this.getHeaders() }
    );
  }

  deleteTuningPart(carId: string, partId: string): Observable<void> {
    return this.http.delete<void>(
      `${this.apiUrl}/cars/${carId}/tuning/parts/${partId}`,
      { headers: this.getHeaders() }
    );
  }
}