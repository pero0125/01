import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as ecs from 'aws-cdk-lib/aws-ecs';
import * as ecr from 'aws-cdk-lib/aws-ecr';
import * as ecs_patterns from 'aws-cdk-lib/aws-ecs-patterns';
import * as logs from 'aws-cdk-lib/aws-logs';
import * as iam from 'aws-cdk-lib/aws-iam';

export class CdkL3Stack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    
    // ECRリポジトリの参照
    const repository = ecr.Repository.fromRepositoryName(this, 'NextJsRepository', 'nextjs-app4');

    // TaskRoleの定義
    const taskRole = new iam.Role(this, 'EcsTaskRole', {
      assumedBy: new iam.ServicePrincipal('ecs-tasks.amazonaws.com'),
    });
    // ポリシーの追加
    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('AWSXRayDaemonWriteAccess')
    );
    taskRole.addManagedPolicy(
      iam.ManagedPolicy.fromAwsManagedPolicyName('CloudWatchFullAccess')
    );
    taskRole.addToPolicy(
      new iam.PolicyStatement({
        effect: iam.Effect.ALLOW,
        actions: ['s3:*'],
        resources: ['*'],
      })
    );

    // ApplicationLoadBalancedFargateServiceの作成
    const loadBalancedFargateService = new ecs_patterns.ApplicationLoadBalancedFargateService(this, 'Service', {
      memoryLimitMiB: 512,
      cpu: 256,
      desiredCount: 1,
      taskImageOptions: {
        image: ecs.ContainerImage.fromEcrRepository(repository, "latest"),
        containerPort: 8080,
        taskRole: taskRole,
        logDriver: ecs.LogDrivers.awsLogs({
          streamPrefix: 'nextjs',
          logGroup: new logs.LogGroup(this, 'NextJsLogGroup', {
            logGroupName: 'my-nextjs-app-logs',
            retention: logs.RetentionDays.ONE_WEEK,
            removalPolicy: cdk.RemovalPolicy.DESTROY
          }),
        }),
      },
      publicLoadBalancer: true,
    });
    // ADOTサイドカーコンテナの追加
    loadBalancedFargateService.taskDefinition.addContainer('AdotSidecar', {
      image: ecs.ContainerImage.fromEcrRepository(repository, "adot"),
      logging: ecs.LogDrivers.awsLogs({ 
        streamPrefix: 'adot',
        logGroup: new logs.LogGroup(this, 'AdotLogGroup', {
          logGroupName: 'my-nextjs-adot-logs',
          retention: logs.RetentionDays.ONE_WEEK,
          removalPolicy: cdk.RemovalPolicy.DESTROY
        }),
      }),
      command: ['--config=/otel-config.yaml'],
    }).addPortMappings({
      containerPort: 4318, // HTTP port for OTLP
    });
    // ヘルスチェックの設定
    loadBalancedFargateService.targetGroup.configureHealthCheck({
      path: '/healthcheck',
      port: '8080',
      interval: cdk.Duration.seconds(10),
      timeout: cdk.Duration.seconds(5),
      healthyThresholdCount: 2,
      unhealthyThresholdCount: 3,
    });

    // CloudFormationの出力にALBのDNS名を追加
    new cdk.CfnOutput(this, 'LoadBalancerDNSRollDice', {
      value: `http://${loadBalancedFargateService.loadBalancer.loadBalancerDnsName}/rolldice`,
    });

    new cdk.CfnOutput(this, 'LoadBalancerDNSS3', {
      value: `http://${loadBalancedFargateService.loadBalancer.loadBalancerDnsName}/s3buckets`,
    });
  }
}
