// Importing modules
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import { Button, Card, Form, Modal } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { abi, contractAddress } from "./constants.js";
import CanvasJSReact from "./canvasjs.react";
var CanvasJS = CanvasJSReact.CanvasJS;
var CanvasJSChart = CanvasJSReact.CanvasJSChart;

function App() {
  const [address, setAddress] = useState("");
  const [balance, setBalance] = useState(0);
  const [poolBalance, setPoolBalance] = useState("0");
  const [baseValue, setBaseValue] = useState("0");
  const [interestValue, setInterestValue] = useState("0");
  const [modal, setModal] = useState(false);

  const handleClose = () => setModal(false);
  const handleShow = async () => {
    await calculateWithdrawAmount();
    setModal(true);
  };

  useEffect(() => {}, []);

  const connect = () => {
    if (window.ethereum) {
      window.ethereum.request({ method: "eth_requestAccounts" }).then((res) => {
        setAddress(res[0]);
        getbalance(res[0]);
      });
    } else {
      alert("install metamask extension!!");
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

  const listenForTransactionMine = (transactionResponse, provider) => {
    console.log(`Mining ${transactionResponse.hash}...`);
    return new Promise((resolve, reject) => {
      // listen for this tx to finish
      provider.once(transactionResponse.hash, (transactionReceipt) => {
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

    if (typeof window.ethereum !== "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);

      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        const transactionResponse = await contract.stakeEther({
          value: ethers.utils.parseEther(ethAmount),
        });

        // listen for the tx to be mined
        await listenForTransactionMine(transactionResponse, provider);
        console.log("done!");
        getbalance(address);
        getPoolBalanceFromContract();
      } catch (error) {
        console.log(error);
      }
    }
  };

  const getPoolBalanceFromContract = async () => {
    if (typeof window.ethereum != "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);

      try {
        console.log("Updating pool balance..");
        const result = await contract.getAWETHAddressBalance();
        console.log("Pool balance: " + result.toString());
        setPoolBalance(ethers.utils.formatEther(result.toString()));
      } catch (error) {
        console.log(error);
      }
    }
  };

  const calculateWithdrawAmount = async () => {
    if (typeof window.ethereum != "undefined") {
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        const result = await contract.balanceOfUser();
        setBaseValue(ethers.utils.formatEther(result[0].toString()));
        setInterestValue(ethers.utils.formatEther(result[1].toString()));
      } catch (error) {
        console.log(error);
      }
    }
  };

  const withdraw = async () => {
    handleClose();
    if (typeof window.ethereum != "undefined") {
      console.log("Withdrawing...");
      const provider = new ethers.providers.Web3Provider(window.ethereum);
      const signer = provider.getSigner();
      const contract = new ethers.Contract(contractAddress, abi, signer);
      try {
        const transactionResponse = await contract.extractEther();
        await listenForTransactionMine(transactionResponse, provider);
        getbalance(address);
        getPoolBalanceFromContract();
      } catch (error) {
        console.log(error);
      }
    }
  };

  function generateDataPoints(noOfDps) {
    var xVal = 1,
      yVal = 100;
    var dps = [];
    for (var i = 0; i < noOfDps; i++) {
      yVal = yVal + Math.round(5 + Math.random() * (-5 - 5));
      dps.push({ x: xVal, y: yVal });
      xVal++;
    }
    return dps;
  }

  const options = {
    theme: "light2", // "light1", "dark1", "dark2"
    animationEnabled: true,
    zoomEnabled: true,
    title: {
      text: "Pool APY",
    },
    data: [
      {
        type: "area",
        dataPoints: generateDataPoints(500),
      },
    ],
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
            <Button onClick={connect} variant="primary">
              Connect to wallet
            </Button>
            <br />
            <br />
            <strong>Pool Address: {contractAddress} </strong>
            <br />
            <strong>Pool Balance: {poolBalance} aWETH </strong>
            <Button onClick={getPoolBalanceFromContract} variant="primary">
              Update
            </Button>
          </Card.Text>
          <br />
          <Button onClick={deposit} variant="primary">
            Deposit
          </Button>
          <input id="ethAmount" type="number" placeholder="0" />
          <br />
          <Button onClick={handleShow} variant="primary">
            Withdraw
          </Button>
          
          <br />
          <br />

          <CanvasJSChart options={options} />

          <Modal show={modal} onHide={handleClose}>
            <Modal.Header closeButton>
              <Modal.Title>After Values</Modal.Title>
            </Modal.Header>
            <Modal.Body>
              Base Value: {baseValue} ETH
              <br />
              Interest Value: {interestValue} ETH
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
