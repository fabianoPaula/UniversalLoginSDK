import React from 'React';
import {ReactWrapper} from 'enzyme';
import {expect} from 'chai';
import sinon from 'sinon';
import {Services} from '../../src/services/Services';
import {providers, utils} from 'ethers';
import {setupSdk} from '@universal-login/sdk/test';
import preconfigureServices from '../helpers/preconfigureServices';
import {ETHER_NATIVE_TOKEN, waitUntil} from '@universal-login/commons';
import {mountWithContext} from '../helpers/CustomMount';
import App from '../../src/ui/App';
import {createAndSendInitial} from '../utils/utils';

describe('UI: Notifications',  () => {
  let services : Services;
  let relayer : any;
  let provider : providers.Web3Provider;
  let appWrapper : ReactWrapper;

  before(async () => {
    ({relayer, provider} = await setupSdk({overridePort: 33113}));
    services = await preconfigureServices(provider, relayer, [ETHER_NATIVE_TOKEN.address]);
    await services.tokenService.start();
    services.balanceService.start();
    await services.sdk.start();
    appWrapper = mountWithContext(<App/>, services, ['/']);
  });

  it('Should get notification when new device connect', async () => {
    const appPage = await createAndSendInitial(appWrapper, provider);

    expect(appPage.dashboard().isNotificationAlert()).to.be.equal(false);

    const unsubscribe = await services.connectToWallet('super-name.mylogin.eth', () => {});
    await appPage.dashboard().waitForNewNotifications();

    expect(appPage.dashboard().isNotificationAlert()).to.be.equal(true);

    unsubscribe();
  });

  after(async () => {
    appWrapper.unmount();
    services.balanceService.stop();
    await services.sdk.finalizeAndStop();
    await relayer.stop();
  });

});
