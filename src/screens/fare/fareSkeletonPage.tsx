import { useEffect, useState } from "react";
import {
  Box,
  Button,
  Paper,
  Typography,
  TextField,
  MenuItem,
  Grid,
  Divider,
  IconButton,
  Tooltip,
  FormHelperText,
  Card,
  CardContent,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import DeleteIcon from "@mui/icons-material/Delete";
import EditIcon from "@mui/icons-material/Edit";
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

const FareSkeletonPage = ({
  onCancel,
  refreshList,
  fareToEdit,
  mode,
}: FareSkeletonPageProps) => {
  const dispatch = useAppDispatch();
  const [loading, setLoading] = useState(false);

  // Initialize with empty string, will be set in useEffect
  const [fareFunction, setFareFunction] = useState("");
  const [distance, setDistance] = useState<number | "">("");
  const [calculationResults, setCalculationResults] = useState<
    Record<string, number>
  >({});
  const [showCalculation, setShowCalculation] = useState(false);
  const [output, setOutput] = useState("");
  const [_fareToDelete, setFareToDelete] = useState<number | null>(null);
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const canUpdateFare = useSelector((state: RootState) =>
    state.app.permissions.includes("update_fare")
  );
  const canDeleteFare = useSelector((state: RootState) =>
    state.app.permissions.includes("delete_fare")
  );
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
    watch,
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

  const attributes = watch("attributes");

  const handleRunCode = () => {
    try {
      const func = new Function(
        "ticket_type",
        "distance",
        "extra",
        `${fareFunction}\nreturn getFare(ticket_type, distance, extra);`
      );

      const result = func("Adult", 1000, {});
      setOutput(`Test output (Adult, 1000m): ${result}`);
    } catch (error) {
      setOutput(
        `Error: ${error instanceof Error ? error.message : "Invalid function"}`
      );
    }
  };

  const handleCalculateFare = (currentDistance = distance) => {
    if (currentDistance === "") {
      setCalculationResults({});
      return;
    }

    try {
      const func = new Function(
        "ticket_type",
        "distance",
        "extra",
        `${fareFunction}\nreturn getFare(ticket_type, distance, extra);`
      );

      const results: Record<string, number> = {};
      attributes.ticket_types.forEach((ticket) => {
        if (ticket.name) {
          results[ticket.name] = func(ticket.name, currentDistance, {});
        }
      });

      setCalculationResults(results);
    } catch (error) {
      setCalculationResults({});
      setOutput(
        `Calculation error: ${
          error instanceof Error ? error.message : "Invalid function"
        }`
      );
    }
  };

  const handleFareCreation: SubmitHandler<FareInputs> = async (data) => {
    try {
      setLoading(true);
      const fareCreate = {
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
      showErrorToast(error || "Error creating fare");
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
      showErrorToast(error || "Error updating fare");
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
      showErrorToast(error || "Error deleting fare");
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
          flex: "0 0 50%",
          maxWidth: "50%",
          height: "100%",
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
            rules={{ required: "Fare name is required" }}
            render={({ field }) => (
              <TextField
                {...field}
                label="Fare Name"
                fullWidth
                sx={{ mb: 3 }}
                error={!!errors.name}
                helperText={errors.name?.message}
              />
            )}
          />

          <Typography variant="h6" gutterBottom>
            Attributes
          </Typography>

          <Grid container spacing={2} sx={{ mb: 3 }}>
            <Grid item xs={6}>
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
            </Grid>
            <Grid item xs={6}>
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
            </Grid>
            <Grid item xs={12}>
              <Controller
                name="attributes.df_version"
                control={control}
                render={({ field }) => (
                  <TextField
                    {...field}
                    label="DF Version"
                    type="number"
                    fullWidth
                    onChange={(e) =>
                      field.onChange(parseInt(e.target.value) || 0)
                    }
                  />
                )}
              />
            </Grid>
          </Grid>

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
            <Grid container spacing={2} key={field.id} sx={{ mb: 2 }}>
              <Grid item xs={5}>
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
                    />
                  )}
                />
              </Grid>
              <Grid item xs={5}>
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
                    />
                  )}
                />
              </Grid>
              <Grid item xs={2} sx={{ display: "flex", alignItems: "center" }}>
                <Tooltip title="Remove ticket type">
                  <IconButton onClick={() => remove(index)}>
                    <DeleteIcon color="error" />
                  </IconButton>
                </Tooltip>
              </Grid>
            </Grid>
          ))}

          {errors.attributes?.ticket_types && (
            <FormHelperText error sx={{ mb: 2 }}>
              At least one valid ticket type is required
            </FormHelperText>
          )}
          {/* calculate fare */}
          {showCalculation && (
            <Card variant="outlined" sx={{ mb: 3 }}>
              <CardContent>
                <Typography variant="h6" gutterBottom>
                  Fare Calculation
                </Typography>
                <TextField
                  label={`Distance (${attributes.distance_unit})`}
                  type="number"
                  fullWidth
                  value={distance}
                  onChange={(e) => {
                    const newValue =
                      e.target.value === "" ? "" : Number(e.target.value);
                    setDistance(newValue);
                    if (newValue !== "") {
                      handleCalculateFare(newValue);
                    } else {
                      setCalculationResults({});
                    }
                  }}
                  sx={{ mb: 2 }}
                />
                {Object.keys(calculationResults).length > 0 && (
                  <Box>
                    {Object.entries(calculationResults).map(
                      ([ticketType, result]) => (
                        <Box
                          key={ticketType}
                          sx={{
                            display: "flex",
                            justifyContent: "space-between",
                            mb: 1,
                          }}
                        >
                          <Typography>{ticketType}:</Typography>
                          <Typography fontWeight="bold">
                            {attributes.currency_type} {result}
                          </Typography>
                        </Box>
                      )
                    )}
                  </Box>
                )}
              </CardContent>
            </Card>
          )}
        </Box>

        {/* Buttons  */}
        <Box
          sx={{
            mt: "auto",
            display: "flex",
            justifyContent: "flex-end",
            gap: 2,
            pt: 2,
          }}
        >
          <Button variant="outlined" onClick={onCancel} disabled={loading}>
            Cancel
          </Button>
          <Button
            variant="outlined"
            onClick={() => {
              setShowCalculation(!showCalculation);
              if (!showCalculation && distance === "") {
                setDistance(1000); // Default test distance
                handleCalculateFare(1000);
              }
            }}
          >
            {showCalculation ? "Hide Calculation" : "Calculate Fare"}
          </Button>

          {mode === "view" ? (
            <>
              <Tooltip
                title={
                  !canDeleteFare
                    ? "You don't have permission, contact the admin"
                    : ""
                }
                arrow
                placement="top-start"
              >
                <span
                  style={{
                    cursor: !canDeleteFare ? "not-allowed" : "default",
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={(e) => {
                      e.stopPropagation();
                      handleDeleteFare(fareToEdit!.id);
                    }}
                    startIcon={<DeleteIcon />}
                    disabled={!canDeleteFare}
                    sx={{
                      "&.Mui-disabled": {
                        backgroundColor: "#e57373 !important",
                        color: "#ffffff99",
                      },
                    }}
                  >
                    Delete
                  </Button>
                </span>
              </Tooltip>
              <Tooltip
                title={
                  !canUpdateFare
                    ? "You don't have permission, contact the admin"
                    : ""
                }
                arrow
                placement="top-start"
              >
                <span
                  style={{
                    cursor: !canUpdateFare ? "not-allowed" : "default",
                  }}
                >
                  <Button
                    variant="contained"
                    color="success"
                    size="small"
                    onClick={handleSubmit(handleFareUpdate)}
                    startIcon={<EditIcon />}
                    disabled={!canUpdateFare}
                    sx={{
                      "&.Mui-disabled": {
                        backgroundColor: "#81c784 !important",
                        color: "#ffffff99",
                      },
                    }}
                  >
                    Update
                  </Button>
                </span>
              </Tooltip>
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
          flex: "0 0 50%",
          maxWidth: "50%",
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
          <Button variant="contained" onClick={handleRunCode}>
            Run Code
          </Button>
        </Box>

        <Box sx={{ flex: 1, overflow: "hidden" }}>
          <CodeEditor
            value={fareFunction}
            readOnly={false}
            onChange={(value) => setFareFunction(value || "")}
          />
        </Box>

        <Box
          sx={{
            height: "200px",
            p: 2,
            overflow: "auto",
            borderTop: "1px solid #e0e0e0",
          }}
        >
          <Typography variant="subtitle1" gutterBottom>
            Output:
          </Typography>
          <Paper
            sx={{
              p: 2,
              bgcolor: "#f5f5f5",
              height: "calc(100% - 40px)",
              overflow: "auto",
            }}
          >
            <pre>{output}</pre>
          </Paper>
        </Box>
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

export default FareSkeletonPage;
