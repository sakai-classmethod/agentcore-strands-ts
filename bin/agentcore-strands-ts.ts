#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib/core';
import { AgentcoreStrandsTsStack } from '../lib/agentcore-strands-ts-stack';

const app = new cdk.App();
new AgentcoreStrandsTsStack(app, 'AgentcoreStrandsTsStack', {
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: 'us-east-1',
  },
});
