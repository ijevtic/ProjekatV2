from flask import Flask
from flask_restful import reqparse, abort, Api, Resource
from web3 import Web3
import time
from abi import abi_aave, abi_main_contract
import atexit
import asyncio
import json
from apscheduler.schedulers.background import BackgroundScheduler
import os
from dotenv import load_dotenv
import bson.json_util as json_util
from flask_cors import CORS
from pymongo import MongoClient
from calculate import calculate_base_interest

app = Flask(__name__)
CORS(app)
api = Api(app)

array_apy = []
users_transaction_history = dict()
transactions = []


class Object(object):
    pass


class APY(Resource):
    def get(self):
        return json_util.dumps(array_apy)


class TRANSACTIONS(Resource):
    global users_transaction_history

    def get(self, address):
        if address not in users_transaction_history:
            users_transaction_history[address] = []
            print('lol')
            return json.dumps([])
        print(users_transaction_history[address])
        print(type(users_transaction_history))
        return json_util.dumps(users_transaction_history[address])


api.add_resource(APY, '/apy')
api.add_resource(TRANSACTIONS, '/transactions/<address>')

RAY = 10**27
SECONDS_PER_YEAR = 31536000


provider_url = 'https://kovan.infura.io/v3/75fe0c9d66ad48a7ba1e3c5ca2ac94a9'

w3 = Web3(Web3.HTTPProvider(provider_url))
contract_aave = w3.eth.contract(
    address="0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe", abi=abi_aave)
contract_main = w3.eth.contract(
    address="0x24eD12F36411171D3F854dc9af9d4552988FD8Ec", abi=abi_main_contract)


transaction_filter = contract_main.events.Transaction.createFilter(
    fromBlock='latest')
withdraw_filter = contract_main.events.WithdrawInterest.createFilter(
    fromBlock='latest')


def get_database():

    load_dotenv()

    CONNECTION_STRING = os.getenv('CONNECTION_STRING')

    client = MongoClient(CONNECTION_STRING)

    return client['ProjekatV2']


def get_object(json_object):
    return {
        "user": json_object['args']['user'].lower(),
        "amount": json_object['args']['amount'],
        "event": json_object['args']['transactionType'],
        "block_number": json_object['blockNumber'],
        "oldAmount": json_object['args']['oldAmount'],
        "newAmount": json_object['args']['newAmount'],
        "old_c": json_object['args']['old_c'],
        "new_c": json_object['args']['new_c']
    }


def create_transaction_object(jsonEvent, table, type):
    x = Object()
    json_object = json.loads(jsonEvent)
    row = dict()
    x = dict()
    print(json_object)
    if type == "transaction":
        row = get_object(json_object)
        x = get_object(json_object)
    else:
        row = {"event": "WithdrawInterest",
               "block_number": json_object['blockNumber']}
        x = {"event": "WithdrawInterest",
             "block_number": json_object['blockNumber']}

    if x["event"] == "Withdraw":
        base, interest = calculate_base_interest(transactions, x)
        x["base"] = base
        x["interest"] = interest
        row["base"] = base
        row["interest"] = interest

    if(x["user"] not in users_transaction_history):
        users_transaction_history[x["user"]] = []
    users_transaction_history[x["user"]].append(x)

    transactions.append(x)

    table.insert_one(row)


def collect_apy(apy_table, transactions_table):
    _, _, _, liq_rate, _, _, _, _, _, _, _, _ = contract_aave.functions.getReserveData(
        '0xd0A1E359811322d97991E03f863a0C30C2cF029C').call()
    depositAPR = liq_rate/RAY
    depositAPY = ((1 + (depositAPR / SECONDS_PER_YEAR))
                  ** SECONDS_PER_YEAR) - 1
    row = {"time": time.time(), "value": depositAPY}
    array_apy.append(row)
    apy_table.insert_one(row)

    for transaction in transaction_filter.get_new_entries():
        create_transaction_object(Web3.toJSON(
            transaction), transactions_table, "transaction")
    for transaction in withdraw_filter.get_new_entries():
        create_transaction_object(Web3.toJSON(
            transaction), transactions_table, "WithdrawInterest")


if __name__ == '__main__':
    dbname = get_database()
    print(dbname)
    apy_table = dbname.apy
    transactions_table = dbname.transactions
    apy_cursor = apy_table.find()
    transactions_cursor = transactions_table.find()

    for apy in apy_cursor:
        array_apy.append({"time": apy["time"], "value": apy["value"]})

    for t in transactions_cursor:
        if t["event"] == "WithdrawInterest":
            transactions.append(
                {"event": "WithdrawInterest", "block_number": t["block_number"]})
        else:
            if t["user"] not in users_transaction_history:
                users_transaction_history[t["user"]] = []
            transaction = {"amount": t["amount"],
                           "newAmount": t["newAmount"],
                           "oldAmount": t["oldAmount"],
                           "event": t["event"], "block_number": t["block_number"], "old_c": t["old_c"], "new_c": t["new_c"]}
            if t["event"] == "Withdraw":
                transaction["base"] = t["base"]
                transaction["interest"] = t["interest"]
            users_transaction_history[t["user"]].append(transaction)
            transactions.append(transaction)
    for t in transactions:
        print(t["block_number"])

    scheduler = BackgroundScheduler()
    scheduler.add_job(lambda: collect_apy(
        apy_table, transactions_table), trigger="interval", seconds=5)
    scheduler.start()

    app.run(use_reloader=False)
