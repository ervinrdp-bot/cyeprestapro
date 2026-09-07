import { initializeApp } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-app.js';
import { getAuth, signInAnonymously } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-auth.js';
import { getFirestore } from 'https://www.gstatic.com/firebasejs/11.10.0/firebase-firestore.js';

const firebaseConfig = {
  apiKey: 'AIzaSyBhlNoUtf7__M_RUpj4ChAsiy9c0JpXV9o',
  authDomain: 'prestapro-9771a.firebaseapp.com',
  projectId: 'prestapro-9771a',
  storageBucket: 'prestapro-9771a.firebasestorage.app',
  messagingSenderId: '361200137391',
  appId: '1:361200137391:web:8689276dce8a8caef4905a'
};

const firebaseApp = initializeApp(firebaseConfig);
export const auth = getAuth(firebaseApp);
export const firestore = getFirestore(firebaseApp);
export const anonymousSession = () => signInAnonymously(auth);
