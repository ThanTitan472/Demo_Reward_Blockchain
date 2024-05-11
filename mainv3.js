const {Blockchain, Transaction } = require("./Blockchain");
const EC = require('elliptic');
const prompt = require('prompt-sync')();
const { TaskContract } = require("./sc");
const WebSocket = require('ws');
const fs = require('fs');
class Server {
  constructor(){
    this.Tcoin;
    this.mapWallet;
  }
  loadData()
  {
    fs.readFile('blockchain.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Lỗi khi đọc file:', err);
        return;
      }
      if(data)
        this.Tcoin = JSON.parse(data);
      else
        this.Tcoin = new Blockchain();
    });
    fs.readFile('wallet.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Lỗi khi đọc file:', err);
        return;
      }
      if(data)
        this.mapWallet = JSON.parse(data);
      else
        this.mapWallet = {};
    });
  }
  generateWallet(balance){
    const ec = new EC.ec('secp256k1');
    const key = ec.genKeyPair();
    const wallet =
    {
      keyObj: key,
      publicKey: key.getPublic('hex'),
      privateKey: key.getPrivate('hex'),
      balance: balance
    };
    console.log(`Tao vi thanh cong`);
    return wallet;
  }
  addmapWallet(address, balance)
  {
    if(this.mapWallet.length === 0 || !(address in this.mapWallet))
      this.mapWallet[address] = this.generateWallet(balance);
  }
  setBalance(creator,assignee,amount){
    this.mapWallet[creator].balance -= amount;
    this.mapWallet[assignee].balance += parseInt(amount);
  }
  getBalance(address){
    // if(address in this.mapWallet)
    //   return this.mapWallet[address].balance;
    // else
    //   return 0;
    fs.readFile('wallet.json', 'utf8', (err, data) => {
      if (err) {
        console.error('Lỗi khi đọc file:', err);
        return;
      }
      if(data)
        {
          const _data = JSON.parse(data);
          console.log(_data[address].balance);
          return _data[address].balance;
        }
      else
        return 0;
    });
  }
  saveWallet()
  {
    const data = JSON.stringify(this.mapWallet, null, 2);
    fs.writeFile('wallet.json', data, 'utf8', err => {
      if (err) throw err;
      console.log('Saved Wallet');
    });
  }
  saveBlockchain()
  {
    const data = JSON.stringify(this.Tcoin, null, 2);
    fs.writeFile('blockchain.json', data, 'utf8', err => {
      if (err) throw err;
      console.log('Saved Blockchain');
    });
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
server.loadData();
const sc = new TaskContract();
sc.LoadData();
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
      if(data.type === 'sendTask')
        sc.createTask(data.content.creator,data.content.description,data.content.difficult,data.content.reward);
      if(data.type === 'checkWallet')
        {
          var data_ = JSON.stringify({type:'returnWallet',balance: server.getBalance(data.address)
          });
          ws.send(data_);
        }     

    } catch (e) {
      console.error('Error parsing message', e);
    }
  });
});
wssR.on('connection', function connection(ws) {
  console.log('Receiver connected');
  var data = JSON.stringify({type: 'sendtask', content: sc.tasks[0]});
  ws.send(data);
  ws.on('message', function incoming(message) {
    console.log('received: %s', message);

    // Chuyển đổi chuỗi JSON thành đối tượng JavaScript
    try {
      const data = JSON.parse(message);
      if(data.type === 'acceptTask')
      // Bây giờ bạn có thể truy cập các thuộc tính của đối tượng data
      {
        ID = data.content.id;
        sc.assignTask(data.content.id, data.content.assignee,sc.tasks[data.content.id].creator);
        sc.acceptTask(sc.tasks[ID].id,data.content.solution,sc.tasks[ID].assignee);
        //
        // server.addmapWallet(sc.tasks[ID].creator);
        // server.generateWallet(100);
        // server.addmapWallet(sc.tasks[ID].assignee);
        // server.generateWallet(100);

        server.addmapWallet(sc.tasks[ID].creator,100);
        server.addmapWallet(sc.tasks[ID].assignee,100);

        console.log("Done Task");
        let tran = new Transaction(server.mapWallet[sc.tasks[ID].creator].publicKey, server.mapWallet[sc.tasks[ID].assignee].publicKey, sc.tasks[ID].description, sc.tasks[ID].diff, sc.tasks[ID].reward);

        tran.signTransaction(server.mapWallet[sc.tasks[ID].creator].keyObj);

        console.log("generate tran");
        server.Tcoin.minePendingTransactions(tran,sc.tasks[ID].diff);

        sc.payReward(sc.tasks[ID].id,sc.tasks[ID].creator,server.mapWallet[sc.tasks[ID].creator].balance);
        // server.Tcoin.getBalanceOfAddress(sc.tasks[ID].creator,server.wallet);
        server.setBalance(sc.tasks[ID].creator,sc.tasks[ID].assignee,sc.tasks[ID].reward);
        //Save
        server.saveBlockchain();
        server.saveWallet();
        sc.saveData();
      }
      if(data.type === 'checkWallet')
        {
          var _data = JSON.stringify({type:'returnWallet',balance: server.getBalance(data.address)
          });
          ws.send(_data);
        }

    } catch (e) {
      console.error('Error parsing message', e);
    }
    wssS.on('connection', function connection(ws)
    {
      var data = JSON.stringify({type: 'finishtask', content: sc.tasks[ID]});
      ws.send(data);
    });
  });
});
console.log('WebSocket server is running on ws://localhost:3000');
console.log('WebSocket server is running on ws://localhost:3001');

