// Re-export from the enhanced firebase configuration
export { 
  auth, 
  googleProvider, 
  db, 
  handleFirestoreError, 
  checkFirestoreConnection,
  retryFirestoreOperation
} from './config/firebase-config';