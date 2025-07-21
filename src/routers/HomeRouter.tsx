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
const BusRoute=lazy(() => import("../screens/busroute/BusRoute"));
const Fare = lazy(() => import("../screens/fare/Fare"));
const Service=lazy(() => import("../screens/service/service"));
const Schedule = lazy(() => import("../screens/schedule/schedule"));
const Duty = lazy(() => import("../screens/duty/duty"));
const PaperTicket = lazy(() => import("../screens/ticket/ticket"));
const Statement = lazy(() => import("../screens/statement/statement"));
const Profile = lazy(() => import("../common/profile/profile"));
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
        <Route path="/operator" element={<Operators />} />
        <Route path="/role" element={<OperatorRole />} />
        <Route path="/bus" element={<Bus />} />
        <Route path="/busroute" element={<BusRoute />} />
        <Route path="/fare" element={<Fare />} />
        <Route path="/service" element={<Service />} />
        <Route path="/schedule" element={<Schedule />} />
        <Route path="/duty" element={<Duty />} />
        <Route path="/ticket" element={<PaperTicket />} />
        <Route path="/statement" element={<Statement />} />
        <Route path="/profile" element={<Profile />} />
        

        <Route
          path="*"
          element={<Navigate to="/operator" replace />}
        />
       
      </Routes>
    </Suspense>
  );
};

export default HomeRouter;
