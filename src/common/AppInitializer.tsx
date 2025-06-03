import React, { useEffect } from "react";
import { useAppDispatch } from "../store/Hooks";
import { setPermissions } from "../slices/appSlice";

const AppInitializer: React.FC = () => {
  const dispatch = useAppDispatch();

  useEffect(() => {
    const storedPermissions = localStorage.getItem("@permissions");
    if (storedPermissions) {
      const permissions = JSON.parse(storedPermissions);
      dispatch(setPermissions(permissions));
    }
  }, [dispatch]);

  return null;
};

export default AppInitializer;
