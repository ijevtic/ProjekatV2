// Importing modules
import React, { useState, useEffect } from "react";
import { ethers } from "ethers";
import "./App.css";
import { Button, Card, Form } from "react-bootstrap";
import "bootstrap/dist/css/bootstrap.min.css";
import { abi, contractAddress } from "./constants.js"

function App() {

  const [address, setAddress] = useState("")
  const [balance, setBalance] = useState(0)

  useEffect(() => {

  }, []);

  const connect = () => {

    if (window.ethereum) {

      window.ethereum
        .request({ method: "eth_requestAccounts" })
        .then((res) => {
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
        params: [address, "latest"]
      })
      .then((balance) => {
        // Setting balance
        setBalance(ethers.utils.formatEther(balance));
      });
  };

  const listenForTransactionMine = (transactionResponse, provider) => {
    console.log(`Mining ${transactionResponse.hash}...`)
    return new Promise((resolve, reject) => {
      // listen for this tx to finish
      provider.once(transactionResponse.hash, (transactionReceipt) => {
        console.log(`Completed with ${transactionReceipt.confirmations} confirmations`)
        resolve()
      })
    })
  }

  const deposit = async () => {
    const ethAmount = document.getElementById("ethAmount").value;
    console.log(`Depositing ${ethAmount} ETH...`);

    if (typeof window.ethereum !== "undefined") {

      const provider = new ethers.providers.Web3Provider(window.ethereum)

      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        const transactionResponse = await contract.stakeEther({ value: ethers.utils.parseEther(ethAmount) })
        // listen for the tx to be mined
        await listenForTransactionMine(transactionResponse, provider)
        console.log("done!")
      } catch (error) {
        console.log(error)
      }
    }
  }


  const withdraw = async () => {
    if (typeof window.ethereum != "undefined") {
      console.log("Withdrawing...")
      const provider = new ethers.providers.Web3Provider(window.ethereum)
      const signer = provider.getSigner()
      const contract = new ethers.Contract(contractAddress, abi, signer)
      try {
        const transactionResponse = await contract.extractEther()
        await listenForTransactionMine(transactionResponse, provider)
      } catch (error) {
        console.log(error)
      }
    }
  }


  return (
    <div className="App">

      <Card className="text-center">
        <Card.Header>
          <strong>Address: {address}</strong>
        </Card.Header>
        <Card.Body>
          <Card.Text>
            <strong>Balance: {balance}</strong>
          </Card.Text>
          <Button onClick={connect} variant="primary">
            Connect to wallet
          </Button>
          <br />
          <Button onClick={deposit} variant="primary">
            Deposit
          </Button>
          <input id="ethAmount" type="number" placeholder="0" />
          <br />
          <Button onClick={withdraw} variant="primary">
            Withdraw
          </Button>
        </Card.Body>
      </Card>
    </div>
  );
}

export default App;

