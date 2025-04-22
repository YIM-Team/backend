const functions = require('firebase-functions')
const { getFirestore } = require('firebase-admin/firestore')
const { getMessaging } = require('firebase-admin/messaging')
const { onDocumentCreated } = require('firebase-functions/v2/firestore')
const { logger } = require('firebase-functions')

const db = getFirestore()
const messaging = getMessaging()

exports.newMessageNotification = onDocumentCreated(
  {
    document: 'rooms/{roomId}/messages/{messageId}',
    region: 'europe-west1',
  },
  async (event) => {
    try {
      if (!event.data) {
        logger.error('No data associated with the event')
        return null
      }

      const message = event.data.data()
      if (!message) {
        logger.error('Message data is empty')
        return null
      }

      const roomRef = db.doc(`rooms/${event.params.roomId}`)
      const room = await roomRef.get().then((doc) => doc.data())

      const authorRef = db.doc(`users/${message.authorId}`)
      const author = await authorRef.get().then((doc) => doc.data())

      const userIds = room.userIds.filter((id) => id !== message.authorId)
      const devices = await Promise.all(
        userIds.map(async (uid) => {
          const userDevices = await db
            .doc(`users/${uid}`)
            .get()
            .then((doc) => {
              const userData = doc.data()
              return userData.devices
            })
          return userDevices
        })
      ).then((results) => results.flat())

      // Send to each device individually using the newer send method
      const sendPromises = devices.map(device => 
        messaging.send({
          token: device,
          notification: {
            title: `${author.firstName} ${author.lastName || ''}`,
            body: message.text,
          },
          data: {
            title: 'new_message',
            body: JSON.stringify({
              room: event.params.roomId,
              author: message.authorId,
              text: message.text,
            }),
          },
        })
      );
      
      return Promise.all(sendPromises);
    } catch (error) {
      logger.error('Error in newMessageNotification:', error)
      throw error
    }
  }
)

exports.newNewsNotification = onDocumentCreated(
  {
    document: '/News/{newsId}',
    region: 'europe-west1',
  },
  async (event) => {
    try {
      if (!event.data) {
        logger.error('No data associated with the event')
        return null
      }

      const newsData = event.data.data()
      if (!newsData) {
        logger.error('News data is empty')
        return null
      }

      functions.logger.log(newsData)

      // return admin.messaging().sendToTopic("news", {
      //   notification: {
      //     title: "YiM News",
      //     body: changeData.title["de"],
      //   },
      //   data: {
      //     title: "new_news",
      //     body: JSON.stringify({
      //       newsId: context.params.newsId,
      //       title: changeData.title["de"],
      //       text: changeData.text["de"],
      //     }),
      //   },
      // });
    } catch (error) {
      logger.error('Error in newNewsNotification:', error)
      throw error
    }
  }
)
