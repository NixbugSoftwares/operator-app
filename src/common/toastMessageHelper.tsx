import { toast, ToastOptions } from "react-toastify";
import "react-toastify/dist/ReactToastify.css";

// Toast options
const toastOptions: ToastOptions = {
  position: "top-center",
  autoClose: 5000,
  hideProgressBar: false,
  closeOnClick: true,
  pauseOnHover: true,
  draggable: true,
  progress: undefined,
};

// Success toast
export const showSuccessToast = (message: string) => {
  toast.success(message, toastOptions);
};

// Error toast
export const showErrorToast = (message: string) => {
  toast.error(message, toastOptions);
};

// Warning toast
export const showWarningToast = (message: string) => {
  toast.warning(message, toastOptions);
};

// Info toast
export const showInfoToast = (message: string) => {
  toast.info(message, toastOptions);
};