const admin = require('firebase-admin');
const { PubSub } = require('@google-cloud/pubsub');
const functions = require('firebase-functions/v2');

const pubsub = new PubSub();
const TOPIC_NAME = 'scheduled-notifications';
const DEFAULT_TOPIC = 'all'; // Default topic for all registered devices

/**
 * Convert a date to Berlin time (CET/CEST)
 * @param {Date|string} date - The date to convert
 * @returns {Date} - The date in Berlin time
 */
function toBerlinTime(date) {
  // Parse the date if it's a string
  const inputDate = typeof date === 'string' ? new Date(date) : date;
  
  // Create a formatter for Berlin time
  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: 'Europe/Berlin',
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hour12: false
  });
  
  // Format the date in Berlin time
  const parts = formatter.formatToParts(inputDate);
  const values = {};
  parts.forEach(part => {
    values[part.type] = part.value;
  });
  
  // Create a new date in Berlin time
  return new Date(
    `${values.year}-${values.month}-${values.day}T${values.hour}:${values.minute}:${values.second}`
  );
}

/**
 * Send a notification immediately
 * @param {Object} message - The notification message
 * @param {string} topic - The FCM topic
 * @returns {Promise<string>} - The message ID
 */
async function sendNotificationImmediately(message, topic) {
  try {
    const response = await admin.messaging().send(message);
    console.log(`Successfully sent immediate notification to topic '${topic}':`, response);
    return response;
  } catch (error) {
    console.error(`Error sending immediate notification to topic '${topic}':`, error);
    throw error;
  }
}

/**
 * Schedule a push notification to be sent at a specific time
 * @param {Object} data - The notification data
 * @param {string} data.title - The notification title
 * @param {string} data.body - The notification body
 * @param {Object} data.data - Additional data to send with the notification
 * @param {string} data.scheduledTime - ISO string of when to send the notification (will be interpreted in Berlin time)
 * @param {string} [data.topic] - Optional custom FCM topic (defaults to 'all')
 */
exports.scheduleNotification = functions.https.onCall({
  region: 'europe-west1'
}, async (data) => {
  // Validate the request
  if (!data.title || !data.body || !data.scheduledTime) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Missing required fields'
    );
  }

  // Parse and convert the scheduled time to Berlin time
  let scheduledTime;
  try {
    scheduledTime = toBerlinTime(data.scheduledTime);
  } catch (error) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid scheduled time format'
    );
  }

  // Validate the scheduled time
  if (isNaN(scheduledTime.getTime())) {
    throw new functions.https.HttpsError(
      'invalid-argument',
      'Invalid scheduled time'
    );
  }

  // Use custom topic if provided, otherwise use default
  const topic = data.topic || DEFAULT_TOPIC;
  
  // Create the message payload
  const message = {
    topic: topic, // Use the specified topic or default
    notification: {
      title: data.title,
      body: data.body,
    },
    data: data.data || {},
  };

  // Check if the scheduled time is now or in the past
  const now = new Date();
  if (scheduledTime.getTime() <= now.getTime()) {
    console.log(`Scheduled time is in the past or now, sending notification immediately`);
    
    // Send the notification immediately
    const messageId = await sendNotificationImmediately(message, topic);
    
    return { 
      messageId, 
      topic,
      scheduledTime: scheduledTime.toISOString(),
      timezone: 'Europe/Berlin',
      sentImmediately: true
    };
  }

  // Calculate delay in seconds
  const delaySeconds = Math.floor((scheduledTime.getTime() - now.getTime()) / 1000);
  
  // Log the delay for debugging purposes
  console.log(`Scheduling notification with delay of ${delaySeconds} seconds for topic: ${topic}`);
  console.log(`Scheduled time (Berlin): ${scheduledTime.toISOString()}`);

  // Publish to Pub/Sub with attributes for scheduling
  const messageId = await pubsub
    .topic(TOPIC_NAME)
    .publishMessage({
      data: Buffer.from(JSON.stringify(message)),
      attributes: {
        scheduledTime: scheduledTime.toISOString(),
        delaySeconds: delaySeconds.toString(),
        topic: topic, // Store the topic in attributes for reference
      },
    });

  return { 
    messageId, 
    topic,
    scheduledTime: scheduledTime.toISOString(),
    timezone: 'Europe/Berlin',
    sentImmediately: false
  };
});

/**
 * Cloud Function triggered by Pub/Sub to send the scheduled notification
 */
exports.sendScheduledNotification = functions.pubsub
  .onMessagePublished({
    topic: TOPIC_NAME,
    region: 'europe-west1'
  }, async (event) => {
    const message = JSON.parse(Buffer.from(event.data.message.data, 'base64').toString());
    const topic = event.data.message.attributes.topic || DEFAULT_TOPIC;
    
    try {
      // Send to all devices subscribed to the topic
      const response = await admin.messaging().send(message);
      console.log(`Successfully sent scheduled notification to topic '${topic}':`, response);
    } catch (error) {
      console.error(`Error sending scheduled notification to topic '${topic}':`, error);
      throw error;
    }
  }); 