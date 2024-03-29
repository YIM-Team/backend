const admin = require('firebase-admin')
const functions = require('firebase-functions')
const {
  onDocumentCreated,
  onDocumentUpdated,
} = require('firebase-functions/v2/firestore')

const db = admin.firestore()

exports.changeMessageStatus = onDocumentCreated(
  'rooms/{roomId}/messages/{messageId}',
  async (change, context) => {
    const message = change.data()
    message.id = context.params.messageId
    message.status = 'delivered'

    if (message) {
      functions.logger.log('Message created', message)
      db.doc('rooms/' + context.params.roomId).update({
        lastMessages: [message],
        updatedAt: admin.firestore.Timestamp.now(),
      })

      change.ref.update({
        status: 'delivered',
      })
    }
  }
)

exports.changeLastMessage = onDocumentUpdated(
  'rooms/{roomId}/messages/{messageId}',
  async (change, context) => {
    const message = change.after.data()
    message.id = context.params.messageId

    const roomDoc = db.doc('rooms/' + context.params.roomId)
    const room = (await roomDoc.get()).data()
    const lastMessage = room['lastMessages'][0]

    if (
      message &&
      message.status == 'seen' &&
      context.params.messageId == lastMessage.id
    ) {
      functions.logger.log('Message updated', message)
      return roomDoc.update({
        lastMessages: [message],
      })
    } else {
      return null
    }
  }
)
