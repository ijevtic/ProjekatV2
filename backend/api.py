from flask import Flask
from flask_restful import reqparse, abort, Api, Resource
from web3 import Web3
import time
from abi import abi
import atexit
from apscheduler.schedulers.background import BackgroundScheduler


app = Flask(__name__)
api = Api(app)

TODOS = {
    'todo1': {'task': 'build an API'},
    'todo2': {'task': '?????'},
    'todo3': {'task': 'profit!'},
}


def abort_if_todo_doesnt_exist(todo_id):
    if todo_id not in TODOS:
        abort(404, message="Todo {} doesn't exist".format(todo_id))

parser = reqparse.RequestParser()
parser.add_argument('task')


# Todo
# shows a single todo item and lets you delete a todo item
class Todo(Resource):
    def get(self, todo_id):
        abort_if_todo_doesnt_exist(todo_id)
        return TODOS[todo_id]

    def delete(self, todo_id):
        abort_if_todo_doesnt_exist(todo_id)
        del TODOS[todo_id]
        return '', 204

    def put(self, todo_id):
        args = parser.parse_args()
        task = {'task': args['task']}
        TODOS[todo_id] = task
        return task, 201


class APY(Resource):
    def get(self):
        return array_apy


api.add_resource(APY, '/apy')
api.add_resource(Todo, '/todos/<todo_id>')

RAY = 10**27
SECONDS_PER_YEAR = 31536000


provider_url = 'https://kovan.infura.io/v3/75fe0c9d66ad48a7ba1e3c5ca2ac94a9'
array_apy = []

w3 = Web3(Web3.HTTPProvider(provider_url))
contract_instance = w3.eth.contract(address = "0xE0fBa4Fc209b4948668006B2bE61711b7f465bAe", abi = abi)

def collect_apy():
    _,_,_,liq_rate,borrow_rate,_,_,_,_,_,_,_ = contract_instance.functions.getReserveData('0xd0A1E359811322d97991E03f863a0C30C2cF029C').call()
    depositAPR = liq_rate/RAY
    variableBorrowAPR = borrow_rate/RAY
    stableBorrowAPR = borrow_rate/RAY
    depositAPY = ((1 + (depositAPR / SECONDS_PER_YEAR)) ** SECONDS_PER_YEAR) - 1
    array_apy.append((depositAPY, time.time()))
    print('lolcina')

if __name__ == '__main__':
    print(time.time())
    
    scheduler = BackgroundScheduler()
    scheduler.add_job(func=collect_apy, trigger="interval", seconds=5)
    scheduler.start()
    app.run(use_reloader=False)