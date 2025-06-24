import React, { useCallback, useEffect, useRef, useState } from "react";
import {
  Box,
  Button,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TextField,
  Tooltip,
} from "@mui/material";
import CheckCircleIcon from "@mui/icons-material/CheckCircle";
import CancelIcon from "@mui/icons-material/Cancel";
import { useDispatch, useSelector } from "react-redux";
import { operatorRoleListApi } from "../../slices/appSlice";
import type { AppDispatch, RootState } from "../../store/Store";
import type { RoleDetails } from "../../types/type";
import PaginationControls from "../../common/paginationControl";
import { showErrorToast } from "../../common/toastMessageHelper";
import RoleDetailsCard from "./RoleDetailCard";
import RoleCreationForm from "./RoleCreatingForm";
import FormModal from "../../common/formModal";
interface Role {
  id: number;
  name: string;
  roleDetails: RoleDetails;
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
  const canManageRole = useSelector((state: RootState) =>
    state.app.permissions.includes("manage_role")
  );

  const fetchRoleList = useCallback(
    (pageNumber: number, searchParams = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(
        operatorRoleListApi({ limit: rowsPerPage, offset, ...searchParams })
      )
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          const formattedRoleList = items.map((role: any) => ({
            id: role.id,
            name: role.name,
            roleDetails: {
              manage_operator: role.manage_operator,
              manage_bus: role.manage_bus,
              manage_route: role.manage_route,
              manage_fare: role.manage_fare,
              manage_schedule: role.manage_schedule,
              manage_role: role.manage_role,
              manage_company: role.manage_company,
              manage_duty: role.manage_duty,
              manage_service: role.manage_service,
            },
          }));
          setRoleList(formattedRoleList);
          setHasNextPage(items.length === rowsPerPage);
        })
        .catch((error) => {
          showErrorToast(
            error.message || "Failed to fetch role list. Please try again."
          );
        })
        .finally(() => setIsLoading(false));
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
    { key: "Rolename", label: "Role Name" },
  ];

  const permissionKeys = [
    "Operator",
    "Role",
    "Bus",
    "Route",
    "Fare",
    "Schedule",
    "Company",
    "Service",
    "Duty",
  ];

  const permissionFields = [
    "manage_operator",
    "manage_role",
    "manage_bus",
    "manage_route",
    "manage_fare",
    "manage_schedule",
    "manage_company",
    "manage_service",
    "manage_duty",
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
        height: "100%",
        gap: 2,
      }}
    >
      <Box
        sx={{
          flex: selectedRole ? { xs: "0 0 100%", md: "0 0 65%" } : "0 0 100%",
          maxWidth: selectedRole ? { xs: "100%", md: "65%" } : "100%",
          transition: "all 0.3s ease",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
        }}
      >
        <Tooltip
          title={
            !canManageRole
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
                backgroundColor: !canManageRole
                  ? "#6c87b7 !important"
                  : "#00008B",
                color: "white",
                "&.Mui-disabled": {
                  backgroundColor: "#6c87b7 !important",
                  color: "#ffffff99",
                },
              }}
              variant="contained"
              disabled={!canManageRole}
              onClick={() => setOpenCreateModal(true)}
              style={{ cursor: !canManageRole ? "not-allowed" : "default" }}
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
                  <TableCell key={key}>
                    <b style={{ display: "block", textAlign: "center" }}>
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
                      fullWidth
                      sx={{
                        "& .MuiInputBase-root": {
                          height: 40,
                          fontSize: selectedRole ? "0.8rem" : "1rem",
                        },
                        "& .MuiInputBase-input": {
                          textAlign: "center",
                        },
                      }}
                    />
                  </TableCell>
                ))}
                {permissionKeys.map((perm) => (
                  <TableCell key={perm} align="center">
                    <b>Manage {perm}</b>
                  </TableCell>
                ))}
              </TableRow>
            </TableHead>
            <TableBody>
              {roleList.length > 0 ? (
                roleList.map((row) => {
                  const isSelected = selectedRole?.id === row.id;
                  return (
                    <TableRow
                      key={row.id}
                      hover
                      onClick={() => handleRowClick(row)}
                      sx={{
                        cursor: "pointer",
                        backgroundColor: isSelected ? "#E3F2FD" : "inherit",
                      }}
                    >
                      <TableCell>{row.id}</TableCell>
                      <TableCell>{row.name}</TableCell>
                      {permissionFields.map((key) => (
                        <TableCell key={key} align="center">
                          {row.roleDetails[key as keyof RoleDetails] ? (
                            <CheckCircleIcon sx={{ color: "#228B22" }} />
                          ) : (
                            <CancelIcon sx={{ color: "#DE3163" }} />
                          )}
                        </TableCell>
                      ))}
                    </TableRow>
                  );
                })
              ) : (
                <TableRow>
                  <TableCell colSpan={10} align="center">
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

      {selectedRole && (
        <Box
          sx={{
            flex: { xs: "0 0 100%", md: "0 0 35%" },
            maxWidth: { xs: "100%", md: "35%" },
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
            canManageRole={canManageRole}
            onUpdate={() => {}}
            onDelete={() => {}}
            onBack={() => setSelectedRole(null)}
            refreshList={(value: any) => refreshList(value)}
            onCloseDetailCard={() => setSelectedRole(null)}
          />
        </Box>
      )}

      <FormModal
        open={openCreateModal}
        onClose={() => setOpenCreateModal(false)}
      >
        <RoleCreationForm
          refreshList={refreshList}
          onClose={() => setOpenCreateModal(false)}
        />
      </FormModal>
    </Box>
  );
};

export default RoleListingTable;
