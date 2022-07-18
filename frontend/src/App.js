// Importing modules
import React, { useState, useEffect } from "react";
import Web3Modal from 'web3modal'
import WalletConnect from "@walletconnect/web3-provider";
import { ethers } from "ethers";
import "./App.css";
import { Button, Card, Row, Col, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { abi, contractAddress } from "./constants.js";
import CanvasJSReact from "./canvasjs.react";
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

export const providerOptions = {
  walletconnect: {
    package: WalletConnect,
    options: {
      infuraId: "27e484dcd9e3efcfd25a83a78777cdf1"
    }
  }
};

const web3Modal = new Web3Modal({
  cacheProvider: true,
  providerOptions
});

function App() {
  const [address, setAddress] = useState("");
  const [contract, setContract] = useState();
  const [balance, setBalance] = useState(0);
  const [poolBalance, setPoolBalance] = useState("0");
  const [baseValue, setBaseValue] = useState("0");
  const [balanceInPool, setBalanceInPool] = useState("0");
  const [apyData, setApyData] = useState([]);
  const [addressTxData, setAddressTxData] = useState([]);
  const [modal, setModal] = useState(false);

  const handleClose = () => setModal(false);
  const handleShow = async () => {
    await calculateWithdrawAmount();
    setModal(true);
  };

  useEffect(() => {
    getAPY();
    const interval = setInterval(() => {
      if (contract) getCurrentBalance();
      getAPY();
      getPoolBalanceFromContract();
    }, 10000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    getPoolBalanceFromContract();
  }, [contract]);

  useEffect(() => {
    getTransactionsFromAddress();
  }, [address]);

  const connectWallet = async () => {
    try {
      await web3Modal.clearCachedProvider()
      const instance = await web3Modal.connect();
      const provider = new ethers.providers.Web3Provider(instance);
      const signer = provider.getSigner();
      const account = await signer.getAddress();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      setContract(contract);
      if (account) {
        setAddress(account);
        getbalance(account);
        getPoolBalanceFromContract();
      }
    } catch (error) {
      console.error(error);
    }
  };

  const getbalance = (address) => {
    // Requesting balance method
    window.ethereum
      .request({
        method: "eth_getBalance",
        params: [address, "latest"],
      })
      .then((balance) => {
        // Setting balance
        setBalance(ethers.utils.formatEther(balance));
      });
  };

  const listenForTransactionMine = (transactionResponse) => {
    console.log(`Mining ${transactionResponse.hash}...`);
    return new Promise((resolve, reject) => {
      // listen for this tx to finish
      contract.provider.once(transactionResponse.hash, (transactionReceipt) => {
        console.log(
          `Completed with ${transactionReceipt.confirmations} confirmations`
        );
        resolve();
      });
    });
  };

  const deposit = async () => {
    const ethAmount = document.getElementById("ethAmount").value;
    console.log(`Depositing ${ethAmount} ETH...`);

    if (contract) {
      try {
        const transactionResponse = await contract.stakeEther({
          value: ethers.utils.parseEther(ethAmount),
        });

        // listen for the tx to be mined
        await listenForTransactionMine(transactionResponse);
        console.log("done!");
        getbalance(address);
        getPoolBalanceFromContract();
        getTransactionsFromAddress();
      } catch (error) {
        console.log(error);
      }
    }
  };

  const getPoolBalanceFromContract = async () => {
    if (contract) {
      try {
        const result = await contract.getAWETHAddressBalance();
        setPoolBalance(ethers.utils.formatEther(result.toString()));
      } catch (error) {
        console.log(error);
      }
    }
  };

  const getCurrentBalance = async () => {
    if (contract) {
      try {
        const result = await contract.balanceOfUser();
        console.log(result);
        setBalanceInPool(ethers.utils.formatEther(result.toString()));
      } catch (error) {
        console.log(error);
      }
    }
  };

  const calculateWithdrawAmount = async () => {
    if (contract) {
      try {
        const result = await contract.realBalanceOfUser();
        console.log(result);
        setBaseValue(ethers.utils.formatEther(result.toString()));
      } catch (error) {
        console.log(error);
      }
    }
  };

  const withdraw = async () => {
    handleClose();
    if (contract) {
      console.log("Withdrawing...");
      try {
        const transactionResponse = await contract.extractEther();
        await listenForTransactionMine(transactionResponse);
        getbalance(address);
        getPoolBalanceFromContract();
        getTransactionsFromAddress();
      } catch (error) {
        console.log(error);
      }
    }
  };

  const options = {
    theme: "dark1", // "light1", "dark1", "dark2"
    animationEnabled: true,
    zoomEnabled: true,
    title: {
      text: "Pool APY",
    },
    data: [
      {
        type: "area",
        xValueFormatString: "MMM YYYY",
        dataPoints: apyData,
      },
    ],
  };

  const getAPY = async () => {
    console.log("Fetching APY...");
    fetch("http://127.0.0.1:5000/apy")
      .then((response) => response.json())
      .then((data) => {
        const jsonResult = JSON.parse(data);
        let array = [];

        jsonResult.forEach((obj) => {
          let date = new Date(0);
          date.setSeconds(obj["time"]);
          array.push({ x: date, y: obj["value"] });
        });

        setApyData(array);
      });
  };

  const getTransactionsFromAddress = async () => {
    if (address) {
      fetch("http://127.0.0.1:5000/transactions/" + address)
        .then((response) => response.json())
        .then((data) => {
          let jsonResult = JSON.parse(data);
          jsonResult.forEach((obj) => {
            console.log(obj);
            if(obj["event"] === "Withdraw"){
              console.log("Withdraw AAAAAAAAAAAAaa");
              console.log(obj["base"], obj["interest"]);
            }
          });
          setAddressTxData(jsonResult);
        });
    }
  };

  return (
    <div className="App">
      <Card className="text-center">
        <Card.Header>
          <strong>Wallet Address: {address}</strong>
          <br />
          <strong>Wallet Balance: {balance} ETH</strong>
        </Card.Header>
        <Card.Body>
          <Card.Text>
            <Button onClick={connectWallet} variant="primary">
              Connect to wallet
            </Button>
            <br />
            <br />
            <strong>Pool Address: {contractAddress} </strong>
            <br />
            <strong>Pool Balance: {poolBalance} aWETH </strong>
            <br />
            <strong>My Balance In Pool: {balanceInPool} aWETH </strong>
          </Card.Text>
          <br />

          {address && (
            <div>
              <Button onClick={deposit} variant="primary">
                Deposit
              </Button>
              <input id="ethAmount" type="number" placeholder="0" />
              <br />
              <Button onClick={handleShow} variant="primary">
                Withdraw
              </Button>
            </div>
          )}

          <br />
          <br />

          <CanvasJSChart options={options} />

          <br />
          <br />

          <Row xs={1} md={5} className="g-4">
            {addressTxData.map((tx, indx) => (
              <Col key={indx}>
                <Card
                  key={indx}
                  bg="dark"
                  text="white"
                  style={{ width: "18rem" }}
                >
                  <Card.Body>
                    <Card.Title>{tx.event}</Card.Title>
                    Amount : {tx.amount} ETH
                    <br />
                    Block Number : {tx.block_number}
                    <br />
                    {tx.event ==="Withdraw" && <>Earned from withdrawals: {(tx.base)} ETH<br /></>}
                    {tx.event ==="Withdraw" && <>Earned from interest: {(tx.interest)} ETH</>}
                    <Card.Text></Card.Text>
                  </Card.Body>
                </Card>
              </Col>
            ))}
          </Row>

          <Modal show={modal} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>After Values</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              After Value: {baseValue} ETH
              <br />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={handleClose}>
                Deny
              </Button>
              <Button variant="primary" onClick={withdraw}>
                Accept
              </Button>
            </Modal.Footer>
          </Modal>
        </Card.Body>
      </Card>
    </div>
  );
}

export default App;
