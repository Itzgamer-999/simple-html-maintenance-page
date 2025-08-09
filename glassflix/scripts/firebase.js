import { firebaseConfig } from './firebase-config.js';

let fb = null;

export async function getFirebase() {
  if (fb) return fb;
  const [{ initializeApp }, { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, addDoc, serverTimestamp } ] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js')
  ]);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  fb = { app, db, doc, getDoc, setDoc, onSnapshot, collection, addDoc, serverTimestamp };
  return fb;
}