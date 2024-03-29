// Initialize Firebase
const firebaseConfig = {
  apiKey: 'AIzaSyAwV45qNvp2y17EfnuXwnOTu3igDR8UWqg',
  authDomain: 'yimapp-21d84.firebaseapp.com',
  projectId: 'yimapp-21d84',
  storageBucket: 'yimapp-21d84.appspot.com',
  messagingSenderId: '422267308394',
  appId: '1:422267308394:web:1b8992916710b015a1bd13',
  measurementId: 'G-GFKC2BF4WE',
}
firebase.initializeApp(firebaseConfig)

// Firestore query code
const firestore = firebase.firestore()

const twoHoursAgo = new Date(Date.now() - 2 * 60 * 60 * 1000)

const query = firestore
  .collection('Scans')
  .where('timestamp', '>', twoHoursAgo)
  .where('recentScanExists', '==', false)
  .where('type', '==', 'kitchen')

const unsubscribe = query.onSnapshot(
  (querySnapshot) => {
    const scans = []
    querySnapshot.forEach((doc) => {
      scans.push({ id: doc.id, ...doc.data() })
    })

    setScansNumber(scans)
  },
  (error) => {
    console.error('Error listening to changes: ', error)
  }
)

const setScansNumber = (scans) => {
  console.log('Current Scans: ', scans)
  document.getElementById('count-number').textContent = scans.length
}
