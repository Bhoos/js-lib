/**
 * EC2 Wrapper module
 * @module @bhoos/aws/lib/EC2
 */
import launchInstanceFactory from './launchInstance';
import terminateInstanceFactory from './terminateInstance';
import * as metaData from './meta-data';
import getUserData from './user-data/getUserData';

const AWS = require('aws-sdk');

const REGION = process.env.AWS_REGION;

AWS.config.update({
  region: REGION,
});

const EC2 = new AWS.EC2();

/**
 * Launch an EC2 instance on a preconfigured AWS region provided by
 * `AWS_REGION` environment variable.
 * @param {string} ami - The image id available on the AWS region used as
 *                       a template to create the instance
 * @param {string} token - The client token that corresponds to `ClientToken` in
 *                         AWS params, used to make sure that the instances are
 *                         not run multiple times. The token acts as a client side
 *                         unique id for the instance
 * @param {string} [instanceTy=t2.micro] - The AWS instance type
 * @param {boolean} [wait=false] - A boolean flag that determines if the method must resolve
 *                         immediately triggering an instance launch or wait for the instance
 *                         to start
 *                          Internally it uses timeouts and a number of retries calling
 *                          `describeInstance` to determine the started state when waited.
 * @param {object} tags -  A key value pair for the tags to be associated with the instance
 * @param {string} userData A user data to be associated with the instance
 * @returns {Promise<instance>} The instance description with InstanceId, PrivateIpAddress, etc.
 */
const launchInstance = launchInstanceFactory(EC2);

/**
 * Terminate an existing instance on a preconfigured AWS region provided by
 * `AWS_REGION` environment variable.
 * @param {string} id - The id of the instance (`InstanceId`) that needs to be terminated
 * @param {boolean} [wait=false] - A flag that determines if the method must resolve
 *                                 immediately triggering an instance termination or wait for
 *                                 the instance to  terminate.
 *                                 Internally it uses timeouts and a number of retries calling
 *                                 `describeInstance` to determine the terminated state when waited.
 */
const terminateInstance = terminateInstanceFactory(EC2);

const defaultExport = {
  launchInstance,
  terminateInstance,
  metaData,
  getUserData,
};

export default defaultExport;
module.exports = defaultExport;
