import { useCallback, useEffect, useRef, useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Button,
  Box,
  Stack,
  TextField,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogContentText,
  DialogActions,
  Tooltip,
  Typography,
  CircularProgress,
  Chip,
} from "@mui/material";
import VerifiedIcon from "@mui/icons-material/Verified";
import ErrorIcon from "@mui/icons-material/Error";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../../store/Store";
import {
  busRouteLandmarkListApi,
  busRouteListApi,
  routeDeleteApi,
} from "../../slices/appSlice";
import { AppDispatch } from "../../store/Store";
import MapComponent from "./BusRouteMap";
import BusRouteCreation from "./BusRouteCreationPage";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import BusRouteDetailsPage from "./BusRouteDetails";
import { SelectedLandmark, RouteLandmark } from "../../types/type";
import PaginationControls from "../../common/paginationControl";
interface Route {
  id: number;
  companyId: number;
  name: string;
  start_time: string;
  status: string;
}

const BusRouteListing = () => {
  const [showCreationForm, setShowCreationForm] = useState(false);
  const dispatch = useDispatch<AppDispatch>();
  const [routeList, setRouteList] = useState<Route[]>([]);
  const [landmarks, setLandmarks] = useState<SelectedLandmark[]>([]);
  const [routeToDelete, setRouteToDelete] = useState<Route | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const [selectedRoute, setSelectedRoute] = useState<{
    id: number;
    name: string;
    start_time: string;
  } | null>(null);

  const mapRef = useRef<{
    clearRoutePath: () => void;
    toggleAddLandmarkMode?: () => void;
    disableAddLandmarkMode?: () => void;
  }>(null);
  const [_selectedRouteLandmarks, setSelectedRouteLandmarks] = useState<
    RouteLandmark[]
  >([]);
  const [mapLandmarks, setMapLandmarks] = useState<SelectedLandmark[]>([]);
  const [isEditingRoute, setIsEditingRoute] = useState(false);
  const [newRouteLandmarks, setNewRouteLandmarks] = useState<
    SelectedLandmark[]
  >([]);
  const [routeStartingTime, setRouteStartingTime] = useState("");
  const [search, setSearch] = useState({ id: "", name: "" });
  const [debouncedSearch, setDebouncedSearch] = useState(search);
  const debounceRef = useRef<number | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasNextPage, setHasNextPage] = useState(false);
  const rowsPerPage = 10;
  const canCreateRoutes = useSelector((state: RootState) =>
    state.app.permissions.includes("create_route")
  );
  const canDeleteRoutes = useSelector((state: RootState) =>
    state.app.permissions.includes("delete_route")
  );
  const [newLandmarkTrigger, setNewLandmarkTrigger] = useState(false);

  const handleStartingTimeChange = (time: string) => {
    setRouteStartingTime(time);
  };

  const fetchRoute = useCallback(
    (pageNumber: number, searchParams = {}) => {
      setIsLoading(true);
      const offSet = pageNumber * rowsPerPage;
      dispatch(
        busRouteListApi({
          limit: rowsPerPage,
          offset: offSet,
          ...searchParams,
        })
      )
        .unwrap()
        .then((res) => {
          console.log("API Response:", res);

          const items = res.data || [];
          const formattedRoute = items.map((route: any) => ({
            id: route.id,
            name: route.name,
            start_time: route.start_time,
            status:
              route.status === 1
                ? "Valid"
                : route.status === 2
                ? "Invalid"
                : "Unknown",
          }));
          setRouteList(formattedRoute);
          setHasNextPage(items.length === rowsPerPage);
        })
        .catch((error) => {
          console.error("Fetch Error:", error);
          showErrorToast(error.message || "Failed to fetch Bus Route list");
        })
        .finally(() => setIsLoading(false));
    },
    [dispatch]
  );

  useEffect(() => {
    const fetchRouteLandmarks = async () => {
      if (selectedRoute) {
        try {
          const response = await dispatch(
            busRouteLandmarkListApi(selectedRoute.id)
          ).unwrap();

          const processed = response.map((lm: any) => ({
            id: lm.landmark_id,
            arrivalTime: lm.arrival_delta,
            departureTime: lm.departure_delta,
            distance_from_start: lm.distance_from_start ?? 0,
          }));
          console.log("_____+_+_+_+_+_+_+_+_+_+_+_+_++_+", processed);

          setSelectedRouteLandmarks(processed);
          setMapLandmarks(processed);
        } catch (error: any) {
          showErrorToast(error.message || "Failed to load route landmarks");
        }
      }
    };

    fetchRouteLandmarks();
  }, [selectedRoute]);
  useEffect(() => {
    if (newLandmarkTrigger) {
      const timer = setTimeout(() => setNewLandmarkTrigger(false), 100);
      return () => clearTimeout(timer);
    }
  }, [newLandmarkTrigger]);
  useEffect(() => {
    return () => {
      setMapLandmarks([]);
      if (mapRef.current) {
        mapRef.current.clearRoutePath();
      }
    };
  }, []);

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

    fetchRoute(page, searchParams);
  }, [page, debouncedSearch, fetchRoute]);

  const toggleCreationForm = () => {
    setShowCreationForm(!showCreationForm);
    setLandmarks([]);
    // No need to disable add landmark mode anymore
  };

  const handleRouteCreated = () => {
    setShowCreationForm(true);
    setLandmarks([]);
  };

  const handleAddLandmark = (landmark: SelectedLandmark) => {
    const sortedLandmarks = [...landmarks, landmark].sort(
      (a, b) => (a.distance_from_start || 0) - (b.distance_from_start || 0)
    );

    setLandmarks(sortedLandmarks);
  };

  const handleRemoveLandmark = (id: number) => {
    const updatedLandmarks = landmarks
      .filter((landmark) => landmark.id !== id)
      .map((landmark, index) => ({
        ...landmark,
        sequenceId: index + 1,
      }));
    setLandmarks(updatedLandmarks);
  };

  const handleDeleteClick = (route: Route) => {
    setRouteToDelete(route);
    setDeleteConfirmOpen(true);
  };

  const handleRouteDelete = async () => {
    if (!routeToDelete) return;

    try {
      const formData = new FormData();
      formData.append("id", routeToDelete.id.toString());
      const result = await dispatch(routeDeleteApi(formData)).unwrap();

      if (result && result.error) {
        throw new Error(result.error);
      }

      showSuccessToast("Route deleted successfully");
      fetchRoute(page, debouncedSearch);
    } catch (error: any) {
      showErrorToast(error.message || "Failed to delete route");
    } finally {
      setDeleteConfirmOpen(false);
      setRouteToDelete(null);
    }
  };

  const handleAddLandmarkEdit = (landmark: SelectedLandmark) => {
    setNewRouteLandmarks((prev) => [...prev, landmark]);
    setMapLandmarks((prev) => [...prev, landmark]);
  };

  const refreshList = (value: string) => {
    if (value === "refresh") {
      fetchRoute(page, debouncedSearch);
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
      {/* Left Side: Table or Creation Form or Details */}
      <Box
        sx={{
          flex: { xs: "0 0 100%", md: "50%" },
          maxWidth: { xs: "100%", md: "50%" },
          transition: "all 0.3s ease",
          overflow: "hidden",
          display: "flex",
          flexDirection: "column",
          height: "100vh", // Ensure full height
          position: "relative", // Needed for absolute positioning of children
        }}
      >
        {selectedRoute ? (
          <BusRouteDetailsPage
            routeId={selectedRoute.id}
            routeName={selectedRoute.name}
            routeStartingTime={`1970-01-01T${selectedRoute.start_time}`}
            refreshList={(value: any) => refreshList(value)}
            onBack={() => {
              setSelectedRoute(null);
              setMapLandmarks([]);
              setIsEditingRoute(false);
              if (mapRef.current) {
                mapRef.current.clearRoutePath();
              }
            }}
            onLandmarksUpdate={setMapLandmarks}
            onEnableAddLandmark={() => {
              setIsEditingRoute(true);
              if (mapRef.current?.toggleAddLandmarkMode) {
                mapRef.current.toggleAddLandmarkMode();
              }
            }}
            isEditing={isEditingRoute}
            onCancelEdit={() => setIsEditingRoute(false)}
            newLandmarks={newRouteLandmarks}
            setNewLandmarks={setNewRouteLandmarks}
            newLandmarkTrigger={newLandmarkTrigger}
          />
        ) : showCreationForm ? (
          <>
            <Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
              <Button
                onClick={toggleCreationForm}
                variant="outlined"
                sx={{ ml: "auto" }}
              >
                Back to Routes
              </Button>
            </Box>
            <BusRouteCreation
              landmarks={landmarks}
              onLandmarkRemove={handleRemoveLandmark}
              onSuccess={handleRouteCreated}
              onCancel={toggleCreationForm}
              onClearRoute={() => mapRef.current?.clearRoutePath()}
              mapRef={mapRef}
              onStartingTimeChange={handleStartingTimeChange}
              refreshList={refreshList}
              onClose={() => {
                setShowCreationForm(false);
              }}
            />
          </>
        ) : (
          <>
            <Stack
              direction="row"
              justifyContent="right"
              alignItems="center"
              sx={{ mb: 2 }}
            >
              {canCreateRoutes && (
                <Button
                  sx={{
                    ml: "auto",
                    mr: 2,
                    mb: 2,
                    display: "block",
                    backgroundColor: !canCreateRoutes
                      ? "#6c87b7 !important"
                      : "#00008B",
                    color: "white",
                    "&.Mui-disabled": {
                      backgroundColor: "#6c87b7 !important",
                      color: "#ffffff99",
                    },
                  }}
                  variant="contained"
                  onClick={toggleCreationForm}
                  disabled={!canCreateRoutes}
                >
                  Add New Routes
                </Button>
              )}
            </Stack>

            <Box
              sx={{
                flex: 1,
                overflow: "hidden",
                display: "flex",
                flexDirection: "column",
              }}
            >
              <TableContainer
                sx={{
                  flex: 1,
                  overflowY: "auto",
                  borderRadius: 2,
                  border: "1px solid #e0e0e0",
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
                      <TableCell sx={{ width: "25%" }}>
                        <Box
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                        >
                          <b>ID</b>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ width: "60%" }}>
                        <Box
                          display="flex"
                          flexDirection="column"
                          alignItems="center"
                        >
                          <b>Name</b>
                        </Box>
                      </TableCell>
                      <TableCell sx={{ width: "15%", textAlign: "center" }}>
                        <b>Status</b>
                      </TableCell>
                      {canDeleteRoutes && (
                        <TableCell sx={{ width: "20%", textAlign: "center" }}>
                          <b>Actions</b>
                        </TableCell>
                      )}
                    </TableRow>
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
                            "& .MuiInputBase-root": {
                              height: 40,
                              padding: "4px",
                            },
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
                            "& .MuiInputBase-root": {
                              height: 40,
                              padding: "4px",
                            },
                          }}
                        />
                      </TableCell>
                      <TableCell colSpan={2}></TableCell>
                    </TableRow>
                  </TableHead>
                  <TableBody>
                    {isLoading ? (
                      <TableRow>
                        <TableCell colSpan={6} align="center"></TableCell>
                      </TableRow>
                    ) : routeList.length > 0 ? (
                      routeList.map((row) => (
                        <TableRow key={row.id} hover>
                          <TableCell align="center">{row.id}</TableCell>
                          <TableCell
                            sx={{
                              cursor: "pointer",
                            }}
                            onClick={() =>
                              setSelectedRoute({
                                id: row.id,
                                name: row.name,
                                start_time: row.start_time,
                              })
                            }
                          >
                            <Tooltip title={row.name} placement="bottom">
                              <Typography noWrap>
                                {row.name.length > 15
                                  ? `${row.name.substring(0, 15)}...`
                                  : row.name}
                              </Typography>
                            </Tooltip>
                          </TableCell>
                          <TableCell align="center">
                            {row.status === "Invalid" ? (
                              <Tooltip
                                title="Not in usable state"
                                placement="bottom"
                              >
                                <ErrorIcon sx={{ color: "#e64747ff" }} />
                              </Tooltip>
                            ) : row.status === "Valid" ? (
                              <Tooltip title="Usable" placement="bottom">
                                <VerifiedIcon sx={{ color: "#5cca60ff" }} />
                              </Tooltip>
                            ) : (
                              <Chip
                                label="Unknown"
                                color="default"
                                size="small"
                              />
                            )}
                          </TableCell>

                          {canDeleteRoutes && (
                            <TableCell sx={{ textAlign: "center" }}>
                              <Button
                                variant="outlined"
                                color="error"
                                size="small"
                                disabled={!canDeleteRoutes}
                                onClick={() => handleDeleteClick(row)}
                                sx={{
                                  ml: "auto",
                                  mr: 2,
                                  mb: 2,
                                  display: "flex",
                                  alignItems: "center",
                                  gap: 1,
                                  textTransform: "none",
                                  borderRadius: 2,
                                  fontWeight: 500,
                                  boxShadow: "none",
                                  backgroundColor: "#e64747ff",
                                  color: "#fff",
                                  "&:hover": {
                                    backgroundColor: !canDeleteRoutes
                                      ? "#f46a6a"
                                      : "#b71c1c",
                                    boxShadow: "0 2px 5px rgba(0,0,0,0.2)",
                                  },
                                }}
                              >
                                Delete
                              </Button>
                            </TableCell>
                          )}
                        </TableRow>
                      ))
                    ) : (
                      <TableRow>
                        <TableCell colSpan={3} align="center">
                          No Routes found.
                        </TableCell>
                      </TableRow>
                    )}
                  </TableBody>
                </Table>
              </TableContainer>
              <Box
                sx={{
                  width: "100%",
                  bgcolor: "#fff",
                  borderTop: "1px solid #e0e0e0",
                  p: 1,
                  position: "sticky",
                  bottom: 0,
                }}
              >
                <PaginationControls
                  page={page}
                  onPageChange={(newPage) => handleChangePage(null, newPage)}
                  isLoading={isLoading}
                  hasNextPage={hasNextPage}
                />
              </Box>
            </Box>
          </>
        )}
      </Box>

      {/* Right Side: Map */}
      <Box
        sx={{
          flex: { xs: "0 0 100%", md: "50%" },
          height: "100vh",
          maxWidth: { xs: "100%", md: "50%" },
          display: "flex",
          flexDirection: "column",
          gap: 2,
        }}
      >
        <MapComponent
          onAddLandmark={
            isEditingRoute ? handleAddLandmarkEdit : handleAddLandmark
          }
          ref={mapRef}
          landmarks={selectedRoute ? mapLandmarks : landmarks}
          mode={selectedRoute ? "view" : showCreationForm ? "create" : "list"}
          isEditing={isEditingRoute || showCreationForm}
          selectedLandmarks={isEditingRoute ? newRouteLandmarks : landmarks}
          startingTime={routeStartingTime}
          routeId={selectedRoute?.id}
          selectedRouteStartingTime={selectedRoute?.start_time}
          onLandmarkAdded={() => setNewLandmarkTrigger(true)}
        />
      </Box>

      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
        aria-labelledby="alert-dialog-title"
        aria-describedby="alert-dialog-description"
      >
        <DialogTitle id="alert-dialog-title">
          Confirm Route Deletion
        </DialogTitle>
        <DialogContent>
          <DialogContentText id="alert-dialog-description">
            Are you sure you want to delete the route "{routeToDelete?.name}"?
            This action cannot be undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)}>Cancel</Button>
          <Button onClick={handleRouteDelete} color="error" autoFocus>
            Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default BusRouteListing;
