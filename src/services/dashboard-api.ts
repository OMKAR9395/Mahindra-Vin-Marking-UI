import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { catchError, forkJoin, map, Observable, of } from 'rxjs';
import { API_BASE_URL } from './api-config';

export interface DashboardSummaryRow {
  duration: string;
  dXuv700: number;
  eXuv700: number;
  domKuv: number;
  expKuv: number;
  eXuv500: number;
  totalXuv700: number;
  totalKuv: number;
  totalXuv500: number;
  total: number;
}

export interface DashboardVehicleRow {
  dateTime: string;
  shift: string;
  batchNo: string;
  vinNo: string;
  engineSrNo: string;
  modelNo: string;
  market: string;
  country: string;
  driveType: string;
  colorCode: string;
}

export interface DashboardResponse {
  title: string;
  generatedAt: string;
  summaryRows: DashboardSummaryRow[];
  vehicleRows: DashboardVehicleRow[];
}

interface ApiResponse<T> {
  success: boolean;
  message: string;
  data: T[];
}

interface ProductionSummaryApiRow {
  duration: string;
  dxuV700: number;
  exuV700: number;
  domkuv: number;
  expkuv: number;
  exuV500: number;
  totalXUV700: number;
  totalKUV: number;
  totalXUV500: number;
  total: number;
}

interface LiveTrackingApiRow {
  date: string;
  shift: string;
  batchNo: number | string;
  vinNo: string;
  engineSrNo: string;
  modelNo: string;
  market: string;
  country: string;
  driveType: string;
  colorCode: string;
}

@Injectable({
  providedIn: 'root',
})
export class DashboardApi {
  private http = inject(HttpClient);
  private productionUrl = `${API_BASE_URL}/production`;

  getDashboardData(): Observable<DashboardResponse> {
    return forkJoin({
      liveTracking: this.http.get<ApiResponse<LiveTrackingApiRow>>(
        `${this.productionUrl}/live-tracking`,
      ),
      productionSummary: this.http.get<ApiResponse<ProductionSummaryApiRow>>(
        `${this.productionUrl}/production-summary`,
      ),
    }).pipe(
      map(({ liveTracking, productionSummary }) => ({
        title: 'Live DASHBOARD',
        generatedAt: new Date().toISOString(),
        vehicleRows: (liveTracking.data ?? []).map(row => this.mapLiveTrackingRow(row)),
        summaryRows: (productionSummary.data ?? []).map(row => this.mapSummaryRow(row)),
      })),
      catchError(error => {
        console.error('Failed to fetch dashboard data', error);

        return of({
          title: 'Live DASHBOARD',
          generatedAt: new Date().toISOString(),
          vehicleRows: [],
          summaryRows: [],
        });
      }),
    );
  }

  private mapLiveTrackingRow(row: LiveTrackingApiRow): DashboardVehicleRow {
    return {
      dateTime: this.formatDateTime(row.date),
      shift: row.shift ?? '',
      batchNo: String(row.batchNo ?? ''),
      vinNo: row.vinNo ?? '',
      engineSrNo: row.engineSrNo ?? '',
      modelNo: row.modelNo ?? '',
      market: row.market ?? '',
      country: row.country ?? '',
      driveType: row.driveType ?? '',
      colorCode: row.colorCode ?? '',
    };
  }

  private mapSummaryRow(row: ProductionSummaryApiRow): DashboardSummaryRow {
    return {
      duration: row.duration ?? '',
      dXuv700: row.dxuV700 ?? 0,
      eXuv700: row.exuV700 ?? 0,
      domKuv: row.domkuv ?? 0,
      expKuv: row.expkuv ?? 0,
      eXuv500: row.exuV500 ?? 0,
      totalXuv700: row.totalXUV700 ?? 0,
      totalKuv: row.totalKUV ?? 0,
      totalXuv500: row.totalXUV500 ?? 0,
      total: row.total ?? 0,
    };
  }

  private formatDateTime(value: string): string {
    if (!value) {
      return '';
    }

    const date = new Date(value);

    if (Number.isNaN(date.getTime())) {
      return value;
    }

    const day = `${date.getDate()}`.padStart(2, '0');
    const month = date.toLocaleString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const hours = `${date.getHours()}`.padStart(2, '0');
    const minutes = `${date.getMinutes()}`.padStart(2, '0');

    return `${day}-${month}-${year} ${hours}:${minutes}`;
  }
}
