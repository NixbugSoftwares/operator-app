import React, { useEffect, useState, useRef, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  Tooltip,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Box,
  Button,
  Select,
  MenuItem,
  Typography,
  CircularProgress,
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import { SelectChangeEvent } from "@mui/material";
import { useDispatch } from "react-redux";
import { operatorListApi } from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import { Account } from "../../types/type";
import PaginationControls from "../../common/paginationControl";
import AccountDetailsCard from "./AccountDetail";
import AccountForm from "./crerationForm";
import FormModal from "../../common/formModal";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";
const getGenderBackendValue = (displayValue: string): string => {
  const genderMap: Record<string, string> = {
    Other: "1",
     Female : "2",
     Male: "3",
    Transgender: "4",
  };
  return genderMap[displayValue] || "";
};

const AccountListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [accountList, setAccountList] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState({
    id: "",
    fullName: "",
    gender: "",
    email_id: "",
    phoneNumber: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const canCreateOperator = useSelector((state: RootState) =>
    state.app.permissions.includes("create_operator")
  );
  const fetchAccounts = useCallback((pageNumber: number, searchParams = {}) => {
    const offset = pageNumber * rowsPerPage;
    dispatch(operatorListApi({ limit: rowsPerPage, offset, ...searchParams }))
      .unwrap()
      .then((res) => {
        const items = res.data || [];
        const formattedAccounts = items.map((account: any) => ({
          id: account.id,
          fullName: account.full_name || account.fullName,
          username: account.username,
          gender:
            account.gender === 1
              ? "Other"
              : account.gender === 2
              ? "Female"
              : account.gender === 3
              ? "Male"
              : "Transgender",
          email_id: account.email_id || account.email,
          phoneNumber: account.phone_number || account.phoneNumber || "",
          status: account.status === 1 ? "Active" : "Suspended",
          created_on: account.created_on,
          updated_on: account.updated_on
        }));

        setAccountList(formattedAccounts);
        setHasNextPage(items.length === rowsPerPage);
      })
      .catch((error) => {
        console.error("Fetch Error:", error);
        showErrorToast(error || "Failed to fetch account list");
      })
      .finally(() => setIsLoading(false));
  }, []);

  const handleRowClick = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleSearchChange = useCallback(
    (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
      column: keyof typeof search
    ) => {
      const value = e.target.value;
      setSearch((prev) => ({ ...prev, [column]: value }));

      if (debounceRef.current) clearTimeout(debounceRef.current);
      debounceRef.current = window.setTimeout(() => {
        setDebouncedSearch((prev) => ({ ...prev, [column]: value }));
        setPage(0);
      }, 700);
    },
    []
  );

  const handleSelectChange = useCallback((e: SelectChangeEvent<string>) => {
    const value = e.target.value;
    setSearch((prev) => ({ ...prev, gender: value }));
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = window.setTimeout(() => {
      setDebouncedSearch((prev) => ({ ...prev, gender: value }));
      setPage(0);
    }, 700);
  }, []);

  const handleChangePage = useCallback(
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  useEffect(() => {
    const genderBackendValue = getGenderBackendValue(debouncedSearch.gender);
    const searchParams = {
      ...(debouncedSearch.id && { id: debouncedSearch.id }),
      ...(debouncedSearch.fullName && { fullName: debouncedSearch.fullName }),
      ...(debouncedSearch.gender && { gender: genderBackendValue }),
      ...(debouncedSearch.email_id && { email_id: debouncedSearch.email_id }),
      ...(debouncedSearch.phoneNumber && {
        phoneNumber: debouncedSearch.phoneNumber,
      }),
    };

    fetchAccounts(page, searchParams);
  }, [page, debouncedSearch, fetchAccounts]);

  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchAccounts(page, debouncedSearch);
    }
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
      <Box
        sx={{
          flex: selectedAccount
            ? { xs: "0 0 100%", md: "0 0 65%" }
            : "0 0 100%",
          maxWidth: selectedAccount ? { xs: "100%", md: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Tooltip
          title={
            !canCreateOperator
              ? "You don't have permission, contact the admin"
              : "Click to open the account creation form"
          }
          placement="top-end"
        >
            <Button
              sx={{
                ml: "auto",
                mr: 2,
                mb: 2,
                backgroundColor: !canCreateOperator
                  ? "#6c87b7 !important"
                  : "#00008B",
                color: "white !important",
                display: "flex",
                justifyContent: "flex-end",
                "&.Mui-disabled": {
                  color: "#fff !important",
                },
              }}
              variant="contained"
              onClick={() => setOpenCreateModal(true)}
              disabled={!canCreateOperator}
              style={{ cursor: !canCreateOperator ? "not-allowed" : "pointer" }}
            >
              Add New operator
            </Button>
        </Tooltip>
        <TableContainer
          sx={{
            flex: 1,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            position: "relative",
          }}
        >
           {isLoading && (
                      <Box
                        sx={{
                          position: "absolute",
                          top: 0,
                          left: 0,
                          right: 0,
                          bottom: 0,
                          display: "flex",
                          justifyContent: "center",
                          alignItems: "center",
                          backgroundColor: "rgba(255, 255, 255, 0.7)",
                          zIndex: 1,
                        }}
                      >
                        <CircularProgress />
                      </Box>
                    )}
          <Table stickyHeader>
            <TableHead>
              {/* Header Row */}
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                <TableCell
                  sx={{
                    width: "80px",
                    minWidth: "80px",
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  ID
                </TableCell>
                <TableCell
                  sx={{
                    width: "200px",
                    minWidth: "200px",
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Full Name
                </TableCell>
                <TableCell
                  sx={{
                    width: "160px",
                    minWidth: "160px",
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Phone
                </TableCell>
                <TableCell
                  sx={{
                    width: "220px",
                    minWidth: "220px",
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Email
                </TableCell>
                <TableCell
                  sx={{
                    width: "120px",
                    minWidth: "120px",
                    textAlign: "center",
                    backgroundColor: "#fafafa",
                    fontWeight: 600,
                    fontSize: "0.875rem",
                    borderBottom: "1px solid #ddd",
                  }}
                >
                  Gender
                </TableCell>
              </TableRow>
              {/* Search Row */}
              <TableRow>
                <TableCell>
                  <TextField
                    type="number"
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.id}
                    onChange={(e) => handleSearchChange(e, "id")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": { height: 40 },
                      "& .MuiInputBase-input": { textAlign: "center" },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="text"
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.fullName}
                    onChange={(e) => handleSearchChange(e, "fullName")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": { height: 40 },
                      "& .MuiInputBase-input": { textAlign: "center" },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="number"
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.phoneNumber}
                    onChange={(e) => handleSearchChange(e, "phoneNumber")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": { height: 40 },
                      "& .MuiInputBase-input": { textAlign: "center" },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <TextField
                    type="text"
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.email_id}
                    onChange={(e) => handleSearchChange(e, "email_id")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": { height: 40 },
                      "& .MuiInputBase-input": { textAlign: "center" },
                    }}
                  />
                </TableCell>
                <TableCell>
                  <Select
                    value={search.gender}
                    onChange={handleSelectChange}
                    displayEmpty
                    size="small"
                    fullWidth
                    sx={{ height: 40 }}
                  >
                    <MenuItem value="">All</MenuItem>
                    <MenuItem value="Male">Male</MenuItem>
                    <MenuItem value="Female">Female</MenuItem>
                    <MenuItem value="Transgender">Transgender</MenuItem>
                    <MenuItem value="Other">Other</MenuItem>
                  </Select>
                </TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
             {isLoading ? (
                             <TableRow>
                               <TableCell colSpan={6} align="center"></TableCell>
                             </TableRow>
                           ) :accountList.length > 0 ? (
                accountList.map((row) => (
                  <TableRow
                    key={row.id}
                    hover
                    onClick={() => handleRowClick(row)}
                    sx={{
                      cursor: "pointer",
                      backgroundColor:
                        selectedAccount?.id === row.id
                          ? "#E3F2FD !important"
                          : "inherit",
                      "&:hover": {
                        backgroundColor:
                          selectedAccount?.id === row.id
                            ? "#E3F2FD !important"
                            : "#E3F2FD",
                      },
                    }}
                  >
                    <TableCell sx={{ textAlign: "center" }}>{row.id}</TableCell>

                    <TableCell>
                      {row.fullName ? (
                        <Tooltip title={row.fullName} placement="bottom">
                          <Typography noWrap>
                            {row.fullName.length > 15
                              ? `${row.fullName.substring(0, 15)}...`
                              : row.fullName}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Tooltip
                          title="Full Name not added yet"
                          placement="bottom"
                        >
                          <ErrorIcon sx={{ color: "#737d72" }} />
                        </Tooltip>
                      )}
                    </TableCell>

                    <TableCell>
                      {row.phoneNumber ? (
                        <Typography noWrap>
                          {row.phoneNumber.replace(/\D/g, "").slice(-10)}
                        </Typography>
                      ) : (
                        <Tooltip
                          title="Phone Number not added yet"
                          placement="bottom"
                        >
                          <ErrorIcon sx={{ color: "#737d72" }} />
                        </Tooltip>
                      )}
                    </TableCell>

                    {/* Email (Truncated to 20 chars + ...) */}
                    <TableCell>
                      {row.email_id ? (
                        <Tooltip title={row.email_id} placement="bottom">
                          <Typography noWrap>
                            {row.email_id.length > 20
                              ? `${row.email_id.substring(0, 20)}...`
                              : row.email_id}
                          </Typography>
                        </Tooltip>
                      ) : (
                        <Tooltip title="Email not added yet" placement="bottom">
                          <ErrorIcon sx={{ color: "#737d72" }} />
                        </Tooltip>
                      )}
                    </TableCell>

                    <TableCell sx={{ textAlign: "center" }}>
                      {row.gender}
                    </TableCell>
                  </TableRow>
                ))
              ) : (
                <TableRow>
                  <TableCell colSpan={5} align="center">
                    <Typography variant="body1" color="textSecondary" mt={2}>
                      No accounts found.
                    </Typography>
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>
        <PaginationControls
          page={page}
          onPageChange={(newPage) => handleChangePage(null, newPage)}
          isLoading={isLoading}
          hasNextPage={hasNextPage}
        />
      </Box>
      {/* Right Side - Account Details Card */}
      {selectedAccount && (
        <Box
          sx={{
            flex: { xs: "0 0 100%", md: "0 0 35%" },
            maxWidth: { xs: "100%", md: "35%" },
            transition: "all 0.3s ease",
            bgcolor: "grey.100",
            p: 2,
            mt: { xs: 2, md: 0 },
            overflowY: "auto",
            overflowX: "hidden",
            height: "100%",
          }}
        >
          <AccountDetailsCard
            account={selectedAccount}
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedAccount(null)}
            refreshList={(value: any) => refreshList(value)}
            onCloseDetailCard={() => setSelectedAccount(null)}
          />
        </Box>
      )}
      {/* Create Account Modal */}
      <FormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
        title="Create Account"
      >
        <AccountForm
          refreshList={refreshList}
          onClose={() => setOpenCreateModal(false)}
        />
      </FormModal>
    </Box>
  );
};
export default AccountListingTable;
