import React from "react";
import { Sidebar } from "../../common";
import { Box } from "@mui/material";
import StatementsPage from "./statementList";


const StatementPage: React.FC = () => {

const [isStatementGenerated, setIsStatementGenerated] = React.useState(false);

const handleStatementGenerated = () => {
  setIsStatementGenerated(true);
}
  const handleBackToServices = () => {
    setIsStatementGenerated(false); // 👈 Reset when going back
  };
  return (
    <Box
      sx={{
        display: "flex",
        height: "100vh",
        width: "100%",
        scrollBehavior: "auto",
      }}
    >
      {!isStatementGenerated && (<Sidebar />)}
      <Box sx={{ width: "100%", p: 3 }}>
        <StatementsPage onStatementGenerated={handleStatementGenerated} 
        onBackToServices={handleBackToServices} />
      </Box>


    </Box>
  );
};

export default StatementPage;
