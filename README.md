# Simple Voting DApp

## Slides
[Link](https://slides.com/youngle37/dapp)

## Prerequisites
* Node.js
* npm

## How to build
### Initialize and install dependencies
```
$ mkdir Voting
$ cd Voting
$ npm init
$ npm install -g ethereumjs-testrpc http-server
$ npm install solc web3@0.20.1 --save
```

### Writing contract
```
$ code Voting.sol       # Using VSCode to edit. You can use other editor of course.
```

Voting.sol：
```
pragma solidity ^0.4.11;
// 指定 compiler 的版本

contract Voting {
  
    // bytes32 -> uint8 的一個 map，用來存候選人的票數
    mapping (bytes32 => uint8) public votesReceived;

    // Solidity 不給傳字串的陣列，所以用 bytes32 的陣列來存候選人列表
    bytes32[] public candidateList;

    // 合約的建構子，傳入候選人列表以建立合約
    function Voting(bytes32[] candidateNames) public {
        candidateList = candidateNames;
    }

    // 檢視某個候選人目前所得的票數
    function totalVotesFor(bytes32 candidate) public returns (uint8) {
        assert(validCandidate(candidate) == true);
        return votesReceived[candidate];
    }

    // 幫某個候選人票數 + 1
    function voteForCandidate(bytes32 candidate) public {
        assert(validCandidate(candidate) == true);
        votesReceived[candidate] += 1;
    }

    // 確認傳入的候選人是否真的在列表中
    function validCandidate(bytes32 candidate) private returns (bool) {
        for(uint i = 0; i < candidateList.length; i++) {
            if (candidateList[i] == candidate) {
                return true;
            }
        }
        return false;
    }
}
```

### Writing script to deploy.

deployContract.js：
```
var solc = require("solc"); // 匯入 Solidity Compiler
var Web3 = require("web3"); // 匯入 web3
var fs = require("fs");  // 匯入 file system 模組

// 初始化 web3 這個物件去監聽 port 8545 (testrpc 的 port) 才能跟 blockchain 溝通
var web3 = new Web3(new Web3.providers.HttpProvider("http://localhost:8545"));

// 顯示所有錢包
console.log("\n------------ LOGGING ACCOUNTS -------------\n");
console.log(web3.eth.accounts);

// 編譯合約，利用 fs 模組去拿到 Voting.sol 的內容並使用 solc 編譯
var code = fs.readFileSync("Voting.sol").toString();
var compiledCode = solc.compile(code);

// 顯示編譯完的 code 的醜樣
console.log("\n------------ LOGGING COMPILED CODE -------------\n");
console.log(compiledCode);

// 從編譯完的 code 中取得合約的 bytecode 並顯示出來
var byteCode = compiledCode.contracts[":Voting"].bytecode;
console.log("\n------------ LOGGING BYTECODE -------------\n");
console.log(byteCode);

// 從編譯完的 code 中取得合約的介面，叫 Application Binary Interface (ABI)，用來告訴用戶能怎麼使用這個合約
// 並顯示出來
var abi = compiledCode.contracts[":Voting"].interface;
console.log("\n------------ LOGGING Application Binary Interface (ABI) -------------\n");
console.log(abi);

// 將 ABI 字串轉成 json 格式
var abiDefinition = JSON.parse(abi);

// 部署合約

// 1. 先建立一個物件用來部署及初始化合約
var VotingContract = web3.eth.contract(abiDefinition);

var contractInstance;

// 2. 用下面的 VotingContract.new 去部署合約到 blockchain

// 一開始的參數是要傳入合約 contructor 的參數，因此傳入 [ "==", "= =" ] 這個陣列
// 如果合約 contructor 有超過一個以上的參數，那就直接加在第一個參數後。 

// 接下來的參數是要部署合約的參數們
// data：為編譯過的合約，也就是 bytecode
// from：為部署此合約的錢包，這裡用第一個錢包當例子。在測試環境中，testrpc 幫我們解鎖了所有錢包，所以可以很方便的直接使用。在正式環境上，還需要再附上在創造錢包時所需要的密碼以證明你為錢包的擁有者。
// gas：部署合約在 Blockchain 上是需要手續費的，此數量為你願意支付的手續費。這些手續費會給那些幫你部署的礦工們，根據合約的複雜度可以計算出你需要支付多少手續費。

// 最後一個參數為 callback function ， 當合約被部署後此 function 會被呼叫，而參數則為 error 或是一個合約的 instance。

var deployedContract = VotingContract.new(
    ["==", "= ="],
    {
        data: byteCode,
        from: web3.eth.accounts[0],
        gas: 4700000
    },
    function(e, contract) {
        if (!e) {
            if (!contract.address) {
                console.log("\n------------ Contract waiting to be mined -------------\n");
                console.log("Contract transaction send: TransactionHash: " + contract.transactionHash + " waiting to be mined...\n");
            } else {
                console.log("Contract mined! Address: " + contract.address);
                console.log("\n------------ LOGGING Deployed Contract  -------------\n");
                // 當你要使用合約時，你必須要有合約的 address 以及 ABI
                console.log(contract);

                console.log("\n------------ LOGGING Contract Address -------------\n");
                console.log(contract.address);

                // 從合約 address 拿一個 instance
                contractInstance = VotingContract.at(contract.address);

                // 將 contract address 和 ABI 寫入 contract.json 讓客戶端可以使用
                fs.writeFile("./contract.json",
                    JSON.stringify(
                    {
                        address: contract.address,
                        abi: JSON.stringify(abiDefinition, null, 2)
                    },
                    null,
                    2),
                    "utf-8",
                    function(err) {
                            if (err) {
                                console.log("ERROR: ");
                                console.log(err);
                            } else {
                                console.log(`The file ./contract.json was saved!`);
                            }
                    }
                );
            }
        } else {
            console.log(e);
        }
    }
);
```

### Update script in package.json

package.json：
```
"scripts": {
    "start": "node deployContract.js && http-server .",         # Adding this line in "scripts" part.
    "test": "echo \"Error: no test specified\" && exit 1"
  },
```

### Create frontend

index.html：
```
<!DOCTYPE html>
<html>

<head>
  <title>DApp Hello_World</title>
  <link href='https://fonts.googleapis.com/css?family=Open+Sans:400,700' rel='stylesheet' type='text/css'>
  <link href='https://maxcdn.bootstrapcdn.com/bootstrap/3.3.7/css/bootstrap.min.css' rel='stylesheet' type='text/css'>
</head>

<body class="container">
  <h1>都 2018 了還有人 = = 加空格</h1>
  <h2 style="color: red;">10.0.0.0:8080</h2>
  <div class="table-responsive">
    <table class="table table-bordered">
      <thead>
        <tr>
          <th>候選人</th>
          <th>票數</th>
        </tr>
      </thead>
      <tbody>
        <tr>
          <td>==</td>
          <td id="candidate-1"></td>
        </tr>
        <tr>
          <td>= =</td>
          <td id="candidate-2"></td>
        </tr>
      </tbody>
    </table>
  </div>
  <input type="text" id="candidate">
  <input type="button" onclick="voteForCandidate()" class="btn btn-primary" value="Vote">
</body>

<script src="https://cdn.jsdelivr.net/npm/web3@0.19.0/dist/web3.js"></script>
<!--<script src="https://cdn.jsdelivr.net/npm/web3@0.20.2/dist/web3.min.js"></script> -->
<script src="https://code.jquery.com/jquery-3.2.1.min.js" integrity="sha256-hwg4gsxgFZhOsEEamdOYGBf13FyQuiTwlAQgxVSNgt4="
  crossorigin="anonymous"></script>
<script src="./index.js"></script>

</html>
```

### Connect it all together using index.js
index.js：
```
// 跑完所有 script 後才跑這個 function
window.onload = function() {
    // 初始化 web3
    var web3 = new Web3(new Web3.providers.HttpProvider("http://192.168.0.102:8545"));
    var contractInstance;

    // 事先建好表方便更新票數
    var candidates = {
        "==": "candidate-1",
        "= =": "candidate-2"
    };

    var candidateNames = Object.keys(candidates);

    // 載入之前寫的 contract.json
    $.getJSON("./contract.json", function(contract) {

        // 利用 contract 的 address 去拿到 contract 的 instance
        contractInstance = web3.eth.contract(JSON.parse(contract.abi)).at(contract.address);

        // 當 Vote 按鈕被按時，會呼叫此 function
        window.voteForCandidate = function() {
            candidateName = $("#candidate").val();

            // 使用第一個帳號(web3.eth.accounts[0])去投票
            contractInstance.voteForCandidate(candidateName, {from: web3.eth.accounts[0]},
                function() {
                    let div_id = candidates[candidateName];
                    // 顯示目前所得票數
                    $("#" + div_id).html(contractInstance.totalVotesFor.call(candidateName).toString());
                }
            );
        };

        // 顯示所有候選人票數
        for (var i = 0; i < candidateNames.length; i++) {
            let name = candidateNames[i];
            $("#" + candidates[name]).html(contractInstance.totalVotesFor.call(name).toString());
        }
    });
};
```

### Run testrpc and Web
```
$ testrpc
```

and open another terminal
```
$ npm start
```