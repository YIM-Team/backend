const { getFirestore } = require('firebase-admin/firestore')
const { logger } = require('firebase-functions')
const {
  onDocumentCreated,
  onDocumentWritten,
} = require('firebase-functions/v2/firestore')

const db = getFirestore()

/**
 * Function triggered when a new message is created in a room
 * Updates the message status to 'delivered' and updates the room's lastMessages
 */
exports.changeMessageStatus = onDocumentCreated(
  {
    path: 'rooms/{roomId}/messages/{messageId}',
    region: 'europe-west1',
  },
  async (event) => {
    try {
      // Validate event data
      if (!event.data) {
        logger.error('No data associated with the event')
        return null
      }

      // Get the message data
      const messageData = event.data.data()
      if (!messageData) {
        logger.error('Message data is empty')
        return null
      }

      // Create a copy of the message data and add the ID
      const message = {
        ...messageData,
        id: event.params.messageId,
        status: 'delivered',
      }

      logger.info('Processing new message', { 
        messageId: message.id, 
        roomId: event.params.roomId 
      })

      // Get reference to the room document
      const roomRef = db.doc(`rooms/${event.params.roomId}`)

      // Update the room document with the new message
      await roomRef.update({
        lastMessages: [message],
        updatedAt: new Date(),
      })

      // Update the message document status
      await event.data.ref.update({
        status: 'delivered',
      })

      logger.info('Message processed successfully', { 
        messageId: message.id, 
        roomId: event.params.roomId 
      })

      return null
    } catch (error) {
      logger.error('Error in changeMessageStatus function', error)
      throw error
    }
  }
)

/**
 * Function triggered when a message document is written (created or updated)
 * Updates the room's lastMessages if the message status changes to 'seen'
 */
exports.changeLastMessage = onDocumentWritten(
  {
    path: 'rooms/{roomId}/messages/{messageId}',
    region: 'europe-west1',
  },
  async (event) => {
    try {
      // Skip if this is a delete operation
      if (!event.data.after) {
        return null
      }

      // Skip if this is a create operation (handled by changeMessageStatus)
      if (!event.data.before) {
        return null
      }

      const beforeData = event.data.before.data()
      const afterData = event.data.after.data()

      // Skip if no data change
      if (!beforeData || !afterData) {
        return null
      }

      // Skip if status didn't change to 'seen'
      if (beforeData.status === afterData.status || afterData.status !== 'seen') {
        return null
      }

      const { roomId, messageId } = event.params

      // Get the room document
      const roomRef = db.doc(`rooms/${roomId}`)
      const roomDoc = await roomRef.get()

      if (!roomDoc.exists) {
        logger.warn(`Room ${roomId} does not exist`)
        return null
      }

      const room = roomDoc.data()

      // Check if this is the last message
      if (!room.lastMessages || 
          !room.lastMessages.length || 
          room.lastMessages[0].id !== messageId) {
        return null
      }

      // Update the room's last messages with the updated status
      const updatedMessage = {
        ...afterData,
        id: messageId
      }

      await roomRef.update({
        lastMessages: [updatedMessage]
      })

      logger.info('Updated room last messages', {
        roomId,
        messageId,
        status: afterData.status
      })

      return null
    } catch (error) {
      logger.error('Error in changeLastMessage:', error)
      throw error
    }
  }
)
