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
  CircularProgress,
  SelectChangeEvent,
  ListItemText,
  Select,
  Checkbox,
  MenuItem,
  Dialog,
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
interface ColumnConfig {
  id: string;
  label: string;
  width: string;
  minWidth: string;
  fixed?: boolean;
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
  const [isLoading, setIsLoading] = useState(true);
  const debounceRef = useRef<number | null>(null);
  const rowsPerPage = 10;
  const canCreateRole = useSelector((state: RootState) =>
    state.app.permissions.includes("create_role")
  );
  
  const columnConfig: ColumnConfig[] = [
    { id: "id", label: "ID", width: "80px", minWidth: "80px", fixed: true },
    {
      id: "name",
      label: "Role Name",
      width: "200px",
      minWidth: "200px",
      fixed: true,
    },
    {
      id: "created_on",
      label: "Created Date",
      width: "150px",
      minWidth: "150px",
      fixed: true,
    },
    {
      id: "updated_on",
      label: "Updated Date",
      width: "150px",
      minWidth: "150px",
      fixed:true
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
      setVisibleColumns(prev => {
        const newVisibleColumns = {...prev};
        // Update all columns based on selection
        Object.keys(newVisibleColumns).forEach(key => {
          newVisibleColumns[key] = value.includes(key);
        });
        return newVisibleColumns;
      });
    };

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
          console.log("items", items);

          const formattedRoleList = items.map((role: any) => ({
            id: role.id,
            name: role.name,
            created_on: role.created_on,
            updated_on: role.updated_on || "not updated",
            roleDetails: {
              ...role,
            },
          }));
          setRoleList(formattedRoleList);
          setHasNextPage(items.length === rowsPerPage);
        })
        .catch((error) => {
          showErrorToast(error.message||"Error fetching role list");
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


  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchRoleList(page, debouncedSearch);
    }
  };
  const selectedColumns = columnConfig.filter(col => visibleColumns[col.id]);

  return (
    <Box
      sx={{
        display: "flex",
        flexDirection: { xs: "column", lg: "row" }, // ✅ Use lg for side panel
        width: "100%",
        height: "100%",
        gap: 2,
      }}
    >
      {/* Table Section */}
      <Box
        sx={{
          flex: selectedRole ? { xs: "0 0 100%", lg: "0 0 50%" } : "0 0 100%",
          maxWidth: selectedRole ? { xs: "100%", lg: "50%" } : "100%",
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
            flexWrap: "nowrap", // Force one line
          }}
        >
          <Box
            sx={{
              flexShrink: 0,
              width: { xs: "50%", md: "auto" },
            }}
          >
            {1>100&&(
            <Select
              multiple
              value={Object.keys(visibleColumns).filter(
                (key) => visibleColumns[key]
              )}
              onChange={handleColumnChange}
              renderValue={(selected) => `Columns (${selected.length})`}
              size="small"
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
                  <ListItemText
                    primary={column.label}
                    secondary={column.fixed ? "(Always visible)" : undefined}
                  />
                </MenuItem>
              ))}
            </Select>)}
          </Box>

          {canCreateRole && (
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
              Add New Role
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
                      <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
                        {selectedColumns.map((column) => (
                          <TableCell
                            key={column.id}
                            sx={{
                              width: column.width,
                              minWidth: column.minWidth,
                              p: 1,
                              textAlign: "center",
                            }}
                          >
                            <b style={{ display: "block", fontSize: "0.85rem" }}>
                              {column.label}
                            </b>
                          </TableCell>
                        ))}
                      </TableRow>
                      <TableRow>
                        {selectedColumns.map((column) => (
                          <TableCell key={`search-${column.id}`}>
                            {column.id === "id" || column.id === "name" ? (
                              <TextField
                                type={column.id === "id" ? "number" : "text"}
                                variant="outlined"
                                size="small"
                                placeholder="Search"
                                value={search[column.id === "id" ? "id" : "Rolename"]}
                                onChange={(e) => 
                                  handleSearchChange(e, column.id === "id" ? "id" : "Rolename")
                                }
                                fullWidth
                                sx={{
                                  "& .MuiInputBase-root": { height: 40 },
                                  "& .MuiInputBase-input": { textAlign: "center" },
                                }}
                              />
                            ) : (
                              <Box sx={{ height: 40 }} /> // Placeholder for non-searchable columns
                            )}
                          </TableCell>
                        ))}
                      </TableRow>
                    </TableHead>
        
                    <TableBody>
                      {isLoading ? (
                        <TableRow>
                          <TableCell colSpan={selectedColumns.length} align="center">
                            Loading...
                          </TableCell>
                        </TableRow>
                      ) : roleList.length > 0 ? (
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
                              {selectedColumns.map((column) => (
                                <TableCell key={`${row.id}-${column.id}`} align="center">
                                  {column.id === "id" ? (
                                    row.id
                                  ) : column.id === "name" ? (
                                    <Tooltip title={row.name} placement="bottom">
                                      <Typography noWrap>
                                        {row.name.length > 30
                                          ? `${row.name.substring(0, 30)}...`
                                          : row.name}
                                      </Typography>
                                    </Tooltip>
                                  ) : column.id === "created_on" ? (
                                    moment(row.created_on)
                                      .local()
                                      .format("DD-MM-YYYY, hh:mm A")
                                  ) : column.id === "updated_on" ? (
                                    moment(row?.updated_on).isValid()
                                      ? moment(row.updated_on)
                                          .local()
                                          .format("DD-MM-YYYY, hh:mm A")
                                      : "Not updated yet"
                                  ) : null}
                                </TableCell>
                              ))}
                            </TableRow>
                          );
                        })
                      ) : (
                        <TableRow>
                          <TableCell colSpan={selectedColumns.length} align="center">
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
            display: { xs: "none", lg: "block" }, // ✅ Only show on large screens
            flex: "0 0 50%",
            maxWidth: "50%",
            transition: "all 0.3s ease",
            bgcolor: "grey.100",
            p: 2,
            overflowY: "auto",
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

      <Dialog
              open={Boolean(selectedRole)}
              onClose={() => setSelectedRole(null)}
              fullScreen
              sx={{ display: { xs: "block", lg: "none" } }} // ✅ Show on mobile + tablet
            >
              {selectedRole && (
                <RoleDetailsCard
                  role={selectedRole}
                  onBack={() => setSelectedRole(null)}
                  onUpdate={() => {}}
                  onDelete={() => {}}
                  refreshList={(value: any) => refreshList(value)}
                  handleCloseDetailCard={() => setSelectedRole(null)}
                  onCloseDetailCard={() => setSelectedRole(null)}
                />
              )}


            </Dialog>

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
