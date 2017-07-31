import waitForInstanceState from './_waitForInstanceState';

const launchInstance = EC2 => (ami, token, instanceType = 't2.micro', wait = false, tags = null) => {
  const params = {
    ImageId: ami,
    MinCount: 1,
    MaxCount: 1,
    ClientToken: token,
    InstanceType: instanceType,
  };

  if (tags) {
    params.TagSpecifications = [{
      ResourceType: 'instance',
      Tags: Object.keys(tags).map(Key => ({ Key, Value: tags[Key] })),
    }];
  }

  return new Promise((resolve, reject) => {
    EC2.runInstances(params, (err, data) => {
      if (err) {
        return reject(err);
      }

      const instance = data.Instances[0];

      // If wait flag has not been set, just return the instance object
      if (!wait) {
        return resolve(instance);
      }

      // Wait until the instance has started
      return waitForInstanceState(EC2, instance, instance.State.Code, resolve, reject, 0,
        state => state === 0);
    });
  });
};

export default launchInstance;
