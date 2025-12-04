import * as cdk from 'aws-cdk-lib/core';
import * as iam from 'aws-cdk-lib/aws-iam';
import { Construct } from 'constructs';
import * as path from "path";
import * as agentcore from "@aws-cdk/aws-bedrock-agentcore-alpha";

export class AgentcoreStrandsTsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const agentRuntimeArtifact = agentcore.AgentRuntimeArtifact.fromAsset(
      path.join(__dirname, "../agent"),
    );

    const runtime = new agentcore.Runtime(this, "StrandsAgentsRuntime", {
      runtimeName: "StrandsAgentsTS",
      agentRuntimeArtifact: agentRuntimeArtifact,
      description: "Strands Agents for TypeScript",
    });

    runtime.addToRolePolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: [
          "bedrock:InvokeModel",
          "bedrock:InvokeModelWithResponseStream",
        ],
        resources: [
          "arn:aws:bedrock:*::foundation-model/*",
          `arn:aws:bedrock:${this.region}:${this.account}:inference-profile/*`,
        ],
      }),
    );

    new cdk.CfnOutput(this, "RuntimeArn", {
      value: runtime.agentRuntimeArn,
      description: "ARN of the AgentCore Runtime",
      exportName: "AgentRuntimeArn",
    });

    new cdk.CfnOutput(this, "RuntimeId", {
      value: runtime.agentRuntimeId,
      description: "ID of the AgentCore Runtime",
      exportName: "AgentRuntimeId",
    });
  }
}
