 export interface User {
  operator_id: string;
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
  created_on: string;
}
export interface Company {
  id: number;
  name: string;
  ownerName: string;
  location: string;
  phoneNumber: string;
  address: string;
  email: string;
  status: string;
  companyType: string;
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


export interface Bus {
  id: number;
  registrationNumber: string;
  name: string;
  capacity: number;
  model: string;
  manufactured_on: string;
  insurance_upto: string;
  pollution_upto: string;
  fitness_upto: string;
  road_tax_upto: string;
  status: number;
}




export interface Landmark {
  id: number;
  name: string;
  boundary: string;
  status: string;
  importance: string;
}



export interface SelectedLandmark {
  id: number;
  name: string;
  sequenceId?: number;
  starting_time: string;

  arrivalTime: { fullTime: string };
  departureTime: { fullTime: string };

  arrivalDayOffset: number; 
  departureDayOffset: number;
  arrivalDelta: number;
  departureDelta: number;
  distance_from_start: number;

  arrivalHour?: number;
  arrivalMinute?: number;
  arrivalAmPm?: "AM" | "PM";
  departureHour?: number;
  departureMinute?: number;
  departureAmPm?: "AM" | "PM";
}


export interface RouteLandmark {
  id: number;
  landmark_id: string;
  name: string;
  starting_time: string;
  arrival_delta: string;
  departure_delta: string;
  arrivalTime: {  fullTime: string };
  departureTime: { fullTime: string };
  distance_from_start?: number;
  sequence_id?: number;
}

export interface Fare {
  id: number;
  name: string;
  company_id: number | null;
  version: number;
  function: string;
  scope: number;
  attributes: {
    df_version: number;
    ticket_types: { id: number; name: string }[];
    currency_type: string;
    distance_unit: string;
    extra: Record<string, any>;
  };
  created_on: string;
}

export interface Service{
  id:number
  name:string
  bus_id:number
  route_id:number
  fare_id:number
  fareName:string
  routeName:string
  status:string
  ticket_mode:string
  created_mode:string
  starting_at:string
  ending_at:string
  remarks:string
}


export interface Schedule{
  id:number
  service_id:number
  name:string
  permit_no:string
  triggering_mode:number
  ticketing_mode:number
  frequency:number[] 
  bus_id:number
  route_id:number
  fare_id:number
}

export interface Duty{
  id:number
  operator_id:number
  service_id:number
  operatorName:string
  serviceName:string
  status:string
  type:string
  created_on:string
}


export interface PaperTicket {
  id: number;
  service_id: number;
  duty_id: number;
  sequence_id: number;
  pickup_point: number;
  dropping_point: number;
  pickupName: string;
  droppingName: string;
  amount: number;
  distance: number;
  ticket_types: { name: string; count: number; }[];
  created_on: string | null;
}