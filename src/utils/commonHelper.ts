// commonHelper.ts
import { userLoggedOut } from "../slices/appSlice";
import localStorageHelper from "./localStorageHelper";

async function logout() {
  try {
    // Import store lazily (breaks circular import)
    const { default: store } = await import("../store/Store");
    store.dispatch(userLoggedOut());

    // Clear storage
    localStorageHelper.removeStoredItem("@user");
    localStorageHelper.removeStoredItem("@token");
    localStorageHelper.removeStoredItem("@token_expires");
    localStorageHelper.clearStorage();
  } catch (error) {
    console.error("Logout error:", error);
    localStorage.clear();
    sessionStorage.clear();
  }
}

export default {
  logout,
};
