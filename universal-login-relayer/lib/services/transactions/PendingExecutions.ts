import PendingExecution from '../../utils/pendingExecution';
import { Message } from '@universal-login/commons';
import {calculateMessageHash} from '@universal-login/contracts';
import { Wallet } from 'ethers';

export default class PendingExecutions {
  public executions: Record<string, PendingExecution>;

  constructor(private wallet : Wallet) {
    this.executions = {};
  }

  isPresent(messageHash : string) {
    return messageHash in this.executions;
  }

  private throwIfNotPresent(hash: string) {
    if (!this.isPresent(hash)) {
      throw 'Unable to find execution with given message hash';
    }
  }

  async add(message: Message) : Promise<string> {
    const hash = calculateMessageHash(message);
    if (!this.isPresent(hash)) {
      this.executions[hash] = new PendingExecution(message.from, this.wallet);
    }
    await this.signExecution(hash, message);
    return hash;
  }

  private async signExecution(hash: string, message: Message) {
    await this.executions[hash].push(message);
  }

  async getStatus(hash: string) {
    this.throwIfNotPresent(hash);
    return this.executions[hash].getStatus();
  }

  async getConcatenatedSignatures(hash: string) : Promise<string> {
    return  '';
  }

  async confirmExecution(hash: string) {

  }

  async isEnoughSignatures(hash: string) : Promise<boolean> {
    this.throwIfNotPresent(hash);
    return this.executions[hash].isEnoughSignatures();
  }

  get(hash: string) {
    return this.executions[hash];
  }
}
