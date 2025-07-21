import { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Box,
  Button,
  Typography,
  TextField,
  Tooltip,
  Chip,
} from "@mui/material";
import { useDispatch } from "react-redux";
import ErrorIcon from "@mui/icons-material/Error";
import PersonIcon from "@mui/icons-material/Person";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import SchoolIcon from "@mui/icons-material/School";
import { fareListApi } from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { showErrorToast } from "../../common/toastMessageHelper";
import FareSkeletonPage from "./fareSkeletonPage";
import { Fare } from "../../types/type";
import PaginationControls from "../../common/paginationControl";
import { useSelector } from "react-redux";
import { RootState } from "../../store/Store";

const FareListingPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [fareList, setFareList] = useState<Fare[]>([]);
  const [selectedFare, setSelectedFare] = useState<Fare | null>(null);
  const [search, setSearch] = useState({
    id: "",
    name: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);

  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const rowsPerPage = 10;
  const [hasNextPage, setHasNextPage] = useState(false);
  const [viewMode, setViewMode] = useState<"list" | "create" | "view">("list");
  const canManageFare = useSelector((state: RootState) =>
    state.app.permissions.includes("update_fare")
  );
  const fetchGlobalFares = useCallback(
    (pageNumber: number, searchParams = {}) => {
      const offset = pageNumber * rowsPerPage;
      dispatch(
        fareListApi({ limit: rowsPerPage, offset, ...searchParams })
      )
        .unwrap()
        .then((res: any) => {
          const items = res.data || [];
          console.log("items", items);
          
          const formattedFares = items.map((fare: any) => ({
            id: fare.id,
            name: fare.name,
            company_id: fare.company_id,
            version: fare.version,
            attributes: {
              df_version: fare.attributes?.df_version || 1,
              ticket_types: fare.attributes?.ticket_types || [],
              currency_type: fare.attributes?.currency_type,
              distance_unit: fare.attributes?.distance_unit || "m",
              extra: fare.attributes?.extra || {},
            },
            function: fare.function,
            scope: fare.scope,
            created_on: fare.created_on,
          }));
          setFareList(formattedFares);
          setHasNextPage(items.length === rowsPerPage);
        })
        .catch((error) => {
          console.error("Error fetching fares:", error);
          showErrorToast(
            error || "Failed to fetch fare list. Please try again."
          );
        })
        .finally(() => setIsLoading(false));
    },
    []
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
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  useEffect(() => {
    const searchParams = {
      ...(debouncedSearch.id && { id: debouncedSearch.id }),
      ...(debouncedSearch.name && { name: debouncedSearch.name }),
    };

    fetchGlobalFares(page, searchParams);
  }, [page, debouncedSearch, fetchGlobalFares]);
  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchGlobalFares(page, debouncedSearch);
    }
  };

  if (viewMode === "create" || viewMode === "view") {
    return (
      <FareSkeletonPage
        onCancel={() => {
          setViewMode("list");
          setSelectedFare(null);
        }}
        refreshList={refreshList}
        fareToEdit={viewMode === "view" ? selectedFare : null}
        mode={viewMode}
      />
    );
  }

  return (
    <>
      <Box
        sx={{
          display: "flex",
          width: "100%",
          height: "100vh",
        }}
      >
        <Box
          sx={{
            flex: "0 0 100%",
            maxWidth: "1000%",
            height: "100%",
            display: "flex",
            flexDirection: "column",
            overflow: "hidden",
            borderRight: "1px solid #e0e0e0",
          }}
        >
          <Box
            sx={{
              p: 2,
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
            }}
          >
            <Typography variant="h6">Global Fares</Typography>
            <Tooltip
              title={
                !canManageFare
                  ? "You don't have permission, contact the admin"
                  : "click to open the create fare page"
              }
            >
              <span
                style={{ cursor: !canManageFare ? "not-allowed" : "default" }}
              >
                <Button
                  sx={{
                    ml: "auto",
                    mr: 2,
                    mb: 2,
                    display: "block",
                    backgroundColor: !canManageFare
                      ? "#6c87b7 !important"
                      : "#00008B",
                    color: "white",
                    "&.Mui-disabled": {
                      backgroundColor: "#6c87b7 !important",
                      color: "#ffffff99",
                    },
                  }}
                  variant="contained"
                  onClick={() => setViewMode("create")}
                  disabled={!canManageFare}
                >
                  Add New Fare
                </Button>
              </span>
            </Tooltip>
          </Box>

          <TableContainer
            sx={{
              flex: 1,
              overflowY: "auto",
              "& .MuiTableCell-root": {
                padding: "8px 12px",
              },
              "& .MuiTableCell-head": {
                // Header centering fix
                textAlign: "center",
                padding: "8px 12px",
                "& > *": {
                  justifyContent: "center",
                  margin: "0 auto",
                },
              },
            }}
          >
            <Table stickyHeader>
              <TableHead>
                <TableRow>
                  {/* ID Column */}
                  <TableCell sx={{ width: "10%" }}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                    >
                      <b>ID</b>
                      <TextField
                        type="number"
                        variant="outlined"
                        size="small"
                        placeholder="Search"
                        value={search.id}
                        onChange={(e) => handleSearchChange(e, "id")}
                        sx={{
                          width: "100%",
                          mt: 1,
                          "& .MuiInputBase-root": { height: 36 },
                        }}
                      />
                    </Box>
                  </TableCell>

                  {/* Name Column */}
                  <TableCell sx={{ width: "25%" }}>
                    <Box
                      display="flex"
                      flexDirection="column"
                      alignItems="center"
                    >
                      <b>Name</b>
                      <TextField
                        variant="outlined"
                        size="small"
                        placeholder="Search"
                        value={search.name}
                        onChange={(e) => handleSearchChange(e, "name")}
                        sx={{
                          width: "100%",
                          mt: 1,
                          "& .MuiInputBase-root": { height: 36 },
                        }}
                      />
                    </Box>
                  </TableCell>

                  {/* Ticket Types Header */}
                  <TableCell>
                    <b style={{ display: "block", textAlign: "center" }}>
                      Ticket Types
                    </b>
                  </TableCell>

                  {/* Version Header */}
                  <TableCell>
                    <b style={{ display: "block", textAlign: "center" }}>
                      DF Version
                    </b>
                  </TableCell>

                  {/* Created On Header */}
                  <TableCell>
                    <b style={{ display: "block", textAlign: "center" }}>
                      Created On
                    </b>
                  </TableCell>
                </TableRow>
              </TableHead>

              <TableBody>
                {fareList.length > 0 ? (
                  fareList.map((fare) => {
                    const isSelected = selectedFare?.id === fare.id;
                    return (
                      <TableRow
                        key={fare.id}
                        hover
                        selected={isSelected}
                        onClick={() => {
                          setSelectedFare(fare);
                          setViewMode("view");
                        }}
                        sx={{
                          cursor: "pointer",
                          backgroundColor: isSelected
                            ? "#E3F2FD !important"
                            : "inherit",
                          "&:hover": { backgroundColor: "#E3F2FD" },
                        }}
                      >
                        {/* ID */}
                        <TableCell
                          sx={{
                            fontWeight: 500,
                            textAlign: "center",
                            height: 60,
                          }}
                        >
                          {fare.id}
                        </TableCell>

                        {/* Name */}
                        <TableCell>
                          <Tooltip title={fare.name} placement="bottom">
                            <Typography noWrap>
                              {fare.name.length > 20
                                ? `${fare.name.substring(0, 20)}...`
                                : fare.name}
                            </Typography>
                          </Tooltip>
                        </TableCell>

                        {/* Ticket Types - Block Style */}
                        <TableCell>
                          {fare.attributes.ticket_types?.length > 0 ? (
                            <Box display="flex" gap={1}>
                              {fare.attributes.ticket_types.map(
                                (type, index) => {
                                  const typeConfig = {
                                    adult: {
                                      bg: "rgba(25, 118, 210, 0.1)",
                                      color: "#1565c0",
                                      icon: <PersonIcon fontSize="small" />,
                                    },
                                    child: {
                                      bg: "rgba(255, 152, 0, 0.1)",
                                      color: "#ef6c00",
                                      icon: <ChildCareIcon fontSize="small" />,
                                    },
                                    default: {
                                      bg: "rgba(76, 175, 80, 0.1)",
                                      color: "#2e7d32",
                                      icon: <SchoolIcon fontSize="small" />,
                                    },
                                  };

                                  const typeKey = type.name
                                    ?.toLowerCase()
                                    .includes("adult")
                                    ? "adult"
                                    : type.name?.toLowerCase().includes("child")
                                    ? "child"
                                    : "default";

                                  return (
                                    <Chip
                                      key={index}
                                      size="small"
                                      icon={typeConfig[typeKey].icon}
                                      label={type.name || `Type ${index + 1}`}
                                      sx={{
                                        width: "100%",
                                        maxWidth: "120px",
                                        justifyContent: "flex-start",
                                        borderRadius: "4px",
                                        backgroundColor: typeConfig[typeKey].bg,
                                        color: typeConfig[typeKey].color,
                                        "& .MuiChip-icon": {
                                          color: typeConfig[typeKey].color,
                                          opacity: 0.8,
                                          marginLeft: "8px",
                                        },
                                      }}
                                    />
                                  );
                                }
                              )}
                            </Box>
                          ) : (
                            <Tooltip title="No ticket types">
                              <ErrorIcon color="disabled" />
                            </Tooltip>
                          )}
                        </TableCell>

                        {/* Version */}
                        <TableCell sx={{ textAlign: "center" }}>
                          {fare.attributes.df_version || (
                            <Tooltip title="Version not available">
                              <ErrorIcon color="disabled" />
                            </Tooltip>
                          )}
                        </TableCell>

                        {/* Created On */}
                        <TableCell sx={{ textAlign: "center" }}>
                          {fare.created_on ? (
                            new Date(fare.created_on).toLocaleDateString()
                          ) : (
                            <Tooltip title="Date not available">
                              <ErrorIcon color="disabled" />
                            </Tooltip>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">
                        No fares found
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
      </Box>
    </>
  );
};

export default FareListingPage;
