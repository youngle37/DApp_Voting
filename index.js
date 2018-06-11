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