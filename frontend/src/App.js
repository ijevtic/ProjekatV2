// Importing modules
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import { Button, Card, Row, Col, Modal } from "react-bootstrap";
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
      getAPY();
      getPoolBalanceFromContract();
    }, 10000);
    return () => {
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    getPoolBalanceFromContract();
    getTransactionsFromAddress(address);
  }, [address]);

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
        getTransactionsFromAddress(address);
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
        getTransactionsFromAddress(address);
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

  const getTransactionsFromAddress = (address) => {
    if (address) {
      fetch("http://127.0.0.1:5000/transactions/" + address)
        .then((response) => response.json())
        .then((data) => {
          let jsonResult = JSON.parse(data);
          jsonResult.forEach((obj) => {
            obj["amount"] = ethers.utils.formatEther(obj["amount"].toString());
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
            <Button onClick={connect} variant="primary">
              Connect to wallet
            </Button>
            <br />
            <br />
            <strong>Pool Address: {contractAddress} </strong>
            <br />
            <strong>Pool Balance: {poolBalance} aWETH </strong>
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
