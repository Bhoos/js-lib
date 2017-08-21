import { launchInstance, terminateInstance } from '../src';

test('Check launching and terminating', () => {
  const token = `${Date.now()}`;
  return launchInstance('ami-162b5479', token, 't2.nano', true, { Name: 'Jest Test Instance' }).then((instance) => {
    return terminateInstance(instance.InstanceId, true);
  });
}, 3 * 60 * 1000);
