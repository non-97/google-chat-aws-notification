// 失敗2
// 2025-05-13 18:52:08

import * as cdk from "aws-cdk-lib";
import { Alarm } from "aws-cdk-lib/aws-cloudwatch";
import { Construct } from "constructs";

export interface NotificationConstructProps {
  alarm: cdk.aws_cloudwatch.IAlarm;
}

export class NotificationConstruct extends Construct {
  constructor(scope: Construct, id: string, props: NotificationConstructProps) {
    super(scope, id);

    const inputTemplate = JSON.stringify({
      text:
        "👋🌎 こんにちは！ AWSに関する通知だよ！！" +
        "以下のメッセージを確認してね 🌎👋",
      cards_v2: [
        {
          card: {
            header: {
              title: "CloudWatch Alarm State Change",
              image_url:
                "https://fonts.gstatic.com/s/i/short-term/release/googlesymbols/error/default/24px.svg",
            },
            sections: [
              {
                header:
                  "\u003ca href='https://<region>.console.aws.amazon.com/cloudwatch/home?region=<region>#alarmsV2:alarm/<alarmName>'\u003eCloudWatchアラーム情報\u003c/a\u003e\u003c/a\u003e",
                widgets: [
                  {
                    text_paragraph: {
                      text: "AWSアカウントID : <account>",
                    },
                  },
                  {
                    text_paragraph: {
                      text: "リージョン : <region>",
                    },
                  },
                  {
                    text_paragraph: {
                      text: "CloudWatchアラーム名 : <alarmName>",
                    },
                  },
                  {
                    text_paragraph: {
                      text: "CloudWatchアラームの説明 : <alarmDescription>",
                    },
                  },
                ],
              },
              {
                header: "現在の状態",
                widgets: [
                  {
                    text_paragraph: {
                      text: "状態 : <stateValue>",
                    },
                  },
                  {
                    text_paragraph: {
                      text: "理由 : <stateReason>",
                    },
                  },
                  {
                    text_paragraph: {
                      text: "時刻 : <stateTimestamp>",
                    },
                  },
                ],
              },
              {
                header: "前回の状態",
                widgets: [
                  {
                    text_paragraph: {
                      text: "状態 : <previousStateValue>",
                    },
                  },
                  {
                    text_paragraph: {
                      text: "理由 : <previousStateReason>",
                    },
                  },
                  {
                    text_paragraph: {
                      text: "時刻 : <previousStateTimestamp>",
                    },
                  },
                ],
              },
            ],
          },
        },
      ],
    });

    const connection = new cdk.aws_events.Connection(this, "Connection", {
      authorization: cdk.aws_events.Authorization.apiKey(
        "GoogleChatWebhook",
        cdk.SecretValue.unsafePlainText("xxxxx") // APIキーによる認証は行わないが、authorization は必須プロパティであるため適当な文字列を渡す
      ),
    });

    const destination = new cdk.aws_events.ApiDestination(this, "Destination", {
      connection,
      endpoint: cdk.aws_ssm.StringParameter.fromStringParameterAttributes(
        this,
        "Endpoint",
        {
          parameterName: "/google-chat/webhook/aws-notification",
        }
      ).stringValue,
      httpMethod: cdk.aws_events.HttpMethod.POST,
    });

    const role = new cdk.aws_iam.Role(this, "Role", {
      assumedBy: new cdk.aws_iam.ServicePrincipal("events.amazonaws.com"),
      inlinePolicies: {
        InvokeApiDestination: new cdk.aws_iam.PolicyDocument({
          statements: [
            new cdk.aws_iam.PolicyStatement({
              effect: cdk.aws_iam.Effect.ALLOW,
              actions: ["events:InvokeApiDestination"],
              resources: [destination.apiDestinationArn],
            }),
          ],
        }),
      },
    });

    const rule = new cdk.aws_events.Rule(this, "Rule", {
      eventPattern: {
        source: ["aws.cloudwatch"],
        detailType: ["CloudWatch Alarm State Change"],
        resources: [props.alarm.alarmArn],
      },
    });

    const cfnRule = rule.node.defaultChild as cdk.aws_events.CfnRule;
    cfnRule.addPropertyOverride("Targets", [
      {
        Arn: destination.apiDestinationArn,
        Id: "AwsNotificationTarget",
        RoleArn: role.roleArn,
        InputTransformer: {
          InputTemplate: inputTemplate,
          InputPathsMap: {
            account: "$.account",
            region: "$.region",
            alarmName: "$.detail.alarmName",
            alarmDescription: "$.detail.configuration.description",
            stateValue: "$.detail.state.value",
            stateReason: "$.detail.state.reason",
            stateTimestamp: "$.detail.state.timestamp",
            previousStateValue: "$.detail.previousState.value",
            previousStateReason: "$.detail.previousState.reason",
            previousStateTimestamp: "$.detail.previousState.timestamp",
          },
        },
      },
    ]);
  }
}
