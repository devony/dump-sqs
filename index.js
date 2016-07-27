'use strict';

const async = require('async');
const _ = require('lodash');
const aws = require('aws-sdk');
const fs = require('fs');
const langUtils = require('langUtils');
const out = fs.createWriteStream('sqslogs.out');

function exitCB(err) {
  out.end();
  if (err) {
    console.error(err);
    process.exit(1);
  }
  console.log('Successfully completed');
  process.exit(0);
}


const sqs = new aws.SQS({
  apiVersion: '2012-11-05',
  accessKeyId: '',
  awsAccountId: '',
  secretAccessKey: '',
  region: 'us-east-1'
});

async.doUntil(cb => {
  async.waterfall([
    cb => {
      sqs.receiveMessage({
        QueueUrl: '',
        MaxNumberOfMessages: 10,
        MessageAttributeNames: ['All'],
        VisibilityTimeout: 30,
        WaitTimeSeconds: 0
      }, cb)
    },
    (resp, cb) => {
      const msgs = resp.Messages;
      console.log('Got ' + _.size(msgs) + ' messages');
      if (_.isEmpty(msgs)) return cb(null, true);

      const removeEntries = _.map(msgs, m => {
        console.log(JSON.stringify(m));
        out.write(JSON.stringify(m) + '\n');
        return {
          Id: m.MessageId,
          ReceiptHandle: m.ReceiptHandle
        }
      });

      sqs.deleteMessageBatch({
        QueueUrl: '',
        Entries: removeEntries
      }, langUtils.provide(cb, false));
    }
  ], cb);
}, (resp) => {
  return resp;
}, exitCB);
