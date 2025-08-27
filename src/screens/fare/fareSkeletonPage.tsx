import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Divider,
  IconButton,
  Tooltip,
  FormHelperText,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  Collapse,
  Stack,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import CodeEditor from "./textEditor";
import {
  useForm,
  Controller,
  useFieldArray,
  SubmitHandler,
} from "react-hook-form";
import { useAppDispatch } from "../../store/Hooks";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import { Fare } from "../../types/type";
import {
  fareDeleteApi,
  fareupdationApi,
  fareCreationApi,
} from "../../slices/appSlice";
import { RootState } from "../../store/Store";
import { useSelector } from "react-redux";
interface TicketType {
  id: number;
  name: string;
}

interface FareAttributes {
  df_version: number;
  ticket_types: TicketType[];
  currency_type: string;
  distance_unit: string;
  extra: Record<string, any>;
}

interface FareInputs {
  name: string;
  function: string;
  attributes: FareAttributes;
}

interface FareSkeletonPageProps {
  onCancel: () => void;
  refreshList: (value: any) => void;
  fareToEdit?: Fare | null;
  mode: "create" | "view";
}

const defaultTicketTypes = [
  { id: 1, name: "Adult" },
  { id: 2, name: "Child" },
  { id: 3, name: "Student" },
];

const CompanyFareSkeletonPage = ({
  onCancel,
  refreshList,
  fareToEdit,
  mode,
}: FareSkeletonPageProps) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  // Initialize with empty string, will be set in useEffect
  const [fareFunction, setFareFunction] = useState("");
  const [output, setOutput] = useState("");
  const [_fareToDelete, setFareToDelete] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const canUpdateFare = useSelector((state: RootState) =>
    state.app.permissions.includes("update_fare")
  );
  const canDeleteFare = useSelector((state: RootState) =>
    state.app.permissions.includes("delete_fare")
  );

  const [distanceKm, setDistanceKm] = useState(5);
  const [fareResults, setFareResults] = useState<{
    distance: number;
    results: { type: string; fare: number }[];
    rangeResults?: { distance: string; fares: Record<string, number> }[];
  } | null>(null);
  const [showOutput, setShowOutput] = useState(false);

  useEffect(() => {
    if (fareToEdit) {
      setFareFunction(fareToEdit.function);
    } else {
      setFareFunction(`function getFare(ticket_type, distance, extra) {
  const base_fare_distance = 2.5;
  const base_fare = 10;
  const rate_per_km = 1;

  distance = distance / 1000;
  if (ticket_type == "Student") {
    if (distance <= 2.5) return 1;
    else if (distance <= 7.5) return 2;
    else if (distance <= 17.5) return 3;
    else if (distance <= 27.5) return 4;
    else return 5;
  }

  if (ticket_type == "Adult") {
    if (distance <= base_fare_distance) return base_fare;
    else return base_fare + ((distance - base_fare_distance) * rate_per_km);
  }

  if (ticket_type == "Child") {
    if (distance <= base_fare_distance) return base_fare / 2;
    else return (base_fare + ((distance - base_fare_distance) * rate_per_km)) / 2;
  }
  return -1;
}`);
    }
  }, [fareToEdit]);

  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm<FareInputs>({
    defaultValues: fareToEdit
      ? {
          name: fareToEdit.name,
          function: fareToEdit.function,
          attributes: fareToEdit.attributes,
        }
      : {
          name: "",
          function: "",
          attributes: {
            df_version: 1,
            ticket_types: defaultTicketTypes.map((ticketType) => ({
              id: ticketType.id,
              name: ticketType.name,
            })),
            currency_type: "INR",
            distance_unit: "m",
            extra: {},
          },
        },
  });

  const { fields, append, remove } = useFieldArray({
    control,
    name: "attributes.ticket_types",
  });
  const handleRunCode = () => {
    setShowOutput(true); // Show output when running code
    let logs: any[] = [];
    const customConsole = {
      log: (...args: any[]) => logs.push(args.join(" ")),
    };

    try {
      // Check function name
      if (!/function\s+getFare\s*\(/.test(fareFunction)) {
        setOutput("Error: Function name must be 'getFare'");
        setFareResults(null);
        return;
      }

      // eslint-disable-next-line no-new-func
      const func = new Function("console", `${fareFunction}; return getFare;`);
      const getFare = func(customConsole);

      if (typeof getFare !== "function") {
        setOutput("Error: 'getFare' is not a valid function");
        setFareResults(null);
        return;
      }

      // Get current ticket types from form
      const currentTicketTypes = control._formValues.attributes.ticket_types;

      // Test the fare function for the specified distance
      const singleResults = currentTicketTypes.map((ticket: TicketType) => {
        try {
          const fare = getFare(ticket.name, distanceKm * 1000, {}); // distance in meters
          return { type: ticket.name, fare };
        } catch (err: any) {
          return { type: ticket.name, fare: -1 };
        }
      });

      // Test the fare function for all distances up to the specified km
      const rangeResults = [];
      for (let km = 1; km <= distanceKm; km++) {
        const rangeFares: Record<string, number> = {};
        currentTicketTypes.forEach((ticket: TicketType) => {
          try {
            rangeFares[ticket.name] = getFare(ticket.name, km * 1000, {});
          } catch (err) {
            rangeFares[ticket.name] = -1;
          }
        });
        rangeResults.push({
          distance: km === 1 ? "1 km" : `${km - 1}-${km} km`,
          fares: rangeFares,
        });
      }

      setFareResults({
        distance: distanceKm,
        results: singleResults,
        rangeResults,
      });

      let outputText = logs.length > 0 ? logs.join("\n") + "\n" : "";
      outputText += "Fare calculation completed.";
      setOutput(outputText);
    } catch (error) {
      setFareResults(null);
      setOutput(
        `Error: ${error instanceof Error ? error.message : "Invalid code"}`
      );
    }
  };

  const handleFareCreation: SubmitHandler<FareInputs> = async (data) => {
    try {
      setLoading(true);
      const fareCreate = {
        scope: 2,
        name: data.name,
        function: fareFunction,
        attributes: data.attributes,
      };
      await dispatch(fareCreationApi(fareCreate)).unwrap();
      onCancel();
      refreshList("refresh");
      showSuccessToast("Fare created successfully");
    } catch (error: any) {
      console.error("Error creating fare:", error);
      showErrorToast(error.message || "Error creating fare");
    } finally {
      setLoading(false);
    }
  };

  const handleFareUpdate: SubmitHandler<FareInputs> = async (data) => {
    try {
      setLoading(true);
      const fareUpdate = {
        id: fareToEdit?.id,
        name: data.name,
        function: fareFunction,
        attributes: data.attributes,
      };
      await dispatch(
        fareupdationApi({ fareId: fareToEdit!.id, fareUpdate })
      ).unwrap();
      onCancel();
      refreshList("refresh");
      showSuccessToast("Fare updated successfully");
    } catch (error: any) {
      console.error("Error updating fare:", error);
      showErrorToast(error.message || "Error updating fare");
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteFare = (fareId: number) => {
    setFareToDelete(fareId);
    setDeleteConfirmOpen(true);
  };

  const handleDelete = async () => {
    if (!fareToEdit) return;

    try {
      setLoading(true);

      await dispatch(fareDeleteApi({ fareId: fareToEdit.id })).unwrap();
      onCancel();
      refreshList("refresh");
      showSuccessToast("Fare deleted successfully");
    } catch (error: any) {
      console.error("Error deleting fare:", error);
      showErrorToast(error.message || "Error deleting fare");
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box
      sx={{
        display: "flex",
        width: "100%",
        height: "100vh",
        overflow: "hidden",
      }}
    >
      {/* Left Side - Form */}
      <Paper
        component="form"
        onSubmit={handleSubmit(handleFareCreation)}
        sx={{
          flex: "0 0 40%",
          maxWidth: "40%",
          height: "100vh",
          display: "flex",
          flexDirection: "column",
          overflow: "hidden",
          borderRight: "1px solid #e0e0e0",
          p: 3,
        }}
      >
        <Box sx={{ flex: 1, overflowY: "auto", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
            <IconButton onClick={onCancel} sx={{ mr: 1 }}>
              <ArrowBackIcon />
            </IconButton>
            <Typography variant="h5">Fare Structure</Typography>
          </Box>

          <Controller
            name="name"
            control={control}
            rules={{
              required: "Fare name is required",
              minLength: {
                value: 4,
                message: "Fare name must be at least 4 characters",
              },
              maxLength: {
                value: 32,
                message: "Fare name must be at most 32 characters",
              },
              validate: {
                notEmpty: (value) =>
                  value.trim().length > 0 || "Fare name cannot be empty",
                noLeadingTrailingSpace: (value) =>
                  value === value.trim() || "No spaces at beginning or end",
                noConsecutiveSpaces: (value) =>
                  !value.includes("  ") || "No consecutive spaces allowed",
              },
            }}
            render={({ field }) => (
              <TextField
                required
                {...field}
                label="Fare Name"
                fullWidth
                sx={{}}
                error={!!errors.name}
                helperText={errors.name?.message}
                onChange={(e) => {
                  const value = e.target.value.replace(/\s{2,}/g, " ");
                  field.onChange(value);
                }}
              />
            )}
          />

          <Typography variant="h6" gutterBottom>
            Attributes
          </Typography>

          <Stack spacing={2} sx={{ mb: 3 }}>
            {/* First row with 2 items side by side */}
            <Stack direction="row" spacing={2}>
              <Controller
                name="attributes.currency_type"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Currency Type" fullWidth>
                    {["INR"].map((currency) => (
                      <MenuItem key={currency} value={currency}>
                        {currency}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />

              <Controller
                name="attributes.distance_unit"
                control={control}
                render={({ field }) => (
                  <TextField {...field} select label="Distance Unit" fullWidth>
                    {["m"].map((unit) => (
                      <MenuItem key={unit} value={unit}>
                        {unit}
                      </MenuItem>
                    ))}
                  </TextField>
                )}
              />
            </Stack>

            {/* Full width field */}
            <Controller
              name="attributes.df_version"
              control={control}
              disabled
              render={({ field }) => (
                <TextField
                  {...field}
                  label="DF Version"
                  type="number"
                  fullWidth
                  onChange={(e) =>
                    field.onChange(parseInt(e.target.value) || 0)
                  }
                  InputProps={{
                    inputProps: {
                      min: 1,
                      max: 1,
                    },
                  }}
                />
              )}
            />
          </Stack>

          <Divider sx={{ my: 2 }} />

          <Box
            sx={{
              display: "flex",
              justifyContent: "space-between",
              alignItems: "center",
              mb: 2,
            }}
          >
            <Typography variant="h6">Ticket Types</Typography>
            <Button
              variant="outlined"
              startIcon={<AddIcon />}
              onClick={() =>
                append({
                  id:
                    fields.length > 0
                      ? Math.max(...fields.map((f) => f.id)) + 1
                      : 1,
                  name: "",
                })
              }
            >
              Add Type
            </Button>
          </Box>

          {fields.map((field, index) => (
            <Stack
              key={field.id}
              direction="row"
              spacing={2}
              sx={{ mb: 2 }}
              alignItems="center"
            >
              {/* Ticket Name */}
              <Controller
                name={`attributes.ticket_types.${index}.name`}
                control={control}
                rules={{ required: "Name is required" }}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="Ticket Type Name"
                    fullWidth
                    error={!!errors.attributes?.ticket_types?.[index]?.name}
                    helperText={
                      errors.attributes?.ticket_types?.[index]?.name?.message
                    }
                    sx={{ flex: 5 }}
                  />
                )}
              />

              {/* Ticket ID */}
              <Controller
                name={`attributes.ticket_types.${index}.id`}
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="ID"
                    type="number"
                    fullWidth
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                    sx={{ flex: 2 }}
                    InputProps={{ inputProps: { min: 1 } }}
                  />
                )}
              />

              {/* Delete Button */}
              <Tooltip title="Remove ticket type">
                <IconButton onClick={() => remove(index)}>
                  <DeleteIcon color="error" />
                </IconButton>
              </Tooltip>
            </Stack>
          ))}

          {errors.attributes?.ticket_types && (
            <FormHelperText error sx={{ mb: 2 }}>
              At least one valid ticket type is required
            </FormHelperText>
          )}
          {/* calculate fare */}
        </Box>

        {/* Buttons  */}
        <Box
          sx={{
            mt: "auto",
            display: "flex",
            justifyContent: "left",
            gap: 2,
            pt: 2,
          }}
        >
          <Button
            variant="outlined"
            onClick={onCancel}
            size="small"
            disabled={loading}
          >
            Back
          </Button>

          {mode === "view" ? (
            <>
              {canDeleteFare && (
                <Button
                  variant="contained"
                  color="error"
                  size="small"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteFare(fareToEdit!.id);
                  }}
                  sx={{
                    "&.Mui-disabled": {
                      backgroundColor: "#e57373 !important",
                      color: "#ffffff99",
                    },
                  }}
                >
                  Delete
                </Button>
              )}
              {canUpdateFare && (
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={handleSubmit(handleFareUpdate)}
                  sx={{
                    "&.Mui-disabled": {
                      backgroundColor: "#81c784 !important",
                      color: "#ffffff99",
                    },
                  }}
                >
                  Update
                </Button>
              )}
            </>
          ) : (
            <Button
              type="submit"
              variant="contained"
              onClick={handleSubmit(handleFareCreation)}
              disabled={loading}
            >
              {loading ? "Saving..." : "Save Fare"}
            </Button>
          )}
        </Box>
      </Paper>

      {/*  Editor */}
      <Paper
        sx={{
          flex: "0 0 60%",
          maxWidth: "60%",
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
            justifyContent: "space-between",
            alignItems: "center",
            borderBottom: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="h6">Fare Function</Typography>
          <Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
            <TextField
              label="Distance (km)"
              type="number"
              size="small"
              value={distanceKm}
              onChange={(e) =>
                setDistanceKm(Math.max(1, Number(e.target.value)))
              }
              sx={{ width: 120 }}
              inputProps={{ min: 1 }}
            />
            <Button variant="contained" onClick={handleRunCode}>
              Run Code
            </Button>
          </Box>
        </Box>

        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <CodeEditor
            value={fareFunction}
            readOnly={false}
            onChange={(value) => setFareFunction(value || "")}
          />
        </Box>
        <Collapse in={showOutput}>
          <Box
            sx={{
              height: "300px", // Increased height for better visibility
              p: 2,
              overflow: "auto",
              borderTop: "1px solid #e0e0e0",
            }}
          >
            <Paper
              sx={{
                p: 2,
                bgcolor: "#f5f5f5",
                height: "100%",
                overflow: "auto",
              }}
            >
              <Box
                sx={{
                  mb: 2,
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "center",
                }}
              >
                <Typography variant="subtitle1" gutterBottom sx={{ mb: 0 }}>
                  Console Output:
                </Typography>
                <IconButton
                  onClick={() => setShowOutput(false)}
                  sx={{ color: "red" }}
                >
                  <CloseIcon />
                </IconButton>
              </Box>
              <Box
                component="pre"
                sx={{
                  p: 1,
                  bgcolor: "#fff",
                  borderRadius: 1,
                  maxHeight: 100,
                  overflow: "auto",
                }}
              >
                {output || "No output yet"}
              </Box>

              {fareResults && (
                <Box>
                  <Typography variant="subtitle1" gutterBottom>
                    Fare Calculation Results:
                  </Typography>

                  {/* Single distance result */}
                  <Box sx={{ mb: 3 }}>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      For {fareResults.distance} km:
                    </Typography>
                    <Table size="small" sx={{ mb: 2 }}>
                      <TableHead>
                        <TableRow>
                          <TableCell>Ticket Type</TableCell>
                          <TableCell align="right">Fare</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {fareResults.results.map((r) => (
                          <TableRow key={r.type}>
                            <TableCell>{r.type}</TableCell>
                            <TableCell align="right">
                              {r.fare === -1 ? (
                                <Typography color="error">Error</Typography>
                              ) : (
                                `${r.fare} ${control._formValues.attributes.currency_type}`
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Box>

                  {/* Distance range results */}
                  {/* Distance range results */}
                  <Box>
                    <Typography variant="body2" sx={{ mb: 1 }}>
                      Fare breakdown by distance:
                    </Typography>
                    <Box sx={{ maxHeight: 200, overflow: "auto" }}>
                      <Table size="small" stickyHeader>
                        <TableHead>
                          <TableRow>
                            <TableCell>Distance</TableCell>
                            {control._formValues.attributes.ticket_types.map(
                              (ticket: TicketType) => (
                                <TableCell key={ticket.id} align="right">
                                  {ticket.name}
                                </TableCell>
                              )
                            )}
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {fareResults.rangeResults?.map((row) => (
                            <TableRow key={row.distance}>
                              <TableCell>{row.distance}</TableCell>
                              {control._formValues.attributes.ticket_types.map(
                                (ticket: TicketType) => (
                                  <TableCell key={ticket.id} align="right">
                                    {row.fares[ticket.name] === -1 ? (
                                      <Typography color="error">-</Typography>
                                    ) : (
                                      row.fares[ticket.name]
                                    )}
                                  </TableCell>
                                )
                              )}
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </Box>
                  </Box>
                </Box>
              )}
            </Paper>
          </Box>
        </Collapse>
      </Paper>
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this fare? This action cannot be
            undone.
          </DialogContentText>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleDelete} color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
};

export default CompanyFareSkeletonPage;
