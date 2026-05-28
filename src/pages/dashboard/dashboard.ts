import { AsyncPipe, NgFor, NgIf } from '@angular/common';
import { ChangeDetectionStrategy, Component, OnDestroy, OnInit, inject } from '@angular/core';
import { BehaviorSubject, switchMap } from 'rxjs';
import { DashboardApi, DashboardSummaryRow, DashboardVehicleRow } from '../../services/dashboard-api';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [AsyncPipe, NgFor, NgIf],
  templateUrl: './dashboard.html',
  styleUrls: ['./dashboard.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Dashboard implements OnInit, OnDestroy {
  private dashboardApi = inject(DashboardApi);
  private readonly instanceId =
    typeof crypto !== 'undefined' && 'randomUUID' in crypto
      ? crypto.randomUUID()
      : `${Date.now()}-${Math.random()}`;
  private readonly dashboardStateKey = 'mahindra.dashboard.running';
  private readonly originalTitle = document.title;
  private readonly originalIconHref = this.getCurrentIconHref();
  private readonly originalManifestHref = this.getCurrentManifestHref();
  private heartbeatTimer?: ReturnType<typeof setInterval>;
  private dashboardChannel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mahindra-dashboard') : null;

  private readonly refresh$ = new BehaviorSubject<void>(undefined);
  readonly dashboard$ = this.refresh$.pipe(
    switchMap(() => this.dashboardApi.getDashboardData()),
  );

  readonly summaryColumns = [
    { key: 'duration', label: 'Duration' },
    { key: 'dXuv700', label: 'D-XUV700' },
    { key: 'eXuv700', label: 'E-XUV700' },
    { key: 'domKuv', label: 'DOMKUV' },
    { key: 'expKuv', label: 'EXPKUV' },
    { key: 'eXuv500', label: 'E-XUV500' },
    { key: 'totalXuv700', label: 'TotalXUV700' },
    { key: 'totalKuv', label: 'TotalKUV' },
    { key: 'totalXuv500', label: 'TotalXUV500' },
    { key: 'total', label: 'Total' },
  ] as const;

  readonly detailColumns = [
    { key: 'dateTime', label: 'Date' },
    { key: 'shift', label: 'Shift' },
    { key: 'batchNo', label: 'Batch No' },
    { key: 'vinNo', label: 'VIN No' },
    { key: 'engineSrNo', label: 'Engine Sr. No.' },
    { key: 'modelNo', label: 'Model No' },
    { key: 'market', label: 'Market' },
    { key: 'country', label: 'Country' },
    { key: 'driveType', label: 'Drive Type' },
    { key: 'colorCode', label: 'Color Code' },
  ] as const;

  trackSummaryRow = (_index: number, row: DashboardSummaryRow) => row.duration;

  trackVehicleRow = (_index: number, row: DashboardVehicleRow) =>
    `${row.batchNo}-${row.vinNo}-${row.dateTime}`;

  ngOnInit(): void {
    document.title = 'Live Dashboard';
    this.setDashboardIcon();
    this.setDashboardManifest();
    this.writeHeartbeat();
    this.heartbeatTimer = setInterval(() => this.writeHeartbeat(), 2000);

    this.dashboardChannel?.addEventListener('message', this.handleDashboardMessage);
  }

  ngOnDestroy(): void {
    if (this.heartbeatTimer) {
      clearInterval(this.heartbeatTimer);
    }
    this.clearHeartbeat();
    this.dashboardChannel?.removeEventListener('message', this.handleDashboardMessage);
    this.dashboardChannel?.close();
    document.title = this.originalTitle;
    this.restoreOriginalIcon();
    this.restoreOriginalManifest();
  }

  private readonly handleDashboardMessage = (event: MessageEvent) => {
    if (event.data?.type === 'focus-dashboard') {
      window.focus();
    } else if (event.data?.type === 'refresh-dashboard') {
      this.refresh$.next();
    }
  };

  private writeHeartbeat(): void {
    localStorage.setItem(
      this.dashboardStateKey,
      JSON.stringify({ id: this.instanceId, lastSeen: Date.now() }),
    );
  }

  private clearHeartbeat(): void {
    try {
      const rawState = localStorage.getItem(this.dashboardStateKey);
      const state = rawState ? JSON.parse(rawState) as { id?: string } : null;
      if (state?.id === this.instanceId) {
        localStorage.removeItem(this.dashboardStateKey);
      }
    } catch {
      localStorage.removeItem(this.dashboardStateKey);
    }
  }

  private setDashboardIcon(): void {
    this.ensureIconLink().href = 'icons/dashboard-icon.png';
  }

  private setDashboardManifest(): void {
    this.ensureManifestLink().href = 'dashboard-manifest.webmanifest';
  }

  private restoreOriginalIcon(): void {
    if (this.originalIconHref) {
      this.ensureIconLink().href = this.originalIconHref;
    }
  }

  private restoreOriginalManifest(): void {
    if (this.originalManifestHref) {
      this.ensureManifestLink().href = this.originalManifestHref;
    }
  }

  private getCurrentIconHref(): string {
    return document.querySelector<HTMLLinkElement>('link[rel="icon"]')?.href ?? '';
  }

  private getCurrentManifestHref(): string {
    return document.querySelector<HTMLLinkElement>('link[rel="manifest"]')?.href ?? '';
  }

  private ensureIconLink(): HTMLLinkElement {
    let link = document.querySelector<HTMLLinkElement>('link[rel="icon"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'icon';
      link.type = 'image/png';
      document.head.appendChild(link);
    }
    return link;
  }

  private ensureManifestLink(): HTMLLinkElement {
    let link = document.querySelector<HTMLLinkElement>('link[rel="manifest"]');
    if (!link) {
      link = document.createElement('link');
      link.rel = 'manifest';
      document.head.appendChild(link);
    }
    return link;
  }
}
