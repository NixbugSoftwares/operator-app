 export interface User {
  userId: string;
  username: string;
}


export  interface Account {
  id: number;
  fullName: string;
  username: string;
  password?: string;
  gender: string;
  email_id: string;
  phoneNumber: string;
  status: string;
}


export interface RoleDetails{
  manage_operator: boolean
  manage_bus: boolean,
  manage_route: boolean,
  manage_schedule: boolean,
  manage_role: boolean,
  manage_company: boolean,
  manage_fare: boolean,
  manage_duty: boolean,
  manage_service: boolean
}