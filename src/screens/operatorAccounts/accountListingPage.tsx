import React, { useEffect, useState } from "react";
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
} from "@mui/material";
import ErrorIcon from "@mui/icons-material/Error";
import { SelectChangeEvent } from "@mui/material";
import { useDispatch } from "react-redux";
import { operatorListApi } from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import localStorageHelper from "../../utils/localStorageHelper";
import { showErrorToast } from "../../common/toastMessageHelper";

export interface Account {
  id: number;
  fullName: string;
  username: string;
  password?: string;
  gender: string;
  designation: string;
  email: string;
  phoneNumber: string;
  status: string;
}
const AccountListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [accountList, setAccountList] = useState<Account[]>([]);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);
  const [search, setSearch] = useState({
    id: "",
    fullName: "",
    designation: "",
    gender: "",
    email: "",
    phoneNumber: "",
  });

  const [page, setPage] = useState(0);
  const rowsPerPage = selectedAccount ? 10 : 10;
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const roleDetails = localStorageHelper.getItem("@roleDetails");
  const canManageExecutive = roleDetails?.manage_executive || false;

  // Function to fetch accounts
  const fetchAccounts = () => {
    dispatch(operatorListApi())
      .unwrap()
      .then((res: any[]) => {
        const formattedAccounts = res.map((account: any) => ({
          id: account.id,
          fullName: account.full_name,
          username: account.username,
          gender:
            account.gender === 1
              ? "Female"
              : account.gender === 2
              ? "Male"
              : account.gender === 3
              ? "Transgender"
              : "Other",
          designation: account.designation,
          email: account.email_id,
          phoneNumber: account.phone_number ?? "",
          status: account.status === 1 ? "Active" : "Suspended",
        }));
        setAccountList(formattedAccounts);
      })
      .catch(() => {
        showErrorToast("Failed to fetch account list. Please try again.");
      });
  };

  useEffect(() => {
    fetchAccounts();
    refreshList;
  }, []);
  const handleRowClick = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleCloseDetailCard = () => {
    setSelectedAccount(null);
  };

  const handleSearchChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>,
    column: keyof typeof search
  ) => {
    setSearch((prev) => ({ ...prev, [column]: e.target.value }));
  };

  const handleSelectChange = (e: SelectChangeEvent<string>) => {
    setSearch({ ...search, gender: e.target.value });
  };

  const filteredData = accountList.filter(
    (row: Account) =>
      (row.id?.toString()?.toLowerCase() || "").includes(
        search.id.toLowerCase()
      ) &&
      (row.fullName?.toLowerCase() || "").includes(
        search.fullName.toLowerCase()
      ) &&
      (row.designation?.toLowerCase() || "").includes(
        search.designation.toLowerCase()
      ) &&
      (!search.gender ||
        (row.gender?.toLowerCase() || "") === search.gender.toLowerCase()) &&
      (row.email?.toLowerCase() || "").includes(search.email.toLowerCase()) &&
      (row.phoneNumber?.toLowerCase() || "").includes(
        search.phoneNumber.toLowerCase()
      )
  );

  const handleChangePage = (
    _event: React.MouseEvent<HTMLButtonElement> | null,
    newPage: number
  ) => {
    setPage(newPage);
  };

  const handleCloseModal = () => {
    setOpenCreateModal(false);
  };

  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchAccounts();
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", md: "row" },
        width: "100%",
        height: "100vh",
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
            !canManageExecutive
              ? "You don't have permission, contact the admin"
              : "click to open the account creation form"
          }
          placement="top-end"
        >
          <span
            style={{ cursor: !canManageExecutive ? "not-allowed" : "default" }}
          >
            <Button
              sx={{
                ml: "auto",
                mr: 2,
                mb: 2,
                display: "block",
                backgroundColor: !canManageExecutive
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
              disabled={!canManageExecutive}
            >
              Create Account
            </Button>
          </span>
        </Tooltip>

        <TableContainer
          sx={{
            flex: 1,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "hidden",
          }}
        >
          <Table>
            <TableHead>
              <TableRow>
                <TableCell>
                  <b
                    style={{
                      display: "block",
                      textAlign: "center",
                      fontSize: selectedAccount ? "0.8rem" : "1rem",
                    }}
                  >
                    ID
                  </b>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.id}
                    onChange={(e) => handleSearchChange(e, "id")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 40,
                        padding: "4px",
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                      "& .MuiInputBase-input": {
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                    }}
                  />
                </TableCell>

                <TableCell>
                  <b
                    style={{
                      display: "block",
                      textAlign: "center",
                      fontSize: selectedAccount ? "0.8rem" : "1rem",
                    }}
                  >
                    Full Name
                  </b>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.fullName}
                    onChange={(e) => handleSearchChange(e, "fullName")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 40,
                        padding: "4px",
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                      "& .MuiInputBase-input": {
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                    }}
                  />
                </TableCell>

                <TableCell>
                  <b
                    style={{
                      display: "block",
                      textAlign: "center",
                      fontSize: selectedAccount ? "0.8rem" : "1rem",
                    }}
                  >
                    Designation
                  </b>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.designation}
                    onChange={(e) => handleSearchChange(e, "designation")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 40,
                        padding: "4px",
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                      "& .MuiInputBase-input": {
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                    }}
                  />
                </TableCell>

                <TableCell>
                  <b
                    style={{
                      display: "block",
                      textAlign: "center",
                      fontSize: selectedAccount ? "0.8rem" : "1rem",
                    }}
                  >
                    Phone
                  </b>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.phoneNumber}
                    onChange={(e) => handleSearchChange(e, "phoneNumber")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 40,
                        padding: "4px",
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                      "& .MuiInputBase-input": {
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                    }}
                  />
                </TableCell>

                <TableCell>
                  <b
                    style={{
                      display: "block",
                      textAlign: "center",
                      fontSize: selectedAccount ? "0.8rem" : "1rem",
                    }}
                  >
                    Email
                  </b>
                  <TextField
                    variant="outlined"
                    size="small"
                    placeholder="Search"
                    value={search.email}
                    onChange={(e) => handleSearchChange(e, "email")}
                    fullWidth
                    sx={{
                      "& .MuiInputBase-root": {
                        height: 40,
                        padding: "4px",
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                      "& .MuiInputBase-input": {
                        textAlign: "center",
                        fontSize: selectedAccount ? "0.8rem" : "1rem",
                      },
                    }}
                  />
                </TableCell>

                <TableCell size="small">
                  <b
                    style={{
                      display: "block",
                      textAlign: "center",
                      fontSize: selectedAccount ? "0.8rem" : "1rem",
                    }}
                  >
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
                          fontSize: selectedAccount ? "0.8rem" : "1rem",
                        },
                        "& .MuiInputBase-input": {
                          textAlign: "center",
                          fontSize: selectedAccount ? "0.8rem" : "1rem",
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

            <TableBody
              sx={{
                fontSize: selectedAccount ? "0.8rem" : "1rem",
                whiteSpace: "nowrap",
                overflow: "hidden",
                textOverflow: "ellipsis",
              }}
            >
              {filteredData.length > 0 ? (
                filteredData
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row) => {
                    const isSelected = selectedAccount?.id === row.id;
                    return (
                      
                      <TableRow
                        key={row.id}
                        hover
                        onClick={() => handleRowClick(row)}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? "#E3F2FD !important"
                            : "inherit",
                          color: isSelected ? "black" : "black",
                          "&:hover": {
                            backgroundColor: isSelected
                              ? "#E3F2FD !important"
                              : "#E3F2FD",
                          },
                          "& td": {
                            color: isSelected ? "black !important" : "black",
                          },
                        }}
                      >
                        <TableCell>{row.id}</TableCell>
                        <TableCell>
                          {row.fullName ? (
                            row.fullName
                          ) : (
                            <Tooltip
                              title=" Full Name not added yet"
                              placement="bottom"
                            >
                              <ErrorIcon sx={{ color: "#737d72 " }} />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.designation ? (
                            row.designation
                          ) : (
                            <Tooltip
                              title=" Designation not added yet"
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
                              title=" Phone Number not added yet"
                              placement="bottom"
                            >
                              <ErrorIcon sx={{ color: "#737d72" }} />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>
                          {row.email ? (
                            row.email
                          ) : (
                            <Tooltip
                              title=" Email not added yet"
                              placement="bottom"
                            >
                              <ErrorIcon sx={{ color: "#737d72 " }} />
                            </Tooltip>
                          )}
                        </TableCell>
                        <TableCell>{row.gender}</TableCell>
                      </TableRow>
                    );
                  })
              ) : (
                <TableRow>
                  <TableCell colSpan={6} align="center">
                    No accounts found.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </TableContainer>

        {/* Pagination */}
        <Box
          sx={{
            display: "flex",
            justifyContent: "center",
            alignItems: "center",
            gap: 1,
            mt: 2,
            position: "sticky",
            bottom: 0,
            backgroundColor: "white",
            zIndex: 1,
            p: 1,
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <Button
            onClick={() => handleChangePage(null, page - 1)}
            disabled={page === 0}
            sx={{ padding: "5px 10px", minWidth: 40 }}
          >
            &lt;
          </Button>
          {Array.from(
            { length: Math.ceil(filteredData.length / rowsPerPage) },
            (_, index) => index
          )
            .slice(
              Math.max(0, page - 1),
              Math.min(page + 2, Math.ceil(filteredData.length / rowsPerPage))
            )
            .map((pageNumber) => (
              <Button
                key={pageNumber}
                onClick={() => handleChangePage(null, pageNumber)}
                sx={{
                  padding: "5px 10px",
                  minWidth: 40,
                  bgcolor:
                    page === pageNumber
                      ? "rgba(21, 101, 192, 0.2)"
                      : "transparent",
                  fontWeight: page === pageNumber ? "bold" : "normal",
                  borderRadius: "5px",
                  transition: "all 0.3s",
                  "&:hover": {
                    bgcolor: "rgba(21, 101, 192, 0.3)",
                  },
                }}
              >
                {pageNumber + 1}
              </Button>
            ))}
          <Button
            onClick={() => handleChangePage(null, page + 1)}
            disabled={page >= Math.ceil(filteredData.length / rowsPerPage) - 1}
            sx={{ padding: "5px 10px", minWidth: 40 }}
          >
            &gt;
          </Button>
        </Box>
      </Box>

     

    
    </Box>
  );
};

export default AccountListingTable;
