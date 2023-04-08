const aws = require('aws-sdk');

aws.config.update({
  region: process.env.AWS_REGION,
});

const S3 = new aws.S3();
const SQS = new aws.SQS();

module.exports = { S3, SQS };
