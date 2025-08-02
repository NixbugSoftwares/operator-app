
import * as yup from "yup";



//******************************************** login validation schema ************************************************
export const loginSchema = yup.object().shape({
  company_id: yup.number().nullable().required("Company is required"),
  username: yup.string().required("Username is required"),
  password: yup.string().required("Password is required")
});


//******************************************** account creation validation schema ************************************************
// export const operatorCreationSchema = yup.object().shape({
//   username: yup
//     .string()
//     .required("Username is required")
//     .matches(/^[A-Za-z][A-Za-z0-9@._-]{3,31}$/, "Invalid username format"),

//   password: yup
//     .string()
//     .required("Password is required")
//     .matches(
//       /^[A-Za-z0-9\-+,.@_$%&*#!^=/\?]{8,64}$/,
//       "Invalid password format"
//     ),

//   fullName: yup
//     .string()
//     .required("Full name is required")
//     .matches(/^[A-Za-z]+(?: [A-Za-z]+)*$|^$/, "Invalid full name format")
//     .min(4, "Full name must be at least 4 characters")
//     .max(32, "Full name cannot exceed 32 characters"),
//   phoneNumber: yup
//     .string()
//     .optional()
//     .matches(/^[1-9][0-9]{9}$/, "Invalid phone number format"),

//   email: yup
//     .string()
//     .trim()
//     .max(254, "Email cannot exceed 254 characters")
//     .matches(/^(?!.*\.\.)[a-zA-Z0-9!#$%&'*+/=?^_{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_{|}~-]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}|^$/, "Invalid email format")
//     .optional(),

//   gender: yup
//     .number(),

//   role: yup.number()
//   .required("Role is required"),
// })

// //********************************************oprator Role Creation validation schema *****************************************
// export const operatorRoleCreationSchema = yup.object().shape({
//   name: yup.string().required("Role name is required"),
//   manage_operator: yup.boolean().required(),
//   manage_role: yup.boolean().required(),
//   manage_bus: yup.boolean().required(),
//   manage_route: yup.boolean().required(),
//   manage_fare: yup.boolean().required(),
//   manage_schedule: yup.boolean().required(),
//   manage_company: yup.boolean().required(),
//   manage_duty: yup.boolean().required(),
//   manage_service: yup.boolean().required(),
// });
//******************************************Bus creation validation schema******************************* */
export const busCreationSchema = yup.object().shape({
   registration_number: yup
    .string()
    .required("Registration number is required")
    .max(16, "Registration number must be at most 16 characters")
    .matches(
      /^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{1,4}$/,
      "Format: e.g., KA01AB1234 — 2 letters, 2 digits, 1-2 letters, 1-4 digits"
    ),

  name: yup.string().required().min(4).max(32),
  capacity: yup.number().required().min(1).max(120),
  manufactured_on: yup.string().required(),
  insurance_upto: yup.string().nullable().notRequired(),
  pollution_upto: yup.string().nullable().notRequired(),
  fitness_upto: yup.string().nullable().notRequired(),
  road_tax_upto: yup.string().nullable().notRequired(),
});