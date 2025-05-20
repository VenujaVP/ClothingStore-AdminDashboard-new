import * as Yup from 'yup';

export const addEmployeeValidationSchema = Yup.object({
  employee_uname: Yup.string()
    .required('Employee ID is required')
    .matches(/^[A-Za-z0-9]+$/, 'Employee ID must be alphanumeric'),

  email: Yup.string()
    .email('Invalid email format')
    .required('Email is required'),

  f_name: Yup.string()
    .required('First Name is required')
    .min(2, 'First Name must be at least 2 characters')
    .max(50, 'First Name can\'t be more than 50 characters'),

  l_name: Yup.string()
    .required('Last Name is required')
    .min(2, 'Last Name must be at least 2 characters')
    .max(50, 'Last Name can\'t be more than 50 characters'),

  password: Yup.string()
    .required('Password is required')
    .min(8, 'Password must be at least 8 characters')
    .matches(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .matches(/[a-z]/, 'Password must contain at least one lowercase letter')
    .matches(/[0-9]/, 'Password must contain at least one number')
    .matches(/[!@#$%^&*]/, 'Password must contain at least one special character'),

  com_password: Yup.string()
    .required('Please confirm your password')
    .oneOf([Yup.ref('password'), null], "Passwords must match"),

  role: Yup.string()
    .required('Role is required')
    .oneOf(['employee', 'cashier', 'onlineorderchecker'], 'Role must be Employee, Cashier, or Online Order Checker'),

  phone_1: Yup.string()
    .required('Primary Phone is required')
    .matches(/^[0-9]{10}$/, 'Primary Phone must be 10 digits'),

  phone_2: Yup.string()
    .matches(/^[0-9]{10}$/, 'Secondary Phone must be 10 digits')
    .notRequired(), // optional field
});

export const productValidationSchema = Yup.object().shape({
  product_id: Yup.string().required('Product ID is required'),
  product_name: Yup.string().required('Product Name is required'),
  product_description: Yup.string().required('Product Description is required'),
  unit_price: Yup.number().required('Unit Price is required').positive('Unit Price must be positive'),
  date_added: Yup.date().required('Date Added is required'),
  shipping_weight: Yup.number().positive('Shipping Weight must be positive'),
  total_units: Yup.number().required('Total Units is required').min(1, 'Total Units must be at least 1'),
  category1: Yup.string().required('Category 1 is required'),
  product_variations: Yup.array()
    .of(
      Yup.object().shape({
        size: Yup.string().required('Size is required'),
        color: Yup.string().required('Color is required'),
        units: Yup.number().required('Units is required').min(1, 'Units must be at least 1'),
      })
    )
    .min(1, 'At least one variation is required'),
});

export const addExpensesValidationSchema = Yup.object({
  date: Yup.date()
    .required('Date is required'),
  expense_custom_id: Yup.string()
    .required('Expense ID is required')
    .min(3, 'Expense ID must be at least 3 characters')
    .max(50, 'Expense ID cannot exceed 50 characters'),
  expenses_name: Yup.string()
    .required('Expense name is required')
    .min(3, 'Expense name must be at least 3 characters')
    .max(255, 'Expense name cannot exceed 255 characters'),
  cost: Yup.number()
    .required('Cost is required')
    .positive('Cost must be a positive number')
    .typeError('Cost must be a number'),
  description: Yup.string()
    .nullable()
});

