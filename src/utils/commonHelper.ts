import { useDispatch } from "react-redux";
import { userLoggedOut } from "../slices/appSlice";
import localStorageHelper from "./localStorageHelper";

async function logout() {
  try {
    const dispatch = useDispatch();
    dispatch(userLoggedOut());
    
    // Clear all relevant storage items
    await localStorageHelper.removeStoredItem("@user");
    await localStorageHelper.removeStoredItem("@token");
    await localStorageHelper.removeStoredItem("@token_expires"); // Fixed typo from "@token_expiry"
    await localStorageHelper.clearStorage();
    
  } catch (error) {
    console.error('Logout error:', error);
    localStorage.clear();
    sessionStorage.clear();
  }
}

export default {
  logout,
};