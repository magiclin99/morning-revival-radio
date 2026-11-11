import { initializeApp } from 'firebase/app'
import { getDatabase } from 'firebase/database'

// Firebase web config is safe to expose in client code; access is
// controlled by Realtime Database security rules, not by hiding this.
const firebaseConfig = {
  apiKey: 'AIzaSyDtzrU8kGfJXXriOlML-QNoXzKwDbsGdaU',
  authDomain: 'morning-revival-radio.firebaseapp.com',
  databaseURL: 'https://morning-revival-radio-default-rtdb.asia-southeast1.firebasedatabase.app',
  projectId: 'morning-revival-radio',
  storageBucket: 'morning-revival-radio.firebasestorage.app',
  messagingSenderId: '494292605908',
  appId: '1:494292605908:web:090997dc973c4f3c211441',
  measurementId: 'G-878EZNF1KM',
}

export const firebaseApp = initializeApp(firebaseConfig)
export const database = getDatabase(firebaseApp)
