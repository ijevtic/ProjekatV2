from flask import Flask
from flask_restful import reqparse, abort, Api, Resource
from web3 import Web3
import time
from abi import abi_aave, abi_main_contract
import atexit
import asyncio
import json
from apscheduler.schedulers.background import BackgroundScheduler


app = Flask(__name__)
api = Api(app)

class Object(object):
    pass

class APY(Resource):
    def get(self):
        return array_apy


api.add_resource(APY, '/apy')

RAY = 10**27
SECONDS_PER_YEAR = 31536000


provider_url = 'https://kovan.infura.io/v3/75fe0c9d66ad48a7ba1e3c5ca2ac94a9'
array_apy = []
users_transaction_history = dict()

w3 = Web3(Web3.HTTPProvider(provider_url))
contract_aave = w3.eth.contract(address = "0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe", abi = abi_aave)
contract_main = w3.eth.contract(address = "0xfDd15D6bFCa84b261551E47FA1438Fadb32B984E", abi = abi_main_contract)


event_filter1 = contract_main.events.Deposit.createFilter(fromBlock='latest')
event_filter2 = contract_main.events.Withdraw.createFilter(fromBlock='latest')

def get_database():
    from pymongo import MongoClient
    import pymongo

    # Provide the mongodb atlas url to connect python to mongodb using pymongo
    CONNECTION_STRING = "mongodb+srv://ivan2:1234@cluster0.1lcnh.mongodb.net/?retryWrites=true&w=majority"

    # Create a connection using MongoClient. You can import MongoClient or use pymongo.MongoClient
    from pymongo import MongoClient
    client = MongoClient(CONNECTION_STRING)

    # Create the database for our example (we will use the same database throughout the tutorial
    return client['user_shopping_list']

def create_transaction_object(jsonEvent):
    x = Object()
    json_object = json.loads(jsonEvent)
    x.user = json_object['args']['user']
    x.amount = json_object['args']['amount']
    x.event = json_object['event']
    x.block_number = json_object['blockNumber']

    if(x.user not in users_transaction_history):
            users_transaction_history[x.user] = []
    users_transaction_history[x.user].append(x)

def collect_apy():
    _,_,_,liq_rate,borrow_rate,_,_,_,_,_,_,_ = contract_aave.functions.getReserveData('0xd0A1E359811322d97991E03f863a0C30C2cF029C').call()
    depositAPR = liq_rate/RAY
    variableBorrowAPR = borrow_rate/RAY
    stableBorrowAPR = borrow_rate/RAY
    depositAPY = ((1 + (depositAPR / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1
    array_apy.append((depositAPY, time.time()))
    print('lolcina')

    for deposit in event_filter1.get_new_entries():
        create_transaction_object(Web3.toJSON(deposit))
    
    for withdraw in event_filter2.get_new_entries():
        create_transaction_object(Web3.toJSON(withdraw))


if __name__ == '__main__':
    dbname = get_database()
    print(dbname)
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=collect_apy, trigger="interval", seconds=5)
    scheduler.start()

    app.run(use_reloader=False)