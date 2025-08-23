
import * as yup from "yup";



//******************************************** login validation schema ************************************************
export const loginSchema = yup.object().shape({
  company_id: yup.number().nullable().required("Company is required"),
  username: yup
    .string()
    .required("Username is required")
    .matches(/^[a-zA-Z]/, "Username must start with an alphabet")
    .matches(/^[a-zA-Z0-9.@_-]+$/, "Username can only contain letters, digits, ., @, _, or -")
    .min(4, "Username must be at least 4 characters")
    .max(32, "Username cannot exceed 32 characters")
    .test(
      "no-consecutive-spaces",
      "Username cannot have consecutive spaces",
      (value) => !/\s{2,}/.test(value)
    )
    .test(
      "no-leading-trailing-spaces",
      "Username cannot have leading or trailing spaces",
      (value) => value?.trim() === value
    ),

  password: yup
  .string()
  .required("Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(32, "Password cannot exceed 32 characters")
  .matches(
    /^[A-Za-z0-9\-+,.@_$%&*#!^=/?]+$/,
    "Password can only contain: letters (A-Z, a-z), numbers (0-9), and these special characters: - + , . @ _ $ % & * # ! ^ = / ?"
  )
  .test(
    "no-spaces",
    "Password cannot contain any spaces",
    (value) => !/\s/.test(value)
  ),
});


//******************************************** account creation validation schema ************************************************
export const operatorCreationSchema = yup.object().shape({
username: yup
  .string()
  .required("Username is required")
  .min(4, "Username must be at least 4 characters long")
  .max(32, "Username cannot exceed 32 characters")
  .test(
    'starts-with-letter',
    'Username must start with a letter (a-z or A-Z)',
    (value) => /^[A-Za-z]/.test(value)
  )
  .test(
    'valid-characters',
    'Username can only contain letters, numbers, hyphens (-), periods (.), underscores (_), and @ symbols',
    (value) => /^[A-Za-z][A-Za-z0-9@._-]*$/.test(value)
  )
  .test(
    'no-consecutive-specials',
    'Username cannot have consecutive special characters',
    (value) => !/([@._-]{2,})/.test(value)
  ),
password: yup
  .string()
  .required("Password is required")
  .min(8, "Password must be at least 8 characters")
  .max(32, "Password cannot exceed 32 characters")
  .matches(
    /^[A-Za-z0-9\-+,.@_$%&*#!^=/?]+$/,
    "Password can only contain: letters (A-Z, a-z), numbers (0-9), and these special characters: - + , . @ _ $ % & * # ! ^ = / ?"
  )
  .test(
    "no-spaces",
    "Password cannot contain any spaces",
    (value) => !/\s/.test(value)
  ),
    
  fullName: yup
  .string()
  .required("Full Name is required")
  .test({
    name: 'fullNameValidation',
    message: (params) => {
      const value = params.value;
      if (/[0-9]/.test(value)) return 'Numbers are not allowed in the full name';
      if (/[^A-Za-z ]/.test(value)) return 'Special characters are not allowed';
      if (!/[A-Za-z]$/.test(value)) return 'Full name must end with a letter';
      if (!/^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)) return 'Full name should consist of letters separated by single spaces';
      return 'Invalid full name format';
    },
    test: (value) => !value || /^[A-Za-z]+(?: [A-Za-z]+)*$/.test(value)
  })
  .max(32, 'Full name cannot exceed 32 characters'),

  phoneNumber: yup
  .string()
  .notRequired()
  .matches(/^[1-9][0-9]{9}$/, "Invalid phone number format"),
 
email: yup
  .string()
  .trim()
  .max(254, "Email cannot exceed 254 characters")
  .test(
    "is-valid-email",
    "Please enter a valid email address eg: user@example.com",
    (value) => {
      if (!value) return true; 
      return /^(?!.*\s)(?!.*\.\.)[a-zA-Z0-9!#$%&'*+/=?^_{|}~-]+(?:\.[a-zA-Z0-9!#$%&'*+/=?^_{|}~-]+)*@[a-zA-Z0-9-]+(?:\.[a-zA-Z0-9-]+)*\.[a-zA-Z]{2,}$/.test(value);
    }
  )
  .optional(),


  gender: yup
    .number(),


  role: yup.number()
  .optional(),

})

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
  .max(16, "The registration number should not exceed 16 characters")
  .matches(
    /^[A-Z]{2}[0-9]{2}(?:[A-Z]{1,2})?[0-9]{1,4}$/,
    "Format: e.g., KA01AB1234 or KA011234 — 2 letters, 2 digits, optional 1-2 letters, 1-4 digits"
  ),


   name: yup.string().required("Bus name is required")
  .min(2, "Bus name must be at least 4 characters")
  .max(32, "Bus name cannot exceed 32 characters")
  .test(
      "allowed-characters",
      "Name can only contain letters, spaces, hyphens (-), underscores (_), and brackets ( )",
      (value) => !value || /^[A-Za-z\s\-_()]*$/.test(value)
    )
    .test(
      "no-leading-trailing-spaces",
      "Name should not start or end with a space",
      (value) => !value || !/^\s|\s$/.test(value)
    )
    .test(
      "no-consecutive-spaces-or-specials",
      "Name cannot have consecutive spaces or special characters",
      (value) => !value || !/([\s\-_()]{2,})/.test(value)
    ),
  capacity: yup
    .number()
    .required('Capacity is required')
    .typeError('Capacity must be a number')
    .min(1, 'Capacity must be at least 1')
    .max(120, 'Capacity cannot exceed 120')
    .integer('Capacity must be a whole number'),
  manufactured_on: yup.string().required(),
  insurance_upto: yup.string().nullable().notRequired(),
  pollution_upto: yup.string().nullable().notRequired(),
  fitness_upto: yup.string().nullable().notRequired(),
  road_tax_upto: yup.string().nullable().notRequired(),
});