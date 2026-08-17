// Geriye dönük import uyumluluğu: uygulama artık Firebase yerine PostgreSQL API kullanır.
export { initializeApp, getAuth, getFirestore, getStorage } from '../sql/firebase-shim';
import { getAuth, getFirestore, getStorage } from '../sql/firebase-shim';

export const auth = getAuth();
export const db = getFirestore();
export const storage = getStorage();
export default {};
