interface Tag {
  name: string;
  value: string;
}

interface Instance {
  InstanceId: string;
  PrivateIpAddress: string;
}

module EC2 {
  export function launchInstance(ami: string, token: string, instanceTyp = 'tc2.micro', wait = false, tags?: {}) : Promise<Instance>;
  export function terminateInstance(instanceId: string, wait = false): Promise<void>;
}

export = EC2;
