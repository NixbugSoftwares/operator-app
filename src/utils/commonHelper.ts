import { useDispatch } from "react-redux";
import { userLoggedOut } from "../slices/appSlice";
import localStorageHelper from "./localStorageHelper";

async function logout() {
 const dispatch = useDispatch()
  dispatch(userLoggedOut());
  localStorageHelper.removeStoredItem("@user");
  localStorageHelper.removeStoredItem("@token");
  localStorageHelper.removeStoredItem("@token_expiry");
}

export default {
  logout,
};