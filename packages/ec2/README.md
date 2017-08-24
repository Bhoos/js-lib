# EC2 wrapper around AWS SDK
A simple instance launcher and terminator

# Installation
> `$ npm install @bhoos/js-ec2`

# Usage
```javascript
const { launchInstance, terminateInstance } from '@bhoos/ec2';

const instance = launchInstance('ami-id', 'token');
```

# API
## `launchInstance(amiId, token, type, wait, tags)`
**parameters**
- **amiId**
The AMI instance id based on which the instance is created
- **token**
A client side token to make sure that multiple instances
are not launched. (Idempotency)
- **type**
AWS instance type `t2.micro`, `t2.nano`, etc
- **wait**
Wait for the function to wait until the instance actually
launches
- **tags**
Key-Value pair tags to associate with the instance

**returns**  
The instance object with `InstanceId`, `PrivateIpAddress`, etc. Check full
object below
```javascript
{
  AmiLaunchIndex: 0,
  ImageId: 'ami-162b5479',
  InstanceId: 'i-06dddaef4a90285f8',
  InstanceType: 't2.nano',
  LaunchTime: 2017-08-21T16:39:51.000Z,
  Monitoring: { State: 'disabled' },
  Placement: { 
    AvailabilityZone: 'ap-south-1a',
    GroupName: '',
    Tenancy: 'default' 
  },
  PrivateDnsName: 'ip-172-31-27-189.ap-south-1.compute.internal',
  PrivateIpAddress: '172.31.27.189',
  ProductCodes: [ 
    { 
      ProductCodeId: '3f8t6t8fp5m9xx18yzwriozxi',
      ProductCodeType: 'marketplace' 
    } 
  ],
  PublicDnsName: '',
  State: { Code: 16, Name: 'running' },
  StateTransitionReason: '',
  SubnetId: 'subnet-c169eea8',
  VpcId: 'vpc-51fc7938',
  Architecture: 'x86_64',
  BlockDeviceMappings: [ { DeviceName: '/dev/xvda', Ebs: [Object] } ],
  ClientToken: '1503333591446',
  EbsOptimized: false,
  EnaSupport: true,
  Hypervisor: 'xen',
  ElasticGpuAssociations: [],
  NetworkInterfaces: [ 
    { 
      Attachment: [Object],
      Description: '',
      Groups: [Array],
      Ipv6Addresses: [],
      MacAddress: '02:25:e2:f1:d4:26',
      NetworkInterfaceId: 'eni-1298b34e',
      OwnerId: '700346145630',
      PrivateDnsName: 'ip-172-31-27-189.ap-south-1.compute.internal',
      PrivateIpAddress: '172.31.27.189',
      PrivateIpAddresses: [Array],
      SourceDestCheck: true,
      Status: 'in-use',
      SubnetId: 'subnet-c169eea8',
      VpcId: 'vpc-51fc7938' 
    } 
  ],
  RootDeviceName: '/dev/xvda',
  RootDeviceType: 'ebs',
  SecurityGroups: [ { GroupName: 'default', GroupId: 'sg-4f6e1226' } ],
  SourceDestCheck: true,
  Tags: [ { Key: 'name', Value: 'Test Instance' } ],
  VirtualizationType: 'hvm' 
}
```

## `terminateInstance(instanceId, wait)`
**paramters**
- **instanceId**
The EC2 instance id
- **wait**
Wait for the function to wait until the instance terminates
