const { initializeApp, getApps, cert } = require("firebase-admin/app")
const { getFirestore } = require("firebase-admin/firestore")

const serviceAccount = require("./firebase-service-account.json")

/*
|--------------------------------------------------------------------------
| INITIALIZE FIREBASE
|--------------------------------------------------------------------------
*/

let firebaseApp

if (!getApps().length) {
  firebaseApp = initializeApp({
    credential: cert(serviceAccount)
  })
} else {
  firebaseApp = getApps()[0]
}

/*
|--------------------------------------------------------------------------
| FIRESTORE
|--------------------------------------------------------------------------
*/

const db = getFirestore(firebaseApp)

/*
|--------------------------------------------------------------------------
| EXPORT
|--------------------------------------------------------------------------
*/

module.exports = {
  app: firebaseApp,
  db
}