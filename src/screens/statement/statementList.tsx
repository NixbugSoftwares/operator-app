import {
  Box,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Paper,
  TextField,
  Typography,
} from "@mui/material";
import PaginationControls from "../../common/paginationControl";

const StatementsPage = () => {
  const statements = [
    {
      id: 1,
      operatorName: "Operator1",
      serviceName: "Service1",
      totalRevenue: 2780,
      date: "2025-07-11",
    },
    {
      id: 2,
      operatorName: "Operator2",
      serviceName: "Service2",
      totalRevenue: 1245.5,
      date: "2025-07-12",
    },
    {
      id: 3,
      operatorName: "Operator3",
      serviceName: "Service3",
      totalRevenue: 890.25,
      date: "2025-07-10",
    },
    {
      id: 4,
      operatorName: "Operator4",
      serviceName: "Service4",
      totalRevenue: 3450.75,
      date: "2025-07-09",
    },
    {
      id: 5,
      operatorName: "Operator5",
      serviceName: "Service5",
      totalRevenue: 7850,
      date: "2025-07-08",
    },
    {
      id: 6,
      operatorName: "Operator6",
      serviceName: "Service6",
      totalRevenue: 4399.99,
      date: "2025-07-07",
    },
    {
      id: 7,
      operatorName: "Operator7",
      serviceName: "Service7",
      totalRevenue: 3120,
      date: "2025-07-06",
    },
    {
      id: 8,
      operatorName: "Operator8",
      serviceName: "Service8",
      totalRevenue: 1100,
      date: "2025-07-05",
    },
    {
      id: 9,
      operatorName: "Operator9",
      serviceName: "Service9",
      totalRevenue: 2345.75,
      date: "2025-07-04",
    },
    {
      id: 10,
      operatorName: "Operator10",
      serviceName: "Service10",
      totalRevenue: 5299.99,
      date: "2025-07-03",
    },
  ];

  const currencyFormatter = new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 2,
  });

  const handlePrintPDF = (statement: any) => {
    console.log("Printing statement as PDF:", statement);
    // Add your actual PDF generation logic here
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        width: "100%",
        height: "100%",
        gap: 2,
      }}
    >
      {/* Main Content */}
      <Box
        sx={{
          flex: "0 0 100%",
          maxWidth: "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Box sx={{ display: "flex", gap: 2, mt: 3 }}>
          <Typography
          variant="h6"
          textAlign={"left"}
          sx={{ ml: 2, fontWeight: "bold", fontSize: 30, color: "black" }}
        >
          Daily Statement
        </Typography>
          <Button
            sx={{
              ml: "auto",
              mr: 2,
              mb: 2,
              backgroundColor: "#00008B",
              color: "white",
              display: "flex",
              justifyContent: "flex-end",
            }}
            variant="contained"
          >
            New Statement
          </Button>
        </Box>
        
        {/* Statement Table */}
        <TableContainer
          component={Paper}
          sx={{
            maxHeight: "calc(100vh - 250px)",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow>
                <TableCell sx={{ fontWeight: "bold" }}>ID</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Operator Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Service Name</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Total Revenue</TableCell>
                <TableCell sx={{ fontWeight: "bold" }}>Action</TableCell>
              </TableRow>
              <TableRow>
                <TableCell>
                  <TextField size="small" fullWidth placeholder="Search" />
                </TableCell>
                <TableCell>
                  <TextField size="small" fullWidth placeholder="Search" />
                </TableCell>
                <TableCell>
                  <TextField size="small" fullWidth placeholder="Search" />
                </TableCell>
                <TableCell>
                  <TextField size="small" fullWidth placeholder="Search" />
                </TableCell>
                <TableCell />
              </TableRow>
            </TableHead>

            <TableBody>
              {statements.map((row) => (
                <TableRow key={row.id}>
                  <TableCell>{row.id}</TableCell>
                  <TableCell>{row.operatorName}</TableCell>
                  <TableCell>{row.serviceName}</TableCell>
                  <TableCell >
                    <Typography sx={{ fontWeight: "bold", color: "green"}} >{currencyFormatter.format(row.totalRevenue)}</Typography>
                  </TableCell>
                  <TableCell>
                    <Button
                      variant="outlined"
                      size="small"
                      onClick={() => handlePrintPDF(row)}
                    >
                      Download
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationControls page={0} onPageChange={() => {}} isLoading={false} hasNextPage={2}/>
      </Box>
    </Box>
  );
};

export default StatementsPage;
