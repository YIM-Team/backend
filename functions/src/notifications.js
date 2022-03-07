const functions = require('firebase-functions');
const admin = require('firebase-admin');

admin.initializeApp(functions.config().firebase);

exports.newMessageNotification = functions.firestore
  .document('/rooms/{roomId}/messages/{messageId}')
  .onCreate((change, context) => {
    functions.logger.info(change, context);

    admin.firestore().doc(`/rooms/${context.params.roomId}`).get().then();

    admin
      .messaging()
      .sendToDevice(
        [
          'dcEpPjk4TzCua8LrNuzQ7S:APA91bGoS0C03nbX4UoA7zKQ-kDyCAtrnXt5LI63xONR0HBVtzO1D51Bnn_dM2JX84j2xxaR0uZapVSl7HUEBt8MytdMFzcnW8m3ezYoMeZGPJTfGI2vpjNgs34cbi6rkAx7yJARKrfb',
        ],
        {
          notification: {
            title: 'test title',
          },
          data: {
            title: 'Test Title BODY',
          },
        }
      );
  });
