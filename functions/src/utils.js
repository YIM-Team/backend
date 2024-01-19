const functions = require("firebase-functions");
const axios = require("axios").default;
const markdownIt = require("markdown-it");

exports.helloWorld = functions.https.onRequest(async (_request, response) => {
  functions.logger.info("Hello logs!");
  response.send("Hello from Firebase!");
});

exports.dataPrivacy = functions.https.onRequest((_request, response) => {
  const markdown = markdownIt({html: true});

  axios
      .get(
          "https://firebasestorage.googleapis.com/v0/b/yimapp-21d84.appspot.com/o/Files%2Fdata-privacy_de.md?alt=media&token=93c627b4-40fd-477e-ae59-834cecac5d87",
      )
      .then((res) => {
        functions.logger.log(res.data);
        response.send(markdown.render(res.data.toString()));
      })
      .catch((err) => functions.logger.error(err));
});

exports.deleteAccount = functions.https.onRequest((_request, response) => {
  const markdown = markdownIt({html: true});

  axios
      .get(
          "https://firebasestorage.googleapis.com/v0/b/yimapp-21d84.appspot.com/o/Files%2Fdelete-account_de.md?alt=media&token=5120e77f-6deb-4c49-ad6b-2d65c490ba5f",
      )
      .then((res) => {
        functions.logger.log(res.data);
        response.send(markdown.render(res.data.toString()));
      })
      .catch((err) => functions.logger.error(err));
});

exports.setFirestoreNullValue = functions.firestore
    .document("Notes/{noteID}")
    .onWrite((change) => {
      const newValue = change.after.data();
      functions.logger.debug(newValue);

      if (newValue.linkedTo == "null") {
        return change.after.ref.set(
            {
              linkedTo: null,
            },
            {merge: true},
        );
      } else {
        return;
      }
    });
