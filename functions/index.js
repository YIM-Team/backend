const admin = require('firebase-admin')
const { setGlobalOptions } = require('firebase-functions/v2')
admin.initializeApp()

const utils = require('./src/utils')
const chat = require('./src/chat')
const notifications = require('./src/notifications')
const scheduledNotifications = require('./src/notifications/scheduled')

setGlobalOptions({ region: 'europe-west1' })

exports.helloWorld = utils.helloWorld
exports.dataPrivacy = utils.dataPrivacy
exports.deleteAccount = utils.deleteAccount
exports.setFirestoreNullValue = utils.setFirestoreNullValue

exports.changeMessageStatus = chat.changeMessageStatus
exports.changeLastMessage = chat.changeLastMessage

exports.newMessageNotification = notifications.newMessageNotification
exports.newNewsNotification = notifications.newNewsNotification

// Scheduled notifications
exports.scheduleNotification = scheduledNotifications.scheduleNotification
exports.sendScheduledNotification = scheduledNotifications.sendScheduledNotification
