import React, { useState } from "react";
import {
  Card,
  CardActions,
  Typography,
  Button,
  Box,
  Avatar,
  Tooltip,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
} from "@mui/material";
import {
  Edit as EditIcon,
  Delete as DeleteIcon,
  ArrowBack as BackIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  AccountCircle as UserIcon,
  Person as PersonIcon,
} from "@mui/icons-material";
import ToggleOnIcon from "@mui/icons-material/ToggleOn";
import ToggleOffIcon from "@mui/icons-material/ToggleOff";
import { useAppDispatch } from "../../store/Hooks";
import { accountDeleteApi } from "../../slices/appSlice";
import localStorageHelper from "../../utils/localStorageHelper";
import {
  showErrorToast,
  showSuccessToast,
} from "../../common/toastMessageHelper";
import FormModal from "../../common/formModal";
import AccountUpdateForm from "./updationForm";

interface AccountCardProps {
  account: {
    id: number;
    fullName: string;
    username: string;
    gender: string;
    email_id: string;
    phoneNumber: string;
    status: string;
  };
  onUpdate: () => void;
  onDelete: (id: number) => void;
  onBack: () => void;
  refreshList: (value: any) => void;
  canManageOperator: boolean;
  onCloseDetailCard: () => void;
}
const genderOptions = [
  { label: "Female", value: 1 },
  { label: "Male", value: 2 },
  { label: "Transgender", value: 3 },
  { label: "Other", value: 4 },
];

const statusOptions = [
  { label: "Active", value: 1 },
  { label: "Suspended", value: 2 },
];
const loggedInUser = localStorageHelper.getItem("@user");
const userId = loggedInUser?.operator_id;

const AccountDetailsCard: React.FC<AccountCardProps> = ({
  account,
  refreshList,
  onDelete,
  onBack,
  canManageOperator,
  onCloseDetailCard,
}) => {
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false);
  const dispatch = useAppDispatch();
  const isLoggedInUser = account.id === userId;
  const [updateFormOpen, setUpdateFormOpen] = useState(false);
  const getGenderValue = (genderText: string): number | undefined => {
    const option = genderOptions.find((opt) => opt.label === genderText);
    return option?.value;
  };

  const getStatusValue = (statusText: string): number | undefined => {
    const option = statusOptions.find((opt) => opt.label === statusText);
    return option?.value;
  };
  const handleAccountDelete = async () => {
    try {
      const formData = new FormData();
      formData.append("id", String(account.id));
      await dispatch(accountDeleteApi(formData)).unwrap();
      setDeleteConfirmOpen(false);
      localStorageHelper.removeStoredItem(`account_${account.id}`);
      onDelete(account.id);
      onCloseDetailCard();
      refreshList("refresh");
      showSuccessToast("Account deleted successfully!");
    } catch (error: any) {
      showErrorToast(error || "Account deletion failed. Please try again.");
    }
  };

  return (
    <>
      <Card
        sx={{
          maxWidth: 450,
          width: "100%",
          margin: "auto",
          boxShadow: 3,
          p: 2,
        }}
      >
        {/* User Avatar & Info */}
        <Box
          sx={{
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            mb: 2,
          }}
        >
          <Avatar sx={{ width: 80, height: 80, bgcolor: "darkblue" }}>
            <UserIcon fontSize="large" />
          </Avatar>
          <Typography variant="h6" sx={{ mt: 1 }}>
            {account.fullName}
          </Typography>
          <Typography variant="body2" color="textSecondary">
            ID: {account.id} | @{account.username}
          </Typography>
        </Box>

        {/* User Contact Info */}
        <Card sx={{ p: 2, bgcolor: "grey.100", mb: 2 }}>
          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <PhoneIcon color="action" sx={{ mr: 1 }} />
            {account.phoneNumber ? (
              <a
                href={`tel:${account.phoneNumber.replace("tel:", "")}`}
                style={{ textDecoration: "none" }}
              >
                <Typography variant="body2" color="primary">
                  {account.phoneNumber.replace("tel:", "")}
                </Typography>
              </a>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Not added yet
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <EmailIcon color="action" sx={{ mr: 1 }} />
            {account.email_id ? (
              <a
                href={`mailto:${account.email_id}`}
                style={{ textDecoration: "none" }}
              >
                <Typography variant="body2" color="primary">
                  {account.email_id}
                </Typography>
              </a>
            ) : (
              <Typography variant="body2" color="textSecondary">
                Not added yet
              </Typography>
            )}
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1 }}>
            <PersonIcon color="action" sx={{ mr: 1 }} />
            <Typography variant="body2">
              {account.gender ? account.gender : "Not added yet"}
            </Typography>
          </Box>

          <Box sx={{ display: "flex", alignItems: "center", mb: 1, gap: 1 }}>
            {account.status === "Active" ? (
              <>
                <ToggleOnIcon sx={{ color: "green", fontSize: 30 }} />
                <Typography sx={{ color: "green", fontWeight: "bold" }}>
                  Active
                </Typography>
              </>
            ) : (
              <>
                <ToggleOffIcon sx={{ color: "#d93550", fontSize: 30 }} />
                <Typography sx={{ color: "#d93550", fontWeight: "bold" }}>
                  Suspended
                </Typography>
              </>
            )}
          </Box>
        </Card>

        {/* Action Buttons */}
        <CardActions
          sx={{
            justifyContent: isLoggedInUser ? "center" : "space-between",
            alignItems: "center",
            mt: 2,
          }}
        >
          <Box sx={{ display: "flex", gap: 1 }}>
            <Button
              variant="outlined"
              color="primary"
              size="small"
              onClick={onBack}
              startIcon={<BackIcon />}
            >
              Back
            </Button>

            {/* Update Button with Tooltip */}
            <Tooltip
              title={
                !canManageOperator && !isLoggedInUser
                  ? "You don't have permission, contact the admin"
                  : ""
              }
              arrow
              placement="top-start"
            >
              <span
                style={{
                  cursor:
                    !canManageOperator && !isLoggedInUser
                      ? "not-allowed"
                      : "default",
                }}
              >
                <Button
                  variant="contained"
                  color="success"
                  size="small"
                  onClick={() => {
                    setUpdateFormOpen(true);
                  }}
                  startIcon={<EditIcon />}
                  disabled={!canManageOperator && !isLoggedInUser}
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

            {!isLoggedInUser && (
              <Tooltip
                title={
                  !canManageOperator
                    ? "You don't have permission, contact the admin"
                    : ""
                }
                arrow
                placement="top-start"
              >
                <span
                  style={{
                    cursor: !canManageOperator ? "not-allowed" : "default",
                  }}
                >
                  <Button
                    variant="contained"
                    color="error"
                    size="small"
                    onClick={() => setDeleteConfirmOpen(true)}
                    startIcon={<DeleteIcon />}
                    disabled={!canManageOperator}
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
            )}
          </Box>
        </CardActions>
      </Card>
      <FormModal open={updateFormOpen} onClose={() => setUpdateFormOpen(false)}>
        <AccountUpdateForm
          accountId={account.id}
          accountData={{
            fullName: account.fullName,
            phoneNumber: account.phoneNumber
              .replace(/\D/g, "")
              .replace(/^91/, ""),
            email: account.email_id,
            gender: getGenderValue(account.gender),
            status: getStatusValue(account.status),
          }}
          refreshList={refreshList}
          onClose={() => setUpdateFormOpen(false)}
          onCloseDetailCard={onCloseDetailCard}
          canManageOperator={canManageOperator}
        />
      </FormModal>

      {/* Delete Confirmation Modal */}
      <Dialog
        open={deleteConfirmOpen}
        onClose={() => setDeleteConfirmOpen(false)}
      >
        <DialogTitle>Confirm Delete</DialogTitle>
        <DialogContent>
          <DialogContentText>
            Are you sure you want to delete this account?
          </DialogContentText>
          <Typography>
            <b>ID:</b> {account.id}, <b>Username:</b> {account.username},{" "}
            <b>Full Name:</b> {account.fullName}
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setDeleteConfirmOpen(false)} color="primary">
            Cancel
          </Button>
          <Button onClick={handleAccountDelete} color="error">
            Confirm Delete
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
};

export default AccountDetailsCard;
