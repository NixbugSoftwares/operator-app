import React, { Suspense, lazy, memo } from "react";
import {
  BrowserRouter as _Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

const Home=lazy(() => import("../screens/operatorAccounts/home"));
const Hyy =lazy(() => import("../screens/operatorAccounts/hy"));
const LoadingIndicator = memo(() => (
  <div
    style={{
      display: "flex",
      justifyContent: "center",
      alignItems: "center",
      height: "100vh",
    }}
  >
    <div>Loading...</div>
  </div>
));

const HomeRouter: React.FC = () => {
  return (
    <Suspense fallback={<LoadingIndicator />}>
      <Routes>
        <Route path="/home" element={<Home />} />
        <Route path="/hyy" element={<Hyy/>} />
        

        <Route
          path="*"
          element={<Navigate to="/home" replace />}
        />
       
      </Routes>
    </Suspense>
  );
};

export default HomeRouter;
