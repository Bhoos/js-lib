import getMetaData from './getMetaData';

const getInstanceId = getMetaData.bind(null, 'instance-id');
const getAmiId = getMetaData.bind(null, 'ami-id');
const getLocalIpV4 = getMetaData.bind(null, 'local-ipv4');
const getPublicIpV4 = getMetaData.bind(null, 'publish-ipv4');

export {
  getMetaData,

  getInstanceId,
  getAmiId,
  getLocalIpV4,
  getPublicIpV4,
};
