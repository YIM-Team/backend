const functions = require('firebase-functions');
const admin = require('firebase-admin');

exports.newMessageNotification = functions.firestore
  .document('/rooms/{roomId}/messages/{messageId}')
  .onCreate(async (change, context) => {
    const changeData = change.data();

    const room = await admin
      .firestore()
      .collection('rooms')
      .doc(context.params.roomId)
      .get()
      .then((roomDoc) => {
        return roomDoc.data();
      });

    const author = await admin
      .firestore()
      .collection('users')
      .doc(changeData.authorId)
      .get()
      .then((authorDoc) => {
        return authorDoc.data();
      });

    const userIds = room.userIds.filter((id) => id != changeData.authorId);
    const devices = (
      await Promise.all(
        userIds.map(async (uid) =>
          admin
            .firestore()
            .collection('users')
            .doc(uid)
            .get()
            .then((userDoc) => {
              const userData = userDoc.data();
              const userDevices = userData.devices;

              return userDevices;
            })
        )
      )
    ).flat();

    return admin.messaging().sendToDevice(devices, {
      notification: {
        title: author.firstName,
        body: changeData.text,
      },
      data: {
        title: 'new_message',
        body: JSON.stringify({
          room: context.params.roomId,
          author: changeData.authorId,
          text: changeData.text,
        }),
      },
    });
  });

exports.newNewsNotification = functions.firestore
  .document('/News/{newsId}')
  .onCreate(async (change, context) => {
    const changeData = change.data();

    functions.logger.log(changeData);

    return admin.messaging().sendToTopic('news', {
      notification: {
        title: 'YiM News',
        body: changeData.title['de'],
      },
      data: {
        title: 'new_news',
        body: JSON.stringify({
          newsId: context.params.newsId,
          title: changeData.title['de'],
          text: changeData.text['de'],
        }),
      },
    });
  });
