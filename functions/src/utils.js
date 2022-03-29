const functions = require('firebase-functions');
const axios = require('axios').default;
const MarkdownIt = require('markdown-it');

exports.helloWorld = functions.https.onRequest(async (request, response) => {
  functions.logger.info('Hello logs!');
  response.send('Hello from Firebase!');
});

exports.dataPrivacy = functions.https.onRequest((request, response) => {
  const markdown = MarkdownIt({ html: true });

  axios
    .get(
      'https://firebasestorage.googleapis.com/v0/b/yimapp-21d84.appspot.com/o/Files%2Fdata-privacy_de.md?alt=media&token=53af3a84-9ca5-4d14-8682-2a3ce964ba9f'
    )
    .then((res) => {
      functions.logger.log(res.data);
      response.send(markdown.render(res.data.toString()));
    })
    .catch((err) => functions.logger.error(err));
});

exports.setFirestoreNullValue = functions.firestore
  .document('Notes/{noteID}')
  .onWrite((change) => {
    const newValue = change.after.data();
    functions.logger.debug(newValue);

    if (newValue.linkedTo == 'null') {
      return change.after.ref.set(
        {
          linkedTo: null,
        },
        { merge: true }
      );
    } else {
      return;
    }
  });
