/**
 * Wait for the specific state of an instance. Retries until the specific state
 * is available. Throws error if the request could not be completed after maximum
 * retries.
 */
const RETRY_TIMEOUT = 7000;
const MAX_RETRY = 15;

export default function waitForInstanceState(EC2, instance, state,
  resolve, reject, count, waitUntil
) {
  if (!waitUntil(state)) {
    return resolve(instance);
  }

  if (count === MAX_RETRY) {
    return reject(new Error('Instance state pending after maximum retries'));
  }

  return setTimeout(() => {
    const params = {
      InstanceIds: [instance.InstanceId],
    };

    EC2.describeInstances(params, (err, data) => {
      if (err) {
        return reject(err);
      }

      const i = data.Reservations[0].Instances[0];
      return waitForInstanceState(EC2, i, i.State.Code, resolve, reject, count + 1, waitUntil);
    });
  }, RETRY_TIMEOUT);
}
