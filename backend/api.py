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


app = Flask(__name__)
api = Api(app)

array_apy = []
users_transaction_history = dict()

class Object(object):
    pass

class APY(Resource):
    def get(self):
        return array_apy

class TRANSACTIONS(Resource):
    def get(self):
        return json_util.dumps(users_transaction_history)


api.add_resource(APY, '/apy')
api.add_resource(TRANSACTIONS, '/transactions')

RAY = 10**27
SECONDS_PER_YEAR = 31536000


provider_url = 'https://kovan.infura.io/v3/75fe0c9d66ad48a7ba1e3c5ca2ac94a9'

w3 = Web3(Web3.HTTPProvider(provider_url))
contract_aave = w3.eth.contract(address = "0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe", abi = abi_aave)
contract_main = w3.eth.contract(address = "0xfDd15D6bFCa84b261551E47FA1438Fadb32B984E", abi = abi_main_contract)


event_filter1 = contract_main.events.Deposit.createFilter(fromBlock='latest')
event_filter2 = contract_main.events.Withdraw.createFilter(fromBlock='latest')

def get_database():
    from pymongo import MongoClient
    import pymongo

    # Provide the mongodb atlas url to connect python to mongodb using pymongo
    load_dotenv()

    CONNECTION_STRING = os.getenv('CONNECTION_STRING')
    # Create a connection using MongoClient. You can import MongoClient or use pymongo.MongoClient
    from pymongo import MongoClient
    client = MongoClient(CONNECTION_STRING)

    # Create the database for our example (we will use the same database throughout the tutorial
    return client['ProjekatV2']

def create_transaction_object(jsonEvent, table):
    x = Object()
    json_object = json.loads(jsonEvent)
    x.user = json_object['args']['user']
    x.amount = json_object['args']['amount']
    x.event = json_object['event']
    x.block_number = json_object['blockNumber']
    row = {"user": x.user, "amount": x.amount, "event": x.event, "block_number": x.block_number}
    table.insert_one(row)

    if(x.user not in users_transaction_history):
            users_transaction_history[x.user] = []
    users_transaction_history[x.user].append(x)

def collect_apy(apy_table, transactions_table):
    _,_,_,liq_rate,_,_,_,_,_,_,_,_ = contract_aave.functions.getReserveData('0xd0A1E359811322d97991E03f863a0C30C2cF029C').call()
    depositAPR = liq_rate/RAY
    depositAPY = ((1 + (depositAPR / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1
    row = {"time": time.time(), "value": depositAPY}
    array_apy.append(row)
    apy_table.insert_one(row)

    for deposit in event_filter1.get_new_entries():
        create_transaction_object(Web3.toJSON(deposit, transactions_table))
    
    for withdraw in event_filter2.get_new_entries():
        create_transaction_object(Web3.toJSON(withdraw, transactions_table))


if __name__ == '__main__':
    dbname = get_database()
    print(dbname)
    apy_table = dbname.apy
    transactions_table = dbname.transactions
    apy_cursor = apy_table.find()
    transactions_cursor = transactions_table.find()

    for apy in apy_cursor:
        array_apy.append({"time":apy["time"], "value": apy["value"]})
    
    for t in transactions_cursor:
        if t["user"] not in users_transaction_history:
            users_transaction_history[t["user"]] = []
        users_transaction_history[t["user"]].append({"amount": t["amount"], "event": t["event"], "block_number": t["block_number"]})
    
    scheduler = BackgroundScheduler()
    scheduler.add_job(lambda: collect_apy(apy_table, transactions_table), trigger="interval", seconds=12)
    scheduler.start()

    app.run(use_reloader=False)