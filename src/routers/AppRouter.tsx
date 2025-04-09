import React, { useEffect, useState } from "react";
import { useAppDispatch, useAppSelector } from "../store/Hooks";
import localStorageHelper from "../utils/localStorageHelper";
import { getLoggedIn, userLoggedIn } from "../slices/appSlice";
import { AuthRouter, HomeRouter } from "../routers";

const AppRouter: React.FC = () => {
  const dispatch = useAppDispatch();
  const loggedIn = useAppSelector(getLoggedIn);
  const [loading, setLoading] = useState(true);

  const checkUserLoggedIn = () => {
    const userData = localStorageHelper.getItem("@user");
    if (userData) {
      dispatch(userLoggedIn(userData));
    }

    setLoading(false);
  };
  useEffect(() => {
    checkUserLoggedIn();
  }, []);

  if (loading) return <div>Loading...</div>;

  return loggedIn ? <HomeRouter /> : <AuthRouter />;
};

export default AppRouter;
