declare module 'jsmediatags/dist/jsmediatags.min.js' {
  const jsmediatags: {
    read: (
      location: any,
      callbacks: {
        onSuccess: (tag: any) => void;
        onError: (error: any) => void;
      }
    ) => void;
  };
  export default jsmediatags;
}

interface Window {
  google?: any;
}
