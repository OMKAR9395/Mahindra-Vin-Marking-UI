import { HttpClient } from '@angular/common/http';
import { inject, Injectable } from '@angular/core';
import { API_BASE_URL } from './api-config';

export interface ModelDetailsData {
  modelNo?: string;
  description?: string;
  description1?: string;
  marketName?: string;
  country?: string;
  driveType?: string;
  trim?: string;
  flw?: string;
  gvw?: string;
  faw?: string;
  raw?: string;
  seatCode?: string;
  colorCode?: string;
  engineType?: string;
  bsStage?: string;
  namePlate?: string;
  variant?: string;
  [key: string]: any;
}

export interface ModelDetailsResponse {
  success: boolean;
  message?: string;
  data?: ModelDetailsData;
}

@Injectable({
  providedIn: 'root',
})
export class ModelsApi {
  private http = inject(HttpClient);

  private apiUrl = `${API_BASE_URL}/model/get-by-modelno`;

  getModelDetails(modelNo: string) {
    const payload = { modelNo: modelNo };
    return this.http.post<ModelDetailsResponse>(this.apiUrl, payload);
  }
}
