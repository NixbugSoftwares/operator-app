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
import { useDispatch, useSelector } from "react-redux";
import ErrorIcon from "@mui/icons-material/Error";
import PersonIcon from "@mui/icons-material/Person";
import ChildCareIcon from "@mui/icons-material/ChildCare";
import SchoolIcon from "@mui/icons-material/School";
import { fareListingApi } from "../../slices/appSlice";
import type { AppDispatch } from "../../store/Store";
import { RootState } from "../../store/Store";
import PaginationControls from "../../common/paginationControl";
import FareSkeletonPage from "./fareSkeletonPage";
import { Fare } from "../../types/type";
import { showErrorToast } from "../../common/toastMessageHelper";

const fareOptions = [
  { label: "Comman Fare", value: 1 },
  { label: "Local Fare", value: 2 },
];
const FareListingPage = () => {
  const dispatch = useDispatch<AppDispatch>();
  const [fareList, setFareList] = useState<Fare[]>([]);
  const [selectedFare, setSelectedFare] = useState<Fare | null>(null);
  const [viewMode, setViewMode] = useState<"list" | "create" | "view">("list");
  const [search, setSearch] = useState({
    id: "",
    name: "",
  });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(false);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canManageFare = useSelector((state: RootState) =>
    state.app.permissions.includes("manage_fare")
  );

  const fetchFares = useCallback(
    (pageNumber: number, searchParams = {}) => {
      setIsLoading(true);
      const offset = pageNumber * rowsPerPage;
      dispatch(fareListingApi({ limit: rowsPerPage, offset, ...searchParams }))
        .unwrap()
        .then((res) => {
          const items = res.data || [];
          const formattedFareList = items.map((fare: any) => ({
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

          setFareList(formattedFareList);
          setHasNextPage(items.length === rowsPerPage);
          setIsLoading(false);
        })
        .catch((error) => {
          console.error("Error fetching fares:", error);
          showErrorToast(error|| "Failed to fetch fares. Please try again.");
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
    (_event: React.MouseEvent<HTMLButtonElement> | null, newPage: number) => {
      setPage(newPage);
    },
    []
  );

  useEffect(() => {
    const searchParams: any = {
      ...(debouncedSearch.id && { id: debouncedSearch.id }),
      ...(debouncedSearch.name && { name: debouncedSearch.name }),
    };

    fetchFares(page, searchParams);
  }, [page, debouncedSearch, fetchFares]);

  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchFares(page, debouncedSearch);
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
        canManageFare={canManageFare}
      />
    );
  }

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
        flex: selectedFare ? { xs: "0 0 100%", md: "0 0 65%" } : "0 0 100%",
        maxWidth: selectedFare ? { xs: "100%", md: "65%" } : "100%",
        transition: "all 0.3s ease",
        height: "100%",
        display: "flex",
        flexDirection: "column",
        overflow: "hidden",
      }}
    >
      <Box
        sx={{
          p: 2,
          display: "flex",
          justifyContent: "flex-end",
        }}
      >
        <Tooltip
          title={
            !canManageFare
              ? "You don't have permission, contact the admin"
              : "Click to open the create fare page"
          }
        >
          <span style={{ cursor: !canManageFare ? "not-allowed" : "default" }}>
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
          maxHeight: "calc(100vh - 100px)",
          overflowY: "auto",
          borderRadius: 2,
          border: "1px solid #e0e0e0",
        }}
      >
        <Table stickyHeader>
          <TableHead>
            <TableRow sx={{ backgroundColor: "#f5f5f5" }}>
              <TableCell sx={{ width: "10%", textAlign: "center", fontWeight: 600, fontSize: "0.875rem", backgroundColor: "#fafafa", borderBottom: "1px solid #ddd" }}>ID</TableCell>
              <TableCell sx={{ width: "25%", textAlign: "center", fontWeight: 600, fontSize: "0.875rem", backgroundColor: "#fafafa", borderBottom: "1px solid #ddd" }}>Name</TableCell>
              <TableCell sx={{ textAlign: "center", fontWeight: 600, fontSize: "0.875rem", backgroundColor: "#fafafa", borderBottom: "1px solid #ddd" }}>Ticket Types</TableCell>
              <TableCell sx={{ textAlign: "center", fontWeight: 600, fontSize: "0.875rem", backgroundColor: "#fafafa", borderBottom: "1px solid #ddd" }}>DF Version</TableCell>
              <TableCell sx={{ textAlign: "center", fontWeight: 600, fontSize: "0.875rem", backgroundColor: "#fafafa", borderBottom: "1px solid #ddd" }}>Fare Type</TableCell>
              <TableCell sx={{ textAlign: "center", fontWeight: 600, fontSize: "0.875rem", backgroundColor: "#fafafa", borderBottom: "1px solid #ddd" }}>Created On</TableCell>
            </TableRow>
            <TableRow>
              <TableCell>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search"
                  value={search.id}
                  onChange={(e) => handleSearchChange(e, "id")}
                  fullWidth
                  type="number"
                  sx={{
                    "& .MuiInputBase-root": { height: 40 },
                    "& .MuiInputBase-input": { textAlign: "center" },
                  }}
                />
              </TableCell>
              <TableCell>
                <TextField
                  variant="outlined"
                  size="small"
                  placeholder="Search"
                  value={search.name}
                  onChange={(e) => handleSearchChange(e, "name")}
                  fullWidth
                  sx={{
                    "& .MuiInputBase-root": { height: 40 },
                    "& .MuiInputBase-input": { textAlign: "center" },
                  }}
                />
              </TableCell>
              <TableCell />
              <TableCell />
              <TableCell />
              <TableCell />
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
                      backgroundColor: isSelected ? "#E3F2FD !important" : "inherit",
                      "&:hover": { backgroundColor: "#E3F2FD" },
                    }}
                  >
                    <TableCell sx={{ fontWeight: 500, textAlign: "center", height: 60 }}>{fare.id}</TableCell>
                    <TableCell sx={{ fontWeight: 500, textAlign: "center" }}>
                      {fare.name || (
                        <Tooltip title="Name not available">
                          <ErrorIcon color="disabled" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell>
                      {fare.attributes.ticket_types?.length > 0 ? (
                        <Box display="flex" gap={1}>
                          {fare.attributes.ticket_types.map((type, index) => {
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
                          })}
                        </Box>
                      ) : (
                        <Tooltip title="No ticket types">
                          <ErrorIcon color="disabled" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {fare.attributes.df_version || (
                        <Tooltip title="Version not available">
                          <ErrorIcon color="disabled" />
                        </Tooltip>
                      )}
                    </TableCell>
                    <TableCell sx={{ textAlign: "center" }}>
                      {fare.scope ? (
                        fareOptions.find((opt) => opt.value === fare.scope)
                          ?.label || (
                          <Tooltip title="Unknown scope">
                            <ErrorIcon color="warning" />
                          </Tooltip>
                        )
                      ) : (
                        <Tooltip title="Scope not available">
                          <ErrorIcon color="disabled" />
                        </Tooltip>
                      )}
                    </TableCell>
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
    {/* Right Side - Fare Details Card */}
    {selectedFare && (
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
        <FareSkeletonPage
          onCancel={() => {
            setViewMode("list");
            setSelectedFare(null);
          }}
          refreshList={refreshList}
          fareToEdit={selectedFare}
          mode="view"
          canManageFare={canManageFare}
        />
      </Box>
    )}
  </Box>
);
};

export default FareListingPage;
