from decimal import Decimal

MULTIPLY = 10 ** 18

def calculate_base_interest(transactions:list, x:dict):
    user = x["user"]
    n = len(transactions)
    poz = -1
    for i in range(n-1, -1, -1):
        t = transactions[i]
        if t["event"] == "WithdrawInterest":
            continue
        if t["user"] == user:
            if t["event"] == "Withdraw":
                break
            poz = i
    
    total_interest = Decimal('0')
    staked_ether = Decimal('0')
    base_ether = Decimal('0')
    user_c = Decimal('0')

    for i in range(poz, n, 1):
        t = transactions[i]

        if i == poz:
            user_c = Decimal(t["new_c"])
            staked_ether += Decimal(t["amount"])
            base_ether += Decimal(t["amount"])
            continue

        if t["event"] == "WithdrawInterest":
            total_interest = 0
            continue
        nova_kamata = Decimal(t["old_c"]) * Decimal(t["newAmount"]) * staked_ether/ Decimal(t["oldAmount"])
        total_interest += (nova_kamata - staked_ether * Decimal(t["old_c"]))/user_c
        if t["user"] == user:
            if t["event"] == "Deposit":
                staked_ether = staked_ether * Decimal(t["new_c"]) / user_c + Decimal(t["amount"])
                user_c = Decimal(t["new_c"])
                base_ether += Decimal(t["amount"])
    
    nova_kamata = Decimal(x["old_c"]) * Decimal(x["newAmount"]) * staked_ether/ Decimal(x["oldAmount"])
    total_interest += (nova_kamata - staked_ether * Decimal(x["old_c"]))/user_c
    
    total_base = Decimal(x["amount"]) - total_interest - base_ether
    if total_base < 0:
        total_base = 0
    return str(total_base), str(total_interest)


if __name__ == '__main__':
    transactions = []
    x = {"user": "1", "amount": "100000000000000", "event": "Deposit", "block_number": "1", "old_c": "1000010977418723406", "new_c": "1000012827568936544", "oldAmount": "400002491503456", "newAmount": "400003231560027"}
    x2 = {"user": "1", "amount": "500004094965286", "event": "Withdraw", "block_number": "1", "old_c": "1000012827568936544", "new_c": "1000014554390452670", "oldAmount": "500003231560027", "newAmount": "500004094965290"}
    transactions.append(x)
    base, interest = calculate_base_interest(transactions, x2)
    print(base, interest)