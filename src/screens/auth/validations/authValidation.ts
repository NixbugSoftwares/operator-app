
import * as yup from "yup";



//******************************************** login validation schema ************************************************
export const loginSchema = yup.object().shape({
  
  company_id: yup.number().required("Company is required"),
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required")
});


