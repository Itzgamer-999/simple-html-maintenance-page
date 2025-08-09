let fb = null;

export async function getFirebase() {
  if (fb) return fb;
  let firebaseConfig;
  try {
    ({ firebaseConfig } = await import('./firebase-config.js'));
  } catch {
    throw new Error('Firebase config missing');
  }
  const [{ initializeApp }, { getFirestore, doc, getDoc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, updateDoc, arrayUnion, Timestamp, deleteDoc, query, orderBy, limit } ] = await Promise.all([
    import('https://www.gstatic.com/firebasejs/10.12.3/firebase-app.js'),
    import('https://www.gstatic.com/firebasejs/10.12.3/firebase-firestore.js')
  ]);
  const app = initializeApp(firebaseConfig);
  const db = getFirestore(app);
  fb = { app, db, doc, getDoc, setDoc, onSnapshot, collection, addDoc, serverTimestamp, updateDoc, arrayUnion, Timestamp, deleteDoc, query, orderBy, limit };
  return fb;
}