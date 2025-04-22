const { onDocumentWritten } = require('firebase-functions/v2/firestore')
const { onRequest } = require('firebase-functions/v2/https')
const { logger } = require('firebase-functions')

const axios = require('axios').default
const markdownIt = require('markdown-it')

exports.helloWorld = onRequest(
  {
    region: 'europe-west1',
  },
  async (req, res) => {
    logger.info('Hello logs!')
    res.send('Hello from Firebase!')
  }
)

exports.dataPrivacy = onRequest(
  {
    region: 'europe-west1',
  },
  async (req, res) => {
    const markdown = markdownIt({ html: true })

    try {
      const response = await axios.get(
        'https://firebasestorage.googleapis.com/v0/b/yimapp-21d84.appspot.com/o/Files%2Fdata-privacy_de.md?alt=media&token=93c627b4-40fd-477e-ae59-834cecac5d87'
      )
      logger.log(response.data)
      res.send(markdown.render(response.data.toString()))
    } catch (err) {
      logger.error(err)
      res.status(500).send('Error processing the markdown file')
    }
  }
)

exports.deleteAccount = onRequest(
  {
    region: 'europe-west1',
  },
  async (req, res) => {
    const markdown = markdownIt({ html: true })

    try {
      const response = await axios.get(
        'https://firebasestorage.googleapis.com/v0/b/yimapp-21d84.appspot.com/o/Files%2Fdelete-account_de.md?alt=media&token=5120e77f-6deb-4c49-ad6b-2d65c490ba5f'
      )
      logger.log(response.data)
      res.send(markdown.render(response.data.toString()))
    } catch (err) {
      logger.error(err)
      res.status(500).send('Error processing the markdown file')
    }
  }
)

exports.setFirestoreNullValue = onDocumentWritten(
  {
    document: 'Notes/{noteID}',
    region: 'europe-west1',
  },
  async (event) => {
    if (!event.data.after) {
      return null
    }

    const newValue = event.data.after.data()
    if (!newValue) {
      return null
    }

    if (newValue.linkedTo === 'null') {
      return event.data.after.ref.set(
        {
          linkedTo: null,
        },
        { merge: true }
      )
    }
    return null
  }
)
