import { ChangeDetectionStrategy, Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, Router } from '@angular/router';

import { MatToolbarModule } from '@angular/material/toolbar';
import { MatSidenavModule } from '@angular/material/sidenav';
import { MatListModule } from '@angular/material/list';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatDividerModule } from '@angular/material/divider';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { APP_NAV_ITEMS, hasRoleAccess, NavItemAccess, normalizeRole, UserRole } from '../../app/role-access';
@Component({
  selector: 'app-layout',
  imports: [
    CommonModule,
    MatToolbarModule,
    MatSidenavModule,
    MatListModule,
    MatButtonModule,
    MatIconModule,
    MatMenuModule,
    MatDividerModule,
    MatSnackBarModule,
    RouterOutlet,
],
  templateUrl: './layout.html',
  styleUrls: ['./layout.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class Layout {
  private router = inject(Router);
  private snackBar = inject(MatSnackBar);
  private currentRole: UserRole | null = normalizeRole(localStorage.getItem('role'));
  private dashboardWindow: Window | null = null;
  private dashboardChannel =
    typeof BroadcastChannel !== 'undefined' ? new BroadcastChannel('mahindra-dashboard') : null;
  private readonly dashboardStateKey = 'mahindra.dashboard.running';
  private readonly dashboardWindowName = 'mahindra-live-dashboard';
  private readonly dashboardHeartbeatTtlMs = 7000;
  readonly isAdmin = this.currentRole === 'Admin';
  readonly canViewAdminMenu = this.isAdmin;
  readonly canViewMaintenanceMenu = this.isAdmin;
  readonly canViewAssociateMenu = !!this.currentRole;
  readonly canViewReports = this.isAdmin;
  readonly canViewHelpMenu = this.isAdmin;
  readonly navItems: readonly NavItemAccess[] = APP_NAV_ITEMS;
  readonly visibleNavItems = this.navItems.filter(
    (item) =>
      item.path !== '/app/serialTerminal' &&
      !!this.currentRole &&
      item.roles.includes(this.currentRole),
  );
  readonly loggedInUserName = (localStorage.getItem('username') || 'User').trim() || 'User';
  readonly loggedInRole = this.currentRole ?? 'Operator';
  readonly loggedInInitial = this.loggedInUserName.charAt(0).toUpperCase();
  private readonly navImageByPath: Record<string, string> = {
    '/app/excel-upload': 'SidebarIcons/Excel.png',
    '/app/marking': 'SidebarIcons/Engrave.png',
    '/app/re-engrave': 'SidebarIcons/Engrave.png',
    '/app/reports': 'SidebarIcons/Report.png',
    '/app/vehicle-images': 'SidebarIcons/VehicleImage.png',
    '/app/user-management': 'SidebarIcons/UserManagement.png',
  };
  readonly logoutImageSrc = 'SidebarIcons/Logout.png';

  trackByNavPath(_: number, item: NavItemAccess): string {
    return item.path;
  }

  getNavImageSrc(item: NavItemAccess): string | null {
    return this.navImageByPath[item.path] ?? null;
  }

  canAccess(allowedRoles: readonly UserRole[]): boolean {
    return hasRoleAccess(this.currentRole, allowedRoles);
  }

  isNavActive(path: string): boolean {
    return this.router.isActive(path, {
      paths: 'exact',
      queryParams: 'ignored',
      fragment: 'ignored',
      matrixParams: 'ignored',
    });
  }

  onNavClick(event: MouseEvent, item: NavItemAccess): void {
    event.preventDefault();
    if (item.path === '/app/dashboard') {
      this.openDashboardWindow();
      return;
    }
    this.router.navigateByUrl(item.path);
  }

  navigateIfAllowed(path: string, allowed: boolean): void {
    if (!allowed) {
      return;
    }
    this.router.navigateByUrl(path);
  }

  private openDashboardWindow(): void {
    if (this.isDashboardRunning()) {
      this.dashboardWindow?.focus();
      this.dashboardChannel?.postMessage({ type: 'focus-dashboard' });
      this.showSnack('Dashboard is already running');
      return;
    }

    const dashboardUrl = `${window.location.origin}${this.router.serializeUrl(
      this.router.createUrlTree(['/dashboard-window']),
    )}`;
    this.dashboardWindow = window.open(
      dashboardUrl,
      this.dashboardWindowName,
      'popup=yes,width=1440,height=900,left=80,top=40',
    );

    if (!this.dashboardWindow) {
      this.showSnack('Please allow pop-ups to open dashboard.');
      return;
    }

    this.dashboardWindow.focus();
  }

  private isDashboardRunning(): boolean {
    if (this.dashboardWindow && !this.dashboardWindow.closed) {
      return true;
    }

    try {
      const rawState = localStorage.getItem(this.dashboardStateKey);
      if (!rawState) {
        return false;
      }

      const state = JSON.parse(rawState) as { lastSeen?: number };
      return typeof state.lastSeen === 'number'
        && Date.now() - state.lastSeen < this.dashboardHeartbeatTtlMs;
    } catch {
      return false;
    }
  }

  private showSnack(message: string): void {
    this.snackBar.open(message, 'Close', {
      duration: 4000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: ['snackbar-error'],
    });
  }

  logout() {
    if(confirm("Are you sure want to logout!!")){
      localStorage.clear();
      this.router.navigateByUrl('/login');

    }

  }
}
