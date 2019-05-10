import PendingExecutions from '../../../lib/services/transactions/PendingExecutions';
import { expect } from 'chai';
import { Message } from '@universal-login/commons';
import { transferMessage } from '../../fixtures/basicWalletContract';
import { loadFixture } from 'ethereum-waffle';
import { calculateMessageSignature, calculateMessageHash } from '@universal-login/contracts';
import basicWalletContractWithMockToken from '../../fixtures/basicWalletContractWithMockToken';
import PendingExecution from '../../../lib/utils/pendingExecution';
import { Wallet, Contract } from 'ethers';

const getMessageWith = async (from: string, privateKey : string) => {
  const message = { ...transferMessage, signature: '0x', from};
  const signature = await calculateMessageSignature(privateKey, message);
  return {...message, signature};
};

describe('PendingExecutionStore', () => {
  let store : PendingExecutions;
  let message : Message;
  let wallet: Wallet;
  let walletContract: Contract;
  let actionKey: string;

  beforeEach(async () => {
    ({ wallet, walletContract, actionKey } = await loadFixture(basicWalletContractWithMockToken));
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
    const signature1 = await calculateMessageSignature(wallet.privateKey, message);
    const signature2 = await calculateMessageSignature(actionKey, message);
    const hash1 = await store.add({...message, signature: signature1});
    const hash2 = await store.add({...message, signature: signature2});
    expect(hash1).to.be.equal(hash2);
    const collectedSignatures = (await store.getStatus(hash1)).collectedSignatures;
    expect(collectedSignatures).to.be.deep.equal([signature1, signature2]);
  });

  it('should check if execution is ready to execute', async () => {
    const signature1 = await calculateMessageSignature(wallet.privateKey, message);
    const signature2 = await calculateMessageSignature(actionKey, message);
    const hash1 = await store.add({...message, signature: signature1});
    expect(await store.isEnoughSignatures(hash1)).to.eq(false);
    const hash2 = await store.add({...message, signature: signature2});
    expect(await store.isEnoughSignatures(hash2)).to.eq(true);
  });

  it('should get added signed transaction', async () => {
    const pendingExecution = new PendingExecution(message.from, wallet);
    const hash = await store.add(message);
    await pendingExecution.push(message);
    expect(store.get(hash).toString()).to.equal(pendingExecution.toString());
  });
});