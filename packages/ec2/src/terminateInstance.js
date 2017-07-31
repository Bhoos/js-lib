import waitForInstanceState from './_waitForInstanceState';

const terminateInstance = EC2 => (id, wait = false) => {
  const params = {
    InstanceIds: [id],
  };

  return new Promise((resolve, reject) => {
    EC2.terminateInstances(params, (err, data) => {
      if (err) {
        return reject(err);
      }

      const instance = data.TerminatingInstances[0];
      if (!wait) {
        return resolve(instance);
      }

      return waitForInstanceState(EC2, instance,
        instance.CurrentState.Code, resolve, reject, 0, state => state !== 48);
    });
  });
};

export default terminateInstance;
