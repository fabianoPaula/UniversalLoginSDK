import PendingExecutions from '../../../lib/services/transactions/PendingExecutions';
import chai, { expect } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Message } from '@universal-login/commons';
import { transferMessage } from '../../fixtures/basicWalletContract';
import { loadFixture } from 'ethereum-waffle';
import { calculateMessageSignature, calculateMessageHash } from '@universal-login/contracts';
import basicWalletContractWithMockToken from '../../fixtures/basicWalletContractWithMockToken';
import PendingExecution from '../../../lib/utils/pendingExecution';

chai.use(chaiAsPromised);

const getMessageWith = async (from: string, privateKey : string) => {
  const message = { ...transferMessage, signature: '0x', from};
  const signature = await calculateMessageSignature(privateKey, message);
  return {...message, signature};
};

describe('PendingExecutionStore', () => {
  let store : PendingExecutions;
  let message : Message;

  beforeEach(async () => {
    const { wallet, walletContract } = await loadFixture(basicWalletContractWithMockToken);
    store = new PendingExecutions(wallet);
    message = await getMessageWith(walletContract.address, wallet.privateKey);
    await walletContract.setRequiredSignatures(2);
  });

  it('not present initally', () => {
    expect(store.isPresent('0x0123')).to.be.false;
  });

  it('should be addded', async () => {
    const hash = await store.add(message);
    expect(store.isPresent(hash)).to.be.true;
  });

  it('getStatus should trow error', async () => {
    const hash = calculateMessageHash(message);
    await expect(store.getStatus(hash)).to.eventually.rejectedWith('Unable to find execution with given message hash');
  });

  it('should sign message', async () => {
    const { actionKey } = await loadFixture(basicWalletContractWithMockToken);
    const signature1 = await calculateMessageSignature(store.getWallet().privateKey, message);
    const signature2 = await calculateMessageSignature(actionKey, message);
    const hash1 = await store.add({...message, signature: signature1});
    const hash2 = await store.add({...message, signature: signature2});
    expect(hash1).to.be.equal(hash2);
    const collectedSignatures = (await store.getStatus(hash1)).collectedSignatures;
    expect(collectedSignatures).to.be.deep.equal([signature1, signature2]);
  });

  it('should get added signed transaction', async () => {
    const pendingExecution = new PendingExecution(message.from, store.getWallet());
    const hash = await store.add(message);
    await pendingExecution.push(message);
    expect(store.get(hash).toString()).to.equal(pendingExecution.toString());
  });
});