import {ReactWrapper} from 'enzyme';
import {Contract} from 'ethers';
import {sleep} from '@universal-login/commons';
import {waitForUI} from '../utils/utils';

export default class DashboardPage {
  constructor(private wrapper : ReactWrapper) {
  }

  clickTransferButton() {
    this.wrapper.find('#transferFunds').simulate('click');
    this.wrapper.update();
  }

  disconnect() {
    this.wrapper.find('.sign-out-btn').simulate('click');
  }

  async getBalance(mockTokenContract : Contract, walletAddress: string) {
    // TODO: walletAddress Should be taken from UI
    await sleep(300);
    const tokenBalance = await mockTokenContract.balanceOf(walletAddress);
    return tokenBalance.toString();
  }

  getWalletBalance() : string {
    return this.wrapper.find('span.balance-amount-highlighted').text();
  }

  isNotificationAlert(): boolean {
    this.wrapper.update();
    return this.wrapper.exists('.new-notifications');
  }

  async waitForNewNotifications() {
    try {
      this.wrapper.update();
      await waitForUI(this.wrapper, () => this.wrapper.text().includes('new-notifications'), 1000);
    } catch {
      this.wrapper.update();
    }
  }
}
