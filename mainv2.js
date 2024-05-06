const {Blockchain, Transaction } = require("./Blockchain");
const EC = require('elliptic');
const prompt = require('prompt-sync')();
const { TaskContract } = require("./sc");
class Server {
  constructor(){
    this.Tcoin = new Blockchain();
    this.wallet = [];
    this.mapWallet = {};
  }
  generateWallet(balance){
    const ec = new EC.ec('secp256k1');
    const key = ec.genKeyPair();

    this.wallet.push({
      keyObj: key,
      publicKey: key.getPublic('hex'),
      privateKey: key.getPrivate('hex'),
      balance: balance
    });
    console.log(`Tao vi thanh cong`);
  }
  addmapWallet(address)
  {
    if(this.mapWallet.length === 0 || !(address in this.mapWallet))
      this.mapWallet[address] = this.wallet.length;
    console.log(this.mapWallet[address]);
  }
  setBalance(creator,assignee,amount){
    this.wallet[this.mapWallet[creator]].balance -= amount;
    this.wallet[this.mapWallet[assignee]].balance += parseInt(amount);
  }
  getBalance(address){
    return this.wallet[this.mapWallet[address]].balance;
  }
}
class Task {
  constructor(){
    this.id;
    this.creator;
    this.assignee;
    this.description;
    this.diff;
    this.reward;
    this.solution;
  }
  create()
  {
    this.creator = prompt("Nhap dia chi creator: ");
    this.description = prompt("Nhap Task can giao: ");
    this.diff = prompt("Nhap do kho: ");
    this.reward = prompt("Nhap phan thuong: ");
  }
  assign()
  {
    this.id = prompt("Nhap Task muon nhan: ");
    this.assignee = prompt("Nhap dia chi assignee: ");
  }
  setsolution()
  {
    this.solution = prompt("Nhap cau tra loi: ");
  }
}
class IWalletKey {
  constructor(key){
    this.keyObj = key;
    this.publicKey;
    this.privateKey;
  }
}

const server = new Server();
const sc = new TaskContract();
//
let task = new Task();
task.create();
sc.createTask(task.creator,task.description,task.diff,task.reward);

task.assign();
sc.assignTask(task.id, task.assignee,sc.tasks[task.id].creator);

server.addmapWallet(sc.tasks[task.id].creator);
server.generateWallet(100);
server.addmapWallet(sc.tasks[task.id].assignee);
server.generateWallet(100);

task.setsolution();
sc.acceptTask(sc.tasks[task.id].id,task.solution,sc.tasks[task.id].assignee);
console.log("Done Task");
let tran = new Transaction(server.wallet[server.mapWallet[sc.tasks[task.id].creator]].publicKey, server.wallet[server.mapWallet[sc.tasks[task.id].assignee]].publicKey, sc.tasks[task.id].description, sc.tasks[task.id].diff, sc.tasks[task.id].reward);

tran.signTransaction(server.wallet[server.mapWallet[sc.tasks[task.id].creator]].keyObj);

console.log("generate tran");
server.Tcoin.minePendingTransactions(tran,sc.tasks[task.id].diff);

sc.payReward(sc.tasks[task.id].id,sc.tasks[task.id].creator,server.wallet[server.mapWallet[sc.tasks[task.id].creator]].balance);
server.Tcoin.getBalanceOfAddress(sc.tasks[task.id].creator,server.wallet);
server.setBalance(sc.tasks[task.id].creator,sc.tasks[task.id].assignee,sc.tasks[task.id].reward);
let address = prompt("Nhap address: ");

console.log(server.getBalance(address));