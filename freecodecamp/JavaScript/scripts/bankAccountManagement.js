class BankAccount {
constructor(balance, transactions) {
    this.balance = 0;
    this.transactions = [];
    }
    deposit (depositAmt) {
    if (depositAmt <= 0) {
        return `Deposit amount must be greater than zero.`;
        }
    this.transactions.push({"type": "deposit",
     amount: depositAmt});
    this.balance += depositAmt;
    return `Successfully deposited $${depositAmt}. New balance: $${this.balance}`;
    }
    
    checkBalance() {
        return `Current balance: $${this.balance}`;
    }

    withdraw (withdrawAmt) {
    if (withdrawAmt <= 0 || withdrawAmt > this.balance) {
    return "Insufficient balance or invalid amount.";
    } else {
        this.transactions.push({"type": "withdraw",
        amount: withdrawAmt});
        this.balance -= withdrawAmt;
        return `Successfully withdrew $${withdrawAmt}. New balance: $${this.balance}`;
        }
    }
    listAllDeposits () {
        const deposits = this.transactions
        .filter((transaction) => transaction.type === 'deposit')
        .map((transaction) => transaction.amount);
        return "Deposits: " + deposits.join(",");
    }
        listAllWithdrawals () {
        const withdraws = this.transactions
        .filter((transaction) => transaction.type === 'withdraw')
        .map((transaction) => transaction.amount);
        return "Withdrawals: " + withdraws.join(",");
    }
}
const myAccount = new BankAccount();
console.log(myAccount.deposit(100));
myAccount.deposit(50);
myAccount.withdraw(10);
myAccount.deposit(500);
myAccount.withdraw(100);
myAccount.withdraw(10);
console.log(myAccount.withdraw(100));


