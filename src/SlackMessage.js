import config from "./config";
import loggingLevels from "./const/LoggingLevels";

export default class SlackMessage {
  constructor() {
    let slackNode = require("slack-node");
    this.slack = new slackNode();
    this.slack.setWebhook(config.webhookUrl);
    this.loggingLevel = config.loggingLevel;
    this.messages = [];
    this.errorMessages = [];
  }

  addMessage(message) {
    this.messages.push(message);
  }

  addErrorMessage(message) {
    this.errorMessages.push(message);
  }

  convertTextToBlock(text) {
    return {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text
          }
        }
      ]
    };
  }

  sendMessage(message, slackProperties = null) {
    let formattedMessage =
      typeof message === "string" ? this.convertTextToBlock(message) : message;

    this.slack.webhook(
      Object.assign(
        {
          channel: config.channel,
          username: config.username,
          ...formattedMessage
        },
        slackProperties
      ),
      function(err, response) {
        if (!config.quietMode) {
          if (err) {
            console.log("Unable to send a message to slack");
            console.log(response);
          } else {
            console.log(
              `The following message is send to slack: \n ${JSON.stringify(
                formattedMessage,
                undefined,
                2
              )}`
            );
          }
        }
      }
    );
  }

  sendTestReport(nrFailedTests) {
    this.sendMessage(
      this.getTestReportMessage(),
      nrFailedTests > 0 && this.loggingLevel === loggingLevels.TEST
        ? {
            attachments: [
              {
                color: "danger",
                text: `${nrFailedTests} test failed`
              }
            ]
          }
        : null
    );
  }

  getTestReportMessage() {
    let message = {
      blocks: [
        {
          type: "section",
          text: {
            type: "mrkdwn",
            text: this.getSlackMessage()
          }
        }
      ]
    };
    let errorMessage = this.getErrorMessage();

    if (errorMessage.length > 0 && this.loggingLevel === loggingLevels.TEST) {
      message.blocks.push({
        type: "section",
        text: {
          type: "mrkdwn",
          text: "\n\n\n```" + this.getErrorMessage() + "```"
        }
      });
    }

    return message;
  }

  getErrorMessage() {
    return this.errorMessages.join("\n\n\n");
  }

  getSlackMessage() {
    return this.messages.join("\n");
  }
}
