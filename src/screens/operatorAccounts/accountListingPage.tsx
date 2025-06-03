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
  FormControl,
  Select,
  MenuItem,
  Skeleton,
  Typography,
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
    Female: "1",
    Male: "2",
    Transgender: "3",
    Other: "4",
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
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const canManageOperator = useSelector((state: RootState) =>
    state.app.permissions.includes("manage_operator")
  );
  const fetchAccounts = useCallback((pageNumber: number, searchParams = {}) => {
    setIsLoading(true);
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
              ? "Female"
              : account.gender === 2
              ? "Male"
              : account.gender === 3
              ? "Transgender"
              : "Other",
          email_id: account.email_id || account.email,
          phoneNumber: account.phone_number || account.phoneNumber || "",
          status: account.status === 1 ? "Active" : "Suspended",
        }));

        setAccountList(formattedAccounts);
        setHasNextPage(items.length === rowsPerPage);
      })
      .catch((error) => {
        console.error("Fetch Error:", error);
        showErrorToast(error.message || "Failed to fetch account list");
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

  const SkeletonLoader = () => (
    <TableBody>
      {[...Array(rowsPerPage)].map((_, index) => (
        <TableRow key={index}>
          <TableCell>
            <Skeleton variant="text" animation="wave" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" animation="wave" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" animation="wave" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" animation="wave" />
          </TableCell>
          <TableCell>
            <Skeleton variant="text" animation="wave" />
          </TableCell>
        </TableRow>
      ))}
    </TableBody>
  );

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
            !canManageOperator
              ? "You don't have permission, contact the admin"
              : "click to open the account creation form"
          }
          placement="top-end"
        >
          <span
            style={{ cursor: !canManageOperator ? "not-allowed" : "default" }}
          >
            <Button
              sx={{
                ml: "auto",
                mr: 2,
                mb: 2,
                display: "block",
                backgroundColor: !canManageOperator
                  ? "#6c87b7 !important"
                  : "#00008B",
                color: "white",
                "&.Mui-disabled": {
                  backgroundColor: "#6c87b7 !important",
                  color: "#ffffff99",
                },
              }}
              variant="contained"
              onClick={() => setOpenCreateModal(true)}
              disabled={!canManageOperator}
            >
              Create Account
            </Button>
          </span>
        </Tooltip>
        <TableContainer
          sx={{
            flex: 1,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
          }}
        >
          {isLoading ? (
            <SkeletonLoader />
          ) : (
            <Table>
              <TableHead>
                <TableRow>
                  <TableCell>
                    <b style={{ display: "block", textAlign: "center" }}>ID</b>
                    <TextField
        type="number"
        variant="outlined"
        size="small"
        placeholder="Search"
        value={search.id}
        onChange={(e) => handleSearchChange(e, "id")}
        fullWidth
        inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
        sx={{
          "& .MuiInputBase-root": {
            height: 40,
            fontSize: selectedAccount ? "0.8rem" : "1rem",
          },
          "& .MuiInputBase-input": {
            textAlign: "center",
          },
        }}
      />
                  </TableCell>

                  <TableCell>
                    <b style={{ display: "block", textAlign: "center" }}>
                      Full Name
                    </b>
                    <TextField
        type="text"
        variant="outlined"
        size="small"
        placeholder="Search"
        value={search.fullName}
        onChange={(e) => handleSearchChange(e, "fullName")}
        fullWidth
        sx={{
          "& .MuiInputBase-root": {
            height: 40,
            fontSize: selectedAccount ? "0.8rem" : "1rem",
          },
          "& .MuiInputBase-input": {
            textAlign: "center",
          },
        }}
      />
                  </TableCell>

                  <TableCell>
                    <b style={{ display: "block", textAlign: "center" }}>
                      Phone
                    </b>
                    <TextField
                      type="number"
                      variant="outlined"
                      size="small"
                      placeholder="Search"
                      value={search.phoneNumber}
                      onChange={(e) => handleSearchChange(e, "phoneNumber")}
                      fullWidth
                      inputProps={{ inputMode: "numeric", pattern: "[0-9]*" }}
                      sx={{
                        "& .MuiInputBase-root": {
                          height: 40,
                          padding: "4px",
                          textAlign: "center",
                        },
                      }}
                    />
                  </TableCell>

                  <TableCell>
                    <b style={{ display: "block", textAlign: "center" }}>
                      Email
                    </b>
                    <TextField
                      type="text"
                      variant="outlined"
                      size="small"
                      placeholder="Search"
                      value={search.email_id}
                      onChange={(e) => handleSearchChange(e, "email_id")}
                      fullWidth
                      sx={{
                        "& .MuiInputBase-root": {
                          height: 40,
                          padding: "4px",
                          textAlign: "center",
                        },
                      }}
                    />
                  </TableCell>

                  <TableCell size="small">
                    <b style={{ display: "block", textAlign: "center" }}>
                      Gender
                    </b>
                    <FormControl fullWidth size="small">
                      <Select
                        value={search.gender}
                        onChange={handleSelectChange}
                        displayEmpty
                        sx={{
                          "& .MuiInputBase-root": {
                            height: 30,
                            padding: "4px",
                            textAlign: "center",
                          },
                        }}
                      >
                        <MenuItem value="">All</MenuItem>
                        <MenuItem value="Male">Male</MenuItem>
                        <MenuItem value="Female">Female</MenuItem>
                        <MenuItem value="Transgender">Transgender</MenuItem>
                        <MenuItem value="Other">Other</MenuItem>
                      </Select>
                    </FormControl>
                  </TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {accountList.length > 0 ? (
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
                      <TableCell>{row.id}</TableCell>
                      <TableCell>
                        {row.fullName ? (
                          row.fullName
                        ) : (
                          <Tooltip
                            title="Full Name not added yet"
                            placement="bottom"
                          >
                            <ErrorIcon sx={{ color: "#737d72 " }} />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.phoneNumber ? (
                          row.phoneNumber.replace("tel:", "")
                        ) : (
                          <Tooltip
                            title="Phone Number not added yet"
                            placement="bottom"
                          >
                            <ErrorIcon sx={{ color: "#737d72" }} />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>
                        {row.email_id ? (
                          row.email_id
                        ) : (
                          <Tooltip
                            title="Email not added yet"
                            placement="bottom"
                          >
                            <ErrorIcon sx={{ color: "#737d72 " }} />
                          </Tooltip>
                        )}
                      </TableCell>
                      <TableCell>{row.gender}</TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center">
                      <Typography variant="body1" color="textSecondary" mt={2}>
                        No accounts found.
                      </Typography>
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          )}
        </TableContainer>
        {/* Pagination */}
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
            canManageOperator={canManageOperator}
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
