const functions = require('firebase-functions');

exports.helloWorld = functions.https.onRequest((request, response) => {
  functions.logger.info('Hello logs!');
  response.send('Hello from Firebase!');
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
