import React, { Suspense, lazy, memo } from "react";
import {
  BrowserRouter as _Router,
  Route,
  Routes,
  Navigate,
} from "react-router-dom";

const Operators=lazy(() => import("../screens/operatorAccounts/operator"));
const OperatorRole = lazy(() => import("../screens/operatorRole/Role"));
const Bus=lazy(() => import("../screens/bus/Bus"));
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
        <Route path="/operators" element={<Operators />} />
        <Route path="/role" element={<OperatorRole />} />
        <Route path="/bus" element={<Bus />} />
        <Route
          path="*"
          element={<Navigate to="/operators" replace />}
        />
       
      </Routes>
    </Suspense>
  );
};

export default HomeRouter;
