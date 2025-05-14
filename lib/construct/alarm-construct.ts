import * as cdk from "aws-cdk-lib";
import { Construct } from "constructs";

export interface AlarmConstructProps {}

export class AlarmConstruct extends Construct {
  readonly alarm: cdk.aws_cloudwatch.IAlarm;

  constructor(scope: Construct, id: string, props?: AlarmConstructProps) {
    super(scope, id);

    const alarm = new cdk.aws_cloudwatch.Alarm(this, "Default", {
      alarmDescription:
        "これは何かタグが付与されたことを知らせるアラートです。",
      metric: new cdk.aws_cloudwatch.Metric({
        namespace: "AWS/Usage",
        metricName: "CallCount",
        dimensionsMap: {
          Type: "API",
          Resource: "CreateTags",
          Service: "EC2",
          Class: "None",
        },
        period: cdk.Duration.seconds(60),
        statistic: "Maximum",
      }),
      threshold: 1,
      evaluationPeriods: 1,
      comparisonOperator:
        cdk.aws_cloudwatch.ComparisonOperator
          .GREATER_THAN_OR_EQUAL_TO_THRESHOLD,
      treatMissingData: cdk.aws_cloudwatch.TreatMissingData.NOT_BREACHING,
    });

    this.alarm = alarm;
  }
}
