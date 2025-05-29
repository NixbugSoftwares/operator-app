import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/Hooks";
import localStorageHelper from "../utils/localStorageHelper";
import { getLoggedIn, userLoggedIn, userLoggedOut } from "../slices/appSlice";
import { AuthRouter, HomeRouter } from "../routers";

const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();
  const loggedIn = useAppSelector(getLoggedIn);
  const [loading, setLoading] = useState(true);
 
  useEffect(() => {
    console.log("logggedinnnnn+++++++++++++++", loggedIn);
    console.log("loadingggggggggggggggg");
    
  const checkUserLoggedIn = () => {
    const userData = localStorageHelper.getItem("@user");
    if (userData) {
      dispatch(userLoggedIn(userData));
    } else {
      dispatch(userLoggedOut()); 
    }
    setLoading(false);
  };

  // Initial check
  checkUserLoggedIn();

  // Listen to storage events
  const handleStorageChange = () => {
    checkUserLoggedIn();
  };

  window.addEventListener('storage', handleStorageChange);
  
  return () => {
    window.removeEventListener('storage', handleStorageChange);
  };
}, [dispatch]);

  if (loading) return <div>Loading...</div>;

  return loggedIn ? <HomeRouter /> : <AuthRouter />;
};

export default AppRouter;
