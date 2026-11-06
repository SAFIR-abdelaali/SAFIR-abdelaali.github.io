declare global {
  interface Window {
    /** Set once the app runs. The head script checks it before dropping hidden starting states. */
    __booted?: boolean;
  }
}

export {};
