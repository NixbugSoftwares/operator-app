function getItem(key: string): any | null {
    try {
      const item = localStorage.getItem(key);
      // console.log("Item from localStorage>>>>>>>>>>:", item);
      if (!item) return null;
      try {
        return JSON.parse(item);
      } catch {
        return item; 
      }
    } catch (error) {
      console.error("Error fetching data from localStorage:", error);
      return null;
    }
  }
  
  function storeItem(key: string, item: any): void {
    try {
      const itemString = typeof item === "string" ? item : JSON.stringify(item);
      localStorage.setItem(key, itemString);
    } catch (error) {
      console.error("Error storing data in localStorage:", error);
    }
  }
  
  function removeStoredItem(key: string): void {
    try {
      localStorage.removeItem(key);
    } catch (error) {
      console.error("Error removing data from localStorage:", error);
    }
  }
  
  function clearStorage(): void {
    try {
      localStorage.clear();
    } catch (error) {
      console.error("Error clearing localStorage:", error);
    }
  }
  
  export default {
    getItem,
    storeItem,
    removeStoredItem,
    clearStorage,
  };
  