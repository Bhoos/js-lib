export default function transactionCreator(client) {
  let counter = 0;
  let transaction = null;
  let transactions = [];

  class Transaction {
    constructor(name) {
      this.name = name;
      this.success = null;
      this.error = null;
      this.finalized = false;
    }

    resolve = (res) => {
      if (this.finalized) {
        // TODO: Dev mode error
        throw new Error(`Transaction: ${this.name} - Resolving an already finalized transaction`);
      }

      this.success = res;
    }

    reject = (err) => {
      if (this.finalized) {
        // TODO: Dev mode error
        throw new Error(`Transaction: ${this.name} - Rejecting an already finalized transaction`);
      }
      this.error = err;
    }

    finalize(err) {
      if (this.finalized) {
        // TODO: Dev mode error
        throw new Error(`Transaction: ${this.name} - Finalizing already finalized transaction.`);
      }

      this.finalized = true;
      this.done(err);
    }

    done(err) {
      const error = this.error || err;
      if (error) {
        this.rejector(error);
      } else {
        this.resolver(this.success);
      }
    }

    handleSuccess = () => {
      counter -= 1;
      // console.log('transaction out', this.name, counter);
      if (counter === 0) {
        const temp = transactions;
        if (this.error) {
          transaction.discard(() => {
            temp.forEach(t => t.finalize());
          });
        } else {
          transaction.exec((err, res) => {
            // console.log('Transaction res', res);
            // Special case, result could be null
            if (res === null) {
              temp.forEach((t) => {
                t.resolve(null);
                t.finalize();
              });
            } else {
              temp.forEach(t => t.finalize(err));
            }
          });
        }
        transaction = null;
        transactions = null;
      }
    }

    handleError = (error) => {
      this.error = error;
      this.handleSuccess();
    }

    wait(scope) {
      Promise.resolve(scope(transaction, this.resolve, this.reject))
        .then(this.handleSuccess, this.handleError);

      return new Promise((resolve, reject) => {
        this.resolver = resolve;
        this.rejector = reject;
      });
    }
  }

  return (scope, name) => {
    // console.log('Trasnsaction IN',  name, counter);
    if (counter === 0) {
      transaction = client.multi();
      transactions = [];
    }
    counter += 1;
    const t = new Transaction(name);
    transactions.push(t);
    return t.wait(scope);
  };
}
