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
  ListItemText,
  Checkbox,
  Dialog,
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
import moment from "moment";
import localStorageHelper from "../../utils/localStorageHelper";

const getGenderBackendValue = (displayValue: string): string => {
  const genderMap: Record<string, string> = {
    Other: "1",
    Female: "2",
    Male: "3",
    Transgender: "4",
  };
  return genderMap[displayValue] || "";
};

interface ColumnConfig {
  id: string;
  label: string;
  width: string;
  minWidth: string;
  fixed?: boolean;
}

const AccountListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [accountList, setAccountList] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState({
    id: "",
    full_name: "",
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
  const loggedInUserId = localStorageHelper.getItem("@user")?.operator_id;
  const [loggedInUserAccount, setLoggedInUserAccount] =
    useState<Account | null>(null);
  const canCreateOperator = useSelector((state: RootState) =>
    state.app.permissions.includes("create_operator")
  );

  const [isSearching, setIsSearching] = useState(false);
  const columnConfig: ColumnConfig[] = [
    { id: "id", label: "ID", width: "80px", minWidth: "80px", fixed: true },
    {
      id: "fullName",
      label: "Full Name",
      width: "200px",
      minWidth: "200px",
      fixed: true,
    },
    {
      id: "phoneNumber",
      label: "Phone Number",
      width: "160px",
      minWidth: "160px",
      fixed: true,
    },
    {
      id: "gender",
      label: "Gender",
      width: "120px",
      minWidth: "120px",
      fixed: true,
    },
    { id: "email", label: "Email", width: "220px", minWidth: "220px" },
    {
      id: "CreatedAt",
      label: "Created Date",
      width: "150px",
      minWidth: "150px",
    },
  ];

  const [visibleColumns, setVisibleColumns] = useState<Record<string, boolean>>(
    columnConfig.reduce((acc, column) => {
      acc[column.id] = column.fixed ? true : false;
      return acc;
    }, {} as Record<string, boolean>)
  );

  const handleColumnChange = (event: SelectChangeEvent<string[]>) => {
    const value = event.target.value;
    const newVisibleColumns = Object.keys(visibleColumns).reduce((acc, key) => {
      acc[key] = value.includes(key);
      return acc;
    }, {} as Record<string, boolean>);
    setVisibleColumns(newVisibleColumns);
  };

  const fetchAccounts = useCallback(
    (pageNumber: number, searchParams = {}) => {
      const offset = pageNumber * rowsPerPage;
      setIsLoading(true);

      // Check if we're searching (any search parameter is present)
      const hasSearchParams = Object.values(searchParams).some(
        (param) => param !== undefined && param !== ""
      );
      setIsSearching(hasSearchParams);

      dispatch(operatorListApi({ limit: rowsPerPage, offset, ...searchParams }))
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          const formattedAccounts = items.map((account: any) => ({
            id: account.id,
            full_name: account.full_name || account.fullName,
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
            updated_on: account.updated_on,
          }));

          setAccountList(formattedAccounts);
          setHasNextPage(items.length === rowsPerPage);

          // Only fetch logged-in user on first page with no search
          if (
            pageNumber === 0 &&
            !hasSearchParams &&
            loggedInUserId &&
            !loggedInUserAccount
          ) {
            dispatch(
              operatorListApi({ limit: 1, offset: 0, id: loggedInUserId })
            )
              .unwrap()
              .then((res) => {
                const items = res.data || [];
                const formattedAccounts = items.map((account: any) => ({
                  id: account.id,
                  full_name: account.full_name || account.fullName,
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
                  phoneNumber:
                    account.phone_number || account.phoneNumber || "",
                  status: account.status === 1 ? "Active" : "Suspended",
                  created_on: account.created_on,
                  updated_on: account.updated_on,
                }));
                setLoggedInUserAccount(formattedAccounts[0] || null);
              });
          }
        })
        .catch((error) => {
          console.error("Fetch Error:", error);
          showErrorToast(error.message || "Failed to fetch account list");
        })
        .finally(() => setIsLoading(false));
    },
    [loggedInUserId, loggedInUserAccount, rowsPerPage, dispatch]
  );

  const sortedAccountList = React.useMemo(() => {
    // Only add logged-in user to the first page when not searching
    if (page === 0 && !isSearching && loggedInUserAccount) {
      const combined = [...accountList];

      // Check if logged-in user is not already in the list
      if (!accountList.some((a) => a.id === loggedInUserAccount.id)) {
        combined.unshift(loggedInUserAccount);
      }

      return combined.sort((a, b) => {
        if (a.id === loggedInUserId) return -1;
        if (b.id === loggedInUserId) return 1;
        return 0;
      });
    }

    // For other pages or when searching, return the account list as is
    return accountList;
  }, [accountList, loggedInUserAccount, loggedInUserId, page, isSearching]);

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
      ...(debouncedSearch.full_name && {
        full_name: debouncedSearch.full_name,
      }),
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
        flexDirection: { xs: "column", lg: "row" },
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
        <Box
          sx={{
            display: "flex",
            justifyContent: "flex-end",
            alignItems: "center",
            mb: 2,
            gap: 1,
            flexWrap: { xs: "wrap", sm: "nowrap" },
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: "50%", md: "auto" },
            }}
          >
            <Select
              multiple
              value={Object.keys(visibleColumns).filter(
                (key) => visibleColumns[key]
              )}
              onChange={handleColumnChange}
              renderValue={(selected) => `Columns (${selected.length})`}
              size="small" // 👈 Makes Select compact
              sx={{
                minWidth: { xs: "120px", sm: "160px", md: "200px" },
                height: 36,
                fontSize: "0.75rem",
                "& .MuiSelect-select": { py: 0.5 },
              }}
            >
              {columnConfig.map((column) => (
                <MenuItem
                  key={column.id}
                  value={column.id}
                  disabled={column.fixed}
                >
                  <Checkbox
                    checked={visibleColumns[column.id]}
                    disabled={column.fixed}
                  />
                  <ListItemText primary={column.label} />
                </MenuItem>
              ))}
            </Select>
          </Box>

          {canCreateOperator && (
            <Button
              variant="contained"
              onClick={() => setOpenCreateModal(true)}
              sx={{
                flexShrink: 0,
                minWidth: "fit-content",
                px: 1.5, // Reduce horizontal padding
                py: 0.5, // Reduce vertical padding
                fontSize: "0.75rem", // Smaller font
                height: 36, // Match Select height
                backgroundColor: "#00008B",
                color: "white !important",
                "&.Mui-disabled": {
                  color: "#fff !important",
                },
              }}
            >
              Add Operator
            </Button>
          )}
        </Box>

        <TableContainer
          sx={{
            flex: 1,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
            position: "relative",
            minHeight: 0, 
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
                {visibleColumns.id && (
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
                )}
                {visibleColumns.fullName && (
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
                )}
                {visibleColumns.phoneNumber && (
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
                )}
                {visibleColumns.email && (
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
                )}
                {visibleColumns.gender && (
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
                )}
                {visibleColumns.CreatedAt && (
                  <TableCell
                    sx={{
                      width: "100px",
                      minWidth: "100px",
                      textAlign: "center",
                      backgroundColor: "#fafafa",
                      fontWeight: 600,
                      fontSize: "0.875rem",
                      borderBottom: "1px solid #ddd",
                    }}
                  >
                    Created Time
                  </TableCell>
                )}
              </TableRow>
              {/* Search Row */}
              <TableRow>
                {visibleColumns.id && (
                  <TableCell width="10%">
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
                        width: "100%",
    minWidth: { xs: 80, sm: "100%" },
                      }}
                    />
                  </TableCell>
                )}
                {visibleColumns.fullName && (
                  <TableCell width="20%">
                    <TextField
                      type="text"
                      variant="outlined"
                      size="small"
                      placeholder="Search"
                      value={search.full_name}
                      onChange={(e) => handleSearchChange(e, "full_name")}
                      fullWidth
                      sx={{
                        "& .MuiInputBase-root": { height: 40 },
                        "& .MuiInputBase-input": { textAlign: "center" },
                      }}
                    />
                  </TableCell>
                )}
                {visibleColumns.phoneNumber && (
                  <TableCell width="10%">
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
                )}
                {visibleColumns.email && (
                  <TableCell width={"10%"}>
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
                )}
                {visibleColumns.gender && (
                  <TableCell width="10%">
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
                )}
                {visibleColumns.CreatedAt && (
                  <TableCell width="10%"></TableCell>
                )}
              </TableRow>
            </TableHead>

            <TableBody>
              {isLoading ? (
                <TableRow>
                  <TableCell colSpan={6} align="center"></TableCell>
                </TableRow>
              ) : sortedAccountList.length > 0 ? (
                sortedAccountList.map((row) => {
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => handleRowClick(row)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor:
                          selectedAccount?.id === row.id
                            ? "#E3F2FD !important"
                            : row.id === loggedInUserId
                            ? "#e6f8e1ff !important"
                            : "inherit",
                        "&:hover": {
                          backgroundColor:
                            selectedAccount?.id === row.id
                              ? "#E3F2FD !important"
                              : "#E3F2FD",
                        },
                      }}
                    >
                      {visibleColumns.id && (
                        <TableCell align="center">{row.id}</TableCell>
                      )}
                      {visibleColumns.fullName && (
                        <TableCell>
                          {row.full_name ? (
                            <Tooltip title={row.full_name} placement="bottom">
                              <Typography noWrap>
                                {row.full_name.length > 15
                                  ? `${row.full_name.substring(0, 15)}...`
                                  : row.full_name}
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
                      )}
                      {visibleColumns.phoneNumber && (
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
                      )}
                      {visibleColumns.email && (
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
                            <Tooltip
                              title="Email not added yet"
                              placement="bottom"
                            >
                              <ErrorIcon sx={{ color: "#737d72" }} />
                            </Tooltip>
                          )}
                        </TableCell>
                      )}
                      {visibleColumns.gender && (
                        <TableCell>{row.gender}</TableCell>
                      )}
                      {visibleColumns.CreatedAt && (
                        <TableCell sx={{ textAlign: "center" }}>
                          {moment(row.created_on)
                            .local()
                            .format("DD-MM-YYYY, hh:mm A")}
                        </TableCell>
                      )}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No operators found.
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
            display: { xs: "none", lg: "block" }, // ✅ Show only on large screens
            flex: "0 0 35%",
            maxWidth: "35%",
            transition: "all 0.3s ease",
            bgcolor: "grey.100",
            p: 2,
            overflowY: "auto",
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

      {/* Mobile/Tablet View (Dialog) */}
      <Dialog
        open={Boolean(selectedAccount)}
        onClose={() => setSelectedAccount(null)}
        fullScreen
        sx={{
          display: { xs: "block", lg: "none" }, // ✅ Show on mobile + tablets
        }}
      >
        {selectedAccount && (
          <Box sx={{ p: 2 }}>
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
      </Dialog>

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
