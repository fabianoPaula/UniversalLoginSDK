import buildEnsService from '../helpers/buildEnsService';
import {EventEmitter} from 'fbemitter';
import AuthorisationService from '../../lib/services/authorisationService';
import WalletService from '../../lib/services/WalletService';
import sinon from 'sinon';
import MockToken from '@universal-login/contracts/build/MockToken';
import MockContract from '@universal-login/contracts/build/MockContract';
import {deployContract, getWallets} from 'ethereum-waffle';
import defaultPaymentOptions from '../../lib/config/defaultPaymentOptions';
import {utils, Wallet} from 'ethers';
import {OPERATION_CALL, ACTION_KEY} from '@universal-login/contracts';
import WalletContract from '@universal-login/contracts/build/Wallet';
import {waitForContractDeploy} from '@universal-login/commons';
import TransactionService from '../../lib/services/transactions/TransactionService';
import TransactionQueueService from '../../lib/services/transactions/TransactionQueueService';
import TransactionQueueStore from '../../lib/services/transactions/TransactionQueueStore';
import {loadFixture} from 'ethereum-waffle';

const {gasPrice, gasLimit} = defaultPaymentOptions;

export async function setupTransactionService(knex) {
   const {wallet, actionKey, ensService, provider, walletService, mockToken, mockContract, walletContract, otherWallet, hooks, callback} = await loadFixture(basicWalletService);
   const authorisationService = new AuthorisationService(knex);
   const transactionQueueStore = new TransactionQueueStore(knex);
   const transactionQueueService = new TransactionQueueService(wallet, provider, transactionQueueStore);
   const transactionService = new TransactionService(wallet, authorisationService, hooks, provider, transactionQueueService);
      
   return {wallet, actionKey, ensService, provider, walletService, callback, mockToken, mockContract, authorisationService, transactionService, walletContract, otherWallet, knex};
}

export default async function basicWalletService(provider, [, , wallet]) {
  const [ensService, provider] = await buildEnsService(wallet, 'mylogin.eth');
  const hooks = new EventEmitter();
  const walletService = new WalletService(wallet, null, ensService, hooks, true);
  const callback = sinon.spy();
  hooks.addListener('created', callback);
  const actionWallet = Wallet.createRandom();
  const actionKey = actionWallet.privateKey;
  const mockToken = await deployContract(wallet, MockToken);
  const mockContract = await deployContract(wallet, MockContract);
  const transaction = await walletService.create(wallet.address, 'alex.mylogin.eth');
  const walletContract = await waitForContractDeploy(wallet, WalletContract, transaction.hash);
  await walletContract.addKey(actionWallet.address, ACTION_KEY);
  await wallet.sendTransaction({to: walletContract.address, value: utils.parseEther('1.0')});
  await mockToken.transfer(walletContract.address, utils.parseEther('1.0'));
  const [, otherWallet] = await getWallets(provider);
  return {wallet, actionKey, ensService, provider, walletService, mockToken, mockContract, walletContract, otherWallet, hooks, callback};
}

export const transferMessage = {
  to: '0x0000000000000000000000000000000000000001',
  value: utils.parseEther('0.5'),
  data: utils.formatBytes32String(0),
  nonce: 0,
  gasPrice,
  gasLimit,
  gasToken: '0x0000000000000000000000000000000000000000',
  operationType: OPERATION_CALL,
};

export const addKeyMessage = {
  to: '0x0000000000000000000000000000000000000000',
  value: utils.parseEther('0.0'),
  data: new utils.Interface(WalletContract.interface).functions.addKey.encode(['0x63FC2aD3d021a4D7e64323529a55a9442C444dA0', ACTION_KEY]),
  nonce: 0,
  gasPrice,
  gasLimit,
  gasToken: '0x0000000000000000000000000000000000000000',
  operationType: OPERATION_CALL,
};

export const removeKeyMessage = {
  to: '0x0000000000000000000000000000000000000000',
  value: utils.parseEther('0.0'),
  data: new utils.Interface(WalletContract.interface).functions.removeKey.encode(['0x63FC2aD3d021a4D7e64323529a55a9442C444dA0', ACTION_KEY]),
  nonce: 1,
  gasPrice,
  gasLimit,
  gasToken: '0x0000000000000000000000000000000000000000',
  operationType: OPERATION_CALL,
};
