import {ReactWrapper} from 'enzyme';
import LoginPage from '../pages/LoginPage';
import TransferPage from '../pages/TransferPage';
import DashboardPage from '../pages/DashboardPage';
import NotificationsPage from './NotificationsPage';

export class AppPage {
  private loginPage? : LoginPage;
  private transferPage? : TransferPage;
  private dashboardPage? : DashboardPage;
  private notificationsPage? : NotificationsPage;

  constructor(private wrapper : ReactWrapper) {
  }

  login() : LoginPage {
    this.loginPage = this.loginPage || new LoginPage(this.wrapper);
    return this.loginPage;
  }

  transfer() : TransferPage {
    this.transferPage = this.transferPage || new TransferPage(this.wrapper);
    return this.transferPage;
  }

  dashboard() : DashboardPage {
    this.dashboardPage = this.dashboardPage || new DashboardPage(this.wrapper);
    return this.dashboardPage;
  }

  notifications() : NotificationsPage {
    this.notificationsPage = this.notificationsPage || new NotificationsPage(this.wrapper);
    return this.notificationsPage;
  }
}
