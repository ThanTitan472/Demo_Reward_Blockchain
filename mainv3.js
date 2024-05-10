const {Blockchain, Transaction } = require("./Blockchain");
const EC = require('elliptic');
const prompt = require('prompt-sync')();
const { TaskContract } = require("./sc");
const WebSocket = require('ws');
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
var ID;
//
///////////

// Tạo một WebSocket Server trên port 3000
const wssS = new WebSocket.Server({ port: 3000 });
const wssR = new WebSocket.Server({ port: 3001 });
wssS.on('connection', function connection(ws) {
  console.log('Send connected');
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);

    // Chuyển đổi chuỗi JSON thành đối tượng JavaScript
    try {
      const data = JSON.parse(message);
      // Bây giờ bạn có thể truy cập các thuộc tính của đối tượng data
      sc.createTask(data.creator,data.description,data.difficult,data.reward);      

    } catch (e) {
      console.error('Error parsing message', e);
    }
  });
});
wssR.on('connection', function connection(ws) {
  console.log('Receiver connected');
  var data = JSON.stringify(sc.tasks[0]);
  ws.send(data);
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);

    // Chuyển đổi chuỗi JSON thành đối tượng JavaScript
    try {
      const data = JSON.parse(message);
      // Bây giờ bạn có thể truy cập các thuộc tính của đối tượng data
      ID = data.id;
      sc.assignTask(data.id, data.assignee,sc.tasks[data.id].creator);
      sc.acceptTask(sc.tasks[ID].id,data.solution,sc.tasks[ID].assignee);
      //
      server.addmapWallet(sc.tasks[ID].creator);
    server.generateWallet(100);
    server.addmapWallet(sc.tasks[ID].assignee);
    server.generateWallet(100);

    console.log("Done Task");
    let tran = new Transaction(server.wallet[server.mapWallet[sc.tasks[ID].creator]].publicKey, server.wallet[server.mapWallet[sc.tasks[ID].assignee]].publicKey, sc.tasks[ID].description, sc.tasks[ID].diff, sc.tasks[ID].reward);

    tran.signTransaction(server.wallet[server.mapWallet[sc.tasks[ID].creator]].keyObj);

    console.log("generate tran");
    server.Tcoin.minePendingTransactions(tran,sc.tasks[ID].diff);

    sc.payReward(sc.tasks[ID].id,sc.tasks[ID].creator,server.wallet[server.mapWallet[sc.tasks[ID].creator]].balance);
    server.Tcoin.getBalanceOfAddress(sc.tasks[ID].creator,server.wallet);
    server.setBalance(sc.tasks[ID].creator,sc.tasks[ID].assignee,sc.tasks[ID].reward);
    let address = prompt("Nhap address: ");
    console.log(server.getBalance(address));

    } catch (e) {
      console.error('Error parsing message', e);
    }
  });
});
console.log('WebSocket server is running on ws://localhost:3000');
console.log('WebSocket server is running on ws://localhost:3001');
