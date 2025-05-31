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