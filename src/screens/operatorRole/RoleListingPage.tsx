import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import RoleDetailsCard from "./RoleDetailCard";
import RoleCreatingForm from "./RoleCreatingForm";
import { useDispatch } from "react-redux";
import type { AppDispatch } from "../../store/Store";
import { operatorRoleListApi } from "../../slices/appSlice";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import PaginationControls from "../../common/paginationControl";
import FormModal from "../../common/formModal";
import moment from "moment";
interface Role {
  id: number;
  name: string;
  created_on: string;
  updated_on: string;
  roleDetails: any;
}

const RoleListingTable = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [roleList, setRoleList] = useState<Role[]>([]);
  const [selectedRole, setSelectedRole] = useState<Role | null>(null);
  const [openCreateModal, setOpenCreateModal] = useState(false);
  const [search, setSearch] = useState({ id: "", Rolename: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const debounceRef = useRef<number | null>(null);
  const rowsPerPage = 10;
  const canCreateRole = useSelector((state: RootState) =>
    state.app.permissions.includes("create_role")
  );
  const fetchRoleList = useCallback(
    (pageNumber: number, searchParams = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        operatorRoleListApi({
          limit: rowsPerPage,
          offset,
          ...searchParams,
        })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          console.log("items",items);
          
          const formattedRoleList = items.map((role: any) => ({
            id: role.id,
            name: role.name,
            created_on: role.created_on,
            updated_on: role.updated_on|| "not updated",
            roleDetails: {
              ...role,
            },
          }));
          setRoleList(formattedRoleList);
          setHasNextPage(items.length === rowsPerPage);
        })
        .catch((errorMessage) => {
          showErrorToast(errorMessage);
        })
        .finally(() => {
          setIsLoading(false);
        });
    },
    [dispatch]
  );

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

  const handleChangePage = useCallback(
    (_: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  const handleRowClick = (role: Role) => setSelectedRole(role);

  useEffect(() => {
    const searchParams = {
      ...(debouncedSearch.id && { id: debouncedSearch.id }),
      ...(debouncedSearch.Rolename && { name: debouncedSearch.Rolename }),
    };
    fetchRoleList(page, searchParams);
  }, [page, debouncedSearch, fetchRoleList]);

  const tableHeaders = [
    { key: "id", label: "ID" },
    { key: "Rolename", label: "Name" },
  ];

  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchRoleList(page, debouncedSearch);
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
      {/* Table Section */}
      <Box
        sx={{
          flex: selectedRole ? { xs: "0 0 100%", md: "0 0 50%" } : "0 0 100%",
          maxWidth: selectedRole ? { xs: "100%", md: "50%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Tooltip
          title={
            !canCreateRole
              ? "You don't have permission, contact the admin"
              : "Click to open the role creation form"
          }
          placement="top-end"
        >
          <Button
            sx={{
              ml: "auto",
              mr: 2,
              mb: 2,
              display: "block",
              backgroundColor: !canCreateRole
                ? "#6c87b7 !important"
                : "#00008B",
              color: "white",
              "&.Mui-disabled": {
                backgroundColor: "#6c87b7 !important",
                color: "#ffffff99",
              },
            }}
            variant="contained"
            disabled={!canCreateRole}
            onClick={() => setOpenCreateModal(true)}
            style={{ cursor: !canCreateRole ? "not-allowed" : "default" }}
          >
            Add New Role
          </Button>
        </Tooltip>

        <TableContainer
          sx={{
            flex: 1,
            maxHeight: "calc(100vh - 100px)",
            overflowY: "auto",
            borderRadius: 2,
            border: "1px solid #e0e0e0",
          }}
        >
          <Table stickyHeader>
            <TableHead>
              <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                {tableHeaders.map(({ key, label }) => (
                  <TableCell
                    key={key}
                    sx={
                      key === "id"
                        ? {
                            width: 100,
                            maxWidth: 100,
                            p: 1,
                            textAlign: "center",
                          } // slightly wider
                        : { minWidth: 150, textAlign: "center" }
                    }
                  >
                    <b style={{ display: "block", fontSize: "0.85rem" }}>
                      {label}
                    </b>
                    <TextField
                      variant="outlined"
                      size="small"
                      placeholder="Search"
                      value={search[key as keyof typeof search]}
                      onChange={(e) =>
                        handleSearchChange(e, key as keyof typeof search)
                      }
                      type={key === "id" ? "number" : "text"}
                      fullWidth
                      sx={{
                        "& .MuiInputBase-root": {
                          height: 36,
                          fontSize: "0.85rem",
                        },
                        "& .MuiInputBase-input": {
                          textAlign: "center",
                          px: 1,
                        },
                      }}
                      inputProps={
                        key === "id"
                          ? { style: { textAlign: "center" } }
                          : undefined
                      }
                    />
                  </TableCell>
                ))}

                {/* Created Date Column */}
                <TableCell sx={{ minWidth: 160, textAlign: "center" }}>
                  <b style={{ fontSize: "0.85rem" }}>Created On</b>
                </TableCell>
                <TableCell sx={{ minWidth: 160, textAlign: "center" }}>
                  <b style={{ fontSize: "0.85rem" }}>Last Updated at</b>
                </TableCell>
              </TableRow>
            </TableHead>

            <TableBody>
              {roleList.length > 0 ? (
                roleList.map((row) => {
                  const isSelected = selectedRole?.id === row.id;
                  return (
                    <React.Fragment key={row.id}>
                      <TableRow
                        hover
                        onClick={() => handleRowClick(row)}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: isSelected ? "#E3F2FD" : "inherit",
                        }}
                      >
                        <TableCell>{row.id}</TableCell>
                        <TableCell>
                          <Tooltip title={row.name} placement="bottom">
                            <Typography noWrap>
                              {row.name.length > 30
                                ? `${row.name.substring(0, 30)}...`
                                : row.name}
                            </Typography>
                          </Tooltip>
                        </TableCell>
                        <TableCell align="center">
                          {moment(row.created_on)
                            .local()
                            .format("YYYY-MM-DD hh:mm A")}
                        </TableCell>
                        <TableCell align="center">
                          {moment(row.updated_on)
                            .local()
                            .format("YYYY-MM-DD hh:mm A")}
                        </TableCell>
                      </TableRow>
                      <TableRow>
                        {/* <TableCell
                          style={{ paddingBottom: 0, paddingTop: 0 }}
                          colSpan={3}
                        >
                          <Collapse
                            in={expandedGroups[row.id.toString()]}
                            timeout="auto"
                            unmountOnExit
                          >
                            <Box sx={{ margin: 1 }}>
                              <Typography
                                variant="subtitle2"
                                gutterBottom
                                component="div"
                              >
                                Permissions
                              </Typography>
                              <Box
                                sx={{
                                  display: "flex",
                                  flexWrap: "wrap",
                                  gap: 1,
                                }}
                              >
                                {permissionGroups.map((group) => (
                                  <Box
                                    key={group.groupName}
                                    sx={{
                                      border: "1px solid #e0e0e0",
                                      borderRadius: 1,
                                      p: 1,
                                      minWidth: "120px",
                                    }}
                                  >
                                    <Typography
                                      variant="caption"
                                      fontWeight="bold"
                                    >
                                      {group.groupName}
                                    </Typography>
                                    <Box
                                      sx={{
                                        display: "flex",
                                        flexDirection: "column",
                                        mt: 0.5,
                                      }}
                                    >
                                      {group.permissions.map((permission) => (
                                        <Box
                                          key={permission.key}
                                          sx={{
                                            display: "flex",
                                            alignItems: "center",
                                            gap: 0.5,
                                          }}
                                        >
                                          <Typography variant="caption">
                                            {permission.label}:
                                          </Typography>
                                          {row.roleDetails[permission.key] ? (
                                            <CheckCircleIcon
                                              sx={{
                                                color: "#228B22",
                                                fontSize: "14px",
                                              }}
                                            />
                                          ) : (
                                            <CancelIcon
                                              sx={{
                                                color: "#DE3163",
                                                fontSize: "14px",
                                              }}
                                            />
                                          )}
                                        </Box>
                                      ))}
                                    </Box>
                                  </Box>
                                ))}
                              </Box>
                            </Box>
                          </Collapse>
                        </TableCell> */}
                      </TableRow>
                    </React.Fragment>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={3} align="center">
                    No roles found.
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

      {/* Side Panel for Role Details */}
      {selectedRole && (
        <Box
          sx={{
            flex: { xs: "0 0 100%", md: "0 0 50%" },
            maxWidth: { xs: "100%", md: "50%" },
            transition: "all 0.3s ease",
            bgcolor: "grey.100",
            p: 2,
            mt: { xs: 2, md: 0 },
            overflowY: "auto",
            overflowX: "hidden",
            height: "100%",
          }}
        >
          <RoleDetailsCard
            role={selectedRole}
            onBack={() => setSelectedRole(null)}
            onUpdate={() => {}}
            onDelete={() => {}}
            refreshList={(value: any) => refreshList(value)}
            handleCloseDetailCard={() => setSelectedRole(null)}
            onCloseDetailCard={() => setSelectedRole(null)}
          />
        </Box>
      )}

      <FormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
      >
        <RoleCreatingForm
          refreshList={refreshList}
          onClose={() => setOpenCreateModal(false)}

        />
      </FormModal>
    </Box>
  );
};

export default RoleListingTable;
